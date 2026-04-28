from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship

from ..core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ Prevent duplicate names, ensure indexing
    name = Column(String, unique=True, index=True, nullable=False)

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