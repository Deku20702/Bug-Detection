import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000"
});

export const setAuthToken = (token) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

export default client;
