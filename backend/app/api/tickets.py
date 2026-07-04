from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.ticket import Ticket, TicketStatus, TicketComment, TicketHistory, TicketActivity
from ..models.user import User, UserRole
from ..schemas.ticket import (
    TicketCreate, TicketUpdate, TicketResponse,
    TicketCommentCreate, TicketCommentResponse,
    TicketAssignRequest, TicketStatusUpdate, TicketProgressCreate,
    TicketActivityResponse
)
from .deps import get_current_active_user
from ..core.websockets import manager
from .ai import classify_issue, TextClassificationRequest
from ..models.company import Company
from ..core.security import get_password_hash
from datetime import datetime
import uuid

router = APIRouter()


# ─── Helper ────────────────────────────────────────────────────────────────

def _log_history(db, ticket_id, action, old_val, new_val, changed_by):
    db.add(TicketHistory(
        ticket_id=ticket_id,
        action=action,
        old_value=old_val,
        new_value=new_val,
        changed_by=changed_by,
        timestamp=datetime.utcnow()
    ))


def _log_activity(db, ticket_id, updated_by, status, message):
    db.add(TicketActivity(
        ticket_id=ticket_id,
        updated_by=updated_by,
        status=status,
        message=message,
        created_at=datetime.utcnow()
    ))


# ─── Create Ticket ──────────────────────────────────────────────────────────

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_customer_id = current_user.id
    target_company_id = current_user.company_id

    if current_user.role in [UserRole.admin, UserRole.staff] and ticket_in.customer_email:
        customer = db.query(User).filter(User.email == ticket_in.customer_email).first()
        if not customer:
            company_id = ticket_in.company_id
            if not company_id and ticket_in.company_name:
                company = db.query(Company).filter(Company.name == ticket_in.company_name).first()
                if not company:
                    company = Company(name=ticket_in.company_name)
                    db.add(company)
                    db.commit()
                    db.refresh(company)
                company_id = company.id
            random_password = str(uuid.uuid4())
            customer = User(
                email=ticket_in.customer_email,
                full_name=ticket_in.customer_email.split('@')[0],
                hashed_password=get_password_hash(random_password),
                role=UserRole.customer,
                company_id=company_id
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
        target_customer_id = customer.id
        target_company_id = customer.company_id

    ai_result = classify_issue(TextClassificationRequest(description=ticket_in.description))
    inferred_category = ai_result.get("category", ticket_in.category)
    inferred_priority = ai_result.get("priority", ticket_in.priority)

    # Manual assignment if provided (for admins)
    assigned_tech_id = ticket_in.assigned_technician_id

    new_ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        device_type=ticket_in.device_type,
        category=inferred_category,
        priority=inferred_priority,
        contact_name=ticket_in.contact_name,
        contact_number=ticket_in.contact_number,
        customer_id=target_customer_id,
        created_by_id=current_user.id, # ✅ Set who created it
        assigned_technician_id=assigned_tech_id,
        company_id=target_company_id,
        device_id=ticket_in.device_id
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    _log_activity(db, new_ticket.id, current_user.id, TicketStatus.open.value, "Ticket created")

    if assigned_tech_id:
        engineer = db.query(User).filter(User.id == assigned_tech_id).first()
        _log_history(db, new_ticket.id, "assigned",
                     "unassigned", engineer.full_name or engineer.email, current_user.id)
        _log_activity(db, new_ticket.id, current_user.id, "assigned", f"Assigned to {engineer.full_name or engineer.email}")
    db.commit()

    await manager.broadcast({"type": "ticket_created", "ticket_id": new_ticket.id})
    return new_ticket


# ─── List Tickets ───────────────────────────────────────────────────────────

@router.get("/", response_model=List[TicketResponse])
def get_tickets(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    from sqlalchemy.orm import selectinload
    query = db.query(Ticket).options(
        selectinload(Ticket.comments),
        selectinload(Ticket.history),
        selectinload(Ticket.device),
        selectinload(Ticket.customer),
        selectinload(Ticket.company),
        selectinload(Ticket.creator),
        selectinload(Ticket.assigned_technician)
    )

    if current_user.role == UserRole.admin:
        tickets = query.order_by(Ticket.updated_at.desc()).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.staff:
        tickets = query.filter(
            Ticket.assigned_technician_id == current_user.id
        ).order_by(Ticket.updated_at.desc()).offset(skip).limit(limit).all()
    else:
        tickets = query.filter(
            Ticket.customer_id == current_user.id
        ).order_by(Ticket.updated_at.desc()).offset(skip).limit(limit).all()
    return tickets


# ─── Admin Tracking Board ───────────────────────────────────────────────────

@router.get("/tracking/all")
def get_all_tracking(
    status: str = None,
    engineer_id: int = None,
    priority: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Admin-only: returns all tickets with their latest activity for tracking board."""
    if current_user.role not in [UserRole.admin, UserRole.staff]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    from sqlalchemy.orm import selectinload
    query = db.query(Ticket).options(
        selectinload(Ticket.comments),
        selectinload(Ticket.history),
        selectinload(Ticket.device),
        selectinload(Ticket.customer),
        selectinload(Ticket.company),
        selectinload(Ticket.creator),
        selectinload(Ticket.assigned_technician),
        selectinload(Ticket.activity)
    )
    if status:
        try:
            query = query.filter(Ticket.status == TicketStatus(status))
        except ValueError:
            pass
            
    # Filter for staff: only show their own tickets
    if current_user.role == UserRole.staff:
        query = query.filter(Ticket.assigned_technician_id == current_user.id)
    # Admin can filter by engineer_id explicitly
    elif engineer_id:
        query = query.filter(Ticket.assigned_technician_id == engineer_id)

    if priority:
        query = query.filter(Ticket.priority == priority)

    tickets = query.order_by(Ticket.updated_at.desc()).all()

    result = []
    for t in tickets:
        engineer = t.assigned_technician
        customer = t.customer
        activities = sorted(t.activity, key=lambda a: a.created_at)
        latest_activity = activities[-1] if activities else None

        result.append({
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "category": t.category,
            "device_type": t.device_type,
            "contact_name": t.contact_name,
            "company_name": t.company.name if t.company else None,
            "customer_name": customer.full_name or customer.email if customer else "Unknown",
            "creator_name": t.creator_name, # ✅ Uses property from model
            "engineer_name": engineer.full_name or engineer.email if engineer else None,
            "engineer_id": t.assigned_technician_id,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat(),
            "latest_update": {
                "status": latest_activity.status,
                "message": latest_activity.message,
                "created_at": latest_activity.created_at.isoformat()
            } if latest_activity else None
        })
    return result


# ─── Get Single Ticket ──────────────────────────────────────────────────────

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return ticket


# ─── Generic Update ─────────────────────────────────────────────────────────

@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = ticket_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_val = getattr(ticket, field)
        if str(old_val) != str(value):
            _log_history(db, ticket.id, f"{field}_change",
                         str(old_val.value) if hasattr(old_val, 'value') else str(old_val),
                         str(value.value) if hasattr(value, 'value') else str(value),
                         current_user.id)
        setattr(ticket, field, value)

    ticket.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    await manager.broadcast({"type": "ticket_updated", "ticket_id": ticket.id})
    return ticket


# ─── Assign Engineer ─────────────────────────────────────────────────────────

@router.put("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_engineer(
    ticket_id: int,
    assign_in: TicketAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admins can assign engineers")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    engineer_name = "unassigned"
    if assign_in.engineer_id is not None:
        engineer = db.query(User).filter(User.id == assign_in.engineer_id).first()
        if not engineer:
            raise HTTPException(status_code=404, detail="Engineer not found")
        if engineer.role not in [UserRole.staff, UserRole.admin]:
            raise HTTPException(status_code=400, detail="User is not authorized to be assigned to tickets")
        engineer_name = engineer.full_name or engineer.email

    old_assignee = "unassigned"
    if ticket.assigned_technician_id:
        prev = db.query(User).filter(User.id == ticket.assigned_technician_id).first()
        if prev:
            old_assignee = prev.full_name or prev.email

    if ticket.assigned_technician_id == assign_in.engineer_id:
        return ticket # No change, avoid duplicate logging

    ticket.assigned_technician_id = assign_in.engineer_id
    ticket.status = TicketStatus.in_progress if assign_in.engineer_id is not None else TicketStatus.open
    ticket.updated_at = datetime.utcnow()
    
    _log_history(db, ticket.id, "assigned",
                 old_assignee, engineer_name, current_user.id)
    # Only use history for assignment logs to avoid duplication in Activity feed
    db.commit()
    db.refresh(ticket)
    await manager.broadcast({"type": "ticket_updated", "ticket_id": ticket.id})
    return ticket


# ─── Engineer Status Update ──────────────────────────────────────────────────

@router.put("/{ticket_id}/status", response_model=TicketResponse)
async def update_status(
    ticket_id: int,
    status_in: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.customer:
        raise HTTPException(status_code=403, detail="Customers cannot update ticket status")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.staff and ticket.assigned_technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own assigned tickets")

    old_status = ticket.status.value if hasattr(ticket.status, 'value') else str(ticket.status)
    if old_status == status_in.status.value:
        return ticket # No change

    ticket.status = status_in.status
    ticket.updated_at = datetime.utcnow()
    _log_history(db, ticket.id, "status_update", old_status, status_in.status.value, current_user.id)
    _log_activity(db, ticket.id, current_user.id, status_in.status.value, status_in.note or f"Status changed to {status_in.status.value}")

    if status_in.note and status_in.note.strip():
        db.add(TicketComment(
            ticket_id=ticket.id,
            sender_id=current_user.id,
            message=f"[Progress Update] {status_in.note.strip()}",
            is_internal=True
        ))

    db.commit()
    db.refresh(ticket)
    await manager.broadcast({"type": "ticket_updated", "ticket_id": ticket.id})
    return ticket


# ─── Delete Ticket ───────────────────────────────────────────────────────────

@router.delete("/{ticket_id}")
async def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admins can delete tickets")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    db.delete(ticket)
    db.commit()
    await manager.broadcast({"type": "ticket_deleted", "ticket_id": ticket_id})
    return {"message": f"Ticket #{ticket_id} deleted successfully"}


# ─── Comments ────────────────────────────────────────────────────────────────

@router.post("/{ticket_id}/comments", response_model=TicketCommentResponse)
async def create_comment(
    ticket_id: int,
    comment_in: TicketCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    comment = TicketComment(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=comment_in.message,
        is_internal=comment_in.is_internal if current_user.role != UserRole.customer else False
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    await manager.broadcast({"type": "comment_added", "ticket_id": ticket.id})
    return comment


@router.get("/{ticket_id}/comments", response_model=List[TicketCommentResponse])
def get_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    query = db.query(TicketComment).filter(TicketComment.ticket_id == ticket_id)
    if current_user.role == UserRole.customer:
        query = query.filter(TicketComment.is_internal == False)
    return query.order_by(TicketComment.created_at.asc()).all()


@router.delete("/{ticket_id}/comments/{comment_id}")
async def delete_comment(
    ticket_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role == UserRole.customer:
        raise HTTPException(status_code=403, detail="Not authorized to delete comments")

    comment = db.query(TicketComment).filter(
        TicketComment.id == comment_id,
        TicketComment.ticket_id == ticket_id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    db.delete(comment)
    db.commit()
    await manager.broadcast({"type": "comment_added", "ticket_id": ticket_id})
    return {"message": "Comment deleted"}


# ─── Engineer Progress Update ─────────────────────────────────────────────────

@router.post("/{ticket_id}/progress")
async def add_progress(
    ticket_id: int,
    entry: TicketProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Engineer (or admin) submits a progress update."""
    if current_user.role == UserRole.customer:
        raise HTTPException(status_code=403, detail="Customers cannot post progress updates")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.staff and ticket.assigned_technician_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your assigned tickets")

    ticket.status = entry.status
    ticket.updated_at = datetime.utcnow()
    _log_activity(db, ticket.id, current_user.id, entry.status.value, entry.message)

    db.commit()
    db.refresh(ticket)

    await manager.broadcast({"type": "ticket_updated", "ticket_id": ticket_id})
    return {"message": "Progress recorded", "status": ticket.status}


@router.get("/{ticket_id}/activity", response_model=List[TicketActivityResponse])
def get_activity(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Return full activity timeline for a ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if current_user.role == UserRole.customer and ticket.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    from sqlalchemy.orm import selectinload
    entries = db.query(TicketActivity).options(selectinload(TicketActivity.engineer)).filter(
        TicketActivity.ticket_id == ticket_id
    ).order_by(TicketActivity.created_at.asc()).all()

    result = []
    for e in entries:
        engineer = e.engineer
        result.append({
            "id": e.id,
            "status": e.status,
            "message": e.message,
            "engineer_name": engineer.full_name or engineer.email if engineer else "System",
            "created_at": e.created_at.isoformat()
        })
    return result
