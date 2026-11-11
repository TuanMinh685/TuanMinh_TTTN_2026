import { Link, useNavigate } from 'react-router-dom';

const ROLE_LABELS = {
  GIAM_DOC: { name: 'Quản Trị Cấp Cao' },
  ADMIN: { name: 'Quản Trị Hệ Thống CSKH' },
  QUAN_LY: { name: 'Trưởng Bộ Phận CSKH' },
  KY_THUAT_VIEN: { name: 'Chuyên Viên Hỗ Trợ CSKH' },
  LE_TAN: { name: 'Chuyên Viên Tiếp Nhận QR' }
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
      label: 'Bàn điều hành hồ sơ QR',
      path: '/admin',
      visible: true
    },
    {
      key: 'QUAN_LY',
      label: 'Tổng quan bộ phận CSKH',
      path: '/admin/quan-ly',
      visible: isManagerOrAbove
    },
    {
      key: 'NHAN_SU',
      label: 'Nhân sự & Phân quyền',
      path: '/admin/nhan-su',
      visible: isManagerOrAbove
    },
    {
      key: 'CMS_CLIENT',
      label: 'Cấu hình giao diện Client',
      path: '/admin/cau-hinh-client',
      visible: true
    }
  ];

  return (
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Brand & User Role Info */}
        <div className="flex items-center gap-3">
          <img
            src="/img/logo-luc-giac.png"
            alt="Logo Lục Giác"
            className="h-9 w-9 object-contain shrink-0"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                TRUNG TÂM ĐIỀU HÀNH &amp; CSKH • CÔNG TY CỔ PHẦN LỤC GIÁC
              </h1>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {roleInfo.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xin chào, <strong className="text-slate-700">{fullName}</strong> • Trung tâm CSKH 615 Âu Cơ
            </p>
          </div>
        </div>

        {/* Right: Navigation Links & Logout */}
        <div className="flex flex-wrap items-center gap-1.5">
          {navItems
            .filter(item => item.visible)
            .map(item => {
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-blue text-white'
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
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
