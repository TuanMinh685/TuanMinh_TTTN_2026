import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import QrScannerModal from '../../components/QrScannerModal';

function HomeLanding() {
  const navigate = useNavigate();
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    QRCode.toDataURL(`${origin}/intake`, {
      width: 180,
      margin: 1,
      color: {
        dark: '#2563eb',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Lỗi tạo mã QR:', err));
  }, []);

  const handleLookup = (e) => {
    e.preventDefault();
    const code = ticketCodeInput.trim().toUpperCase();
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
    <div className="bg-white text-slate-800">
      {/* PHẦN 1: HERO - ĐƠN GIẢN, RÕ RÀNG, TINH TẾ */}
      <section className="border-b border-slate-200 py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Cột trái (7/12): Nội dung và tra cứu */}
            <div className="md:col-span-7 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
                MYH GROUP • CSKH SỬA CHỮA MÁY TÍNH &amp; PHẦN MỀM
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                Chăm Sóc Khách Hàng <br />
                <span className="text-brand-blue">Qua Mã QR Điện Tử</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                Hệ thống tiếp nhận máy tính, theo dõi tiến độ sửa chữa phần cứng &amp; xử lý phần mềm thời gian thực, kích hoạt Sổ bảo hành điện tử (e-Warranty) và đánh giá chất lượng dịch vụ.
              </p>

              {/* Ô tra cứu đơn giản */}
              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2 max-w-lg">
                <input
                  type="text"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  placeholder="Nhập mã phiếu (VD: RP-839400)..."
                  className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-blue"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-semibold text-sm transition shrink-0 cursor-pointer"
                >
                  Tra Cứu
                </button>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>📷</span>
                  <span>Quét QR</span>
                </button>
              </form>

              {/* 3 Nút nghiệp vụ chính */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <Link
                  to="/intake"
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-medium text-xs sm:text-sm transition"
                >
                  📝 Tạo Phiếu Tại Quầy
                </Link>
                <Link
                  to="/tra-cuu"
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition"
                >
                  🔍 Tra Cứu SĐT / Serial
                </Link>
                <Link
                  to="/dat-lich"
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition"
                >
                  📅 Đặt Lịch Hẹn
                </Link>
              </div>
            </div>

            {/* Cột phải (5/12): Khung mã QR tại quầy gọn gàng */}
            <div className="md:col-span-5 flex justify-center">
              <div className="w-full max-w-xs border border-slate-200 rounded-2xl p-5 text-center bg-slate-50">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                  Quét QR Tiếp Nhận Tại Quầy
                </p>
                <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block mb-3">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Mã QR Tiếp Nhận" className="w-36 h-36 mx-auto object-contain" />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                      Đang tạo QR...
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Quét bằng điện thoại để tự điền thông tin tiếp nhận máy &amp; tải ảnh hiện trạng.
                </p>
                <Link
                  to="/intake"
                  className="block w-full py-2 bg-brand-blue hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition"
                >
                  Mở Biểu Mẫu Tại Quầy →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PHẦN 2: 3 BƯỚC HOẠT ĐỘNG ĐƠN GIẢN */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Quy Trình Chăm Sóc Khách Hàng 3 Bước
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Đơn giản, minh bạch và theo dõi trực tiếp trên điện thoại
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center text-lg font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                Quét QR Tiếp Nhận Máy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Khách quét mã QR tại quầy để điền mô tả lỗi máy tính / phần mềm và lưu ảnh ngoại quan máy lúc gửi.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center text-lg font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                Theo Dõi Tiến Độ Trực Tuyến
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nhận phiếu nhiệt 80mm có mã QR để xem nhật ký kiểm tra phần cứng &amp; xử lý phần mềm thời gian thực.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center text-lg font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                Bảo Hành QR (e-Warranty)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tự động kích hoạt Sổ bảo hành điện tử 06 tháng trên mã QR và gửi đánh giá chất lượng phục vụ 1–5 sao.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 3: THÔNG TIN HỖ TRỢ & ĐIỀU HÀNH */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Trung Tâm CSKH &amp; Sửa Chữa Máy Tính Hùng Hậu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                📍 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM • 📞 Hotline: (028) 3860 4999
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <Link
                to="/dat-lich"
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
              >
                📅 Đặt Lịch Hẹn
              </Link>
              <Link
                to="/admin"
                className="px-4 py-2.5 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-medium text-xs transition"
              >
                🔐 Bàn Điều Hành Nội Bộ
              </Link>
            </div>
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
