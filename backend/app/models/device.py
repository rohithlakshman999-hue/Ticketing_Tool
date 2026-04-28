from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class DeviceType(Base):
    __tablename__ = "device_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True) # Laptop, Desktop, Router, etc.
    description = Column(Text, nullable=True)
    
    # Relationships
    devices = relationship("Device", back_populates="device_type")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    model_number = Column(String, index=True)
    serial_number = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    purchase_date = Column(Date, nullable=True)
    warranty_expiry_date = Column(Date, nullable=True)
    warranty_available = Column(Boolean, default=False)
    warranty_duration = Column(String, nullable=True)  # e.g., "12 months", "2 years"
    
    device_type_id = Column(Integer, ForeignKey("device_types.id"), index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    device_type = relationship("DeviceType", back_populates="devices")
    customer = relationship("User", foreign_keys=[customer_id], backref="devices")
    company = relationship("Company", backref="devices")
    tickets = relationship("Ticket", back_populates="device")
