import api from '../services/api';

let cachedBaseUrl = null;

export const getAccessibleBaseUrl = async () => {
  if (cachedBaseUrl) return cachedBaseUrl;
  if (typeof window === 'undefined') return 'http://localhost:5173';

  // Nếu trình duyệt đang mở bằng IP LAN (vd http://172.20.10.4:5173) hoặc tên miền công khai
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    cachedBaseUrl = window.location.origin;
    return cachedBaseUrl;
  }

  // Nếu đang mở bằng localhost, lấy IP LAN Wi-Fi của máy để sinh mã QR cho điện thoại quét được
  try {
    const res = await api.get('/public/network-ip');
    if (res.data?.frontendUrl) {
      cachedBaseUrl = res.data.frontendUrl;
      return cachedBaseUrl;
    }
  } catch {
    // Dự phòng nếu không lấy được
  }

  cachedBaseUrl = window.location.origin;
  return cachedBaseUrl;
};
