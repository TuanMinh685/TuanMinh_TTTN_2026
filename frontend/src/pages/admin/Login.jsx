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

        if (role === 'QUAN_LY' || role === 'ADMIN' || role === 'GIAM_DOC') {
          navigate('/admin/quan-ly');
        } else {
          navigate('/admin');
        }
      }
    } catch (err) {
      if (!err.response) {
        setError('Không thể kết nối đến máy chủ backend (Port 5001). Vui lòng kiểm tra kết nối mạng!');
      } else {
        setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 py-10">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-200/80">
        <div className="h-2 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue"></div>

        <div className="p-7 sm:p-9">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <img
                src="/img/logo-HHH-26.png"
                alt="HungHau Logo"
                className="h-14 object-contain mx-auto mb-3 bg-brand-blue rounded-2xl p-2 shadow-md shadow-blue-900/10"
              />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-[11px] font-bold uppercase tracking-wider mb-2">
              📷 Hệ Thống Quản Trị QR CSKH
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              Cổng Điều Hành CSKH Nội Bộ
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Trung Tâm Dịch Vụ &amp; Chăm Sóc Khách Hàng • Tập đoàn MYH Group
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
                Tài khoản nhân viên CSKH
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
              className="w-full mt-2 py-3.5 bg-brand-blue hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang xác thực thông tin...' : 'ĐĂNG NHẬP HỆ THỐNG CSKH'}
            </button>
          </form>

          {/* Gợi ý tài khoản bộ phận CSKH */}
          <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
              🔑 Chọn nhanh vai trò Bộ phận CSKH (Mật khẩu: 123456)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFormData({ username: 'admin', password: '123456' })}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-2xs text-left cursor-pointer"
              >
                <span className="text-lg">🛡️</span>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">Quản Trị Hệ Thống</p>
                  <p className="text-[10px] text-slate-400">@admin</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ username: 'quanly', password: '123456' })}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-2xs text-left cursor-pointer"
              >
                <span className="text-lg">🏬</span>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">Trưởng BP CSKH</p>
                  <p className="text-[10px] text-slate-400">@quanly</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ username: 'letan', password: '123456' })}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-2xs text-left cursor-pointer"
              >
                <span className="text-lg">👩‍💼</span>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">Lễ Tân & Tiếp Nhận</p>
                  <p className="text-[10px] text-slate-400">@letan</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ username: 'kythuat', password: '123456' })}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-2xs text-left cursor-pointer"
              >
                <span className="text-lg">🎧</span>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">Chuyên Viên Hỗ Trợ</p>
                  <p className="text-[10px] text-slate-400">@kythuat</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2.5">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-brand-blue transition flex items-center gap-1.5"
            >
              <span>←</span> Về Trang Chủ Quét Mã QR
            </Link>
            <p className="text-[11px] text-slate-400 text-center">
              Bản quyền © {CURRENT_YEAR} MYH Group (HungHau Holdings).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

