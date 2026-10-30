import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import { getAccessibleBaseUrl } from '../../utils/network';
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
    tag: 'Phần cứng Laptop & PC',
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
    tag: 'Nâng cấp & Serial e-Warranty',
    title: 'Nâng Cấp SSD, RAM & Linh Kiện Chính Hãng',
    desc: 'Tư vấn nâng cấp ổ cứng SSD NVMe, RAM, Pin, Sạc chuẩn hãng. Mã Serial linh kiện được lưu trực tiếp vào hồ sơ Sổ bảo hành điện tử QR.',
    serviceParam: 'Nâng cấp SSD / RAM & Linh kiện máy tính'
  },
  {
    icon: '🔐',
    tag: 'Dữ liệu & An toàn bảo mật',
    title: 'Cứu Dữ Liệu, Sao Lưu & Diệt Virus Mã Độc',
    desc: 'Khôi phục dữ liệu ổ cứng/SSD lỗi phân vùng, sao lưu an toàn dữ liệu doanh nghiệp và quét sạch mã độc, phần mềm gián điệp.',
    serviceParam: 'Cứu dữ liệu, Sao lưu & Diệt Virus bảo mật'
  },
  {
    icon: '🌐',
    tag: 'Mạng nội bộ & Máy in',
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
  const [displayQrUrl, setDisplayQrUrl] = useState('');
  const [quickTicketCode, setQuickTicketCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    api.get('/public/reviews/top')
      .then(res => setTopReviews(res.data.data || []))
      .catch(error => console.error('Không tải được đánh giá nổi bật:', error));
  }, []);

  useEffect(() => {
    let active = true;
    getAccessibleBaseUrl().then(origin => {
      if (!active) return;
      const targetUrl = qrMode === 'INTAKE'
        ? `${origin}/intake`
        : `${origin}/tra-cuu`;
      setDisplayQrUrl(targetUrl);

      QRCode.toDataURL(targetUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#005596',
          light: '#ffffff'
        }
      })
        .then(url => {
          if (active) setQrDataUrl(url);
        })
        .catch(err => console.error('Lỗi tạo mã QR:', err));
    });

    return () => {
      active = false;
    };
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
    <div className="font-sans text-slate-800 bg-[#f0f5fa]">
      {/* SECTION 01: HERO - CHUẨN MÀU NỀN HÙNG HẬU (MYH GROUP) */}
      <section className="bg-gradient-to-b from-[#e8f1f8] via-[#f1f6fa] to-[#f0f5fa] border-b border-slate-200 py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* CỘT TRÁI (7/12): THÔNG TIN CHÍNH & HỘP TRA CỨU */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                <span>TRUNG TÂM CSKH &amp; DỊCH VỤ KỸ THUẬT • MYH GROUP</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
                  Dịch Vụ Sửa Chữa &amp; Chăm Sóc Khách Hàng <br />
                  <span className="text-brand-blue font-extrabold">Theo Dõi Tiến Độ &amp; Bảo Hành Qua Mã QR</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Hỗ trợ tiếp nhận thiết bị nhanh chóng, theo dõi tiến độ kiểm tra phần cứng &amp; xử lý phần mềm thời gian thực, quản lý <strong>Sổ bảo hành điện tử (e-Warranty)</strong> và thanh toán tiện lợi chỉ với một lần quét mã QR.
                </p>
              </div>

              {/* Hộp Tra cứu phiếu & Quét camera QR tinh giản */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs max-w-2xl">
                <div className="mb-2.5">
                  <span className="text-xs font-bold text-slate-700">
                    Tra cứu nhanh hồ sơ phiếu QR:
                  </span>
                </div>

                <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={quickTicketCode}
                    onChange={(e) => setQuickTicketCode(e.target.value)}
                    placeholder="Nhập mã phiếu (Ví dụ: RP-839400)..."
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:border-brand-blue"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-sm transition shrink-0 cursor-pointer"
                  >
                    Tra Cứu
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Quét QR</span>
                  </button>
                </form>
              </div>

              {/* 3 Nút nghiệp vụ chính đồng nhất */}
              <div className="flex flex-wrap gap-2.5 max-w-2xl">
                <Link
                  to="/intake"
                  className="px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  📝 Tạo Phiếu Tại Quầy
                </Link>
                <Link
                  to="/tra-cuu"
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs sm:text-sm transition"
                >
                  🔍 Tra Cứu SĐT / Serial
                </Link>
                <Link
                  to="/dat-lich"
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs sm:text-sm transition"
                >
                  📅 Đặt Lịch Hẹn
                </Link>
              </div>

              {/* 4 Chỉ số cam kết nhã nhặn */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 max-w-2xl">
                {[
                  { value: '30 Giây', label: 'Tiếp nhận qua mã QR' },
                  { value: 'Thời gian thực', label: 'Cập nhật tiến độ xử lý' },
                  { value: '06 Tháng', label: 'Bảo hành điện tử QR' },
                  { value: '1–5 Sao', label: 'Đánh giá chất lượng CSAT' }
                ].map((stat, idx) => (
                  <div key={idx} className="rounded-lg bg-white border border-slate-200 p-2.5">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CỘT PHẢI (5/12): KIOSK MÃ QR TẠI QUẦY GỌN GÀNG */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      MÃ QR QUẦY TIẾP NHẬN
                    </span>
                    <h2 className="font-bold text-sm text-slate-900">
                      Cổng Quét QR Tự Phục Vụ
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                    615 Âu Cơ
                  </span>
                </div>

                {/* Chuyển chế độ mã QR */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg mb-3.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setQrMode('INTAKE')}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer ${
                      qrMode === 'INTAKE'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📝 QR Tạo Phiếu
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('DEMO_TRACK')}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer ${
                      qrMode === 'DEMO_TRACK'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🛡️ QR Phiếu Mẫu
                  </button>
                </div>

                {/* Ảnh Mã QR trung thực */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center mb-3">
                  {qrDataUrl ? (
                    <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                      <img
                        src={qrDataUrl}
                        alt="Mã QR Chăm Sóc Khách Hàng"
                        className="w-40 h-40 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                      Đang tạo mã QR...
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-600 text-center font-medium">
                    {qrMode === 'INTAKE'
                      ? 'Dùng Camera điện thoại hoặc Zalo quét để mở form tiếp nhận'
                      : 'Dùng Camera điện thoại hoặc Zalo quét để tra cứu hồ sơ'}
                  </p>
                  {displayQrUrl && (
                    <span className="mt-1 text-[10px] text-slate-400 font-mono text-center truncate max-w-full block">
                      {displayQrUrl}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Mở Camera Quét</span>
                  </button>
                  <Link
                    to={qrMode === 'INTAKE' ? '/intake' : '/track/RP-839400'}
                    className="py-2 px-3 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs transition flex items-center justify-center text-center"
                  >
                    {qrMode === 'INTAKE' ? 'Mở Form Ngay' : 'Xem Hồ Sơ'} →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 02: 4 TRỤ CỘT CHĂM SÓC KHÁCH HÀNG QUA MÃ QR */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              QUY TRÌNH TIÊU CHUẨN ĐỀ TÀI
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              4 Trụ Cột Chăm Sóc Khách Hàng Qua Mã QR
            </h2>
            <p className="text-slate-500 mt-1.5 max-w-2xl mx-auto text-xs sm:text-sm">
              Mỗi thiết bị hoặc yêu cầu phần mềm được quản lý bằng một mã QR định danh duy nhất xuyên suốt quy trình hỗ trợ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CORE_PILLARS.map((pillar) => (
              <div
                key={pillar.step}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{pillar.icon}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      BƯỚC {pillar.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 03: DANH MỤC HỖ TRỢ TRỌNG TÂM MẢNG SỬA CHỮA MÁY TÍNH & PHẦN MỀM */}
      <section className="py-14 bg-[#f0f5fa] border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                DỊCH VỤ KỸ THUẬT &amp; HỖ TRỢ TẬN TÂM
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Các Hạng Mục Dịch Vụ Tiếp Nhận &amp; Xử Lý
              </h2>
            </div>
            <Link
              to="/intake"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs sm:text-sm transition shrink-0"
            >
              <span>📝</span>
              <span>Tạo Phiếu Tiếp Nhận →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {COMPUTER_SOFTWARE_SERVICES.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    🛡️ Bảo hành QR 06 tháng
                  </span>
                  <Link
                    to={`/dat-lich?service=${encodeURIComponent(item.serviceParam)}`}
                    className="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs transition"
                  >
                    Đặt lịch →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04: HƯỚNG DẪN 3 BƯỚC */}
      <section id="how-it-works" className="py-14 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Hướng Dẫn Khách Hàng Tiếp Nhận &amp; Tra Cứu
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Lựa chọn hình thức phù hợp để xem các bước thực hiện
            </p>
          </div>

          {/* Các nút chuyển Tab thanh lịch */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActiveGuideTab('TAI_QUAY')}
              className={`px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer ${
                activeGuideTab === 'TAI_QUAY'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🏢 Luồng 1: Quét QR tại quầy (615 Âu Cơ)
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('TU_XA')}
              className={`px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer ${
                activeGuideTab === 'TU_XA'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📅 Luồng 2: Đặt lịch hẹn trước qua Web
            </button>
          </div>

          {/* Nội dung Tab: TẠI QUẦY */}
          {activeGuideTab === 'TAI_QUAY' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Quét QR tạo phiếu tại quầy</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách dùng điện thoại quét mã QR quầy lễ tân để điền thông tin và đính kèm ảnh ngoại quan máy tính.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Theo dõi tiến độ trực tuyến</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nhận biên nhận nhiệt 80mm có in mã QR riêng để theo dõi từng bước chẩn đoán và khắc phục sự cố.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Nhận máy &amp; Bảo hành e-Warranty</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hoàn tất hỗ trợ, tự động kích hoạt Sổ bảo hành điện tử 06 tháng trên mã QR và gửi đánh giá dịch vụ.
                  </p>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  to="/intake"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  <span>📝</span>
                  <span>Tạo Phiếu QR Ngay →</span>
                </Link>
              </div>
            </div>
          )}

          {/* Nội dung Tab: ĐẶT LỊCH HẸN TRƯỚC */}
          {activeGuideTab === 'TU_XA' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Đặt lịch hẹn trực tuyến</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Chọn khung giờ hẹn và điền thông tin tình trạng máy tính / sự cố phần mềm qua biểu mẫu đặt hẹn.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Xác nhận lịch &amp; Cấp mã QR</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nhân viên tiếp nhận lịch hẹn trên hệ thống nội bộ, xác nhận khung giờ và khởi tạo sẵn mã hồ sơ QR.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-center">
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xl font-bold text-slate-800 mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Phục vụ đúng giờ &amp; Hậu mãi</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Khách hàng đến quầy được ưu tiên phục vụ đúng giờ và theo dõi toàn bộ tiến độ qua mã QR.
                  </p>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link
                  to="/dat-lich"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  <span>📅</span>
                  <span>Đặt Lịch Hẹn Ngay →</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 05: PHẢN HỒI ĐÁNH GIÁ (CSAT) */}
      {topReviews.length > 0 && (
        <section className="py-14 bg-[#f0f5fa] border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                CHỈ SỐ HÀI LÒNG CSAT
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                Đánh Giá Thực Tế Từ Khách Hàng Quét Mã QR
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {topReviews.map((r, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="text-amber-500 mb-2 text-sm font-semibold">
                      {'★'.repeat(r.so_sao)}
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm italic mb-4 leading-relaxed">"{r.nhan_xet}"</p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-800">{r.ho_ten}</p>
                    <p className="text-slate-400">{new Date(r.ngay_danh_gia).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 06: CỔNG ĐIỀU HÀNH NỘI BỘ */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto rounded-2xl p-6 sm:p-8 text-center border border-slate-200 bg-slate-50/80">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Cổng Điều Hành Chăm Sóc Khách Hàng Nội Bộ
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mb-5 max-w-xl mx-auto leading-relaxed">
              Dành cho Lễ tân tiếp nhận, Kỹ thuật viên hỗ trợ và Quản lý tại Tập đoàn MYH Group quản lý hồ sơ QR, cập nhật tiến độ xử lý và in phiếu 80mm.
            </p>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs sm:text-sm rounded-lg transition shadow-xs"
            >
              <span>🔐</span>
              <span>Truy Cập Bàn Điều Hành CSKH →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modal Camera Quét Mã QR */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

export default HomeLanding;
