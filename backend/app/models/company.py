from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from ..core.database import Base
from sqlalchemy.orm import relationship

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="company")
    tickets = relationship("Ticket", back_populates="company")
