import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const DEMO_ACCOUNTS = [
  {
    username: 'giamdoc',
    roleName: '👑 Giám Đốc (Cấp 1 - Toàn quyền)',
    desc: 'Toàn quyền hệ thống, tạo/khóa mọi tài khoản kể cả Quản lý',
    badgeClass: 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100'
  },
  {
    username: 'quanly',
    roleName: '🛡️ Quản Lý Cửa Hàng (Cấp 2)',
    desc: 'Truy cập mọi trang, tạo/quản lý tài khoản nhân viên cấp dưới',
    badgeClass: 'border-purple-200 bg-purple-50/80 text-purple-900 hover:bg-purple-100'
  },
  {
    username: 'ketoan',
    roleName: '💰 Kế Toán / Thu Ngân (Cấp 3)',
    desc: 'Báo cáo doanh thu, đối soát hóa đơn 80mm & xác nhận thu tiền',
    badgeClass: 'border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100'
  },
  {
    username: 'thukho',
    roleName: '📦 Thủ Kho Linh Kiện (Cấp 4)',
    desc: 'Nhập xuất tồn kho linh kiện, cập nhật giá & cảnh báo tồn kho',
    badgeClass: 'border-cyan-200 bg-cyan-50/80 text-cyan-900 hover:bg-cyan-100'
  },
  {
    username: 'kythuat',
    roleName: '🔧 Kỹ Thuật Viên (Cấp 5)',
    desc: 'Chẩn đoán lỗi, gắn linh kiện Serial, cài phần mềm & gửi báo giá',
    badgeClass: 'border-blue-200 bg-blue-50/80 text-blue-900 hover:bg-blue-100'
  },
  {
    username: 'letan',
    roleName: '💁 Lễ Tân & CSKH (Cấp 6)',
    desc: 'Tiếp nhận máy POS, chụp ảnh ngoại quan, duyệt lịch hẹn & trả máy',
    badgeClass: 'border-orange-200 bg-orange-50/80 text-orange-900 hover:bg-orange-100'
  }
];

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const performLogin = async (credentials) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.success) {
        const { token, role, fullName, accountId, username } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('fullName', fullName);
        if (accountId) localStorage.setItem('accountId', String(accountId));
        if (username) localStorage.setItem('username', username);

        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin(formData);
  };

  const handleQuickLogin = (username) => {
    const nextCreds = { username, password: '123456' };
    setFormData(nextCreds);
    performLogin(nextCreds);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl overflow-hidden border-t-4 border-brand-blue grid grid-cols-1 lg:grid-cols-12">
        {/* Cột trái: Form đăng nhập */}
        <div className="p-8 lg:col-span-6 flex flex-col justify-between">
          <div>
            <div className="text-center mb-6">
              <img src="/img/logo-HHH-26.png" alt="Logo" className="h-14 object-contain mx-auto mb-3 bg-brand-blue rounded-xl p-2" />
              <h2 className="text-2xl font-extrabold text-slate-800">Cổng Điều Hành Nội Bộ</h2>
              <p className="text-slate-500 text-xs mt-1">Hệ thống phân quyền 6 cấp bậc • 615 Âu Cơ</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-5 font-semibold text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  required
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm font-medium"
                  placeholder="Ví dụ: giamdoc, quanly, kythuat, letan..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  required
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm font-medium"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-blue hover:bg-blue-800 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm uppercase tracking-wider"
              >
                {loading ? 'Đang xác thực phân quyền...' : 'ĐĂNG NHẬP HỆ THỐNG'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Mọi thao tác nghiệp vụ đều được kiểm soát theo cấp bậc chức vụ (RBAC).
          </div>
        </div>

        {/* Cột phải: Bảng chọn nhanh 6 cấp bậc phân quyền từ trên xuống */}
        <div className="bg-slate-50/90 p-6 lg:p-8 lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200/80">
          <div className="mb-4">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-blue text-[11px] font-extrabold uppercase tracking-wider mb-1">
              ⚡ Demo Phân Quyền Từ Trên Xuống
            </span>
            <h3 className="text-base font-extrabold text-slate-800">
              Chọn nhanh tài khoản theo Chức vụ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bấm vào bất kỳ cấp bậc nào bên dưới để đăng nhập tức thì (Mật khẩu mặc định: <code className="font-bold text-slate-700">123456</code>):
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(acc.username)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-2 shadow-2xs ${acc.badgeClass}`}
              >
                <div>
                  <p className="text-xs font-extrabold">{acc.roleName}</p>
                  <p className="text-[11px] opacity-85 mt-0.5 leading-snug">{acc.desc}</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white/80 px-2 py-0.5 rounded-lg border border-black/10 shrink-0">
                  @{acc.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
