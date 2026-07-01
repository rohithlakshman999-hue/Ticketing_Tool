import os
import sys

# Force the Render URL with sslmode=require
os.environ["DATABASE_URL"] = "postgresql://ticketing_db_e3kf_user:5VNPM9XdS2lvFNwjCGQ6UDNTJENNpCBp@dpg-d7o9ugreo5us739p242g-a.oregon-postgres.render.com/ticketing_db_e3kf?sslmode=require"

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def reset_admin():
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
            print("Admin created successfully on Render DB!")
        else:
            print("Admin already exists. Resetting password to 'adminpassword' and ensuring role is 'admin'...")
            exists.hashed_password = get_password_hash("adminpassword")
            exists.role = UserRole.admin
            db.commit()
            print("Admin password and role reset successfully!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
