from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.core.security import create_access_token


@router.post("/google")
def google_login(data: dict, db: Session = Depends(get_db)):
    try:
        token = data.get("token")

        if not token:
            raise HTTPException(status_code=400, detail="Token missing")

        # 🔥 VERIFY TOKEN
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        name = idinfo.get("name")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid Google token")

        # 🔍 CHECK USER
        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                full_name=name,
                hashed_password="google_user",
                role=UserRole.customer
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 🔐 CREATE JWT
        access_token = create_access_token(data={"sub": user.email})

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except Exception as e:
        print("❌ GOOGLE LOGIN ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Google login failed")