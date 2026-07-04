import asyncio
from app.core.database import SessionLocal
from app.api.auth import register
from app.schemas.user import UserCreate
from app.models.user import UserRole
import uuid

def test_reg():
    db = SessionLocal()
    try:
        user_in = UserCreate(
            email=f"test{uuid.uuid4().hex[:6]}@example.com",
            full_name="Test Engineer",
            password="Password123!",
            role=UserRole.staff,
            designation="Engineer",
        )
        print("Registering:", user_in)
        res = register(user_in=user_in, db=db)
        print("Success:", res)
    except Exception as e:
        print("Exception:", e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_reg()
