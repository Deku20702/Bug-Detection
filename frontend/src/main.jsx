import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="PASTE_YOUR_CLIENT_ID_FROM_GOOGLE_CONSOLE_HERE">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);