// src/api/axiosInstance.js
import axios from "axios";

// Prefer env override; fall back to local dev API
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true
});

// Add interceptor to attach Authorization token from localStorage
api.interceptors.request.use((request) => {
  // Get token from localStorage and attach to every request
  const token = localStorage.getItem('token');
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log("FINAL URL:", (request.baseURL || "") + request.url);
  return request;
});

// Add interceptor to handle errors and retry on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retried, try once more with fresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Re-read token from localStorage (might have been updated)
      const freshToken = localStorage.getItem('token');
      if (freshToken) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return api(originalRequest);
      }
    }
    
    console.log("API Error Details:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    const enhancedError = new Error(errorMessage);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    enhancedError.response = error.response;
    return Promise.reject(enhancedError);
  }
);

export default api;
