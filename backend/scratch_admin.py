from app.core.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import getpass

db = SessionLocal()

try:
    admin_email = "admin@ticketing.com"

    admin = db.query(User).filter(User.email == admin_email).first()

    if admin:
        print("⚠️ Admin user already exists!")
    else:
        print("🔐 Create Admin User")

        # ✅ Secure password input
        password = getpass.getpass("Enter admin password: ")

        admin = User(
            email=admin_email,
            full_name="System Admin",
            hashed_password=get_password_hash(password),
            role=UserRole.admin,
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("✅ Admin user created successfully!")

except Exception as e:
    db.rollback()
    print("❌ Error creating admin:", str(e))

finally:
    db.close()