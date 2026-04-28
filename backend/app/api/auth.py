from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse, Token

router = APIRouter()

from ..models.company import Company

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    company_id = None
    if user_in.company_name:
        company = db.query(Company).filter(Company.name == user_in.company_name).first()
        if not company:
            company = Company(name=user_in.company_name)
            db.add(company)
            db.commit()
            db.refresh(company)
        company_id = company.id

    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        role=user_in.role,
        company_id=company_id,
        designation=user_in.designation
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

from .deps import get_current_active_user
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import uuid

class GoogleToken(BaseModel):
    token: str

@router.post("/google", response_model=Token)
def google_login(token_data: GoogleToken, db: Session = Depends(get_db)):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    
    if not client_id:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured. Please use email/password login or contact your administrator."
        )
    
    try:
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token_data.token, 
            requests.Request(), 
            client_id,
            clock_skew_in_seconds=30
        )
        
        if not idinfo:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        
        email = idinfo.get('email')
        full_name = idinfo.get('name', '')
        
        if not email:
            raise HTTPException(status_code=400, detail="No email found in Google token")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create user with a random unguessable password
            from ..models.user import UserRole
            random_password = str(uuid.uuid4())
            user = User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(random_password),
                role=UserRole.customer
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(data={"sub": user.email})
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        error_msg = str(e)
        if "Token used too late" in error_msg:
            raise HTTPException(status_code=400, detail="Google token has expired. Please try logging in again.")
        elif "Wrong recipient" in error_msg or "audience" in error_msg:
            raise HTTPException(status_code=400, detail="Google Client ID mismatch. Please check your Google Cloud Console configuration.")
        elif "certs" in error_msg:
            raise HTTPException(status_code=500, detail="Google certificate verification failed. Please try again later.")
        else:
            raise HTTPException(status_code=400, detail=f"Google token verification failed: {error_msg}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google login failed: {str(e)}")

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/engineers")
def get_engineers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    engineers = db.query(User).filter(User.role == "staff").all()
    return [{"id": e.id, "name": e.full_name or e.email, "email": e.email, "designation": e.designation} for e in engineers]
