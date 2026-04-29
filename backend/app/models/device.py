from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
from ..core.database import Base


class DeviceType(Base):
    __tablename__ = "device_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    devices = relationship("Device", back_populates="device_type")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, nullable=False)
    model_number = Column(String, nullable=False)
    serial_number = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Missing warranty fields
    purchase_date = Column(DateTime, nullable=True)
    warranty_available = Column(Boolean, default=False)
    warranty_duration = Column(String, nullable=True)
    warranty_expiry_date = Column(DateTime, nullable=True)

    customer_id = Column(Integer, ForeignKey("users.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    device_type_id = Column(Integer, ForeignKey("device_types.id"))
    device_type = relationship("DeviceType", back_populates="devices")

    company = relationship("Company")
    customer = relationship("User")

    tickets = relationship("Ticket", back_populates="device")