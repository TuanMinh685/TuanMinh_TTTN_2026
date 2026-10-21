import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const IntakeForm = lazy(() => import('./pages/public/IntakeForm'));
const Tracking = lazy(() => import('./pages/public/Tracking'));
const HomeLanding = lazy(() => import('./pages/public/HomeLanding'));
const BookingForm = lazy(() => import('./pages/public/BookingForm'));
const Pricing = lazy(() => import('./pages/public/Pricing'));
const PhoneTracking = lazy(() => import('./pages/public/PhoneTracking'));
const OnlineIntakeForm = lazy(() => import('./pages/public/OnlineIntakeForm'));
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

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-white flex flex-col">
      {/* SECTION 01: HEADER & NAVBAR */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center justify-center">
            <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 md:h-12 object-contain" />
            <span className="text-[10px] text-brand-orange font-bold tracking-widest leading-none mt-1">IT SUPPORT</span>
          </Link>

          {/* Menu máy tính để bàn (Desktop) */}
          <nav className="hidden lg:flex items-center text-xs font-bold text-slate-600 uppercase h-full">
            <Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Trang chủ</Link>
            <Link to="/tra-cuu" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Tra Cứu Tiến Độ</Link>
            <Link to="/dat-lich" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Đặt Lịch Hẹn</Link>
            <Link to="/bang-gia" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Bảng Giá</Link>
            
            {/* Dropdown: Dịch Vụ Máy Tính */}
            <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
              <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Dịch vụ máy tính ▾</span>
              <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[240px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange z-50">
                <Link to="/dat-lich?service=Sửa chữa máy tính - laptop" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Sửa chữa máy tính - laptop</Link>
                <Link to="/online-intake" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu online từ xa</Link>
                <Link to="/dat-lich?service=Bảo trì & vệ sinh máy tính" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Bảo trì & vệ sinh máy tính</Link>
                <Link to="/dat-lich?service=Dịch vụ cài Win & phần mềm&pkg=OFFICE" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Dịch vụ cài Win & phần mềm</Link>
              </div>
            </div>

            {/* Dropdown: Dịch Vụ Laptop */}
            <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
              <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Dịch vụ laptop ▾</span>
              <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[240px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange z-50">
                <Link to="/dat-lich?service=Vệ sinh & tra keo tản nhiệt" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Vệ sinh & tra keo tản nhiệt</Link>
                <Link to="/bang-gia?q=Pin, Sạc" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Bán sạc & pin laptop</Link>
                <Link to="/bang-gia?q=Màn hình, Bàn phím" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Thay màn hình & bàn phím</Link>
              </div>
            </div>

            <Link to="/intake" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Tạo Phiếu QR</Link>
          </nav>

          {/* Cổng KTV & Nút Menu Mobile */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="hidden sm:inline-flex px-4 xl:px-6 py-2 bg-brand-green text-white font-bold rounded-full hover:bg-green-600 transition-all text-sm shadow-md">
              Cổng KTV
            </Link>
            
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
                <span className="text-xl">🏠</span> Trang chủ
              </Link>
              <Link to="/tra-cuu" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100 text-brand-orange font-bold">
                <span className="text-xl">📷</span> Tra cứu tiến độ & Quét QR
              </Link>
              <Link to="/intake" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">📝</span> Tạo phiếu sửa chữa tại quầy
              </Link>
              <Link to="/dat-lich" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">📅</span> Đặt lịch hẹn sửa chữa
              </Link>
              <Link to="/bang-gia" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">🏷️</span> Bảng giá dịch vụ & linh kiện
              </Link>
              <Link to="/online-intake" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-100">
                <span className="text-xl">💻</span> Cứu dữ liệu & Sửa online
              </Link>
              
              <div className="pt-3 mt-2 border-t border-slate-200 flex flex-col gap-3">
                <Link to="/admin" className="py-3 px-4 bg-brand-green text-white font-bold rounded-xl text-center shadow-md hover:bg-green-600 transition-colors">
                  🔧 Cổng Kỹ thuật viên / Quản lý
                </Link>
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
        <Suspense fallback={<div className="py-20 text-center font-bold text-slate-500">Đang tải trang...</div>}>
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<HomeLanding />} />

            {/* Public Pages */}
            <Route path="/dat-lich" element={<BookingForm />} />
            <Route path="/bang-gia" element={<Pricing />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Các trang tra cứu & tiếp nhận */}
            <Route path="/tra-cuu" element={<PhoneTracking />} />
            <Route path="/intake" element={<IntakeForm />} />
            <Route path="/track/:ticketCode" element={<Tracking />} />
            <Route path="/tra-cuu/:ticketCode" element={<Tracking />} />
            <Route path="/online-intake" element={<OnlineIntakeForm />} />
            <Route path="/cap-cuu-online" element={<OnlineIntakeForm />} />

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
