from app.core.database import SessionLocal
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.ticket import Ticket
from app.models.device import Device, DeviceType
from app.core.security import get_password_hash

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
        print("✅ Admin created with password: adminpassword")
    else:
        print("✅ Admin already exists.")
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    db.close()
