import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import api from './services/api';

const IntakeForm = lazy(() => import('./pages/public/IntakeForm'));
const Tracking = lazy(() => import('./pages/public/Tracking'));
const HomeLanding = lazy(() => import('./pages/public/HomeLanding'));
const BookingForm = lazy(() => import('./pages/public/BookingForm'));
const PhoneTracking = lazy(() => import('./pages/public/PhoneTracking'));
const Payment = lazy(() => import('./pages/public/Payment'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const DirectorDashboard = lazy(() => import('./pages/admin/DirectorDashboard'));
const ManagerDashboard = lazy(() => import('./pages/admin/ManagerDashboard'));
const EmployeeManagement = lazy(() => import('./pages/admin/EmployeeManagement'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

const CURRENT_YEAR = new Date().getFullYear();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-4xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra gián đoạn hiển thị</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Hệ thống đã tự động bảo vệ dữ liệu. Vui lòng bấm làm mới hoặc quay về trang tra cứu.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 transition"
            >
              Tải lại trang
            </button>
            <Link
              to="/tra-cuu"
              onClick={() => this.setState({ hasError: false })}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Về Trang Tra Cứu
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ROLE_NAV_CONFIG = {
  GIAM_DOC: {
    shortLabel: '👑 Giám Đốc',
    fullTitle: '👑 Giám Đốc Điều Hành',
    link: '/admin/giam-doc',
    bgClass: 'bg-slate-900 text-amber-300 hover:bg-slate-800'
  },
  ADMIN: {
    shortLabel: '👑 Ban Giám Đốc',
    fullTitle: '👑 Ban Giám Đốc Hệ Thống',
    link: '/admin/giam-doc',
    bgClass: 'bg-slate-900 text-amber-300 hover:bg-slate-800'
  },
  QUAN_LY: {
    shortLabel: '🏬 Quản Lý',
    fullTitle: '🏬 Quản Lý Cửa Hàng',
    link: '/admin/quan-ly',
    bgClass: 'bg-blue-600 text-white hover:bg-blue-700'
  },
  KE_TOAN: {
    shortLabel: '📊 Kế Toán',
    fullTitle: '📊 Kế Toán Doanh Thu',
    link: '/admin',
    bgClass: 'bg-emerald-600 text-white hover:bg-emerald-700'
  },
  THU_KHO: {
    shortLabel: '📦 Thủ Kho',
    fullTitle: '📦 Thủ Kho Linh Kiện',
    link: '/admin',
    bgClass: 'bg-amber-600 text-white hover:bg-amber-700'
  },
  KY_THUAT_VIEN: {
    shortLabel: '🔧 Kỹ Thuật Viên',
    fullTitle: '🔧 Kỹ Thuật Viên Sửa Chữa',
    link: '/admin',
    bgClass: 'bg-brand-green text-white hover:bg-green-600'
  },
  LE_TAN: {
    shortLabel: '👩‍💼 Lễ Tân',
    fullTitle: '👩‍💼 Nhân Viên Lễ Tân',
    link: '/admin',
    bgClass: 'bg-sky-600 text-white hover:bg-sky-700'
  }
};

function isNotificationCorrupted(item) {
  const text = (item?.title || '') + (item?.description || '');
  return text.includes('Ã') || text.includes('Â') || text.includes('áº') || text.includes('Lá»');
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsList, setNotificationsList] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('ticketNotifications') : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.filter(n => !isNotificationCorrupted(n));
      }
    } catch {}
    return [];
  });
  useLocation(); // Theo dõi chuyển hướng trang để cập nhật phiên đăng nhập tức thì

  // Đọc thông tin đăng nhập trực tiếp từ localStorage theo từng lượt render
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : '';
  const fullName = typeof window !== 'undefined' ? (localStorage.getItem('fullName') || '') : '';
  const isLoggedIn = Boolean(token && role);

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const markAllNotificationsRead = () => {
    const updated = notificationsList.map(n => ({ ...n, read: true }));
    setNotificationsList(updated);
    try {
      localStorage.setItem('ticketNotifications', JSON.stringify(updated));
    } catch {}
  };

  const clearAllNotifications = () => {
    setNotificationsList([]);
    try {
      localStorage.removeItem('ticketNotifications');
    } catch {}
  };

  const handleQuickSwitchRole = async (targetUser) => {
    if (!targetUser) return;
    try {
      const res = await api.post('/auth/login', {
        username: targetUser,
        password: '123456'
      });
      if (res.data.success) {
        const { token: nextToken, role: nextRole, fullName: nextName, username: nextUname, accountId } = res.data.data;
        localStorage.setItem('token', nextToken);
        localStorage.setItem('role', nextRole);
        localStorage.setItem('fullName', nextName);
        localStorage.setItem('username', nextUname || targetUser);
        if (accountId) localStorage.setItem('accountId', String(accountId));
        
        // Điều hướng chính xác theo vai trò chuyên biệt
        if (nextRole === 'GIAM_DOC' || nextRole === 'ADMIN') {
          window.location.href = '/admin/giam-doc';
        } else if (nextRole === 'QUAN_LY') {
          window.location.href = '/admin/quan-ly';
        } else {
          window.location.href = '/admin';
        }
      }
    } catch (e) {
      console.error('Lỗi chuyển vai trò:', e);
      alert('Không thể chuyển vai trò: ' + (e.response?.data?.message || 'Lỗi đăng nhập'));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const navRoleInfo = isLoggedIn
    ? (ROLE_NAV_CONFIG[role] || {
        shortLabel: '💼 ' + (role || 'Nội Bộ'),
        fullTitle: '💼 Cổng Quản Trị Hệ Thống',
        link: '/admin',
        bgClass: 'bg-brand-green text-white hover:bg-green-600'
      })
    : {
        shortLabel: '🔐 Cổng Nhân Viên',
        fullTitle: '🔐 Đăng Nhập Nhân Viên',
        link: '/login',
        bgClass: 'bg-brand-green text-white hover:bg-green-600'
      };

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-white flex flex-col">
      {/* SECTION 01: HEADER & NAVBAR */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center justify-center">
            <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 md:h-12 object-contain" />
            <span className="text-[10px] text-brand-orange font-bold tracking-widest leading-none mt-1">QR CSKH & SUPPORT</span>
          </Link>

          {/* Menu máy tính để bàn (Desktop) - Tập trung trọng tâm Web Quét Mã QR Chăm Sóc Khách Hàng */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-600 uppercase h-full">
            <Link to="/" className="px-3.5 h-full flex items-center hover:text-brand-orange transition-colors">
              Trang chủ
            </Link>
            <Link
              to="/tra-cuu"
              className="px-4 py-2 mx-1 rounded-full bg-orange-50 text-brand-orange border border-orange-200 hover:bg-brand-orange hover:text-white transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <span>📷</span>
              <span>Quét Mã QR & Tra Cứu</span>
            </Link>
            <Link to="/intake" className="px-3.5 h-full flex items-center hover:text-brand-orange transition-colors">
              📝 Tạo Phiếu QR
            </Link>
            <Link to="/dat-lich" className="px-3.5 h-full flex items-center hover:text-brand-orange transition-colors">
              📅 Đặt Lịch Hẹn CSKH
            </Link>
          </nav>

          {/* Cụm Điều Hành Người Dùng (User Cluster) & Nút Menu Mobile */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Bộ chuyển vai trò làm việc */}
                <div className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-full px-2.5 py-1 transition">
                  <span className="text-[11px] font-medium text-slate-500">🔄</span>
                  <select
                    value={username || (role === 'GIAM_DOC' ? 'giamdoc' : role === 'QUAN_LY' ? 'quanly' : role === 'KE_TOAN' ? 'ketoan' : role === 'THU_KHO' ? 'thukho' : role === 'KY_THUAT_VIEN' ? 'kythuat' : 'letan')}
                    onChange={(e) => handleQuickSwitchRole(e.target.value)}
                    aria-label="Chuyển vai trò"
                    className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="kythuat">🔧 Kỹ Thuật Viên</option>
                    <option value="letan">👩‍💼 Lễ Tân</option>
                    <option value="quanly">🏬 Quản Lý</option>
                    <option value="giamdoc">👑 Giám Đốc</option>
                    <option value="thukho">📦 Thủ Kho</option>
                    <option value="ketoan">📊 Kế Toán</option>
                  </select>
                </div>

                {/* Nút Thông Báo với Popup */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotificationsDropdown(open => !open)}
                    aria-label={`Thông báo (${unreadCount})`}
                    className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                  >
                    <span className="text-xs">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotificationsDropdown && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="mb-2 flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Thông báo hệ thống</h3>
                        <button
                          type="button"
                          onClick={clearAllNotifications}
                          className="text-[11px] text-brand-blue hover:underline"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="mb-2 text-[11px] text-slate-500 hover:text-brand-blue block text-left"
                        >
                          ✓ Đánh dấu tất cả đã đọc
                        </button>
                      )}
                      <div className="max-h-72 space-y-1.5 overflow-y-auto">
                        {notificationsList.length === 0 ? (
                          <p className="py-6 text-center text-xs text-slate-400">Chưa có thông báo mới.</p>
                        ) : (
                          notificationsList.slice(0, 15).map(n => (
                            <div key={n.id} className={`rounded-xl p-2.5 text-xs ${n.read ? 'bg-slate-50 text-slate-600' : 'bg-blue-50/70 text-slate-800 font-medium'}`}>
                              <p className="font-semibold text-slate-800">{n.title || `Phiếu ${n.ticketCode}: ${n.status}`}</p>
                              {n.description && <p className="mt-0.5 text-slate-600 text-[11px]">{n.description}</p>}
                              <p className="mt-1 text-[10px] text-slate-400">{n.createdAt}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Huy hiệu Chức vụ Hiện tại */}
                <Link 
                  to={navRoleInfo.link} 
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold rounded-full transition-all text-xs shadow-xs ${navRoleInfo.bgClass}`}
                >
                  <span>{navRoleInfo.shortLabel}</span>
                </Link>

                {/* Nút Đăng Xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-semibold text-slate-600 transition"
                >
                  <span>🚪</span>
                  <span className="hidden xl:inline">Đăng Xuất</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden sm:inline-flex items-center gap-1.5 px-4 xl:px-6 py-2 bg-brand-green text-white font-bold rounded-full hover:bg-green-600 transition-all text-sm shadow-md"
              >
                <span>🔐 Cổng Nhân Viên</span>
              </Link>
            )}

            {/* Nút bấm mở/đóng Menu Mobile */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-800 text-2xl p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center w-10 h-10 border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

        </div>

        {/* MENU TRÊN DI ĐỘNG (MOBILE HAMBURGER MENU) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2 font-semibold text-slate-700" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100 text-brand-blue font-bold">
                <span className="text-xl">🏠</span> Trang chủ QR CSKH
              </Link>
              <Link to="/tra-cuu" className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-brand-orange font-bold">
                <span className="text-xl">📷</span> Quét Mã QR & Tra cứu tiến độ
              </Link>
              <Link to="/intake" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">📝</span> Quét QR Tạo phiếu tại quầy
              </Link>
              <Link to="/dat-lich" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">📅</span> Đặt lịch hẹn CSKH
              </Link>
              
              <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-3">
                <Link 
                  to={navRoleInfo.link} 
                  className={`py-3 px-4 font-bold rounded-xl text-center shadow-md transition-colors ${navRoleInfo.bgClass}`}
                >
                  {navRoleInfo.fullTitle}
                </Link>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="py-2.5 px-4 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-center"
                  >
                    🚪 Đăng xuất ({fullName || role})
                  </button>
                )}
                <div className="flex justify-between items-center text-xs text-slate-500 px-1 pt-1">
                  <span>📞 Hotline: (028) 3860 4999</span>
                  <a href="tel:02838604999" className="text-blue-600 font-bold hover:underline">
                    Gọi hỗ trợ
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<div className="py-20 text-center font-bold text-slate-500">Đang tải trang...</div>}>
            <Routes>
            {/* Landing Page */}
            <Route path="/" element={<HomeLanding />} />

            {/* Public Pages */}
            <Route path="/dat-lich" element={<BookingForm />} />
            <Route path="/thanh-toan" element={<Payment />} />
            <Route path="/thanh-toan/:ticketCode" element={<Payment />} />
            <Route path="/payment" element={<Payment />} />

            {/* Các trang tra cứu & tiếp nhận */}
            <Route path="/tra-cuu" element={<PhoneTracking />} />
            <Route path="/intake" element={<IntakeForm />} />
            <Route path="/track/:ticketCode" element={<Tracking />} />
            <Route path="/tra-cuu/:ticketCode" element={<Tracking />} />

            {/* Admin Pages */}
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/giam-doc" element={<DirectorDashboard />} />
              <Route path="/admin/quan-ly" element={<ManagerDashboard />} />
              <Route path="/admin/nhan-su" element={<EmployeeManagement />} />
            </Route>

            {/* 404 Page Not Found */}
            <Route
              path="*"
              element={
                <div className="container mx-auto px-4 py-20 text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl font-extrabold text-brand-orange mb-4">
                    404
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Không tìm thấy trang yêu cầu</h1>
                  <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                    Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi. Vui lòng quay lại trang chủ hoặc tra cứu phiếu sửa chữa.
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link to="/" className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
                      Về Trang Chủ
                    </Link>
                    <Link to="/tra-cuu" className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
                      Tra Cứu Phiếu QR
                    </Link>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>

      {/* Floating Hotline & Contact Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
        <a 
          href="tel:02838604999" 
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative group cursor-pointer animate-bounce"
          aria-label="Gọi Hotline Hùng Hậu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span className="absolute -top-10 right-0 bg-white text-brand-orange font-bold px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs border border-orange-200">
            Gọi ngay: (028) 3860 4999
          </span>
        </a>
      </div>

      {/* SECTION 07: FOOTER */}
      <footer className="bg-[#0d457b] text-white py-12 border-t-4 border-brand-orange">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-white text-[#0d457b] flex items-center justify-center rounded text-xs font-bold" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  HH
                </div>
                CÔNG TY CỔ PHẦN PHÁT TRIỂN HÙNG HẬU
              </h3>
              <p className="text-blue-200 text-sm leading-relaxed mb-4">
                Cổng tiếp nhận và chăm sóc khách hàng nội bộ sửa chữa máy tính, thiết bị công nghệ. Hoạt động trên nền tảng số hóa QR thông minh thuộc Hệ sinh thái HungHau Holdings.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-brand-orange">Địa chỉ liên hệ</h3>
              <ul className="text-blue-200 text-sm space-y-2.5">
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span><strong>Trụ sở chính:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span><strong>Cơ sở đào tạo:</strong> Trường Đại học Văn Hiến (VHU)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>📍</span>
                  <span><strong>Trung tâm bảo hành:</strong> Chi nhánh Lục Giác HungHau</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-brand-orange">Thông tin hỗ trợ</h3>
              <ul className="text-blue-200 text-sm space-y-2.5">
                <li className="flex items-center gap-2">
                  <span>📞</span>
                  <span><strong>Điện thoại:</strong> (+84) 28 3860 4999</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✉</span>
                  <span><strong>Email:</strong> info@hunghau.vn</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🌐</span>
                  <span><strong>Website:</strong> <a href="https://hunghau.vn" target="_blank" rel="noreferrer" className="underline hover:text-white">hunghau.vn</a></span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-blue-800 text-center text-blue-300 text-xs">
            <p>© {CURRENT_YEAR} Bản quyền thuộc về Công ty Cổ phần Phát triển Hùng Hậu - Hệ sinh thái HungHau Holdings.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;
