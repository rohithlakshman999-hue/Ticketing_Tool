#!/usr/bin/env python3
"""
Google OAuth Configuration Test Script
Run this to verify your Google OAuth setup is working correctly.
"""

import os
import sys
import requests
from pathlib import Path

def test_google_oauth_config():
    """Test Google OAuth configuration"""
    print("🔍 Testing Google OAuth Configuration...\n")

    # Check backend .env file
    backend_env = Path(__file__).parent.parent / "backend" / ".env"
    if backend_env.exists():
        with open(backend_env, 'r') as f:
            content = f.read()
            if "GOOGLE_CLIENT_ID=" in content:
                print("✅ Backend GOOGLE_CLIENT_ID found")
            else:
                print("❌ Backend GOOGLE_CLIENT_ID missing")
    else:
        print("❌ Backend .env file not found")

    # Check frontend .env file
    frontend_env = Path(__file__).parent.parent / "frontend" / ".env"
    if frontend_env.exists():
        with open(frontend_env, 'r') as f:
            content = f.read()
            if "VITE_GOOGLE_CLIENT_ID=" in content:
                print("✅ Frontend VITE_GOOGLE_CLIENT_ID found")
            else:
                print("❌ Frontend VITE_GOOGLE_CLIENT_ID missing")
    else:
        print("❌ Frontend .env file not found")

    # Test backend connectivity
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend server is running")
        else:
            print(f"❌ Backend server responded with status {response.status_code}")
    except requests.exceptions.RequestException:
        print("❌ Backend server not accessible")

    # Test Google OAuth endpoint
    try:
        response = requests.post("http://localhost:8000/auth/google",
                               json={"token": "test"},
                               timeout=5)
        if response.status_code == 400:
            print("✅ Google OAuth endpoint is responding")
        else:
            print(f"❌ Google OAuth endpoint unexpected response: {response.status_code}")
    except requests.exceptions.RequestException:
        print("❌ Google OAuth endpoint not accessible")

    print("\n📋 Next Steps:")
    print("1. Ensure Google Cloud Console has http://localhost:5173 in Authorized JavaScript origins")
    print("2. Verify Client ID matches between Google Console and your .env files")
    print("3. Try Google login at http://localhost:5173/")
    print("4. Check browser console for detailed error messages")

if __name__ == "__main__":
    test_google_oauth_config()