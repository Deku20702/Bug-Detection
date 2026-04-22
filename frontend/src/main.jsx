// D:\MCA STUFF\Major Project\project\frontend\src\main.jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="YOUR_CLIENT_ID_HERE.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);