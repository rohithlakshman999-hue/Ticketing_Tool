from pydantic import BaseModel, EmailStr
from typing import Optional
from ..models.user import UserRole

class CompanyBase(BaseModel):
    name: str

class CompanyResponse(CompanyBase):
    id: int
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.customer
    designation: Optional[str] = None

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    company: Optional[CompanyResponse] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
