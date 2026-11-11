import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
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
const ClientCmsConfig = lazy(() => import('./pages/admin/ClientCmsConfig'));
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
              className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-hover active:brightness-95 transition"
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
    bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
  },
  ADMIN: {
    shortLabel: '🛡️ Quản Trị CSKH',
    fullTitle: '🛡️ Quản Trị Hệ Thống QR CSKH',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
  },
  QUAN_LY: {
    shortLabel: '🏬 Trưởng BP CSKH',
    fullTitle: '🏬 Trưởng Bộ Phận CSKH',
    link: '/admin/quan-ly',
    bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
  },
  KY_THUAT_VIEN: {
    shortLabel: '🎧 Chuyên Viên Hỗ Trợ',
    fullTitle: '🎧 Chuyên Viên Hỗ Trợ & Xử Lý',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
  },
  LE_TAN: {
    shortLabel: '👩‍💼 Lễ Tân & Tiếp Nhận',
    fullTitle: '👩‍💼 Lễ Tân & Tiếp Nhận QR',
    link: '/admin',
    bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
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
  const location = useLocation(); // Theo dõi chuyển hướng trang để cập nhật phiên đăng nhập tức thì
  const navigate = useNavigate();

  // Đảm bảo giao diện luôn ở chế độ Sáng chuẩn nhận diện thương hiệu
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark');
      localStorage.removeItem('theme');
    } catch {}
  }, []);

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

  const handleNotificationClick = (n) => {
    // Đánh dấu thông báo này là đã đọc
    const updated = notificationsList.map(item => item.id === n.id ? { ...item, read: true } : item);
    setNotificationsList(updated);
    try {
      localStorage.setItem('ticketNotifications', JSON.stringify(updated));
    } catch {}

    // Đóng dropdown thông báo
    setShowNotificationsDropdown(false);

    // Chuyển hướng trực tiếp đến đúng phiếu / lịch hẹn
    if (n.ticketCode) {
      if (isLoggedIn) {
        navigate(`/admin?ticket=${encodeURIComponent(n.ticketCode)}`);
      } else {
        navigate(`/track/${encodeURIComponent(n.ticketCode)}`);
      }
    } else if (n.type === 'booking') {
      if (isLoggedIn) {
        navigate('/admin?tab=BOOKINGS');
      } else {
        navigate('/dat-lich');
      }
    }
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
        bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
      })
    : {
        shortLabel: '🔐 Cổng Nhân Viên',
        fullTitle: '🔐 Đăng Nhập Nhân Viên',
        link: '/login',
        bgClass: 'bg-brand-blue text-white hover:bg-brand-blue-hover active:brightness-95'
      };

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-[#f0f5fa] flex flex-col">
      {/* SECTION 01: HEADER & NAVBAR - TINH GỌN, ĐỒNG BỘ MÀU SẮC */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-200">
        <div className="container mx-auto px-4 flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo & Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src="/img/logo-luc-giac.png" alt="Logo Công ty Cổ phần Lục Giác" className="h-10 md:h-11 object-contain" />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
              <span className="text-xs font-bold text-slate-900 tracking-wide leading-tight">
                CÔNG TY CỔ PHẦN LỤC GIÁC
              </span>
              <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
                Hệ Thống Web Quét Mã QR CSKH
              </span>
            </div>
          </Link>

          {/* Menu máy tính để bàn (Desktop) - Đồng bộ kiểu chữ, không nhồi nút nhiều màu */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 h-full">
            {[
              { path: '/', label: 'Trang chủ' },
              { path: '/tra-cuu', label: 'Quét mã QR & Tra cứu' },
              { path: '/intake', label: 'Tạo phiếu QR' },
              { path: '/dat-lich', label: 'Đặt lịch hẹn' }
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-100 text-brand-blue font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Cụm Điều Hành Người Dùng (User Cluster) & Nút Menu Mobile */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="hidden sm:flex items-center gap-2">
                {/* Bộ chuyển nhanh vai trò tối giản */}
                <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 transition" title="Chuyển nhanh vai trò kiểm thử">
                  <span className="text-[11px] font-medium text-slate-500">Vai trò:</span>
                  <select
                    value={username === 'giamdoc' ? 'admin' : (username || (role === 'GIAM_DOC' || role === 'ADMIN' ? 'admin' : role === 'QUAN_LY' ? 'quanly' : role === 'KY_THUAT_VIEN' ? 'kythuat' : 'letan'))}
                    onChange={(e) => handleQuickSwitchRole(e.target.value)}
                    aria-label="Chuyển vai trò"
                    className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
                  >
                    <option value="kythuat">Chuyên viên hỗ trợ</option>
                    <option value="letan">Lễ tân &amp; Tiếp nhận</option>
                    <option value="quanly">Trưởng BP CSKH</option>
                    <option value="admin">Quản trị hệ thống</option>
                  </select>
                </div>

                {/* Nút Thông Báo đơn sắc */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotificationsDropdown(open => !open)}
                    aria-label={`Thông báo (${unreadCount})`}
                    className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-blue text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotificationsDropdown && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                      <div className="mb-2 flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-xs">Thông báo hệ thống</h3>
                        <button
                          type="button"
                          onClick={clearAllNotifications}
                          className="text-[11px] text-slate-500 hover:text-slate-800"
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
                      <div className="max-h-80 space-y-1.5 overflow-y-auto">
                        {notificationsList.length === 0 ? (
                          <p className="py-6 text-center text-xs text-slate-400">Chưa có thông báo mới.</p>
                        ) : (
                          notificationsList.slice(0, 20).map(n => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              title={n.ticketCode ? `Bấm để mở hồ sơ phiếu ${n.ticketCode}` : 'Bấm để xem chi tiết'}
                              className={`group flex items-start justify-between gap-2 rounded-lg p-2.5 text-xs transition cursor-pointer ${
                                n.read
                                  ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                  : 'bg-white text-slate-800 font-medium border border-slate-200'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-blue shrink-0"></span>}
                                  <p className="font-semibold text-slate-800 truncate">
                                    {n.title || `Phiếu ${n.ticketCode}: ${n.status}`}
                                  </p>
                                </div>
                                {n.description && <p className="mt-0.5 text-slate-600 text-[11px] line-clamp-2">{n.description}</p>}
                                <p className="mt-1 text-[10px] text-slate-400">{n.createdAt}</p>
                              </div>
                              <span className="text-xs text-slate-400 shrink-0 pt-0.5">→</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút Mở Bàn Điều Hành Quản Trị (Nút điểm nhấn duy nhất trên Header) */}
                <Link 
                  to={navRoleInfo.link} 
                  className="px-4 py-2 font-semibold rounded-lg transition-colors text-xs bg-brand-blue text-white hover:bg-brand-blue-hover"
                >
                  Bàn điều hành
                </Link>

                {/* Nút Đăng Xuất */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 transition cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="hidden sm:inline-flex items-center px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-brand-blue-hover transition-colors text-xs"
              >
                Đăng nhập nội bộ
              </Link>
            )}

            {/* Nút bấm mở/đóng Menu Mobile */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-700 text-xl p-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center w-10 h-10 border border-slate-200"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

        </div>

        {/* MENU TRÊN DI ĐỘNG (MOBILE HAMBURGER MENU) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-6 py-4 shadow-lg">
            <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-700" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/" className="py-2 px-3 rounded-lg hover:bg-slate-50">
                Trang chủ QR CSKH
              </Link>
              <Link to="/tra-cuu" className="py-2 px-3 rounded-lg hover:bg-slate-50">
                Quét mã QR &amp; Tra cứu tiến độ
              </Link>
              <Link to="/intake" className="py-2 px-3 rounded-lg hover:bg-slate-50">
                Tạo phiếu QR tại quầy
              </Link>
              <Link to="/dat-lich" className="py-2 px-3 rounded-lg hover:bg-slate-50">
                Đặt lịch hẹn CSKH
              </Link>

              <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-2">
                <Link 
                  to={navRoleInfo.link} 
                  className="py-2.5 px-4 font-semibold rounded-lg text-center bg-brand-blue text-white text-xs"
                >
                  {isLoggedIn ? 'Bàn điều hành CSKH' : 'Đăng nhập nội bộ'}
                </Link>
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/login';
                    }}
                    className="py-2 px-4 text-xs font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-center"
                  >
                    Đăng xuất ({fullName || role})
                  </button>
                )}
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
              <Route path="/admin/cau-hinh-client" element={<ClientCmsConfig />} />
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
                    <Link to="/" className="rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-hover active:brightness-95">
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
          className="w-12 h-12 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 rounded-full flex items-center justify-center shadow-lg transition-transform relative group cursor-pointer"
          aria-label="Gọi Hotline Công ty Cổ phần Lục Giác"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span className="absolute -top-9 right-0 bg-white text-slate-800 font-semibold px-3 py-1 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-xs border border-slate-200">
            Hotline: (028) 3860 4999
          </span>
        </a>
      </div>

      {/* SECTION 07: FOOTER - TỐI GIẢN, ĐỒNG BỘ MÀU TRẮNG & XÁM SLATE */}
      <footer className="bg-white text-slate-600 py-10 border-t border-slate-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2.5">
                <img src="/img/logo-luc-giac.png" alt="Logo Lục Giác" className="w-7 h-7 object-contain" />
                <span>CÔNG TY CỔ PHẦN LỤC GIÁC</span>
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng Về Mảng Sửa Chữa Máy Tính Và Phần Mềm – Nền tảng số hóa quy trình tiếp nhận thiết bị &amp; yêu cầu phần mềm qua mã QR, theo dõi tiến độ kiểm tra - khắc phục sự cố thời gian thực, cấp sổ bảo hành điện tử (e-Warranty) và đánh giá chất lượng phục vụ thuộc Công ty Cổ phần Lục Giác.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Địa chỉ liên hệ</h3>
              <ul className="text-slate-600 text-xs sm:text-sm space-y-2">
                <li>
                  <strong className="text-slate-800">Trụ sở chính:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh.
                </li>
                <li>
                  <strong className="text-slate-800">Đơn vị thực hiện:</strong> Công ty Cổ phần Lục Giác
                </li>
                <li>
                  <strong className="text-slate-800">Trung tâm bảo hành &amp; CSKH:</strong> Chi nhánh Công ty Cổ phần Lục Giác
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Thông tin hỗ trợ</h3>
              <ul className="text-slate-600 text-xs sm:text-sm space-y-2">
                <li>
                  <strong className="text-slate-800">Điện thoại:</strong> (+84) 28 3860 4999
                </li>
                <li>
                  <strong className="text-slate-800">Email:</strong> info@lucgiac.vn
                </li>
                <li>
                  <strong className="text-slate-800">Website:</strong> lucgiac.vn
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-slate-400 text-xs">
            <p>© {CURRENT_YEAR} Bản quyền thuộc về Công ty Cổ phần Lục Giác.</p>
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

