import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      if (response.data.success) {
        const { token, role, fullName } = response.data.data;
        // Lưu thông tin vào localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullName', fullName);

        // Chuyển hướng vào Portal
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border-t-4 border-brand-blue">
        <div className="p-8">
          <div className="text-center mb-8">
            <img src="/img/logo-HHH-26.png" alt="Logo" className="h-16 object-contain mx-auto mb-4 bg-brand-blue rounded-xl p-2" />
            <h2 className="text-2xl font-bold text-slate-800">Cổng Nội Bộ</h2>
            <p className="text-slate-500 text-sm mt-1">Dành cho Nhân viên hệ thống</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
              <input 
                type="text" 
                name="username" 
                required 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" 
                placeholder="Ví dụ: admin"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <input 
                type="password" 
                name="password" 
                required 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" 
                placeholder="••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30"
            >
              {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </div>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400">
          Chỉ nhân viên có thẩm quyền mới được truy cập hệ thống này.
        </div>
      </div>
    </div>
  );
}

export default Login;
