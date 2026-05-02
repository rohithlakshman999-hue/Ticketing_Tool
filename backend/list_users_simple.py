from app.core.database import SessionLocal
import app.models
from app.models.user import User

db = SessionLocal()

try:
    users = db.query(User).all()
    if not users:
        print("No users found.")
    else:
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Role: {u.role.value}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
