import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import IntakeForm from './pages/public/IntakeForm';
import Tracking from './pages/public/Tracking';
import HomeLanding from './pages/public/HomeLanding';
import BookingForm from './pages/public/BookingForm';
import Pricing from './pages/public/Pricing';
import PhoneTracking from './pages/public/PhoneTracking';
import OnlineIntakeForm from './pages/public/OnlineIntakeForm';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Dummy HomeAdmin for now
function HomeAdmin() { return <div className="p-10 text-center">Admin Page</div>; }

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen font-sans text-slate-800 bg-white flex flex-col">
        {/* SECTION 01: HEADER & NAVBAR */}
        <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-slate-200">
          <div className="container mx-auto px-4 flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex flex-col items-center justify-center">
              <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 md:h-12 object-contain" />
              <span className="text-[10px] text-brand-orange font-bold tracking-widest leading-none mt-1">IT SUPPORT</span>
            </Link>

            {/* Menu */}
            <nav className="hidden lg:flex items-center text-xs font-bold text-slate-600 uppercase h-full">
              <Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Trang chủ</Link>
              <Link to="/tra-cuu" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Tra Cứu Tiến Độ</Link>
              <Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Giới thiệu</Link>
              
              {/* Dropdown: Dịch Vụ Máy Tính */}
              <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
                <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Dịch vụ máy tính ▾</span>
                <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[220px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange">
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Sửa chữa máy tính - laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Phá pass Windows</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Bảo trì máy tính</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Vệ sinh máy tính</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Dịch vụ cài Win</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cài đặt máy tính</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cài đặt máy in</a>
                </div>
              </div>

              {/* Dropdown: Dịch Vụ Laptop */}
              <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
                <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Dịch vụ laptop ▾</span>
                <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[220px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange">
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Vệ sinh laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Bán sạc laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Thay pin laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Thay màn hình laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Thay bàn phím laptop</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Thay pin, phím, sạc, màn hình</a>
                </div>
              </div>

              {/* Dropdown: Cứu Dữ Liệu */}
              <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
                <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Cứu dữ liệu ▾</span>
                <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[220px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange">
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu online - từ xa</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu bị BitLocker</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu bị format</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu ổ cứng</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu thẻ nhớ</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu máy ảnh</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu file bị ẩn</a>
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Cứu dữ liệu USB</a>
                </div>
              </div>

              {/* Dropdown: Sản Phẩm Cung Cấp */}
              <div className="relative group h-full flex items-center px-3 xl:px-4 cursor-pointer">
                <span className="hover:text-brand-orange transition-colors flex items-center gap-1">Sản phẩm cung cấp ▾</span>
                <div className="absolute top-full left-0 bg-white text-slate-700 min-w-[200px] shadow-xl rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 border-t-2 border-brand-orange">
                  <a href="#" className="block px-5 py-2.5 hover:bg-slate-50 hover:text-brand-orange transition-colors normal-case font-semibold">Đang cập nhật...</a>
                </div>
              </div>

              <Link to="/" className="px-3 xl:px-4 h-full flex items-center hover:text-brand-orange transition-colors">Liên hệ</Link>
            </nav>

            {/* Cổng Nội Bộ & Giỏ hàng */}
            <div className="flex items-center gap-4">
              <Link to="/intake" className="hidden lg:flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <span className="text-2xl group-hover:scale-110 transition-transform block">🛒</span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-[#0d457b]">0</span>
                </div>
              </Link>
              
              <Link to="/admin" className="hidden md:inline-flex px-4 xl:px-6 py-2 bg-brand-green text-white font-bold rounded-full hover:bg-green-600 transition-all text-sm shadow-md">
                Cổng KTV
              </Link>
              
              {/* Mobile Menu Button */}
              <button className="lg:hidden text-slate-800 text-2xl">
                ☰
              </button>
            </div>

          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<HomeLanding />} />
            
            {/* Public Pages */}
            <Route path="/dat-lich" element={<BookingForm />} />
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Các trang chạy API thật */}
            <Route path="/tra-cuu" element={<PhoneTracking />} />
            <Route path="/intake" element={<IntakeForm />} />
            <Route path="/track/:ticketCode" element={<Tracking />} />
            <Route path="/online-intake" element={<OnlineIntakeForm />} />
            
            {/* Admin Pages */}
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<Dashboard />} />
            </Route>
          </Routes>
        </main>

        
        {/* Floating Zalo/Messenger Widget */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
          <a href="https://zalo.me/0123456789" target="_blank" rel="noreferrer" className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-bounce relative group cursor-pointer">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white"><path d="M21.544 11.045c.395-4.498-2.227-8.445-6.282-9.306-3.998-.847-8.151.785-10.237 4.14-1.921 3.093-1.636 7.159.624 9.946 1.134 1.397 2.766 2.302 4.549 2.533-.311 1.096-1.121 2.378-2.036 3.064-.265.197-.04.606.275.524 2.825-.742 4.708-2.589 5.867-4.321 4.58.583 8.326-2.122 8.789-5.918-.282-1.229 1.488-2.316.488-3.085.344-.645.068-1.503-.038-2.106zm-6.19 2.536c-.461.109-.941-.098-1.157-.514l-2.007-3.793v3.743c0 .351-.253.645-.589.682-.369.041-.692-.239-.692-.596V8.756c0-.361.277-.665.632-.693.385-.03.71.248.71.616v3.766l2.035-3.834c.23-.424.737-.584 1.168-.363.388.199.515.688.27 1.054l-2.035 3.195 2.059 3.238c.277.433.098 1.026-.401 1.196zM13.203 9.4c0 .341-.247.625-.572.661-.365.04-.678-.239-.678-.593v-1.18c0-.341.248-.625.572-.662.366-.041.678.239.678.594v1.18z"/></svg>
             <span className="absolute -top-10 right-0 bg-white text-brand-blue font-bold px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Chat Zalo ngay</span>
          </a>
          <a href="tel:19001234" className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative group cursor-pointer">
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.28-.28.67-.36 1.02-.25 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
             <span className="absolute -top-10 right-0 bg-white text-orange-500 font-bold px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Gọi Hotline</span>
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
                  Hệ sinh thái HungHau Holdings
                </h3>
                <p className="text-blue-200 text-sm leading-relaxed mb-4">
                  Cổng tiếp nhận và chăm sóc khách hàng nội bộ sửa chữa máy tính, điện thoại, thiết bị công nghệ. Hoạt động trên nền tảng số hóa QR thông minh.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4 text-brand-orange">Địa chỉ bảo hành</h3>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li>📍 Tòa nhà Lục Giác, Quận 3, TP.HCM</li>
                  <li>📍 Cơ sở Đại học Văn Hiến</li>
                  <li>📍 Chi nhánh phân phối HungHau</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-4 text-brand-orange">Liên hệ & Hỗ trợ</h3>
                <ul className="text-blue-200 text-sm space-y-2">
                  <li>📞 Hotline CSKH: 1900 xxxx</li>
                  <li>✉ Email: support@hunghau.vn</li>
                  <li>🌐 Website: hunghau.vn</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-blue-800 text-center text-blue-300 text-xs">
              <p>© {new Date().getFullYear()} Bản quyền thuộc về Công ty Cổ phần Lục Giác - Hệ sinh thái HungHau Holdings.</p>
              <p className="mt-1">Thiết kế chuẩn luồng UX/UI Mobile-first QR System.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
