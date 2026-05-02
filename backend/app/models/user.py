from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base


# ------------------- ROLE ENUM -------------------

class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    customer = "customer"


# ------------------- USER MODEL -------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String, index=True, nullable=True)

    email = Column(String, unique=True, index=True, nullable=False)

    hashed_password = Column(String, nullable=False)

    role = Column(Enum(UserRole), default=UserRole.customer)

    is_active = Column(Boolean, default=True)

    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)

    designation = Column(String, nullable=True)
    last_login = Column(String, nullable=True)

    # ------------------- RELATIONSHIPS -------------------

    company = relationship(
        "Company",
        back_populates="users"
    )

    # Tickets created by this user
    tickets_created = relationship(
        "Ticket",
        foreign_keys="Ticket.customer_id",
        back_populates="customer"
    )

    # Tickets assigned to this user
    tickets_assigned = relationship(
        "Ticket",
        foreign_keys="Ticket.assigned_technician_id",
        back_populates="assigned_technician"
    )