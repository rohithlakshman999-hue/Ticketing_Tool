from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.ticket import Ticket
from app.models.device import Device, DeviceType

db = SessionLocal()
users = db.query(User).all()
print("Current Users in Database:")
for u in users:
    print(f"ID: {u.id} | Email: {u.email} | Role: {u.role}")
db.close()
