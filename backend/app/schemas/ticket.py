from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.ticket import TicketStatus, TicketPriority


class TicketBase(BaseModel):
    title: str
    description: str
    device_type: str
    category: str
    priority: TicketPriority = TicketPriority.low


class TicketCreate(TicketBase):
    customer_email: Optional[str] = None
    company_name: Optional[str] = None
    device_id: Optional[int] = None


class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_technician_id: Optional[int] = None


class TicketAssignRequest(BaseModel):
    engineer_id: int


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    note: Optional[str] = None


class TicketProgressCreate(BaseModel):
    status: TicketStatus
    message: str


class TicketCommentBase(BaseModel):
    message: str
    is_internal: bool = False


class TicketCommentCreate(TicketCommentBase):
    pass


class TicketCommentResponse(TicketCommentBase):
    id: int
    ticket_id: int
    sender_id: int
    sender_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketHistoryResponse(BaseModel):
    id: int
    ticket_id: int
    action: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class TicketActivityResponse(BaseModel):
    id: int
    status: str
    message: str
    engineer_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


from .device import DeviceResponse


class EngineerInfo(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True


class TicketResponse(TicketBase):
    id: int
    status: TicketStatus
    customer_id: int
    customer_name: Optional[str] = None
    assigned_technician_id: Optional[int] = None
    assigned_technician_name: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    device_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    comments: list[TicketCommentResponse] = []
    history: list[TicketHistoryResponse] = []
    device: Optional[DeviceResponse] = None

    class Config:
        from_attributes = True
