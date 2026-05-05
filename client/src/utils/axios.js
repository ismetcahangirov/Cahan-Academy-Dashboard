import axios from 'axios';

const axiosInstance = axios.create({
  // Production URL (Vercel) or local dev fallback.
  // VITE_API_URL should be set in .env (e.g. https://server-eosin-zeta.vercel.app/api)
  baseURL: import.meta.env.VITE_API_URL || 'https://server-eosin-zeta.vercel.app/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor – add auth token if needed
axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 refresh logic (placeholder)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // TODO: add token‑refresh flow here
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;