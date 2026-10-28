import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import api from './services/api';

const IntakeForm = lazy(() => import('./pages/public/IntakeForm'));
const Tracking = lazy(() => import('./pages/public/Tracking'));
const HomeLanding = lazy(() => import('./pages/public/HomeLanding'));
const BookingForm = lazy(() => import('./pages/public/BookingForm'));
const PhoneTracking = lazy(() => import('./pages/public/PhoneTracking'));
const Login = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
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
    shortLabel: '🛡️ Quản Trị CSKH',
    fullTitle: '🛡️ Quản Trị Hệ Thống QR CSKH',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
  },
  ADMIN: {
    shortLabel: '🛡️ Quản Trị CSKH',
    fullTitle: '🛡️ Quản Trị Hệ Thống QR CSKH',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
  },
  QUAN_LY: {
    shortLabel: '🏬 Trưởng BP CSKH',
    fullTitle: '🏬 Trưởng Bộ Phận CSKH',
    link: '/admin/quan-ly',
    bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
  },
  KY_THUAT_VIEN: {
    shortLabel: '🎧 Chuyên Viên Hỗ Trợ',
    fullTitle: '🎧 Chuyên Viên Hỗ Trợ & Xử Lý',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
  },
  LE_TAN: {
    shortLabel: '👩‍💼 Lễ Tân & Tiếp Nhận',
    fullTitle: '👩‍💼 Lễ Tân & Tiếp Nhận QR',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
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
        
        // Điều hướng chính xác theo vai trò chuyên biệt CSKH
        if (nextRole === 'QUAN_LY') {
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
        bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
      })
    : {
        shortLabel: '🔐 Cổng Nhân Viên',
        fullTitle: '🔐 Đăng Nhập Nhân Viên',
        link: '/login',
        bgClass: 'bg-brand-blue text-white hover:bg-blue-800'
      };

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-white flex flex-col">
      {/* SECTION 01: HEADER & NAVBAR */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs border-b border-slate-200/80">
        <div className="container mx-auto px-4 flex justify-between items-center h-20">
          
          {/* Logo & Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 md:h-11 object-contain transition-transform group-hover:scale-105" />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-xs font-extrabold text-brand-blue tracking-wide leading-tight">
                MYH GROUP • CSKH QR
              </span>
              <span className="text-[11px] font-semibold text-slate-500 leading-tight mt-0.5">
                Sửa Chữa Máy Tính &amp; Phần Mềm
              </span>
            </div>
          </Link>

          {/* Menu máy tính để bàn (Desktop) - Tập trung trọng tâm Web Quét Mã QR Chăm Sóc Khách Hàng */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase h-full">
            <Link to="/" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 hover:text-brand-blue transition-colors">
              Trang chủ
            </Link>
            <Link
              to="/tra-cuu"
              className="px-4 py-2 mx-1 rounded-full bg-brand-blue text-white hover:bg-blue-800 transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>📷</span>
              <span>Quét Mã QR & Tra Cứu</span>
            </Link>
            <Link to="/intake" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 hover:text-brand-blue transition-colors">
              📝 Tạo Phiếu QR
            </Link>
            <Link to="/dat-lich" className="px-3.5 py-2 rounded-xl hover:bg-slate-100 hover:text-brand-blue transition-colors">
              📅 Đặt Lịch Hẹn CSKH
            </Link>
          </nav>

          {/* Cụm Điều Hành Người Dùng (User Cluster) & Nút Menu Mobile */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Bộ chuyển nhanh vai trò */}
                <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 transition" title="Chuyển nhanh vai trò kiểm thử">
                  <span className="text-[11px] font-bold text-brand-blue">Vai trò:</span>
                  <select
                    value={username === 'giamdoc' ? 'admin' : (username || (role === 'GIAM_DOC' || role === 'ADMIN' ? 'admin' : role === 'QUAN_LY' ? 'quanly' : role === 'KY_THUAT_VIEN' ? 'kythuat' : 'letan'))}
                    onChange={(e) => handleQuickSwitchRole(e.target.value)}
                    aria-label="Chuyển vai trò"
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="kythuat">🎧 Chuyên Viên Hỗ Trợ</option>
                    <option value="letan">👩‍💼 Lễ Tân & Tiếp Nhận</option>
                    <option value="quanly">🏬 Trưởng BP CSKH</option>
                    <option value="admin">🛡️ Quản Trị Hệ Thống</option>
                  </select>
                </div>

                {/* Nút Thông Báo với Popup */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotificationsDropdown(open => !open)}
                    aria-label={`Thông báo (${unreadCount})`}
                    className="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  >
                    <span className="text-xs">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-blue text-[9px] font-bold text-white shadow-xs">
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

                {/* Nút Mở Bàn Điều Hành Quản Trị */}
                <Link 
                  to={navRoleInfo.link} 
                  className="flex items-center gap-1.5 px-4 py-2 font-bold rounded-full transition-all text-xs shadow-xs bg-brand-blue text-white hover:bg-blue-800"
                >
                  <span>📋 Bàn Điều Hành</span>
                </Link>

                {/* Nút Đăng Xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-brand-blue hover:bg-blue-800 text-xs font-bold text-white transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span className="hidden xl:inline">Đăng Xuất</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 transition-all text-xs shadow-sm"
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
              <Link to="/tra-cuu" className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-brand-blue font-bold">
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
                    className="py-2.5 px-4 text-xs font-bold text-white bg-brand-blue hover:bg-blue-800 rounded-xl transition-colors text-center"
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

            {/* Các trang tra cứu & tiếp nhận QR CSKH */}
            <Route path="/tra-cuu" element={<PhoneTracking />} />
            <Route path="/intake" element={<IntakeForm />} />
            <Route path="/track/:ticketCode" element={<Tracking />} />
            <Route path="/tra-cuu/:ticketCode" element={<Tracking />} />

            {/* Admin Pages */}
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/giam-doc" element={<Dashboard />} />
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
          className="w-14 h-14 bg-brand-blue hover:bg-blue-800 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative group cursor-pointer animate-bounce"
          aria-label="Gọi Hotline Hùng Hậu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span className="absolute -top-10 right-0 bg-white text-brand-blue font-bold px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs border border-blue-200">
            Gọi ngay: (028) 3860 4999
          </span>
        </a>
      </div>

      {/* SECTION 07: FOOTER */}
      <footer className="bg-[#083863] text-white py-12 border-t-4 border-brand-blue">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-white text-[#083863] flex items-center justify-center rounded text-xs font-bold" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  HH
                </div>
                CÔNG TY CỔ PHẦN PHÁT TRIỂN HÙNG HẬU
              </h3>
              <p className="text-blue-100/90 text-sm leading-relaxed mb-4">
                Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng Về Mảng Sửa Chữa Máy Tính Và Phần Mềm – Nền tảng số hóa quy trình tiếp nhận thiết bị &amp; yêu cầu phần mềm qua mã QR, theo dõi tiến độ kiểm tra - khắc phục sự cố thời gian thực, cấp sổ bảo hành điện tử (e-Warranty) và đánh giá chất lượng phục vụ thuộc Tập đoàn MYH Group (HungHau Holdings).
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold mb-4 text-sky-300">Địa chỉ liên hệ</h3>
              <ul className="text-blue-100/90 text-sm space-y-2.5">
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
              <h3 className="text-lg font-bold mb-4 text-sky-300">Thông tin hỗ trợ</h3>
              <ul className="text-blue-100/90 text-sm space-y-2.5">
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
