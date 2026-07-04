from fastapi.testclient import TestClient
from backend.main import app
from backend.app.core.database import get_db, SessionLocal
from backend.app.models.user import User, UserRole
from backend.app.models.ticket import Ticket
import json

client = TestClient(app)

db = SessionLocal()
try:
    # Get a staff user
    admin_user = db.query(User).filter(User.role == UserRole.admin).first()
    if not admin_user:
        print("No admin user found.")
        exit(1)
        
    staff_user = db.query(User).filter(User.role.in_([UserRole.staff, UserRole.admin])).first()
    
    # Get a ticket
    ticket = db.query(Ticket).first()
    if not ticket:
        print("No tickets found.")
        exit(1)

    print(f"Testing assignment of Ticket {ticket.id} to Engineer {staff_user.id} by Admin {admin_user.id}")

    # Override get_current_active_user dependency
    from backend.app.api.deps import get_current_active_user
    app.dependency_overrides[get_current_active_user] = lambda: admin_user

    payload = {"engineer_id": staff_user.id}
    
    response = client.put(f"/tickets/{ticket.id}/assign", json=payload)
    print("STATUS CODE:", response.status_code)
    try:
        print("RESPONSE:", json.dumps(response.json(), indent=2))
    except:
        print("RESPONSE TEXT:", response.text)

finally:
    db.close()
