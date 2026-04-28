from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base

class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    customer = "customer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer)
    is_active = Column(Boolean, default=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    designation = Column(String, nullable=True)

    # Relationships
    company = relationship("Company", back_populates="users")
