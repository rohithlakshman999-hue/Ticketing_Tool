from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ..models.user import UserRole


# ------------------- COMPANY -------------------

class CompanyBase(BaseModel):
    name: str


class CompanyResponse(CompanyBase):
    id: int

    class Config:
        from_attributes = True


# ------------------- USER -------------------

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.customer
    designation: Optional[str] = None


class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None  # used during registration


class UserResponse(UserBase):
    id: int
    is_active: bool

    # ✅ Full company object (good)
    company: Optional[CompanyResponse] = None

    # 🔥 OPTIONAL (useful for frontend display)
    company_name: Optional[str] = None

    class Config:
        from_attributes = True


# ------------------- AUTH -------------------

class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None