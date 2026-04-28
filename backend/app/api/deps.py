from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db
from ..models.user import User
from ..schemas.user import TokenData


# ✅ Make sure this matches your route exactly
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ------------------- GET CURRENT USER -------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

        token_data = TokenData(email=email)

    except JWTError:
        raise credentials_exception

    # Fetch user from DB
    user = db.query(User).filter(User.email == token_data.email).first()

    if user is None:
        raise credentials_exception

    return user


# ------------------- ACTIVE USER CHECK -------------------

def get_current_active_user(
    current_user: User = Depends(get_current_user)
):

    # ✅ Safe check (avoid crash if column missing)
    if hasattr(current_user, "is_active") and not current_user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )

    return current_user