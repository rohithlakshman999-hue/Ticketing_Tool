from pydantic import BaseModel, computed_field
from typing import Optional
from datetime import date, datetime, timedelta


# ------------------- DEVICE TYPE -------------------

class DeviceTypeBase(BaseModel):
    name: str
    description: Optional[str] = None


class DeviceTypeCreate(DeviceTypeBase):
    pass


class DeviceTypeResponse(DeviceTypeBase):
    id: int

    class Config:
        from_attributes = True


# ------------------- DEVICE -------------------

class DeviceBase(BaseModel):
    product_name: str
    model_number: str
    serial_number: Optional[str] = None
    description: Optional[str] = None

    purchase_date: Optional[date] = None
    warranty_expiry_date: Optional[date] = None

    warranty_available: bool = False
    warranty_duration: Optional[str] = None

    device_type_id: int


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    product_name: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None

    purchase_date: Optional[date] = None
    warranty_expiry_date: Optional[date] = None

    warranty_available: Optional[bool] = None
    warranty_duration: Optional[str] = None

    device_type_id: Optional[int] = None


class DeviceResponse(DeviceBase):
    id: int
    customer_id: int
    company_id: Optional[int] = None
    created_at: datetime

    # ✅ Nested relation
    device_type: DeviceTypeResponse

    # ------------------- COMPUTED FIELD -------------------

    @computed_field
    @property
    def warranty_status(self) -> str:
        if not self.warranty_available:
            return "expired"

        if not self.warranty_expiry_date:
            return "unknown"

        today = date.today()

        if today > self.warranty_expiry_date:
            return "expired"

        if (self.warranty_expiry_date - today) <= timedelta(days=30):
            return "expiring_soon"

        return "under_warranty"

    class Config:
        from_attributes = True