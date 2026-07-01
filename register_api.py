import requests

url = "https://ticketing-tool-9kv0.onrender.com/auth/register"
payload = {
  "email": "admin@ticketing.com",
  "full_name": "System Admin",
  "role": "admin",
  "password": "adminpassword"
}

try:
    print("Sending registration request...")
    response = requests.post(url, json=payload, timeout=20)
    print("Status:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", e)
