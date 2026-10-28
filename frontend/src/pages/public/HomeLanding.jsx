import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import QrScannerModal from '../../components/QrScannerModal';

const CORE_PILLARS = [
  {
    step: '01',
    icon: '💻',
    title: 'Quét QR Tiếp Nhận Máy & Ảnh Ngoại Quan',
    desc: 'Khách hàng quét mã QR tại quầy điền nhanh tình trạng lỗi máy tính / phần mềm trong 30 giây và đính kèm ảnh chụp ngoại quan máy lúc bàn giao.'
  },
  {
    step: '02',
    icon: '⏱️',
    title: 'Quét QR Theo Dõi Tiến Độ Thời Gian Thực',
    desc: 'Không cần chờ tổng đài. Quét mã QR trên biên nhận 80mm để xem trực tiếp từng bước kiểm tra phần cứng và khắc phục sự cố phần mềm.'
  },
  {
    step: '03',
    icon: '🛡️',
    title: 'Quét QR Sổ Bảo Hành Điện Tử (e-Warranty)',
    desc: 'Thay thế hoàn toàn sổ bảo hành giấy. Tự động kích hoạt và đếm ngược hạn bảo hành 06 tháng (180 ngày), hỗ trợ gửi yêu cầu bảo hành lại qua QR.'
  },
  {
    step: '04',
    icon: '⭐',
    title: 'Quét QR Đánh Giá Chất Lượng CSKH (1–5 Sao)',
    desc: 'Sau khi nhận bàn giao thiết bị hoạt động ổn định, khách hàng quét mã QR chấm điểm 1–5 sao và gửi nhận xét trực tiếp về Ban quản lý CSKH.'
  }
];

const COMPUTER_SOFTWARE_SERVICES = [
  {
    icon: '🖥️',
    tag: 'Phần cứng Máy tính & Laptop',
    title: 'Kiểm Tra & Sửa Chữa Phần Cứng Chuyên Sâu',
    desc: 'Chẩn đoán lỗi Mainboard, nguồn, màn hình, bàn phím, bản lề và hệ thống tản nhiệt cho Laptop Dell, HP, Asus, Lenovo, MacBook & PC văn phòng.',
    serviceParam: 'Kiểm tra & Sửa chữa phần cứng Máy tính / Laptop'
  },
  {
    icon: '💿',
    tag: 'Hệ điều hành & Phần mềm',
    title: 'Cài Đặt & Khắc Phục Sự Cố Phần Mềm',
    desc: 'Xử lý lỗi Windows 10/11, macOS, Microsoft Office, phần mềm kế toán - đồ họa, xung đột hệ thống, màn hình xanh (BSOD) và tối ưu tốc độ máy.',
    serviceParam: 'Cài đặt & Khắc phục sự cố Phần mềm / Hệ điều hành'
  },
  {
    icon: '🚀',
    tag: 'Nâng cấp & Định danh Serial',
    title: 'Nâng Cấp SSD, RAM & Linh Kiện Chính Hãng',
    desc: 'Tư vấn nâng cấp ổ cứng SSD NVMe, RAM, Pin, Sạc chuẩn hãng. Mã Serial linh kiện được lưu trực tiếp vào hồ sơ Sổ bảo hành điện tử QR.',
    serviceParam: 'Nâng cấp SSD / RAM & Linh kiện máy tính'
  },
  {
    icon: '🔐',
    tag: 'An toàn thông tin & Dữ liệu',
    title: 'Cứu Dữ Liệu, Sao Lưu & Diệt Virus Mã Độc',
    desc: 'Khôi phục dữ liệu ổ cứng/SSD lỗi phân vùng, sao lưu an toàn dữ liệu doanh nghiệp và quét sạch mã độc, phần mềm gián điệp.',
    serviceParam: 'Cứu dữ liệu, Sao lưu & Diệt Virus bảo mật'
  },
  {
    icon: '🌐',
    tag: 'Mạng & Thiết bị ngoại vi',
    title: 'Khắc Phục Lỗi Mạng LAN/Wi-Fi & Máy In',
    desc: 'Cấu hình Driver máy in, chia sẻ dữ liệu nội bộ, khắc phục lỗi mất kết nối Wi-Fi/Bluetooth, cổng USB/HDMI và thiết bị văn phòng.',
    serviceParam: 'Khắc phục lỗi Mạng, Driver & Thiết bị ngoại vi'
  },
  {
    icon: '🛡️',
    tag: 'Hậu mãi & Bảo hành QR',
    title: 'Bảo Dưỡng Định Kỳ & Chăm Sóc e-Warranty',
    desc: 'Vệ sinh laptop chuyên sâu, tra keo tản nhiệt chuẩn nhiệt độ, kiểm tra sức khỏe ổ cứng định kỳ và hỗ trợ bảo hành ưu tiên qua mã QR.',
    serviceParam: 'Bảo dưỡng định kỳ & Chăm sóc hậu mãi e-Warranty'
  }
];

function HomeLanding() {
  const navigate = useNavigate();
  const [activeGuideTab, setActiveGuideTab] = useState('TAI_QUAY');
  const [topReviews, setTopReviews] = useState([]);
  const [qrMode, setQrMode] = useState('INTAKE'); // 'INTAKE' | 'DEMO_TRACK'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [quickTicketCode, setQuickTicketCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    api.get('/public/reviews/top')
      .then(res => setTopReviews(res.data.data || []))
      .catch(error => console.error('Không tải được đánh giá nổi bật:', error));
  }, []);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const targetUrl = qrMode === 'INTAKE'
      ? `${origin}/intake`
      : `${origin}/track/RP-839400`;

    QRCode.toDataURL(targetUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#2563eb',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Lỗi tạo mã QR:', err));
  }, [qrMode]);

  const handleQuickLookup = (e) => {
    e.preventDefault();
    const code = quickTicketCode.trim().toUpperCase();
    if (!code) return;
    navigate(`/track/${code}`);
  };

  const handleScanSuccess = (scannedText) => {
    setIsScannerOpen(false);
    if (!scannedText) return;
    if (scannedText.includes('/track/')) {
      const code = scannedText.split('/track/')[1]?.split(/[?#]/)[0];
      if (code) {
        navigate(`/track/${code.toUpperCase()}`);
        return;
      }
    }
    if (scannedText.includes('/intake')) {
      navigate('/intake');
      return;
    }
    navigate(`/track/${scannedText.trim().toUpperCase()}`);
  };

  return (
    <div className="font-sans text-slate-800 bg-white">
      {/* SECTION 01: ENTERPRISE HERO BANNER - CỔNG QUÉT MÃ QR CHĂM SÓC KHÁCH HÀNG */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/60 to-white border-b border-slate-200/80 py-12 lg:py-16">
        {/* Họa tiết lưới kiến trúc tinh tế phía sau */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -top-24 right-0 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 rounded-full bg-sky-100/60 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* CỘT TRÁI (7/12): THÔNG ĐIỆP TRỌNG TÂM & THANH TRA CỨU QR */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-brand-blue text-xs font-extrabold uppercase tracking-wider shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
                <span>Hệ Thống CSKH Điện Tử Qua Mã QR • Tập Đoàn MYH Group</span>
              </div>

              <div className="space-y-3">
                <h1
                  className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-[1.2] tracking-tight"
                  style={{ textWrap: 'balance' }}
                >
                  Web Quét Mã QR Chăm Sóc Khách Hàng{' '}
                  <span className="text-brand-blue block sm:inline">
                    Mảng Sửa Chữa Máy Tính &amp; Phần Mềm
                  </span>
                </h1>

                <p
                  className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl"
                  style={{ textWrap: 'pretty' }}
                >
                  Nền tảng số hóa quy trình <strong>Chăm sóc khách hàng (CSKH) bằng Mã QR định danh</strong> chuyên biệt cho lĩnh vực máy tính và phần mềm: Quét QR tiếp nhận thiết bị tại quầy, lưu ảnh ngoại quan minh bạch, theo dõi tiến độ kiểm tra phần cứng &amp; xử lý phần mềm thời gian thực, kích hoạt <strong>Sổ bảo hành điện tử (e-Warranty)</strong> và đánh giá chất lượng phục vụ 1–5 sao.
                </p>
              </div>

              {/* Hộp Tra cứu nhanh & Quét Camera QR nổi bật trên nền trắng */}
              <div className="bg-white rounded-2xl p-5 shadow-lg shadow-blue-950/5 border border-slate-200/90 max-w-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                    <span>🔍</span>
                    <span>Tra cứu nhanh hồ sơ CSKH hoặc Bật Camera quét mã QR</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/track/RP-839400')}
                    className="text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full border border-blue-200 transition cursor-pointer"
                  >
                    Xem hồ sơ mẫu: #RP-839400 →
                  </button>
                </div>

                <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={quickTicketCode}
                    onChange={(e) => setQuickTicketCode(e.target.value)}
                    placeholder="Nhập mã phiếu QR trên biên nhận (VD: RP-839400)..."
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm shrink-0 cursor-pointer"
                  >
                    Tra Cứu Ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-5 py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Quét Camera QR</span>
                  </button>
                </form>
              </div>

              {/* Cụm 3 nút nghiệp vụ CSKH đồng bộ 1 màu xanh thương hiệu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                <Link
                  to="/intake"
                  className="px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2 text-center"
                >
                  <span>📝</span>
                  <span>Tạo Phiếu QR Tại Quầy</span>
                </Link>
                <Link
                  to="/tra-cuu"
                  className="px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2 text-center"
                >
                  <span>📷</span>
                  <span>Tra Cứu SĐT / Serial</span>
                </Link>
                <Link
                  to="/dat-lich"
                  className="px-4 py-3 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs sm:text-sm flex items-center justify-center gap-2 text-center"
                >
                  <span>📅</span>
                  <span>Đặt Lịch Hẹn CSKH</span>
                </Link>
              </div>

              {/* Dải chỉ số cam kết chất lượng dịch vụ CSKH */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 max-w-2xl">
                {[
                  { value: '30 Giây', label: 'Quét QR tiếp nhận máy' },
                  { value: 'Realtime', label: 'Nhật ký xử lý trực tuyến' },
                  { value: '06 Tháng', label: 'Sổ bảo hành e-Warranty' },
                  { value: '4.9 / 5 ⭐', label: 'Đánh giá hài lòng CSKH' }
                ].map((stat, idx) => (
                  <div key={idx} className="rounded-xl bg-white/90 border border-slate-200/80 px-3.5 py-2.5 shadow-2xs">
                    <p className="text-base font-extrabold text-brand-blue leading-tight">{stat.value}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI (5/12): KIOSK MÃ QR TỰ PHỤC VỤ TẠI QUẦY 615 ÂU CƠ */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-950/10 border border-slate-200/90 overflow-hidden">
                <div className="h-2 bg-brand-blue" />
                <div className="p-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>KIOSK MÃ QR TRỰC TUYẾN TẠI QUẦY</span>
                      </span>
                      <h2 className="font-extrabold text-base text-slate-900 mt-0.5">
                        Cổng Quét QR Tự Phục Vụ (CSKH)
                      </h2>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-blue font-extrabold text-xs">
                      📍 615 Âu Cơ
                    </span>
                  </div>

                  {/* Chuyển đổi 2 chế độ mã QR thực tế */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-xl mb-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setQrMode('INTAKE')}
                      className={`py-2 px-2 rounded-lg transition cursor-pointer ${
                        qrMode === 'INTAKE'
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📝 QR Tạo Phiếu Mới
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode('DEMO_TRACK')}
                      className={`py-2 px-2 rounded-lg transition cursor-pointer ${
                        qrMode === 'DEMO_TRACK'
                          ? 'bg-brand-blue text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🛡️ QR Hồ Sơ CSKH Mẫu
                    </button>
                  </div>

                  {/* Khung hiển thị ảnh Mã QR thật có thể quét bằng điện thoại */}
                  <div className="bg-slate-50 border-2 border-dashed border-blue-200 rounded-2xl p-5 flex flex-col items-center justify-center mb-4">
                    {qrDataUrl ? (
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80">
                        <img
                          src={qrDataUrl}
                          alt="Mã QR Chăm Sóc Khách Hàng"
                          className="w-44 h-44 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-sm">
                        Đang tạo mã QR...
                      </div>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full">
                      {qrMode === 'INTAKE'
                        ? '📲 Quét mở Form Tiếp Nhận Tại Quầy (/intake)'
                        : '📲 Quét xem Hồ Sơ CSKH Mẫu (#RP-839400)'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
                    {qrMode === 'INTAKE'
                      ? 'Khách hàng đến quầy dùng Camera điện thoại quét mã này để tự điền thông tin máy tính / phần mềm và đính kèm ảnh ngoại quan.'
                      : 'Quét mã hoặc bấm nút bên dưới để trải nghiệm trang theo dõi tiến độ xử lý, Sổ bảo hành điện tử e-Warranty & đánh giá 5 sao.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="py-2.5 px-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>📷</span>
                      <span>Mở Máy Quét QR</span>
                    </button>
                    <Link
                      to={qrMode === 'INTAKE' ? '/intake' : '/track/RP-839400'}
                      className="py-2.5 px-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <span>🚀</span>
                      <span>{qrMode === 'INTAKE' ? 'Mở Form Ngay' : 'Xem Hồ Sơ Mẫu'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02: 4 TRỤ CỘT CHĂM SÓC KHÁCH HÀNG QUA MÃ QR */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold uppercase tracking-wider text-brand-blue">
              GIẢI PHÁP CSKH SỐ HÓA MẢNG MÁY TÍNH &amp; PHẦN MỀM
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-3">
              4 Trụ Cột Chăm Sóc Khách Hàng Qua Mã QR Định Danh
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
              Mỗi thiết bị máy tính hoặc yêu cầu hỗ trợ phần mềm được cấp một mã QR định danh duy nhất xuyên suốt từ lúc tiếp nhận, kiểm tra, khắc phục cho đến hết hạn bảo hành điện tử.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_PILLARS.map((pillar) => (
              <div
                key={pillar.step}
                className="group rounded-2xl border border-slate-200/90 bg-slate-50/50 p-6 hover:bg-white hover:shadow-lg hover:border-brand-blue/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center text-2xl">
                      {pillar.icon}
                    </div>
                    <span className="text-xs font-mono font-extrabold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      BƯỚC {pillar.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03: DANH MỤC HỖ TRỢ TRỌNG TÂM MẢNG SỬA CHỮA MÁY TÍNH & PHẦN MỀM */}
      <section className="py-16 bg-slate-50/80 border-b border-slate-200/70">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold uppercase tracking-wider text-brand-blue">
                CHUYÊN MÔN KỸ THUẬT &amp; CHĂM SÓC KHÁCH HÀNG
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2.5">
                Danh Mục Hỗ Trợ Sửa Chữa Máy Tính &amp; Phần Mềm Qua Mã QR
              </h2>
            </div>
            <Link
              to="/intake"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition shrink-0"
            >
              <span>📝</span>
              <span>Khởi Tạo Hồ Sơ QR Ngay →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPUTER_SOFTWARE_SERVICES.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md hover:border-brand-blue/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-brand-blue flex items-center justify-center text-2xl">
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-bold text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    🛡️ Cấp Sổ BH QR 06 tháng
                  </span>
                  <Link
                    to={`/dat-lich?service=${encodeURIComponent(item.serviceParam)}`}
                    className="px-3.5 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs transition"
                  >
                    Đặt lịch hỗ trợ →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04: QUY TRÌNH HOẠT ĐỘNG 3 BƯỚC */}
      <section id="how-it-works" className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold uppercase tracking-wider text-brand-blue">
               HƯỚNG DẪN KHÁCH HÀNG TRA CỨU &amp; TIẾP NHẬN
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2.5">
              Quy Trình Quét Mã QR Chăm Sóc Khách Hàng
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
              Chọn hình thức tiếp nhận phù hợp với bạn để xem hướng dẫn 3 bước đơn giản.
            </p>
          </div>

          {/* Các nút chuyển Tab */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
            <button
              type="button"
              onClick={() => setActiveGuideTab('TAI_QUAY')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeGuideTab === 'TAI_QUAY'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🏢 Luồng 1: Quét QR trực tiếp tại quầy (615 Âu Cơ)
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('TU_XA')}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeGuideTab === 'TU_XA'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📅 Luồng 2: Đặt lịch hẹn CSKH trước qua Web
            </button>
          </div>

          {/* Nội dung Tab: TẠI QUẦY */}
          {activeGuideTab === 'TAI_QUAY' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    📷
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">1. Quét QR tạo phiếu tại quầy</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Khách hàng quét mã QR tại quầy Lễ tân để điền thông tin liên hệ, mô tả lỗi máy tính / phần mềm và đính kèm hình ảnh ngoại quan.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    📲
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">2. Quét QR theo dõi tiến độ</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Nhận phiếu in nhiệt 80mm có mã QR riêng. Quét mã bất cứ lúc nào để xem nhật ký chẩn đoán và tiến độ khắc phục sự cố thời gian thực.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    🛡️
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">3. Nhận máy, Bảo hành QR &amp; Đánh giá</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Hoàn tất bàn giao thiết bị, tự động kích hoạt Sổ bảo hành điện tử (e-Warranty 06 tháng) trên mã QR và chấm điểm đánh giá 1–5 sao.
                  </p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Link
                  to="/intake"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition"
                >
                  <span>📝</span>
                  <span>Tiến Hành Tạo Phiếu QR Ngay →</span>
                </Link>
              </div>
            </div>
          )}

          {/* Nội dung Tab: ĐẶT LỊCH HẸN TRƯỚC */}
          {activeGuideTab === 'TU_XA' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    📅
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">1. Đặt lịch hẹn trực tuyến</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Chọn khung giờ hẹn trước và mô tả tình trạng máy tính / phần mềm qua biểu mẫu đặt lịch CSKH trực tuyến.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    📞
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">2. Nhân viên CSKH xác nhận &amp; Cấp QR</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Bộ phận Lễ tân &amp; CSKH tiếp nhận lịch hẹn trên hệ thống, xác nhận khung giờ và khởi tạo sẵn mã phiếu QR khi khách đến.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-50 border-2 border-brand-blue rounded-2xl flex items-center justify-center text-3xl mb-4">
                    ✅
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-blue mb-2">3. Phục vụ ưu tiên &amp; Chăm sóc hậu mãi</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Khách hàng đến quầy được phục vụ đúng giờ hẹn không cần xếp hàng và theo dõi toàn bộ tiến độ, bảo hành qua mã QR.
                  </p>
                </div>
              </div>

              <div className="text-center mt-10">
                <Link
                  to="/dat-lich"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition"
                >
                  <span>📅</span>
                  <span>Đặt Lịch Hẹn CSKH Ngay →</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 05: PHẢN HỒI KHÁCH HÀNG QUA MÃ QR */}
      {topReviews.length > 0 && (
        <section className="py-16 bg-slate-50 border-b border-slate-200/70">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-extrabold uppercase tracking-wider text-brand-blue">
                ĐÁNH GIÁ THỰC TẾ TỪ KHÁCH HÀNG QUÉT MÃ QR
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-2.5">
                Khách Hàng Đánh Giá Dịch Vụ CSKH (CSAT)
              </h2>
              <p className="text-slate-500 mt-1.5 text-sm sm:text-base">
                Phản hồi được khách hàng gửi trực tiếp từ trang Quét mã QR sau khi nhận bàn giao máy tính &amp; phần mềm.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topReviews.map((r, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 flex flex-col justify-between">
                  <div>
                    <div className="flex text-amber-400 mb-3 text-lg">
                      {Array.from({ length: r.so_sao }).map((_, idx) => <span key={idx}>★</span>)}
                    </div>
                    <p className="text-slate-600 text-sm italic mb-4 leading-relaxed">"{r.nhan_xet}"</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <p className="font-bold text-brand-blue text-sm">{r.ho_ten}</p>
                    <p className="text-xs text-slate-400">{new Date(r.ngay_danh_gia).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 06: KHU VỰC DÀNH CHO NHÂN VIÊN ĐIỀU HÀNH CSKH NỘI BỘ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 via-blue-50/70 to-slate-100 rounded-3xl p-8 sm:p-10 text-center border border-blue-200/80 shadow-sm">
            <span className="inline-block px-3.5 py-1 rounded-full bg-white border border-blue-200 text-xs font-extrabold uppercase tracking-wider text-brand-blue mb-3">
              🏛️ HỆ THỐNG QUẢN TRỊ NỘI BỘ • MYH GROUP
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-3">
              Cổng Điều Hành Chăm Sóc Khách Hàng Nội Bộ
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mb-6 max-w-2xl mx-auto leading-relaxed">
              Dành cho Lễ tân tiếp nhận, Chuyên viên hỗ trợ và Trưởng bộ phận CSKH tại Tập đoàn MYH Group để quản lý hồ sơ QR, cập nhật nhật ký xử lý, in phiếu nhiệt QR 80mm và thống kê mức độ hài lòng.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-blue text-white font-bold text-sm sm:text-base rounded-xl hover:bg-blue-700 transition-all shadow-md"
            >
              <span>🔐</span>
              <span>Truy Cập Bàn Điều Hành CSKH →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modal Camera Quét Mã QR trực tiếp trên Trang chủ */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

export default HomeLanding;

