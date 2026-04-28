from main import app
from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.security import get_password_hash

db = SessionLocal()

# Check if admin already exists
admin_email = "admin@ticketing.com"
admin = db.query(User).filter(User.email == admin_email).first()

if not admin:
    print("Creating admin user...")
    admin = User(
        email=admin_email,
        full_name="System Admin",
        hashed_password=get_password_hash("admin123"),
        role=UserRole.admin
    )
    db.add(admin)
    db.commit()
    print("Admin user created successfully!")
else:
    print("Admin user already exists!")

db.close()
