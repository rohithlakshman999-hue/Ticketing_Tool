from app.core.database import SessionLocal
from app.models.user import User, UserRole

db = SessionLocal()

email_to_delete = "admin@ticketing.com"

try:
    user = db.query(User).filter(User.email == email_to_delete).first()

    if not user:
        print(f"❌ User {email_to_delete} not found.")
    else:
        # 🔴 Safety check: don't accidentally delete yourself
        print(f"⚠️ Found user: {user.email} | Role: {user.role}")

        confirm = input("Are you sure you want to delete this user? (yes/no): ")

        if confirm.lower() == "yes":
            db.delete(user)
            db.commit()
            print(f"✅ Successfully deleted {email_to_delete}")
        else:
            print("❌ Deletion cancelled")

except Exception as e:
    db.rollback()
    print("❌ Error occurred:", str(e))

finally:
    db.close()