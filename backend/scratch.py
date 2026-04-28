from fastapi.testclient import TestClient
import sys
import traceback

try:
    from main import app
    client = TestClient(app)
    response = client.post("/auth/register", json={
        "email": "test10@test.com",
        "password": "pass",
        "full_name": "Test",
        "role": "customer"
    })
    print(f"STATUS: {response.status_code}")
    print(f"RESPONSE: {response.text}")
except Exception as e:
    traceback.print_exc()
