import { Link, useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  GIAM_DOC: { name: 'Quản Trị Cấp Cao', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🛡️' },
  ADMIN: { name: 'Quản Trị Hệ Thống CSKH', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🛡️' },
  QUAN_LY: { name: 'Trưởng Bộ Phận CSKH', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🏬' },
  KY_THUAT_VIEN: { name: 'Chuyên Viên Hỗ Trợ CSKH', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🎧' },
  LE_TAN: { name: 'Chuyên Viên Tiếp Nhận QR', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '👩‍💼' }
};

export default function AdminNav({ activeKey = 'VAN_HANH' }) {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'Nhân viên CSKH';

  const isManagerOrAbove = role === 'GIAM_DOC' || role === 'ADMIN' || role === 'QUAN_LY';
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.LE_TAN;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    localStorage.removeItem('accountId');
    navigate('/login');
  };

  const navItems = [
    {
      key: 'VAN_HANH',
      label: '📋 Bàn Điều Hành Hồ Sơ QR',
      path: '/admin',
      visible: true
    },
    {
      key: 'QUAN_LY',
      label: '🏬 Tổng Quan Bộ Phận CSKH',
      path: '/admin/quan-ly',
      visible: isManagerOrAbove
    },
    {
      key: 'NHAN_SU',
      label: '👥 Nhân Sự & Phân Quyền CSKH',
      path: '/admin/nhan-su',
      visible: isManagerOrAbove
    }
  ];

  return (
    <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Brand & User Role Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-blue text-xl text-white shadow-xs">
            {roleInfo.icon}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                TRUNG TÂM ĐIỀU HÀNH &amp; CSKH • MYH GROUP
              </h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleInfo.badge}`}>
                {roleInfo.icon} {roleInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xin chào, <strong className="text-slate-700">{fullName}</strong> • Trung tâm CSKH 615 Âu Cơ
            </p>
          </div>
        </div>

        {/* Right: Navigation Links & Logout */}
        <div className="flex flex-wrap items-center gap-2">
          {navItems
            .filter(item => item.visible)
            .map(item => {
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}

