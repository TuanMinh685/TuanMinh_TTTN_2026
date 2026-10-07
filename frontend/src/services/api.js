import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://backend-murex-chi-18.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Middleware tự động gắn Token vào Header nếu có (dành cho Lễ tân)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
