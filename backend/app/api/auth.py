from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import uuid

from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.user import User, UserRole
from ..models.company import Company
from ..schemas.user import UserCreate, UserResponse, Token
from ..core.config import settings
from .deps import get_current_active_user

router = APIRouter()


# ------------------- REGISTER -------------------

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    company_id = None

    if user_in.company_name:
        company = db.query(Company).filter(Company.name == user_in.company_name).first()
        if not company:
            company = Company(name=user_in.company_name)
            db.add(company)
            db.commit()
            db.refresh(company)
        company_id = company.id

    hashed_password = get_password_hash(user_in.password)

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=user_in.role,
        company_id=company_id,
        designation=getattr(user_in, 'designation', None)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ------------------- LOGIN -------------------

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == form_data.username).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # ✅ Added try-except for password verification (bcrypt can fail on invalid hashes)
        try:
            is_valid = verify_password(form_data.password, user.hashed_password)
        except Exception as e:
            print(f"[ERROR] Password verification failed for {user.email}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed. Please reset your password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(data={"sub": user.email})

        # Update last login
        try:
            from datetime import datetime
            user.last_login = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            db.commit()
        except Exception as db_err:
            print(f"[WARNING] Could not update last_login: {str(db_err)}")
            # Don't fail the whole login just because last_login update failed
            db.rollback()

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Unexpected login error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during login: {str(e)}"
        )


# ------------------- GOOGLE LOGIN -------------------

class GoogleToken(BaseModel):
    token: str


@router.post("/google", response_model=Token)
def google_login(token_data: GoogleToken, db: Session = Depends(get_db)):
    try:
        client_id = settings.GOOGLE_CLIENT_ID

        if not client_id:
            raise HTTPException(
                status_code=400,
                detail="Google OAuth not configured on server. Use email/password login."
            )

        try:
            idinfo = id_token.verify_oauth2_token(
                token_data.token,
                requests.Request(),
                client_id,
                clock_skew_in_seconds=30
            )
        except ValueError as e:
            error_msg = str(e)
            print(f"[ERROR] Google token verification failed: {error_msg}")
            if "Token used too late" in error_msg:
                raise HTTPException(status_code=400, detail="Google token expired. Please try again.")
            elif "audience" in error_msg or "Wrong recipient" in error_msg:
                raise HTTPException(status_code=400, detail="Google Client ID mismatch. Please check server configuration.")
            else:
                raise HTTPException(status_code=400, detail=f"Google verification failed: {error_msg}")

        email = idinfo.get("email")
        full_name = idinfo.get("name", "")

        if not email:
            raise HTTPException(status_code=400, detail="No email found in Google account.")

        user = db.query(User).filter(User.email == email).first()

        if not user:
            # Auto-register Google users
            try:
                random_password = str(uuid.uuid4())
                user = User(
                    email=email,
                    full_name=full_name,
                    hashed_password=get_password_hash(random_password),
                    role=UserRole.customer,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"[SUCCESS] Auto-registered new Google user: {email}")
            except Exception as reg_err:
                db.rollback()
                print(f"[ERROR] Failed to auto-register Google user: {str(reg_err)}")
                raise HTTPException(status_code=500, detail="Failed to create user account from Google profile.")

        access_token = create_access_token(data={"sub": user.email})

        # Update last login
        try:
            from datetime import datetime
            user.last_login = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            db.commit()
        except:
            db.rollback()

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[CRITICAL] Unexpected Google Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ------------------- ADMIN PASSWORD RESET -------------------

class PasswordReset(BaseModel):
    new_password: str

@router.put("/users/{user_id}/password")
def reset_password(
    user_id: int,
    reset_in: PasswordReset,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(reset_in.new_password)
    db.commit()
    return {"message": "Password reset successfully"}


# ------------------- CURRENT USER -------------------

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ------------------- GET ENGINEERS -------------------

@router.get("/engineers")
def get_engineers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    engineers = db.query(User).filter(User.role.in_([UserRole.staff, UserRole.admin])).all()

    # Final return
    return [
        {
            "id": e.id,
            "name": e.full_name or e.email,
            "email": e.email,
            "designation": e.designation,
            "last_login": e.last_login
        }
        for e in engineers
    ]

# ------------------- DELETE USER -------------------

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    try:
        # Nullify assignments so tickets go back to unassigned queue
        from ..models.ticket import Ticket, TicketComment, TicketHistory, TicketActivity
        db.query(Ticket).filter(Ticket.assigned_technician_id == user_id).update({Ticket.assigned_technician_id: None})
        db.query(Ticket).filter(Ticket.customer_id == user_id).update({Ticket.customer_id: None})
        db.query(Ticket).filter(Ticket.created_by_id == user_id).update({Ticket.created_by_id: None})
        
        db.query(TicketComment).filter(TicketComment.sender_id == user_id).update({TicketComment.sender_id: None})
        db.query(TicketHistory).filter(TicketHistory.changed_by == user_id).update({TicketHistory.changed_by: None})
        db.query(TicketActivity).filter(TicketActivity.updated_by == user_id).update({TicketActivity.updated_by: None})
        
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot delete user due to existing relationships: {str(e)}")

    return {"message": "User deleted successfully"}