# Google OAuth Setup Guide

## Quick Fix: Use Email/Password Login
If you want to skip Google OAuth setup for now, **just use your email and password to login**. The app now supports both authentication methods.

---

## 🚨 Google Login Troubleshooting

### Error: "origin_mismatch"
**Cause:** Frontend port doesn't match Google Cloud Console configuration
**Quick Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project → APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Under "Authorized JavaScript origins", ensure you have:
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   ```
5. Click Save and wait 5 minutes

### Error: "Client ID mismatch" or "Wrong recipient"
**Cause:** Client ID in Google Cloud Console doesn't match your app
**Fix:** Verify the Client ID in your `.env` files matches Google Cloud Console

### Error: "Token expired"
**Cause:** Google token timed out
**Fix:** Click Google login again (tokens are short-lived)

### Error: "Certificate verification failed"
**Cause:** Network or Google service issue
**Fix:** Check internet connection and try again later

## Setting Up Google OAuth (Step-by-Step)

### 1. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google+ API**:
   - Search for "Google+ API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials
1. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
2. Choose **Web application**
3. Name it: `IT Support Portal` (or any name)

### 4. Configure Authorized Origins
Under "Authorized JavaScript origins", add:
```
http://localhost:5173
http://localhost:5174
http://127.0.0.1:5173
http://127.0.0.1:5174
http://localhost:3000
```
(Add your actual frontend URL if deployed)

### 5. Configure Authorized Redirect URIs
Under "Authorized redirect URIs", add:
```
http://localhost:8000/auth/google
http://127.0.0.1:8000/auth/google
```
(Add your actual backend URL if deployed)

### 6. Copy Client ID
1. Click "Create"
2. Copy the **Client ID** 
3. Paste it in `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-copied-client-id
   ```

### 7. Update Frontend (Optional)
The frontend Client ID is in `frontend/src/main.jsx`. Both should match:
```javascript
const GOOGLE_CLIENT_ID = "your-copied-client-id";
```

### 8. Restart Backend
```bash
# Stop and restart your backend
python main.py
```

---

## Common Issues

### ❌ "Could not deserialize" Error
**Cause:** Client ID is invalid or wrong
**Fix:** Double-check the Client ID from Google Cloud Console

### ❌ "Cookies not set" Error  
**Cause:** CORS issue or different origins
**Fix:** Verify frontend origin matches one in "Authorized JavaScript origins"

### ❌ Google button not showing
**Cause:** Frontend not wrapped with GoogleOAuthProvider
**Fix:** Already fixed! Check `frontend/src/main.jsx`

---

## Quick Workaround (Without Google OAuth)

If you can't set up Google OAuth, just use email/password:

1. **Register** with your email and password
2. **Login** with your email and password

The app works perfectly without Google login!

---

## For Production Deployment

Replace `http://localhost` URLs with your actual domain:

**Authorized JavaScript origins:**
```
https://yourdomain.com
https://www.yourdomain.com
```

**Authorized Redirect URIs:**
```
https://api.yourdomain.com/auth/google
https://yourdomain.com/auth/google
```

Then update `backend/.env` and `frontend/src/main.jsx` with production Client ID.

---

**Need help?** Check the error message displayed on the login screen - it now shows exactly what went wrong!
