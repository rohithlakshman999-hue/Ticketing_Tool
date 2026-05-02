from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..models.device import Device, DeviceType
from ..models.user import User, UserRole
from ..schemas.device import (
    DeviceCreate,
    DeviceUpdate,
    DeviceResponse,
    DeviceTypeCreate,
    DeviceTypeResponse
)
from .deps import get_current_active_user

router = APIRouter()


# ------------------- DEVICE TYPES -------------------

@router.get("/types", response_model=List[DeviceTypeResponse])
def get_device_types(db: Session = Depends(get_db)):
    return db.query(DeviceType).all()


@router.post("/types", response_model=DeviceTypeResponse)
def create_device_type(
    device_type_in: DeviceTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in [UserRole.admin, UserRole.staff]:
        raise HTTPException(status_code=403, detail="Not authorized")

    device_type = DeviceType(**device_type_in.model_dump())
    db.add(device_type)
    db.commit()
    db.refresh(device_type)

    return device_type


# ------------------- CREATE DEVICE -------------------

@router.post("/", response_model=DeviceResponse)
def create_device(
    device_in: DeviceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    device = Device(
        **device_in.model_dump(),
        customer_id=current_user.id,
        company_id=current_user.company_id
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device


# ------------------- GET DEVICES -------------------

@router.get("/", response_model=List[DeviceResponse])
def get_devices(
    type_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    only_with_tickets: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Device)

    # Customer restrictions: Only show devices THEY registered
    if current_user.role == UserRole.customer:
        query = query.filter(Device.customer_id == current_user.id)

    else:
        # Admin/staff filter
        if customer_id:
            query = query.filter(Device.customer_id == customer_id)

    if type_id:
        query = query.filter(Device.device_type_id == type_id)

    if only_with_tickets:
        query = query.filter(Device.tickets.any())

    return query.all()


# ------------------- GET SINGLE DEVICE -------------------

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role == UserRole.customer:
        if (
            device.company_id != current_user.company_id and
            device.customer_id != current_user.id
        ):
            raise HTTPException(status_code=403, detail="Not authorized")

    return device


# ------------------- UPDATE DEVICE -------------------

@router.put("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: int,
    device_update: DeviceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role == UserRole.customer:
        if device.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    update_data = device_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(device, field, value)

    db.commit()
    db.refresh(device)

    return device


# ------------------- DELETE DEVICE -------------------

@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role == UserRole.customer:
        if device.customer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(device)
    db.commit()

    return {"message": "Device deleted successfully"}