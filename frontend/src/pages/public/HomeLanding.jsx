import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import QrScannerModal from '../../components/QrScannerModal';

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
        dark: '#0d457b',
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
    // Nếu quét trúng URL đầy đủ có chứa /track/ hoặc /intake
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
      {/* SECTION 02: HERO BANNER - TRUNG TÂM WEB QUÉT MÃ QR CHĂM SÓC KHÁCH HÀNG */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b3c6d] via-brand-blue to-[#146c3b] py-16 lg:py-24">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Cột trái: Thông điệp trọng tâm Web Quét Mã QR CSKH */}
            <div className="w-full lg:w-7/12 text-white">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-amber-300 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-xs">
                <span>📷</span>
                <span>Web Quét Mã QR Chăm Sóc Khách Hàng • Sửa Chữa Máy Tính &amp; Phần Mềm</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold leading-tight mb-6">
                Web Quét Mã QR Chăm Sóc Khách Hàng <br />
                <span className="text-brand-orange">Mảng Sửa Chữa Máy Tính &amp; Phần Mềm</span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100 mb-6 leading-relaxed max-w-2xl">
                Nền tảng <strong>Chăm sóc khách hàng (CSKH) ứng dụng Mã QR định danh</strong> chuyên biệt cho lĩnh vực sửa chữa máy tính &amp; phần mềm: Quét QR tiếp nhận thiết bị tại quầy, lưu ảnh ngoại quan máy minh bạch, theo dõi tiến độ kiểm tra phần cứng &amp; xử lý phần mềm thời gian thực, kích hoạt <strong>Sổ bảo hành điện tử (e-Warranty)</strong> và đánh giá chất lượng phục vụ 1–5 sao.
              </p>

              {/* Thanh tra cứu & Mở Camera quét QR nhanh ngay trên trang chủ */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-7 max-w-2xl">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2.5 flex items-center justify-between">
                  <span>🔍 Tra cứu nhanh hồ sơ CSKH hoặc Bật Camera quét mã QR</span>
                  <button
                    type="button"
                    onClick={() => navigate('/track/RP-839400')}
                    className="underline hover:text-white transition"
                  >
                    Xem phiếu mẫu: RP-839400 →
                  </button>
                </div>
                <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={quickTicketCode}
                    onChange={(e) => setQuickTicketCode(e.target.value)}
                    placeholder="Nhập mã phiếu QR trên biên nhận (VD: RP-839400)..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white text-slate-800 font-semibold text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 rounded-xl bg-brand-blue hover:bg-blue-800 text-white font-bold text-sm transition shadow-md shrink-0 cursor-pointer"
                  >
                    Tra Cứu Ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-5 py-3 rounded-xl bg-brand-blue hover:bg-blue-800 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Quét Camera QR</span>
                  </button>
                </form>
              </div>

              {/* Cụm nút điều hướng nghiệp vụ CSKH */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/intake"
                  className="px-6 py-3.5 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 transition-all shadow-lg text-sm flex items-center gap-2 border border-white/20"
                >
                  <span>📝</span>
                  <span>Quét QR Tạo Phiếu Tại Quầy</span>
                </Link>
                <Link
                  to="/tra-cuu"
                  className="px-6 py-3.5 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 transition-all shadow-lg text-sm flex items-center gap-2 border border-white/20"
                >
                  <span>📷</span>
                  <span>Quét Mã QR & Tra Cứu</span>
                </Link>
                <Link
                  to="/dat-lich"
                  className="px-6 py-3.5 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 transition-all shadow-lg text-sm flex items-center gap-2 border border-white/20"
                >
                  <span>📅</span>
                  <span>Đặt Lịch Hẹn CSKH</span>
                </Link>
              </div>
            </div>

            {/* Cột phải: Thẻ Mã QR Tương Tác Trực Tiếp Tại Quầy */}
            <div className="w-full lg:w-5/12 flex justify-center">
              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-white/30 p-6 text-slate-800 relative">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-green block">
                      ● MÃ QR TRỰC TUYẾN TẠI QUẦY
                    </span>
                    <h3 className="font-extrabold text-base text-brand-blue">
                      Cổng Quét QR Tự Phục Vụ (CSKH)
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-brand-blue font-bold text-xs">
                    615 Âu Cơ
                  </span>
                </div>

                {/* Chuyển đổi 2 chế độ mã QR thực tế */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
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
                <div className="bg-slate-50 border-2 border-dashed border-brand-blue/30 rounded-2xl p-4 flex flex-col items-center justify-center mb-4">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Mã QR Chăm Sóc Khách Hàng"
                      className="w-48 h-48 object-contain rounded-xl bg-white p-2 shadow-sm"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-sm">
                      Đang tạo mã QR...
                    </div>
                  )}
                  <span className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
                    {qrMode === 'INTAKE'
                      ? 'Quét để mở Form Tiếp Nhận Tại Quầy (/intake)'
                      : 'Quét để xem Hồ Sơ CSKH Mẫu (RP-839400)'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
                  {qrMode === 'INTAKE'
                    ? 'Khách hàng đến quầy dùng Camera điện thoại quét mã này để tự điền thông tin yêu cầu & đính kèm ảnh hiện trạng.'
                    : 'Quét mã hoặc bấm nút bên dưới để trải nghiệm trang theo dõi tiến độ xử lý, bảo hành điện tử & đánh giá 5 sao.'}
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-800 transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>📷</span>
                    <span>Mở Máy Quét QR</span>
                  </button>
                  <Link
                    to={qrMode === 'INTAKE' ? '/intake' : '/track/RP-839400'}
                    className="py-2.5 px-3 rounded-xl bg-brand-blue text-white font-bold text-xs hover:bg-blue-800 transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                  >
                    <span>🚀</span>
                    <span>{qrMode === 'INTAKE' ? 'Mở Form Ngay' : 'Xem Hồ Sơ Mẫu'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-brand-green/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* SECTION 02B: 4 TRỤ CỘT CHĂM SÓC KHÁCH HÀNG BẰNG MÃ QR */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-orange">
              GIẢI PHÁP CSKH SỐ HÓA MẢNG MÁY TÍNH &amp; PHẦN MỀM
            </span>
            <h2 className="text-2xl lg:text-4xl font-bold text-brand-blue mt-2">
              4 Trụ Cột Chăm Sóc Khách Hàng Qua Mã QR (Máy Tính &amp; Phần Mềm)
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto text-sm sm:text-base">
              Mỗi thiết bị máy tính hoặc yêu cầu hỗ trợ phần mềm được cấp một mã QR định danh duy nhất xuyên suốt từ lúc tiếp nhận, kiểm tra, sửa chữa cho đến hết hạn bảo hành điện tử.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 hover:shadow-lg hover:border-brand-blue/40 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center text-2xl mb-4">
                💻
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                1. Quét QR Tiếp Nhận Máy &amp; Ảnh Ngoại Quan
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Khách tự quét QR tại quầy điền tình trạng lỗi máy tính / phần mềm trong 30 giây và tải lên ảnh chụp ngoại quan máy lúc gửi để đối chiếu minh bạch.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 hover:shadow-lg hover:border-brand-blue/40 transition">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center text-2xl mb-4">
                ⏱️
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                2. Quét QR Theo Dõi Tiến Độ Sửa Chữa &amp; Cài Đặt
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Không cần gọi điện chờ tổng đài. Khách quét mã QR trên biên nhận để xem trực tiếp nhật ký kiểm tra phần cứng &amp; khắc phục lỗi phần mềm thời gian thực.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 hover:shadow-lg hover:border-brand-blue/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl mb-4">
                🛡️
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                3. Quét QR Sổ Bảo Hành Điện Tử (e-Warranty)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Thay thế hoàn toàn phiếu bảo hành giấy sau khi sửa máy tính hoặc cài đặt phần mềm. Tự động đếm ngược hạn bảo hành 06 tháng và gửi yêu cầu hỗ trợ lại qua QR.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 hover:shadow-lg hover:border-brand-blue/40 transition">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl mb-4">
                ⭐
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2">
                4. Quét QR Đánh Giá Chất Lượng CSKH (1–5 Sao)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sau khi nhận lại máy tính hoạt động ổn định, khách hàng quét mã QR chấm điểm 1–5 sao và gửi nhận xét về chất lượng hỗ trợ của Kỹ thuật viên &amp; CSKH.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: QUY TRÌNH HOẠT ĐỘNG (HOW IT WORKS) */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-blue">Quy Trình Quét Mã QR Chăm Sóc Khách Hàng</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">Chọn hình thức tiếp nhận phù hợp với bạn để xem hướng dẫn 3 bước đơn giản.</p>
          </div>

          {/* Các nút chuyển Tab */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button
              type="button"
              onClick={() => setActiveGuideTab('TAI_QUAY')}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-md cursor-pointer ${activeGuideTab === 'TAI_QUAY' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              🏢 Luồng 1: Quét QR trực tiếp tại quầy (615 Âu Cơ)
            </button>
            <button
              type="button"
              onClick={() => setActiveGuideTab('TU_XA')}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-md cursor-pointer ${activeGuideTab === 'TU_XA' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              📅 Luồng 2: Đặt lịch hẹn CSKH trước qua Web
            </button>
          </div>

          {/* Nội dung Tab: TẠI QUẦY */}
          {activeGuideTab === 'TAI_QUAY' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-slate-200 z-0"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">
                    📷
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">1. Quét QR tạo phiếu tại quầy</h3>
                  <p className="text-slate-600">Khách hàng quét mã QR tại quầy Lễ tân để điền thông tin liên hệ, nội dung cần hỗ trợ và đính kèm hình ảnh minh chứng.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">
                    📲
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">2. Quét QR theo dõi &amp; Xác nhận</h3>
                  <p className="text-slate-600">Nhận phiếu in nhiệt 80mm có mã QR riêng. Quét mã bất cứ lúc nào để xem nhật ký xử lý và xác nhận phương án hỗ trợ online.</p>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">
                    🛡️
                  </div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">3. Hoàn tất, Bảo hành QR &amp; Đánh giá</h3>
                  <p className="text-slate-600">Hoàn tất hồ sơ hỗ trợ, tự động kích hoạt Sổ bảo hành điện tử (e-Warranty) trên mã QR và chấm điểm đánh giá 1–5 sao.</p>
                </div>
              </div>

              <div className="text-center mt-12">
                <Link to="/intake" className="inline-block px-8 py-4 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 shadow-lg">
                  Tiến hành Tạo Phiếu QR Ngay
                </Link>
              </div>
            </div>
          )}

          {/* Nội dung Tab: ĐẶT LỊCH HẸN TRƯỚC */}
          {activeGuideTab === 'TU_XA' && (
            <div className="animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-1 bg-slate-200 z-0"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">📅</div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">1. Đặt lịch hẹn trực tuyến</h3>
                  <p className="text-slate-600">Chọn khung giờ hẹn trước và mô tả tình trạng thiết bị qua biểu mẫu đặt lịch CSKH trực tuyến.</p>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">📞</div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">2. Nhân viên CSKH xác nhận & Cấp QR</h3>
                  <p className="text-slate-600">Bộ phận Lễ tân & CSKH tiếp nhận lịch hẹn trên hệ thống, xác nhận khung giờ và khởi tạo sẵn mã phiếu QR cho bạn.</p>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-brand-blue text-4xl mb-6">✅</div>
                  <h3 className="text-xl font-bold text-brand-blue mb-3">3. Phục vụ ưu tiên & Chăm sóc hậu mãi</h3>
                  <p className="text-slate-600">Khách hàng đến quầy được phục vụ đúng giờ hẹn không cần xếp hàng và theo dõi toàn bộ tiến độ, bảo hành qua mã QR.</p>
                </div>
              </div>
              <div className="text-center mt-12">
                <Link to="/dat-lich" className="inline-block px-8 py-4 bg-brand-blue text-white font-bold rounded-full hover:bg-blue-800 shadow-lg">
                  Đặt Lịch Hẹn CSKH Ngay
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION REVIEWS: PHẢN HỒI KHÁCH HÀNG QUA MÃ QR */}
      {topReviews.length > 0 && (
        <section className="py-20 bg-blue-50 border-t border-blue-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue">
                ĐÁNH GIÁ TỪ KHÁCH HÀNG QUÉT MÃ QR
              </span>
              <h2 className="text-3xl font-bold text-brand-blue mt-1">Khách Hàng Nói Gì Về Dịch Vụ CSKH</h2>
              <p className="text-slate-500 mt-2">Phản hồi thực tế được khách hàng gửi trực tiếp từ trang Quét mã QR sau khi nhận lại thiết bị</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topReviews.map((r, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                  <div className="flex text-yellow-400 mb-4 text-xl">
                    {Array.from({ length: r.so_sao }).map((_, idx) => <span key={idx}>★</span>)}
                  </div>
                  <p className="text-slate-600 italic mb-4">"{r.nhan_xet}"</p>
                  <p className="font-bold text-brand-blue text-sm">- {r.ho_ten}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(r.ngay_danh_gia).toLocaleDateString('vi-VN')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 06: KHU VỰC DÀNH CHO NHÂN VIÊN CSKH */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-brand-blue rounded-3xl p-10 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl lg:text-4xl font-bold mb-4 relative z-10">Cổng Điều Hành Chăm Sóc Khách Hàng Nội Bộ</h2>
            <p className="text-blue-200 text-base sm:text-lg mb-8 max-w-2xl mx-auto relative z-10">
              Dành cho Lễ tân tiếp nhận, Chuyên viên hỗ trợ và Trưởng bộ phận CSKH tại Tập đoàn MYH Group để quản lý hồ sơ QR, cập nhật nhật ký xử lý, in phiếu QR nhiệt 80mm và thống kê mức độ hài lòng.
            </p>
            <Link to="/admin" className="inline-block px-10 py-4 bg-white text-brand-blue font-bold text-lg rounded-full hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl relative z-10 w-full md:w-auto">
              🔐 Truy Cập Cổng Điều Hành CSKH
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
