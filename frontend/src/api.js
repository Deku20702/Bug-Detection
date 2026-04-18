import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000"
});

// 1. The Auth Token Setter
export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

// 2. NEW: The Global Error Interceptor
client.interceptors.response.use(
  (response) => response, // If the response is successful, just pass it through
  (error) => {
    // If the backend kicks back a 401 Unauthorized (Expired/Invalid Token)
    if (error.response && error.response.status === 401) {
      
      // Wipe the dead session data from the browser's memory
      localStorage.removeItem("app_token");
      localStorage.removeItem("app_email");
      localStorage.removeItem("recent_scan_data");
      
      // Force the browser to refresh, automatically sending them back to the Login Screen
      window.location.reload();
    }
    
    // Reject the promise so the specific component (like the Dashboard) can still show a toast error if needed
    return Promise.reject(error);
  }
);

export default client;