from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..core.database import Base


# ------------------- ENUMS -------------------

class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class TicketPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


# ------------------- MAIN TICKET -------------------

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)

    device_type = Column(String)
    category = Column(String)

    status = Column(Enum(TicketStatus), default=TicketStatus.open)
    priority = Column(Enum(TicketPriority), default=TicketPriority.low)

    customer_id = Column(Integer, ForeignKey("users.id"), index=True)
    assigned_technician_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ------------------- RELATIONSHIPS -------------------

    customer = relationship(
        "User",
        foreign_keys=[customer_id],
        backref="tickets_created"
    )

    assigned_technician = relationship(
        "User",
        foreign_keys=[assigned_technician_id],
        backref="tickets_assigned"
    )

    company = relationship(
        "Company",
        back_populates="tickets"
    )

    device = relationship(
        "Device",
        back_populates="tickets"
    )

    comments = relationship(
        "TicketComment",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    history = relationship(
        "TicketHistory",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    activity = relationship(
        "TicketActivity",
        back_populates="ticket",
        cascade="all, delete-orphan"
    )

    # ------------------- FEATURE (COMPANY NAME) -------------------

    @property
    def company_name(self):
        return self.company.name if self.company else None


# ------------------- COMMENTS -------------------

class TicketComment(Base):
    __tablename__ = "ticket_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), index=True)

    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="comments")
    sender = relationship("User")


# ------------------- HISTORY -------------------

class TicketHistory(Base):
    __tablename__ = "ticket_history"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), index=True)

    action = Column(String, index=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)

    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="history")
    user = relationship("User")


# ------------------- ACTIVITY -------------------

class TicketActivity(Base):
    """Engineer progress log — every step of work recorded here."""
    __tablename__ = "ticket_activity"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), index=True)

    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    status = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="activity")
    engineer = relationship("User", foreign_keys=[updated_by])