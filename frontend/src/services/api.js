import axios from 'axios';

const isLocalBrowser = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_URL = isLocalBrowser ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Timeout 15 giây chuẩn doanh nghiệp chống treo kết nối
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '2.0.0-Enterprise'
  }
});

// Middleware request: tự động gắn JWT Token vào Header nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Middleware response: Phân tách rõ 401 (Hết hạn / Khóa TK -> Đăng xuất) và 403 (Thiếu quyền RBAC -> Giữ nguyên phiên)
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
