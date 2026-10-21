import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';

const STATUS_MAP = {
  'TIEP_NHAN': { label: 'Tiếp nhận máy', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'ĐANG_CHUẨN_ĐOÁN': { label: 'Đang chuẩn đoán lỗi', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  'CHỜ_KHÁCH_CHỐT_GIÁ': { label: 'Chờ khách duyệt giá', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'KHÁCH_ĐÃ_ĐỒNG_Ý': { label: 'Khách đã duyệt giá', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'ĐANG_SỬA': { label: 'Đang sửa chữa', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'ĐÃ_SỬA_XONG': { label: 'Đã sửa xong • Sẵn sàng thanh toán', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': { label: 'Đã thanh toán & Đã nhận máy', color: 'bg-green-600 text-white border-green-600' }
};

export default function Payment() {
  const { ticketCode: routeCode } = useParams();
  const [searchInput, setSearchInput] = useState(routeCode || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(routeCode));
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('VIETQR'); // 'VIETQR' | 'CASH' | 'POS'

  const fetchTicketPayment = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setError('');
    setTicket(null);
    try {
      const res = await api.get(`/public/track/${cleanCode}`);
      if (res.data?.success && res.data?.data) {
        setTicket(res.data.data);
      } else {
        setError('Không tìm thấy thông tin phiếu sửa chữa. Vui lòng kiểm tra lại mã phiếu.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy phiếu sửa chữa. Vui lòng kiểm tra lại mã phiếu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const cleanCode = (routeCode || '').trim().toUpperCase();
    if (!cleanCode) return;

    api.get(`/public/track/${cleanCode}`)
      .then(res => {
        if (!active) return;
        if (res.data?.success && res.data?.data) {
          setTicket(res.data.data);
          setError('');
        } else {
          setError('Không tìm thấy thông tin phiếu sửa chữa. Vui lòng kiểm tra lại mã phiếu.');
        }
      })
      .catch(err => {
        if (!active) return;
        setError(err.response?.data?.message || 'Không tìm thấy phiếu sửa chữa. Vui lòng kiểm tra lại mã phiếu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeCode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      fetchTicketPayment(searchInput.trim());
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  // Tính toán số tiền
  const totalRaw = Number(ticket?.tong_tien || 0);
  const isStudent = Boolean(ticket?.uu_dai_sinh_vien?.la_sinh_vien || ticket?.la_sinh_vien);
  const finalAmount = isStudent
    ? Math.round(totalRaw * 0.85)
    : totalRaw;
  const studentDiscount = isStudent ? totalRaw - finalAmount : 0;
  const isPaid = ticket?.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN';

  // VietQR link
  const vietQrUrl = ticket
    ? `https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(`TT ${ticket.ma_tra_cuu}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-blue text-xs font-bold uppercase tracking-wider mb-2">
            💳 Cổng Thanh Toán & Hóa Đơn Trực Tuyến
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Thanh Toán Dịch Vụ Sửa Chữa
          </h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-xl mx-auto">
            Quét mã VietQR chuyển khoản nhanh bằng bất kỳ ứng dụng ngân hàng nào hoặc chọn thanh toán tiền mặt trực tiếp tại quầy 615 Âu Cơ.
          </p>
        </div>

        {/* Search Ticket Input Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-8">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Nhập mã phiếu sửa chữa (VD: RP-680147)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-sm uppercase font-semibold transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-6 py-3 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-900/10 disabled:opacity-50 shrink-0"
            >
              {loading ? 'Đang tra cứu...' : 'Tìm Hóa Đơn'}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Ticket Details & Payment Card */}
        {ticket && (
          <div className="space-y-6">
            
            {/* Payment Status Banner */}
            <div className={`rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isPaid
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : finalAmount > 0
                ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                  isPaid ? 'bg-emerald-600 text-white' : 'bg-brand-blue text-white'
                }`}>
                  {isPaid ? '✓' : '💳'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-extrabold uppercase bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Mã phiếu: {ticket.ma_tra_cuu}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${STATUS_MAP[ticket.trang_thai]?.color || 'bg-slate-100'}`}>
                      {STATUS_MAP[ticket.trang_thai]?.label || ticket.trang_thai}
                    </span>
                  </div>
                  <p className="text-xs font-semibold mt-1">
                    Thiết bị: <strong className="text-slate-800">{ticket.ten_may || ticket.ten_thiet_bi}</strong>
                    {ticket.so_imei_serial ? ` • S/N: ${ticket.so_imei_serial}` : ''}
                  </p>
                </div>
              </div>

              {isPaid ? (
                <div className="text-right shrink-0">
                  <span className="inline-block px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
                    ĐÃ THANH TOÁN
                  </span>
                  {ticket.ngay_thanh_toan && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                      Thời gian: {new Date(ticket.ngay_thanh_toan).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500 font-medium">Số tiền cần thanh toán</p>
                  <p className="text-xl md:text-2xl font-black text-brand-blue">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )}
            </div>

            {/* Invoice Breakdown Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📄</span> Chi Tiết Hóa Đơn Dịch Vụ
                </h2>
                <span className="text-xs text-slate-400">
                  Khách hàng: <strong>{ticket.ho_ten}</strong>
                </span>
              </div>

              {/* Danh sách linh kiện & dịch vụ */}
              <div className="mt-5 space-y-3">
                {ticket.linh_kien && ticket.linh_kien.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {ticket.linh_kien.map((part) => (
                      <div key={part.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {part.hinh_anh ? (
                              <img
                                src={part.hinh_anh}
                                alt={part.ten_linh_kien}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-lg">⚙️</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{part.ten_linh_kien}</p>
                            <p className="text-xs text-slate-500">
                              Số lượng: {part.so_luong} x {Number(part.don_gia).toLocaleString('vi-VN')} đ
                              {part.so_serial ? ` • S/N: ${part.so_serial}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {(Number(part.so_luong) * Number(part.don_gia)).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-xs text-slate-500 italic">
                    Công kỹ thuật kiểm tra và chuẩn đoán thiết bị.
                  </div>
                )}

                {/* Gói phần mềm (nếu có) */}
                {ticket.goi_phan_mem && ticket.goi_phan_mem.length > 0 && (
                  <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
                    <span>Gói phần mềm kèm theo: <strong>{ticket.goi_phan_mem.join(', ')}</strong></span>
                    <span className="text-emerald-600 font-bold">Miễn phí dịch vụ</span>
                  </div>
                )}
              </div>

              {/* Tóm tắt thanh toán */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng chi phí linh kiện & dịch vụ:</span>
                  <span className={isStudent ? 'line-through text-slate-400' : 'font-semibold text-slate-800'}>
                    {totalRaw.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {isStudent && (
                  <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span>🎓</span> Trợ giá sinh viên toàn quốc (-15%):
                    </span>
                    <span>-{studentDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Tổng số tiền thanh toán:</span>
                  <span className="text-xl font-black text-brand-blue">
                    {finalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Phương Thức Thanh Toán (Chỉ hiển thị khi chưa thanh toán hoặc muốn xem lại VietQR) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-7">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                <span>🏦</span> Phương Thức Thanh Toán
              </h2>

              {/* Tabs chọn phương thức */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('VIETQR')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                    selectedMethod === 'VIETQR'
                      ? 'border-brand-blue bg-blue-50/80 text-brand-blue shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">📱</span>
                  <span>Chuyển Khoản VietQR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('CASH')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                    selectedMethod === 'CASH'
                      ? 'border-brand-blue bg-blue-50/80 text-brand-blue shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">💵</span>
                  <span>Tiền Mặt Tại Quầy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod('POS')}
                  className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 ${
                    selectedMethod === 'POS'
                      ? 'border-brand-blue bg-blue-50/80 text-brand-blue shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-lg">💳</span>
                  <span>Quẹt Thẻ POS</span>
                </button>
              </div>

              {/* Chi tiết từng phương thức */}
              {selectedMethod === 'VIETQR' && (
                <div className="rounded-2xl border border-blue-200 bg-slate-50/80 p-5 text-center">
                  <p className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1">
                    Quét mã VietQR bằng bất kỳ App Ngân Hàng hoặc Ví Điện Tử
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Hệ thống tự động điền sẵn số tiền <strong className="text-slate-700">{finalAmount.toLocaleString('vi-VN')} đ</strong> và nội dung <code className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-bold">TT {ticket.ma_tra_cuu}</code>
                  </p>

                  <div className="inline-block p-3 bg-white rounded-2xl border border-slate-200 shadow-md mb-4">
                    <img
                      src={vietQrUrl}
                      alt={`Mã VietQR thanh toán ${ticket.ma_tra_cuu}`}
                      className="w-56 h-auto mx-auto rounded-xl"
                    />
                  </div>

                  {/* Bảng chi tiết chuyển khoản có nút copy */}
                  <div className="max-w-md mx-auto text-xs bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Ngân hàng:</span>
                      <strong className="text-slate-800">MB Bank (Ngân hàng Quân Đội)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-brand-blue font-mono font-bold text-sm">02838604999</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('02838604999', 'stk')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                        >
                          {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Chủ tài khoản:</span>
                      <strong className="text-slate-800">HUNGHAU IT SUPPORT</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Số tiền:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 font-bold">{finalAmount.toLocaleString('vi-VN')} đ</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(String(finalAmount), 'amount')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                        >
                          {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Nội dung chuyển:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-brand-orange font-mono font-bold">TT {ticket.ma_tra_cuu}</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(`TT ${ticket.ma_tra_cuu}`, 'content')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                        >
                          {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'CASH' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
                  <span className="text-4xl block mb-2">🏢</span>
                  <p className="text-sm font-bold text-slate-800">Thanh Toán Tiền Mặt Tại Quầy CSKH</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Vui lòng mang theo máy hoặc mã phiếu <strong>{ticket.ma_tra_cuu}</strong> đến quầy tiếp nhận tại:
                  </p>
                  <div className="mt-3 inline-block rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-700 font-semibold shadow-2xs">
                    📍 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Giờ mở cửa: 07:30 - 20:30 (Thứ 2 đến Thứ 7)</p>
                </div>
              )}

              {selectedMethod === 'POS' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
                  <span className="text-4xl block mb-2">💳</span>
                  <p className="text-sm font-bold text-slate-800">Quẹt Thẻ ATM / Visa / Mastercard / Napas</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Thiết bị POS không tiếp xúc hỗ trợ chạm thẻ ngân hàng, Apple Pay, Samsung Pay và Google Pay trực tiếp tại quầy CSKH.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold mt-2">✓ Hoàn toàn miễn phí phí quẹt thẻ cho khách hàng</p>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link
                to={`/tra-cuu/${ticket.ma_tra_cuu}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-blue"
              >
                <span>←</span> Xem Tiến Độ Sửa Chữa Chi Tiết
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  🖨️ In Hóa Đơn (A4)
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 bg-brand-blue hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  🏠 Về Trang Chủ
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
