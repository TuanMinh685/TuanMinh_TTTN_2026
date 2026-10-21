import { Link, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  GIAM_DOC: 'Bảng Điều Khiển Giám Đốc',
  QUAN_LY: 'Bảng Điều Khiển Quản Lý',
  NHAN_SU: 'Quản Trị Nhân Sự & Phân Quyền'
};

export default function AdminNav({ activeKey }) {
  const location = useLocation();
  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'Nhân sự';
  const cleanName = fullName.replace(/\s*\(.*?\)/, '').trim() || 'Nhân sự';

  const isExecutive = role === 'GIAM_DOC' || role === 'ADMIN';
  const isManagerOrAbove = isExecutive || role === 'QUAN_LY';

  const pageTitle = PAGE_TITLES[activeKey] || 'Bảng Điều Khiển Quản Trị';

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Xin chào <strong className="text-slate-700">{cleanName}</strong> • Chúc bạn một ngày làm việc hiệu quả!
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        <Link
          to="/admin"
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs transition shadow-2xs ${
            location.pathname === '/admin' && !activeKey
              ? 'bg-brand-blue text-white font-bold'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
          }`}
        >
          <span>📋</span> Bàn Vận Hành Kỹ Thuật
        </Link>

        {isExecutive && (
          <Link
            to="/admin/giam-doc"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs transition shadow-2xs ${
              location.pathname === '/admin/giam-doc' || activeKey === 'GIAM_DOC'
                ? 'bg-brand-blue text-white font-bold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
            }`}
          >
            <span>👑</span> Trang Giám Đốc
          </Link>
        )}

        {isManagerOrAbove && (
          <Link
            to="/admin/quan-ly"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs transition shadow-2xs ${
              location.pathname === '/admin/quan-ly' || activeKey === 'QUAN_LY'
                ? 'bg-brand-blue text-white font-bold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
            }`}
          >
            <span>🏬</span> Trang Quản Lý
          </Link>
        )}

        {isManagerOrAbove && (
          <Link
            to="/admin/nhan-su"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs transition shadow-2xs ${
              location.pathname === '/admin/nhan-su' || activeKey === 'NHAN_SU'
                ? 'bg-brand-blue text-white font-bold'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
            }`}
          >
            <span>👥</span> Quản Lý Nhân Sự & Phân Quyền
          </Link>
        )}
      </nav>
    </div>
  );
}
