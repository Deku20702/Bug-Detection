import React, { useState, useEffect } from "react";
import { setAuthToken } from "./api";
import LoginScreen from "./components/auth/LoginScreen";
import Dashboard from "./components/dashboard/Dashboard";
import { Toaster } from 'react-hot-toast'; 

export default function App() {
  // 1. Initialize state by checking localStorage first!
  const [token, setToken] = useState(() => localStorage.getItem("app_token") || "");
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("app_email") || "");

  // 2. If we loaded a token from storage on refresh, make sure Axios gets it
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const handleLogout = () => {
    setToken("");
    setAuthToken("");
    setUserEmail("");
    
    // 3. Clear memory on logout for security
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_email");
    localStorage.removeItem("recent_scan_data");
  };

  const handleLoginSuccess = (newToken, email) => {
    setToken(newToken);
    setUserEmail(email);
    
    // 4. Save to memory when logging in
    localStorage.setItem("app_token", newToken);
    localStorage.setItem("app_email", email);
  };

  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "US";
  const userName = userEmail || "User";

  return (
    <>
      <Toaster position="bottom-right" /> 

      {!token ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard 
          userName={userName}
          initials={initials}
          handleLogout={handleLogout}
        />
      )}
    </>
  );
}