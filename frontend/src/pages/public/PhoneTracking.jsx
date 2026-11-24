import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QrScannerModal from '../../components/QrScannerModal';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon from '../../components/SvgIcon';

function PhoneTracking() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('QR_CODE'); // 'QR_CODE' hoặc 'PHONE'
  
  // State tra cứu theo mã phiếu / QR
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // State tra cứu theo số điện thoại
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Xử lý tra cứu trực tiếp theo mã phiếu
  const handleTicketCodeSearch = (e) => {
    e.preventDefault();
    if (!ticketCodeInput.trim()) return;
    navigate(`/track/${ticketCodeInput.trim().toUpperCase()}`);
  };

  // Callback khi camera quét QR thành công
  const handleScanSuccess = (scannedCode) => {
    setIsScannerOpen(false);
    if (scannedCode) {
      navigate(`/track/${scannedCode.toUpperCase()}`);
    }
  };

  // Xử lý tra cứu danh sách máy theo số điện thoại
  const handlePhoneSearch = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/public/track/phone/${phone}`);
      setTickets(res.data.data || []);
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f0f5fa] flex flex-col">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        <div className="text-center mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1.5 sm:mb-2">
            <ResponsiveText mobile="Quét Mã QR & Tra Cứu" desktop="Quét Mã QR & Tra Cứu Hồ Sơ" />
          </h1>
          <p className="text-slate-500 text-xs sm:text-base">
            <ResponsiveText
              mobile="Quét QR trên phiếu hoặc nhập SĐT / Serial để xem tiến độ."
              desktop="Quét mã QR trên biên nhận hoặc nhập Số điện thoại / Số Serial máy để xem tiến độ và thời hạn bảo hành."
            />
          </p>
        </div>

        {/* Nút chuyển Tab chế độ tra cứu */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl max-w-md mx-auto mb-5 sm:mb-7">
          <button
            type="button"
            onClick={() => setActiveTab('QR_CODE')}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'QR_CODE'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SvgIcon name="camera" className="w-4 h-4" />
            <ResponsiveText mobile="Quét QR / Mã phiếu" desktop="Mã phiếu / Quét QR" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PHONE')}
            className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              activeTab === 'PHONE'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SvgIcon name="smartphone" className="w-4 h-4" />
            <ResponsiveText mobile="SĐT / Serial" desktop="SĐT / IMEI / Serial" />
          </button>
        </div>

        {/* TAB 1: TRA CỨU BẰNG MÃ PHIẾU HOẶC QUÉT CAMERA QR */}
        {activeTab === 'QR_CODE' && (
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200 p-5 sm:p-8 mb-6 sm:mb-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">
                <ResponsiveText mobile="Quét QR hoặc Nhập mã" desktop="Quét mã QR hoặc Nhập mã phiếu" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                <span className="hidden sm:inline">Mã tra cứu được in trên phiếu tiếp nhận (</span>Ví dụ: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-brand-blue">RP-839400</code><span className="hidden sm:inline">)</span>
              </p>
            </div>

            {/* Nút bật Camera quét mã QR */}
            <div className="mb-5 sm:mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-base sm:text-lg rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
              >
                <SvgIcon name="camera" className="w-5 h-5" />
                <ResponsiveText mobile="Bật Camera Quét QR" desktop="Bật Camera quét mã QR ngay" />
              </button>
            </div>

            <div className="relative flex items-center my-4 sm:my-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <ResponsiveText mobile="Hoặc nhập mã" desktop="Hoặc gõ mã bằng tay" />
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Form nhập mã phiếu */}
            <form onSubmit={handleTicketCodeSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                required
                placeholder="Nhập mã phiếu (VD: RP-839400)"
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-base sm:text-lg font-mono uppercase"
                value={ticketCodeInput}
                onChange={(e) => setTicketCodeInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-base sm:text-lg rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
              >
                <ResponsiveText mobile="Tra Cứu" desktop="Tra Cứu Ngay" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: TRA CỨU THEO SỐ ĐIỆN THOẠI / IMEI / SERIAL */}
        {activeTab === 'PHONE' && (
          <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200 p-5 sm:p-8 mb-6 sm:mb-8">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">
                <ResponsiveText
                  mobile="Tra cứu SĐT / Serial"
                  desktop="Tra cứu theo Số điện thoại hoặc Số Serial / Service Tag thiết bị"
                />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                <span className="hidden sm:inline">Nhập SĐT khách hàng hoặc Số Serial máy tính (</span>VD: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">0901234567</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">C02X9082JG5H</code><span className="hidden sm:inline">, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">DELL-XPS-8821</code>)</span>.
              </p>
            </div>

            <form onSubmit={handlePhoneSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                required
                placeholder="Nhập SĐT khách hàng hoặc Số Serial / Service Tag máy..."
                className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-base sm:text-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-base sm:text-lg rounded-lg shadow-xs transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? 'Đang tìm...' : 'Tra Cứu'}
              </button>
            </form>
          </div>
        )}

        {/* KẾT QUẢ KHI TÌM THEO SĐT / IMEI / SERIAL */}
        {activeTab === 'PHONE' && hasSearched && !loading && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-700 mb-4">Kết quả tìm kiếm cho từ khóa: {phone}</h3>

            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-xs text-center border border-slate-200">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <SvgIcon name="search" className="w-6 h-6" />
                </div>
                <p className="text-slate-500 text-sm">Không tìm thấy thiết bị nào khớp với Số điện thoại / IMEI / Serial này.</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 sm:p-6 rounded-xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-bold text-lg text-brand-blue">{ticket.ten_may}</h4>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold font-mono">
                        Mã: {ticket.ma_tra_cuu}
                      </span>
                      {ticket.so_imei_serial && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono">
                          S/N: {ticket.so_imei_serial}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Nội dung yêu cầu: {ticket.tinh_trang_may}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || ticket.trang_thai === 'ĐÃ_SỬA_XONG'
                            ? 'bg-emerald-500'
                            : ticket.trang_thai === 'YÊU_CẦU_BẢO_HÀNH'
                            ? 'bg-amber-500'
                            : ticket.trang_thai === 'CHỜ_KHÁM'
                            ? 'bg-slate-400'
                            : 'bg-brand-blue'
                        }`} />
                        <span>
                          {ticket.trang_thai === 'CHỜ_KHÁM'
                            ? 'Chờ tiếp nhận'
                            : ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN'
                            ? 'Đang kiểm tra & phân loại'
                            : ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ'
                            ? 'Chờ khách xác nhận'
                            : ticket.trang_thai === 'ĐANG_SỬA'
                            ? 'Đang xử lý hỗ trợ'
                            : ticket.trang_thai === 'ĐÃ_SỬA_XONG'
                            ? 'Đã xử lý xong'
                            : ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
                            ? 'Hoàn tất & Bảo hành'
                            : ticket.trang_thai.replace(/_/g, ' ')}
                        </span>
                      </span>
                      {ticket.han_bao_hanh && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <SvgIcon name="shield" className="w-3.5 h-3.5" />
                          <span>BH đến {new Date(ticket.han_bao_hanh).toLocaleDateString('vi-VN')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/track/${ticket.ma_tra_cuu}`}
                    className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Xem chi tiết tiến độ →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal quét mã QR */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

export default PhoneTracking;

