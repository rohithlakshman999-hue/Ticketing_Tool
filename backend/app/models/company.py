from sqlalchemy import Column, Integer, String, DateTime, UniqueConstraint
from datetime import datetime
from sqlalchemy.orm import relationship

from ..core.database import Base


class Company(Base):
    __tablename__ = "companies"
    
    __table_args__ = (
        UniqueConstraint('name', 'contact_person', name='uq_company_name_contact'),
    )

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # ------------------- RELATIONSHIPS -------------------

    # Users in this company
    users = relationship(
        "User",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    # Tickets raised under this company
    tickets = relationship(
        "Ticket",
        back_populates="company",
        cascade="all, delete-orphan"
    )