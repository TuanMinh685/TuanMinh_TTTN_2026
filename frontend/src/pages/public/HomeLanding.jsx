import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import { getAccessibleBaseUrl } from '../../utils/network';
import QrScannerModal from '../../components/QrScannerModal';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon, { DynamicIcon } from '../../components/SvgIcon';

const CORE_PILLARS = [
  {
    step: '01',
    icon: 'laptop',
    title: 'Tiếp Nhận Thiết Bị & Lưu Ảnh Hiện Trạng',
    desc: 'Quét mã QR tại quầy để điền thông tin sự cố máy tính / phần mềm và đính kèm ảnh ngoại quan thiết bị khi bàn giao.'
  },
  {
    step: '02',
    icon: 'clock',
    title: 'Tra Cứu Tiến Độ Kiểm Tra & Sửa Chữa',
    desc: 'Sử dụng mã QR trên phiếu tiếp nhận để xem trực tiếp trạng thái kiểm tra phần cứng, báo giá linh kiện và nhật ký kỹ thuật.'
  },
  {
    step: '03',
    icon: 'shield',
    title: 'Quản Lý Bảo Hành Điện Tử',
    desc: 'Thông tin bảo hành 06 tháng và số Serial linh kiện được lưu trực tiếp trên mã QR hồ sơ, thuận tiện tra cứu khi cần hỗ trợ.'
  },
  {
    step: '04',
    icon: 'star',
    title: 'Đánh Giá Chất Lượng Dịch Vụ',
    desc: 'Sau khi nhận bàn giao thiết bị, khách hàng có thể gửi đánh giá và góp ý chất lượng phục vụ ngay trên trang tra cứu.'
  }
];

const COMPUTER_SOFTWARE_SERVICES = [
  {
    icon: 'desktop',
    tag: 'Phần cứng Laptop & PC',
    title: 'Kiểm Tra & Sửa Chữa Phần Cứng',
    desc: 'Kiểm tra và xử lý lỗi Mainboard, nguồn, màn hình, bàn phím, bản lề và tản nhiệt cho Laptop Dell, HP, Asus, Lenovo, MacBook & PC.',
    serviceParam: 'Kiểm tra & Sửa chữa phần cứng Máy tính / Laptop'
  },
  {
    icon: 'disc',
    tag: 'Hệ điều hành & Phần mềm',
    title: 'Cài Đặt & Khắc Phục Sự Cố Phần Mềm',
    desc: 'Xử lý lỗi Windows 10/11, macOS, Microsoft Office, phần mềm kế toán - đồ họa và các lỗi hệ thống thường gặp.',
    serviceParam: 'Cài đặt & Khắc phục sự cố Phần mềm / Hệ điều hành'
  },
  {
    icon: 'zap',
    tag: 'Nâng cấp linh kiện',
    title: 'Nâng Cấp SSD, RAM & Linh Kiện Chính Hãng',
    desc: 'Tư vấn nâng cấp ổ cứng SSD NVMe, RAM, Pin, Sạc chính hãng. Số Serial linh kiện được lưu vào hồ sơ bảo hành điện tử.',
    serviceParam: 'Nâng cấp SSD / RAM & Linh kiện máy tính'
  },
  {
    icon: 'lock',
    tag: 'Dữ liệu & Bảo mật',
    title: 'Cứu Dữ Liệu, Sao Lưu & Diệt Virus',
    desc: 'Khôi phục dữ liệu ổ cứng/SSD lỗi phân vùng, sao lưu dữ liệu và xử lý virus, phần mềm độc hại.',
    serviceParam: 'Cứu dữ liệu, Sao lưu & Diệt Virus bảo mật'
  },
  {
    icon: 'globe',
    tag: 'Mạng nội bộ & Máy in',
    title: 'Khắc Phục Lỗi Mạng LAN/Wi-Fi & Máy In',
    desc: 'Cài đặt Driver máy in, chia sẻ máy in nội bộ, xử lý mất kết nối Wi-Fi/Bluetooth và cổng USB/HDMI.',
    serviceParam: 'Khắc phục lỗi Mạng, Driver & Thiết bị ngoại vi'
  },
  {
    icon: 'shield',
    tag: 'Bảo dưỡng định kỳ',
    title: 'Vệ Sinh Laptop & Kiểm Tra Phần Cứng',
    desc: 'Vệ sinh laptop, tra keo tản nhiệt, kiểm tra sức khỏe ổ cứng định kỳ và theo dõi bảo hành qua mã QR.',
    serviceParam: 'Bảo dưỡng định kỳ & Hỗ trợ bảo hành'
  }
];

function HomeLanding() {
  const navigate = useNavigate();
  const [activeGuideTab, setActiveGuideTab] = useState('TAI_QUAY');
  const [topReviews, setTopReviews] = useState([]);
  const [cmsConfig, setCmsConfig] = useState(null);
  const [qrMode, setQrMode] = useState('INTAKE'); // 'INTAKE' | 'DEMO_TRACK'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [displayQrUrl, setDisplayQrUrl] = useState('');
  const [quickTicketCode, setQuickTicketCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    api.get('/public/reviews/top')
      .then(res => setTopReviews(res.data.data || []))
      .catch(error => console.error('Không tải được đánh giá nổi bật:', error));

    api.get('/public/cms-config')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setCmsConfig(res.data.data);
        }
      })
      .catch(error => console.error('Không tải được cấu hình CMS từ Backend:', error));
  }, []);

  const brand = cmsConfig?.brand || {
    companyName: 'CÔNG TY CỔ PHẦN LỤC GIÁC',
    badgeText: 'TRUNG TÂM CSKH & SỬA CHỮA • CÔNG TY CỔ PHẦN LỤC GIÁC',
    showPromoBanner: false,
    promoBannerText: 'Miễn phí kiểm tra lỗi phần cứng & phần mềm tại quầy 615 Âu Cơ.'
  };

  const hero = cmsConfig?.hero || {
    titleLine1: 'Tiếp Nhận & Chăm Sóc Khách Hàng',
    titleHighlight: 'Theo Dõi Sửa Chữa & Bảo Hành Qua Mã QR',
    description: 'Tiếp nhận thiết bị máy tính, theo dõi tiến độ kiểm tra - sửa chữa và tra cứu thời hạn bảo hành điện tử bằng mã QR.',
    bannerImageUrl: '',
    showBannerImage: false,
    kioskTitle: 'Mã QR Quầy Tiếp Nhận',
    kioskBranch: '615 Âu Cơ'
  };

  const dynamicPillars = cmsConfig?.pillars?.length ? cmsConfig.pillars : CORE_PILLARS;
  const dynamicServices = cmsConfig?.services?.length ? cmsConfig.services : COMPUTER_SOFTWARE_SERVICES;

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
      {/* Thanh thông báo đầu trang */}
      {brand.showPromoBanner && brand.promoBannerText && (
        <div className="bg-slate-50 text-slate-700 py-2 px-4 text-center text-xs font-medium border-b border-slate-200">
          <div className="container mx-auto flex flex-wrap items-center justify-center gap-2">
            <span>{brand.promoBannerText}</span>
            <Link to="/dat-lich" className="font-semibold text-brand-blue hover:underline ml-1">
              Đặt lịch ngay →
            </Link>
          </div>
        </div>
      )}

      {/* Phần giới thiệu đầu trang */}
      <section className="bg-[#f4f7fb] border-b border-slate-200 py-7 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
                <ResponsiveText mobile="TT CSKH • LỤC GIÁC" desktop={brand.badgeText} />
              </p>

              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
                  {hero.titleLine1} <br />
                  <span className="text-brand-blue font-extrabold">{hero.titleHighlight}</span>
                </h1>

                <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-none">
                  {hero.description}
                </p>
              </div>

              {hero.showBannerImage !== false && hero.bannerImageUrl && (
                <div className="max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs">
                  <img
                    src={hero.bannerImageUrl}
                    alt={hero.titleLine1}
                    className="h-36 sm:h-44 w-full rounded-lg object-cover bg-slate-50"
                  />
                </div>
              )}

              {/* Tra cứu nhanh theo mã phiếu */}
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
                    <SvgIcon name="camera" className="w-4 h-4 text-slate-600" />
                    <span>Quét QR</span>
                  </button>
                </form>
              </div>

              {/* Các nút chức năng chính */}
              <div className="flex flex-wrap gap-2.5 max-w-2xl pt-1">
                <Link
                  to="/intake"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  <SvgIcon name="file-text" className="w-4 h-4" />
                  <span>Tạo Phiếu Tại Quầy</span>
                </Link>
                <Link
                  to="/tra-cuu"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs sm:text-sm transition"
                >
                  <SvgIcon name="search" className="w-4 h-4 text-slate-500" />
                  <span>Tra Cứu SĐT / Serial</span>
                </Link>
                <Link
                  to="/dat-lich"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs sm:text-sm transition"
                >
                  <SvgIcon name="calendar" className="w-4 h-4 text-slate-500" />
                  <span>Đặt Lịch Hẹn</span>
                </Link>
              </div>
            </div>

            {/* Khung mã QR tại quầy */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                  <h2 className="font-bold text-sm text-slate-900">
                    {hero.kioskTitle || 'Mã QR Quầy Tiếp Nhận'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                    {hero.kioskBranch || '615 Âu Cơ'}
                  </span>
                </div>

                {/* Chuyển chế độ mã QR */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg mb-3.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setQrMode('INTAKE')}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      qrMode === 'INTAKE'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SvgIcon name="file-text" className="w-3.5 h-3.5 text-brand-blue" />
                    <span>QR Tạo Phiếu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrMode('DEMO_TRACK')}
                    className={`py-1.5 px-2 rounded-md transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                      qrMode === 'DEMO_TRACK'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SvgIcon name="search" className="w-3.5 h-3.5 text-brand-blue" />
                    <span>QR Tra Cứu</span>
                  </button>
                </div>

                {/* Ảnh mã QR */}
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
                    <ResponsiveText
                      mobile={qrMode === 'INTAKE' ? 'Quét QR để mở form tạo phiếu' : 'Quét QR để tra cứu hồ sơ'}
                      desktop={
                        qrMode === 'INTAKE'
                          ? 'Dùng Camera điện thoại hoặc Zalo quét để mở form tiếp nhận'
                          : 'Dùng Camera điện thoại hoặc Zalo quét để tra cứu hồ sơ'
                      }
                    />
                  </p>
                  {displayQrUrl && (
                    <span className="hidden sm:block mt-1 text-[10px] text-slate-400 font-mono text-center truncate max-w-full">
                      {displayQrUrl}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <SvgIcon name="camera" className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mở Camera Quét</span>
                  </button>
                  <Link
                    to={qrMode === 'INTAKE' ? '/intake' : '/tra-cuu'}
                    className="py-2 px-3 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs transition flex items-center justify-center text-center"
                  >
                    {qrMode === 'INTAKE' ? 'Mở Form Ngay' : 'Tra Cứu Ngay'} →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Quy trình tiếp nhận */}
      <section className="py-8 sm:py-14 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              <ResponsiveText mobile="Quy Trình Tiếp Nhận & Bảo Hành" desktop="Quy Trình Tiếp Nhận & Theo Dõi Sửa Chữa Qua Mã QR" />
            </h2>
            <p className="hidden sm:block text-slate-500 mt-1.5 max-w-2xl mx-auto text-xs sm:text-sm">
              Mỗi thiết bị khi tiếp nhận tại quầy được cấp một mã QR riêng để theo dõi trạng thái xử lý và thời hạn bảo hành.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {dynamicPillars.map((pillar, idx) => (
              <div
                key={pillar.step || idx}
                className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100">
                      <DynamicIcon value={pillar.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      BƯỚC {pillar.step || `0${idx + 1}`}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1 sm:mb-1.5">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Danh mục dịch vụ */}
      <section className="py-8 sm:py-14 bg-[#f0f5fa] border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                <ResponsiveText mobile="Dịch Vụ Kỹ Thuật" desktop="Danh Mục Dịch Vụ Sửa Chữa & Hỗ Trợ Kỹ Thuật" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kiểm tra tình trạng máy miễn phí tại quầy và báo giá chi tiết trước khi thực hiện.
              </p>
            </div>
            <Link
              to="/intake"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs sm:text-sm transition shrink-0"
            >
              <SvgIcon name="file-text" className="w-4 h-4" />
              <ResponsiveText mobile="Tạo Phiếu →" desktop="Tạo Phiếu Tiếp Nhận →" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {dynamicServices.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 transition flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {item.imageUrl && (
                    <div className="mb-3.5 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-32 sm:h-36 w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center border border-blue-100">
                      <DynamicIcon value={item.icon} className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 sm:mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                      <SvgIcon name="shield" className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Bảo hành điện tử 06 tháng</span>
                    </span>
                    {item.priceHint && (
                      <span className="text-[11px] font-semibold text-slate-700 mt-0.5">
                        {item.priceHint}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/dat-lich?service=${encodeURIComponent(item.serviceParam || item.title)}`}
                    className="px-3 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium text-xs transition shrink-0"
                  >
                    Đặt lịch →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hướng dẫn 3 bước */}
      <section id="how-it-works" className="py-8 sm:py-14 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-5 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              <ResponsiveText mobile="Hướng Dẫn Nhanh" desktop="Hướng Dẫn Khách Hàng Tiếp Nhận & Tra Cứu" />
            </h2>
            <p className="hidden sm:block text-slate-500 text-xs sm:text-sm mt-1">
              Lựa chọn hình thức phù hợp để xem các bước thực hiện
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center gap-2 mb-5 sm:mb-8">
            <button
              type="button"
              onClick={() => setActiveGuideTab('TAI_QUAY')}
              className={`px-3 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                activeGuideTab === 'TAI_QUAY'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SvgIcon name="building" className="w-4 h-4" />
              <ResponsiveText mobile="Tại quầy" desktop="Quét QR trực tiếp tại quầy (615 Âu Cơ)" />
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('TU_XA')}
              className={`px-3 sm:px-5 py-2 rounded-lg font-semibold text-xs sm:text-sm transition cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                activeGuideTab === 'TU_XA'
                  ? 'bg-brand-blue text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <SvgIcon name="calendar" className="w-4 h-4" />
              <ResponsiveText mobile="Đặt lịch" desktop="Đặt lịch hẹn trước qua Website" />
            </button>
          </div>

          {/* Nội dung Tab: TẠI QUẦY */}
          {activeGuideTab === 'TAI_QUAY' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Quét QR tạo phiếu tại quầy</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Khách dùng điện thoại quét mã QR quầy lễ tân để điền thông tin và đính kèm ảnh ngoại quan máy tính.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Theo dõi tiến độ trực tuyến</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Nhận biên nhận nhiệt 80mm có in mã QR riêng để theo dõi từng bước chẩn đoán và khắc phục sự cố.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Nhận máy &amp; Bảo hành điện tử</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Hoàn tất hỗ trợ, kích hoạt sổ bảo hành điện tử 06 tháng trên mã QR để tiện tra cứu khi cần.
                  </p>
                </div>
              </div>

              <div className="text-center mt-5 sm:mt-6">
                <Link
                  to="/intake"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  <SvgIcon name="file-text" className="w-4 h-4" />
                  <span>Tạo Phiếu QR Ngay →</span>
                </Link>
              </div>
            </div>
          )}

          {/* Nội dung Tab: ĐẶT LỊCH HẸN TRƯỚC */}
          {activeGuideTab === 'TU_XA' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Đặt lịch hẹn trực tuyến</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Chọn khung giờ hẹn và điền thông tin tình trạng máy tính / sự cố phần mềm qua biểu mẫu đặt hẹn.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Xác nhận lịch &amp; Cấp mã QR</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Nhân viên tiếp nhận lịch hẹn trên hệ thống nội bộ, xác nhận khung giờ và khởi tạo sẵn mã hồ sơ QR.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-white border border-slate-200 rounded-xl flex items-center justify-center text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Phục vụ đúng giờ &amp; Hậu mãi</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
                    Khách hàng đến quầy được ưu tiên phục vụ đúng giờ và theo dõi toàn bộ tiến độ qua mã QR.
                  </p>
                </div>
              </div>

              <div className="text-center mt-5 sm:mt-6">
                <Link
                  to="/dat-lich"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover active:brightness-95 text-white font-medium rounded-lg text-xs sm:text-sm transition shadow-xs"
                >
                  <SvgIcon name="calendar" className="w-4 h-4" />
                  <span>Đặt Lịch Hẹn Ngay →</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Phản hồi từ khách hàng */}
      {topReviews.length > 0 && (
        <section className="py-8 sm:py-14 bg-[#f0f5fa] border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-5 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                <ResponsiveText mobile="Đánh Giá Từ Khách Hàng" desktop="Phản Hồi Từ Khách Hàng Sử Dụng Dịch Vụ" />
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
              {topReviews.map((r, i) => (
                <div key={i} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-500 mb-2">
                      {Array.from({ length: Number(r.so_sao) || 5 }).map((_, starIdx) => (
                        <SvgIcon key={starIdx} name="star" className="w-4 h-4 fill-current" />
                      ))}
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
