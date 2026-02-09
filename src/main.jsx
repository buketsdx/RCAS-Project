import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const isGoogleClientIdSet = GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

if (!isGoogleClientIdSet) {
  console.warn("Google Client ID is not set. Google Login will be disabled. Please set VITE_GOOGLE_CLIENT_ID in .env file.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isGoogleClientIdSet ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)