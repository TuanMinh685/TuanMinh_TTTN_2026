import axios from 'axios';

// Chuẩn hóa base URL gọi API
let rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();
if (rawApiUrl.startsWith('http') && !rawApiUrl.endsWith('/api') && !rawApiUrl.endsWith('/api/')) {
  rawApiUrl = rawApiUrl.replace(/\/+$/, '') + '/api';
}
const API_URL = rawApiUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '2.0.0'
  }
});

// Tự động đính kèm token đăng nhập nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tự động đăng xuất khi token hết hạn (401), giữ nguyên phiên nếu thiếu quyền (403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthApi = error.config?.url?.includes('/auth/login');
      if (!isAuthApi && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');
        localStorage.removeItem('username');
        localStorage.removeItem('accountId');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

