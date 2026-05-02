import sys
import os

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole

def grant_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found. They might need to log in via Google first to create their account.")
            return

        user.role = UserRole.admin
        db.commit()
        print(f"SUCCESS: User {email} has been granted admin privileges.")
    except Exception as e:
        db.rollback()
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    target_email = "ganesan@hertznbytes.com"
    grant_admin(target_email)
