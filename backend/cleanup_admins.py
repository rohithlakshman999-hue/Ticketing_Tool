from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.ticket import Ticket
from app.models.device import Device, DeviceType

db = SessionLocal()
email_to_delete = "admin@ticketing.com"
user = db.query(User).filter(User.email == email_to_delete).first()

if user:
    db.delete(user)
    db.commit()
    print(f"Successfully deleted {email_to_delete}. Your email is now the only admin.")
else:
    print(f"User {email_to_delete} not found.")

db.close()
