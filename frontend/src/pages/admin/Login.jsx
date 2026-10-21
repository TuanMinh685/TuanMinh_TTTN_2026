import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CURRENT_YEAR = new Date().getFullYear();

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username: formData.username.trim(),
        password: formData.password
      });
      if (response.data.success) {
        const { token, role, fullName, accountId, username } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullName', fullName);
        if (accountId) localStorage.setItem('accountId', String(accountId));
        if (username) localStorage.setItem('username', username);

        if (role === 'GIAM_DOC' || role === 'ADMIN') {
          navigate('/admin/giam-doc');
        } else if (role === 'QUAN_LY') {
          navigate('/admin/quan-ly');
        } else {
          navigate('/admin');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 py-12">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
        <div className="h-2 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue"></div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img
                src="/img/logo-HHH-26.png"
                alt="HungHau Logo"
                className="h-16 object-contain mx-auto mb-3 bg-brand-blue rounded-2xl p-2.5 shadow-md shadow-blue-900/10"
              />
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Cổng Điều Hành Nội Bộ
            </h1>
            <p className="text-slate-500 text-xs mt-1.5 font-medium">
              Hệ thống Tiếp Nhận & Sửa Chữa Thiết Bị • 615 Âu Cơ
            </p>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 text-red-700 p-3.5 rounded-2xl text-xs mb-5 font-bold text-center border border-red-200 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                required
                autoComplete="username"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm font-medium transition"
                placeholder="Nhập tên tài khoản..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  required
                  autoComplete="current-password"
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm font-medium transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-brand-blue hover:bg-blue-800 active:scale-[0.99] text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang xác thực thông tin...' : 'ĐĂNG NHẬP HỆ THỐNG'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-brand-blue transition flex items-center gap-1.5"
            >
              <span>←</span> Về Trang Chủ Khách Hàng
            </Link>
            <p className="text-[11px] text-slate-400 text-center">
              Bản quyền © {CURRENT_YEAR} HungHau IT Support. Mọi quyền được bảo lưu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
