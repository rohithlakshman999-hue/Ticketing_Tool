from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.ticket import Ticket
from app.models.device import Device, DeviceType

db = SessionLocal()
email = "rohithlakshman999@gmail.com"
user = db.query(User).filter(User.email == email).first()

if user:
    user.role = UserRole.admin
    db.commit()
    print(f"Successfully promoted {email} to ADMIN!")
else:
    print(f"User {email} not found in database.")

db.close()
