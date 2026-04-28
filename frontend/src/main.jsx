import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';

import './index.css';
import App from './App.jsx';

// ------------------- ENV -------------------

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ------------------- VALIDATION -------------------

if (!GOOGLE_CLIENT_ID) {
  console.error("❌ Google Client ID is missing!");
}

// ------------------- ROOT -------------------

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("❌ Root element not found");
}

// ------------------- RENDER -------------------

createRoot(rootElement).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      // ✅ fallback (app still works without Google login)
      <App />
    )}
  </StrictMode>
);