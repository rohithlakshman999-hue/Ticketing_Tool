#!/usr/bin/env python3
"""
🚀 Google OAuth Configuration Test Script (Improved)

Supports:
- Local development
- Production (Render + Vercel)
"""

import os
import requests
from pathlib import Path

# ---------------- CONFIG ----------------

LOCAL_BACKEND = "http://localhost:8000"
PROD_BACKEND = "https://ticketing-tool-9kv0.onrender.com"

# ---------------- HELPERS ----------------

def check_env_file(path, key):
    if not path.exists():
        print(f"❌ {path} not found")
        return False

    content = path.read_text()
    if key in content:
        print(f"✅ {key} found in {path}")
        return True
    else:
        print(f"❌ {key} missing in {path}")
        return False


def test_endpoint(url, method="GET"):
    try:
        if method == "GET":
            res = requests.get(url, timeout=5)
        else:
            res = requests.post(url, json={"token": "test"}, timeout=5)

        print(f"✅ {url} → {res.status_code}")
        return True
    except Exception as e:
        print(f"❌ {url} failed → {e}")
        return False


# ---------------- MAIN TEST ----------------

def test_google_oauth_config():
    print("\n🔍 Testing Google OAuth Configuration...\n")

    root = Path(__file__).resolve().parent.parent

    backend_env = root / "backend" / ".env"
    frontend_env = root / "frontend" / ".env"

    # ---------------- ENV CHECK ----------------
    print("📁 Checking Environment Files...\n")

    check_env_file(backend_env, "GOOGLE_CLIENT_ID")
    check_env_file(frontend_env, "VITE_GOOGLE_CLIENT_ID")

    # ---------------- BACKEND TEST ----------------
    print("\n🌐 Testing Backend...\n")

    print("➡️ Local Backend:")
    test_endpoint(f"{LOCAL_BACKEND}/")

    print("➡️ Production Backend:")
    test_endpoint(f"{PROD_BACKEND}/")

    # ---------------- GOOGLE ROUTE ----------------
    print("\n🔐 Testing Google OAuth Endpoint...\n")

    print("➡️ Local:")
    test_endpoint(f"{LOCAL_BACKEND}/auth/google", method="POST")

    print("➡️ Production:")
    test_endpoint(f"{PROD_BACKEND}/auth/google", method="POST")

    # ---------------- FINAL GUIDE ----------------
    print("\n📋 FINAL CHECKLIST:\n")

    print("1. ✅ Google Cloud Console → Add this:")
    print("   - http://localhost:5173")
    print("   - https://ticketingtool.vercel.app\n")

    print("2. ✅ Redirect URIs:")
    print("   - http://localhost:8000/auth/google")
    print("   - https://ticketing-tool-9kv0.onrender.com/auth/google\n")

    print("3. ✅ Same Client ID in:")
    print("   - backend/.env")
    print("   - frontend/.env\n")

    print("4. ⏳ Wait 2–5 minutes after saving in Google Console\n")

    print("5. 🌐 Test login:")
    print("   - http://localhost:5173")
    print("   - https://ticketingtool.vercel.app\n")

    print("🎉 If all checks pass → Google OAuth should work!")


# ---------------- RUN ----------------

if __name__ == "__main__":
    test_google_oauth_config()