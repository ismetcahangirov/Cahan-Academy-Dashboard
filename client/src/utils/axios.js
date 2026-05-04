import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth token here if not using cookies
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh or redirect to login on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh logic here
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
