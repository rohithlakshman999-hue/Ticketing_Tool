import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

// Get Google Client ID from environment variable or fallback to hardcoded value
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "27526727790-8ge7bfakvl9raldt5oenbiocj7j2q72n.apps.googleusercontent.com";

if (!GOOGLE_CLIENT_ID) {
  console.warn('Google Client ID not found. Google login will not work.');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
