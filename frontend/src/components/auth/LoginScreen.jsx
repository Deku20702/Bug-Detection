import React, { useState } from 'react';
import client, { setAuthToken } from '../../api';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google'; // Import the hook

const LoginScreen = ({ onLoginSuccess }) => {
  const [auth, setAuth] = useState({ email: "", password: "" });
  const [authMode, setAuthMode] = useState("login");

  // logic for Google Login
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // This sends the Google access_token to your FastAPI backend
        const response = await client.post("/auth/google-login", {
          token: tokenResponse.access_token
        });
        
        setAuthToken(response.data.access_token);
        onLoginSuccess(response.data.access_token, "Google User");
        toast.success("Signed in with Google!");
      } catch (error) {
        toast.error("Google authentication failed on the server.");
      }
    },
    onError: () => toast.error("Google Login Failed"),
  });

  const handleAuthSubmit = async () => {
    if (!auth.email || !auth.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      const endpoint = authMode === "register" ? "/auth/register" : "/auth/login";
      const response = await client.post(endpoint, auth);
      
      setAuthToken(response.data.access_token);
      onLoginSuccess(response.data.access_token, auth.email);
      
      toast.success(authMode === "register" ? "Account created!" : "Signed in successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Authentication failed. Check credentials.");
    }
  };

  const authImage = authMode === "login" 
    ? "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000" 
    : "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&q=80&w=1000";

  return (
    <div className="auth-page">
      <div className="auth-image-side" style={{ backgroundImage: `url(${authImage})` }}>
        <div className="auth-image-overlay">
          <div className="auth-branding">
            <div className="tag"><div className="tag-dot"></div>AI Architecture Intelligence</div>
            <h1>Identify structural rot before it breaks production.</h1>
          </div>
        </div>
      </div>
      
      <div className="auth-form-side">
        <div className="auth-card">
          <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="auth-sub">
            {authMode === "login" ? "Sign in to start scanning repositories." : "Join to analyze architecture risks."}
          </p>
          
          <div className="auth-field">
            <input 
              type="email" 
              placeholder="Email address" 
              value={auth.email} 
              onChange={e => setAuth({...auth, email: e.target.value})} 
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
            />
          </div>
          <div className="auth-field">
            <input 
              type="password" 
              placeholder="Password" 
              value={auth.password} 
              onChange={e => setAuth({...auth, password: e.target.value})} 
              onKeyDown={e => e.key === 'Enter' && handleAuthSubmit()}
            />
          </div>
          
          <button className="auth-btn" onClick={handleAuthSubmit}>
            {authMode === "login" ? "Sign in" : "Register"}
          </button>

          {/* New Google Login Button */}
          <div className="auth-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#666' }}>OR</div>
          
          <button 
            className="auth-btn google-btn" 
            onClick={() => loginWithGoogle()}
            style={{ backgroundColor: '#fff', color: '#333', border: '1px solid #ddd' }}
          >
            Continue with Google
          </button>
          
          <div className="auth-toggle-wrap">
            {authMode === "login" ? "No account? " : "Already have an account? "}
            <button className="auth-toggle-btn" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Create one" : "Sign in instead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;