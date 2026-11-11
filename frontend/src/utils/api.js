// frontend/src/utils/api.js
// Centralised Axios instance with auth token injection.

import axios from 'axios';

// When running in Electron loaded from file:// or another host, allow configuring backend API URL
const getBaseUrl = () => {
  // If Vite env or window global is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.CAMPUSFIND_API_URL) {
    return window.CAMPUSFIND_API_URL;
  }
  // If loaded via file:// (packaged or fallback Electron)
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const savedServer = localStorage.getItem('cf_server_url');
    return savedServer || 'http://localhost:3001/api';
  }
  // When loaded via HTTP/HTTPS in web browser, use relative /api path (proxied by Vite)
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear local storage (token expired / invalid)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

