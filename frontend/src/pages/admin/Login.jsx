import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CURRENT_YEAR = new Date().getFullYear();

function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'LE_TAN'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchMode = (nextMode) => {
    setAuthMode(nextMode);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (authMode === 'LOGIN') {
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
      } else {
        const response = await api.post('/auth/register', {
          fullName: formData.fullName.trim(),
          username: formData.username.trim(),
          password: formData.password,
          role: formData.role
        });
        if (response.data.success) {
          const { token, role, fullName, accountId, username } = response.data.data;
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
          localStorage.setItem('fullName', fullName);
          if (accountId) localStorage.setItem('accountId', String(accountId));
          if (username) localStorage.setItem('username', username);

          setSuccessMsg(response.data.message || 'Đăng ký tài khoản thành công! Đang chuyển vào hệ thống...');
          setTimeout(() => {
            if (role === 'QUAN_LY' || role === 'ADMIN' || role === 'GIAM_DOC') {
              navigate('/admin/quan-ly');
            } else {
              navigate('/admin');
            }
          }, 700);
        }
      }
    } catch (err) {
      if (!err.response) {
        setError('Không thể kết nối đến máy chủ backend (Port 5001). Vui lòng kiểm tra kết nối mạng!');
      } else {
        setError(err.response?.data?.message || 'Thao tác không thành công, vui lòng kiểm tra lại thông tin!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#f0f5fa] flex items-center justify-center p-4 py-10">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-sm overflow-hidden border border-slate-200">
        <div className="h-1.5 bg-brand-blue"></div>

        <div className="p-7 sm:p-9">
          <div className="text-center mb-5">
            <Link to="/" className="inline-block">
              <img
                src="/img/logo-luc-giac.png"
                alt="Logo Công ty Cổ phần Lục Giác"
                className="h-16 object-contain mx-auto mb-3 transition-transform hover:scale-105"
              />
            </Link>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-2 border border-slate-200">
              📷 Hệ Thống Quản Trị QR CSKH
            </span>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {authMode === 'LOGIN' ? 'Cổng Đăng Nhập Nội Bộ' : 'Đăng Ký Tài Khoản CSKH'}
            </h1>
            <p className="text-slate-500 text-xs mt-1 font-medium">
              Trung Tâm Dịch Vụ &amp; Chăm Sóc Khách Hàng • Công ty Cổ phần Lục Giác
            </p>
          </div>

          {/* Chuyển đổi Đăng Nhập / Đăng Ký kết nối API Backend */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSwitchMode('LOGIN')}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'LOGIN'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔐 Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('REGISTER')}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'REGISTER'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✨ Đăng Ký Tài Khoản
            </button>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs mb-5 font-semibold text-center border border-red-200 flex items-center justify-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div role="status" className="bg-slate-50 text-slate-800 p-3.5 rounded-xl text-xs mb-5 font-semibold text-center border border-slate-200 flex items-center justify-center gap-2">
              <span>✅</span>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'REGISTER' && (
              <div>
                <label htmlFor="auth-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Họ và tên nhân viên
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  required
                  autoComplete="name"
                  enterKeyHint="next"
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-blue text-sm font-medium transition"
                  placeholder="Ví dụ: Lê Trần Tuấn Minh"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tài khoản đăng nhập
              </label>
              <input
                id="auth-username"
                type="text"
                name="username"
                value={formData.username}
                required
                autoComplete="username"
                spellCheck="false"
                autoCorrect="off"
                autoCapitalize="none"
                enterKeyHint="next"
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-blue text-sm font-medium transition"
                placeholder={authMode === 'LOGIN' ? 'Nhập tên tài khoản...' : 'Ví dụ: tuanminh_cskh (tối thiểu 3 ký tự)'}
              />
            </div>

            {authMode === 'REGISTER' && (
              <div>
                <label htmlFor="auth-role" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Vai trò bộ phận CSKH
                </label>
                <select
                  id="auth-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-brand-blue text-sm font-semibold text-slate-800 transition"
                >
                  <option value="LE_TAN">👩‍💼 Lễ Tân &amp; Tiếp Nhận QR (LE_TAN)</option>
                  <option value="KY_THUAT_VIEN">🎧 Chuyên Viên Hỗ Trợ Kỹ Thuật (KY_THUAT_VIEN)</option>
                  <option value="QUAN_LY">🏬 Trưởng Bộ Phận CSKH (QUAN_LY)</option>
                  <option value="ADMIN">🛡️ Quản Trị Hệ Thống &amp; Cấu Hình Client (ADMIN)</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Mật khẩu {authMode === 'REGISTER' && <span className="text-slate-400 font-normal">(Tối thiểu 6 ký tự)</span>}
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  required
                  minLength={authMode === 'REGISTER' ? 6 : undefined}
                  autoComplete={authMode === 'REGISTER' ? 'new-password' : 'current-password'}
                  enterKeyHint="done"
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-blue text-sm font-medium transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-bold rounded-xl transition shadow-xs text-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading
                ? 'Đang xử lý...'
                : authMode === 'LOGIN'
                  ? 'ĐĂNG NHẬP HỆ THỐNG CSKH'
                  : 'TẠO TÀI KHOẢN & ĐĂNG NHẬP NGAY'}
            </button>
          </form>

          {/* Gợi ý tài khoản bộ phận CSKH khi ở chế độ Đăng nhập */}
          {authMode === 'LOGIN' && (
            <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5 text-center">
                🔑 Chọn nhanh vai trò Bộ phận CSKH (Mật khẩu: 123456)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, username: 'admin', password: '123456' })}
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
                  onClick={() => setFormData({ ...formData, username: 'quanly', password: '123456' })}
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
                  onClick={() => setFormData({ ...formData, username: 'letan', password: '123456' })}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition shadow-2xs text-left cursor-pointer"
                >
                  <span className="text-lg">👩‍💼</span>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800 leading-tight">Lễ Tân &amp; Tiếp Nhận</p>
                    <p className="text-[10px] text-slate-400">@letan</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, username: 'kythuat', password: '123456' })}
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
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2.5">
            <Link
              to="/"
              className="text-xs font-bold text-slate-500 hover:text-brand-blue transition flex items-center gap-1.5"
            >
              <span>←</span> Về Trang Chủ Quét Mã QR
            </Link>
            <p className="text-[11px] text-slate-400 text-center">
              Bản quyền © {CURRENT_YEAR} Công ty Cổ phần Lục Giác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
