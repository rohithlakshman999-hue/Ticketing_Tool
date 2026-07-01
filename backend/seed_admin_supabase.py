import os
import sys

# Force the Supabase URL with pooler and just 'postgres' as user
os.environ["DATABASE_URL"] = "postgresql://postgres:applebananauser12@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        email = "admin@ticketing.com"
        exists = db.query(User).filter(User.email == email).first()
        if not exists:
            u = User(
                email=email,
                full_name="System Admin",
                hashed_password=get_password_hash("adminpassword"),
                role=UserRole.admin,
                is_active=True
            )
            db.add(u)
            db.commit()
            print("Admin created successfully on Supabase!")
        else:
            print("Admin already exists on Supabase. Resetting password just in case...")
            exists.hashed_password = get_password_hash("adminpassword")
            db.commit()
            print("Admin password reset successfully on Supabase!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
