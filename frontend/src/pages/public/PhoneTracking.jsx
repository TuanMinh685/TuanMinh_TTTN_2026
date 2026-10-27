import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import QrScannerModal from '../../components/QrScannerModal';

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
            📷 Cổng Tra Cứu Hồ Sơ Điện Tử Bằng Mã QR
          </span>
          <h1 className="text-3xl font-bold text-brand-blue mb-3">Quét Mã QR &amp; Tra Cứu Hồ Sơ CSKH</h1>
          <p className="text-slate-500">
            Quét mã QR trên biên nhận hoặc nhập Số điện thoại / Mã định danh để theo dõi tiến độ xử lý hồ sơ CSKH và tra cứu Sổ bảo hành điện tử (e-Warranty).
          </p>
        </div>

        {/* Nút chuyển Tab chế độ tra cứu */}
        <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto mb-8 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('QR_CODE')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'QR_CODE'
                ? 'bg-white text-brand-blue shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📷</span> Mã phiếu / Quét QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PHONE')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'PHONE'
                ? 'bg-white text-brand-blue shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📱</span> SĐT / IMEI / Serial
          </button>
        </div>

        {/* TAB 1: TRA CỨU BẰNG MÃ PHIẾU HOẶC QUÉT CAMERA QR */}
        {activeTab === 'QR_CODE' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-brand-orange p-6 sm:p-8 mb-8 animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Quét mã QR hoặc Nhập mã phiếu</h2>
              <p className="text-sm text-slate-500">
                Mã tra cứu được in trên phiếu tiếp nhận (Ví dụ: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-brand-blue">RP-839400</code>)
              </p>
            </div>

            {/* Nút bật Camera quét mã QR */}
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-orange to-amber-500 text-white font-bold text-lg rounded-xl hover:brightness-105 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 animate-pulse"
              >
                <span className="text-2xl">📷</span>
                <span>Bật Camera quét mã QR ngay</span>
              </button>
            </div>

            <div className="relative flex items-center my-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">Hoặc gõ mã bằng tay</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Form nhập mã phiếu */}
            <form onSubmit={handleTicketCodeSearch} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                required
                placeholder="Nhập mã phiếu (VD: RP-839400)"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-orange focus:ring focus:ring-amber-200 outline-none text-lg font-mono uppercase"
                value={ticketCodeInput}
                onChange={(e) => setTicketCodeInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-8 py-3 bg-brand-blue text-white font-bold text-lg rounded-lg hover:bg-blue-700 shadow-lg transition-all whitespace-nowrap"
              >
                Tra Cứu Ngay
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: TRA CỨU THEO SỐ ĐIỆN THOẠI / IMEI / SERIAL */}
        {activeTab === 'PHONE' && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-brand-green p-6 sm:p-8 mb-8 animate-in fade-in duration-200">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Tra cứu theo Số điện thoại, IMEI hoặc Serial linh kiện</h2>
              <p className="text-sm text-slate-500">Nhập SĐT khách hàng, Số Serial/IMEI máy hoặc Mã Serial linh kiện bảo hành (VD: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">0901234567</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">C02X9082JG5H</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">SN-SSD-982341</code>).</p>
            </div>

            <form onSubmit={handlePhoneSearch} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                required
                placeholder="Nhập SĐT, Số IMEI/Serial máy hoặc Serial linh kiện..."
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-green focus:ring focus:ring-green-200 outline-none text-lg"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-brand-green text-white font-bold text-lg rounded-lg hover:bg-green-600 shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
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
              <div className="bg-white p-8 rounded-xl shadow text-center border border-slate-100">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-slate-500">Không tìm thấy thiết bị nào khớp với Số điện thoại / IMEI / Serial này.</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-center gap-4"
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
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.trang_thai === 'CHỜ_KHÁM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN'
                            ? 'bg-orange-100 text-orange-700'
                            : ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : ticket.trang_thai === 'ĐANG_SỬA'
                            ? 'bg-blue-100 text-blue-700'
                            : ticket.trang_thai === 'ĐÃ_SỬA_XONG'
                            ? 'bg-green-100 text-green-700'
                            : ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
                            ? 'bg-purple-100 text-purple-700'
                            : ticket.trang_thai === 'YÊU_CẦU_BẢO_HÀNH'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.trang_thai === 'CHỜ_KHÁM'
                          ? 'CHỜ TIẾP NHẬN'
                          : ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN'
                          ? 'ĐANG KIỂM TRA & PHÂN LOẠI'
                          : ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ'
                          ? 'CHỜ KHÁCH HÀNG XÁC NHẬN'
                          : ticket.trang_thai === 'ĐANG_SỬA'
                          ? 'ĐANG XỬ LÝ HỖ TRỢ'
                          : ticket.trang_thai === 'ĐÃ_SỬA_XONG'
                          ? 'ĐÃ XỬ LÝ XONG'
                          : ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
                          ? 'HOÀN TẤT & BẢO HÀNH'
                          : ticket.trang_thai.replace(/_/g, ' ')}
                      </span>
                      {ticket.han_bao_hanh && (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🛡️ BH đến {new Date(ticket.han_bao_hanh).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/track/${ticket.ma_tra_cuu}`}
                    className="px-6 py-2 bg-brand-green/10 text-brand-green font-bold rounded-lg hover:bg-brand-green hover:text-white transition-colors whitespace-nowrap"
                  >
                    Xem chi tiết tiến độ →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MODAL BẬT CAMERA QUÉT MÃ QR */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

export default PhoneTracking;
