import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ROLE_CONFIG = {
  GIAM_DOC: {
    level: 100,
    title: 'Giám Đốc Điều Hành (C-Level)',
    badge: '👑 Giám Đốc',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  ADMIN: {
    level: 100,
    title: 'Quản Trị Hệ Thống (System Admin)',
    badge: '🛡️ Admin',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  QUAN_LY: {
    level: 80,
    title: 'Quản Lý Cửa Hàng (Store Manager)',
    badge: '🏬 Quản Lý',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  KE_TOAN: {
    level: 60,
    title: 'Kế Toán Doanh Thu',
    badge: '📊 Kế Toán',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  THU_KHO: {
    level: 50,
    title: 'Thủ Kho Linh Kiện',
    badge: '📦 Thủ Kho',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  KY_THUAT_VIEN: {
    level: 40,
    title: 'Kỹ Thuật Viên Sửa Chữa',
    badge: '🔧 Kỹ Thuật Viên',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      },
  LE_TAN: {
    level: 30,
    title: 'Lễ Tân Tiếp Nhận',
    badge: '📋 Lễ Tân',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      }
};

const QUICK_SWITCH_OPTIONS = [
  { username: 'giamdoc', label: '👑 Giám Đốc (Level 100)' },
  { username: 'quanly', label: '🏬 Quản Lý (Level 80)' },
  { username: 'ketoan', label: '📊 Kế Toán (Level 60)' },
  { username: 'thukho', label: '📦 Thủ Kho (Level 50)' },
  { username: 'kythuat', label: '🔧 Kỹ Thuật Viên (Level 40)' },
  { username: 'letan', label: '📋 Lễ Tân (Level 30)' }
];

export default function AdminNav({ activeKey }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [switching, setSwitching] = useState(false);

  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'Nhân sự';
  const username = localStorage.getItem('username') || '';
  const currentRoleInfo = ROLE_CONFIG[role] || ROLE_CONFIG.LE_TAN;

  const isExecutive = role === 'GIAM_DOC' || role === 'ADMIN';
  const isManagerOrAbove = isExecutive || role === 'QUAN_LY';

  const handleQuickSwitch = async (targetUser) => {
    if (!targetUser || switching) return;
    setSwitching(true);
    try {
      const res = await api.post('/auth/login', {
        username: targetUser,
        password: targetUser === 'giamdoc' ? 'GiamDoc@2026' : targetUser === 'quanly' ? 'QuanLy@2026' : '123456'
      });
      if (res.data.success) {
        const { token, role: nextRole, fullName: nextName, username: nextUname, accountId } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', nextRole);
        localStorage.setItem('fullName', nextName);
        localStorage.setItem('username', nextUname || targetUser);
        if (accountId) localStorage.setItem('accountId', String(accountId));
        window.location.reload();
      }
    } catch (e) {
      console.error('Lỗi chuyển chức vụ test:', e);
      alert('Không thể chuyển chức vụ nhanh: ' + (e.response?.data?.message || e.message));
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* User Info & Role Badge */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-brand-blue md:text-2xl">
              Hệ Thống Điều Hành & Quản Trị
            </h1>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${currentRoleInfo.badgeClass}`}>
              {currentRoleInfo.badge} • Level {currentRoleInfo.level}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Xin chào <strong className="text-slate-800">{fullName}</strong> {username ? `(@${username})` : ''} — <span className="text-slate-500">{currentRoleInfo.title}</span>
          </p>
        </div>

        {/* Actions & Role Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick switcher for testing */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">⚡ Test vai trò:</span>
            <select
              value={username || (role === 'GIAM_DOC' ? 'giamdoc' : role === 'QUAN_LY' ? 'quanly' : 'letan')}
              disabled={switching}
              onChange={(e) => handleQuickSwitch(e.target.value)}
              aria-label="Chuyển vai trò test"
              className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 outline-none"
            >
              {QUICK_SWITCH_OPTIONS.map(opt => (
                <option key={opt.username} value={opt.username}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-red-700 hover:border-red-200"
          >
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* Navigation Links Bar */}
      <nav className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link
          to="/admin"
          className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
            location.pathname === '/admin' && !activeKey
              ? 'bg-brand-blue text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📋 Bàn Vận Hành Kỹ Thuật
        </Link>

        {isExecutive && (
          <Link
            to="/admin/giam-doc"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
              location.pathname === '/admin/giam-doc' || activeKey === 'GIAM_DOC'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>👑</span> Trang Giám Đốc
          </Link>
        )}

        {isManagerOrAbove && (
          <Link
            to="/admin/quan-ly"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
              location.pathname === '/admin/quan-ly' || activeKey === 'QUAN_LY'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>🏬</span> Trang Quản Lý
          </Link>
        )}

        {isManagerOrAbove && (
          <Link
            to="/admin/nhan-su"
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition ${
              location.pathname === '/admin/nhan-su' || activeKey === 'NHAN_SU'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>👥</span> Quản Lý Nhân Sự & Phân Quyền
          </Link>
        )}
      </nav>
    </header>
  );
}
