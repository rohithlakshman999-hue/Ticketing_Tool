from fastapi.testclient import TestClient
import traceback

try:
    from main import app

    client = TestClient(app)

    response = client.post(
        "/auth/register",
        json={
            "email": "test10@test.com",
            "password": "StrongPass123",
            "full_name": "Test User",
            "company_name": "Test Company"
        }
    )

    print("\n🔍 TEST RESULT")
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.json())

    # ✅ Basic assertion
    if response.status_code == 200 or response.status_code == 201:
        print("✅ Registration test PASSED")
    else:
        print("❌ Registration test FAILED")

except Exception:
    print("❌ Exception occurred:")
    traceback.print_exc()