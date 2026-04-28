from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()

try:
    users = db.query(User).all()

    if not users:
        print("⚠️ No users found in database.")
    else:
        print("\n📋 Current Users in Database:\n")

        for u in users:
            company_name = u.company.name if u.company else "No Company"

            print(
                f"ID: {u.id} | "
                f"Email: {u.email} | "
                f"Role: {u.role.value} | "
                f"Active: {u.is_active} | "
                f"Company: {company_name}"
            )

except Exception as e:
    print("❌ Error fetching users:", str(e))

finally:
    db.close()