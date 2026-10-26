import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
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

const POPULAR_SERVICES = [
  {
    id: 'cai-win-office',
    title: 'Cài đặt Windows 10/11 & Bộ Office Pro',
    price: 150000,
    icon: '💻',
    category: 'Phần mềm',
    desc: 'Bao gồm cài driver đầy đủ, bộ font tiếng Việt, bộ gõ Unikey và tối ưu máy mượt mà.'
  },
  {
    id: 've-sinh-laptop',
    title: 'Bảo trì, Vệ sinh & Tra keo tản nhiệt gốm',
    price: 120000,
    icon: '🧼',
    category: 'Bảo dưỡng',
    desc: 'Vệ sinh quạt gió, khe tản nhiệt, bôi keo gốm làm mát CPU/GPU giảm nhiệt 10-15°C.'
  },
  {
    id: 'cuu-du-lieu-online',
    title: 'Cấp cứu phần mềm & Dữ liệu từ xa (UltraViewer)',
    price: 180000,
    icon: '🚑',
    category: 'Từ xa',
    desc: 'Hỗ trợ can thiệp nhanh qua mạng Internet không cần mang máy tới cửa hàng.'
  },
  {
    id: 'thay-pin-sac',
    title: 'Bán sạc & Thay pin Laptop chính hãng',
    price: 450000,
    icon: '🔋',
    category: 'Linh kiện',
    desc: 'Linh kiện pin chuẩn dung lượng, bảo hành 12 tháng 1 đổi 1.'
  },
  {
    id: 'thay-man-hinh',
    title: 'Thay màn hình & Bàn phím Laptop',
    price: 750000,
    icon: '🖥️',
    category: 'Linh kiện',
    desc: 'Màn hình IPS chuẩn màu góc nhìn rộng, thay thế lấy liền trong ngày.'
  },
  {
    id: 'nang-cap-ssd',
    title: 'Nâng cấp SSD NVMe / RAM tăng tốc máy tính',
    price: 550000,
    icon: '⚡',
    category: 'Nâng cấp',
    desc: 'Khởi động máy trong 5 giây, bảo hành chính hãng 36 tháng.'
  }
];

export default function Payment() {
  const { ticketCode: routeCode } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const serviceFromQuery = queryParams.get('service');
  const priceFromQuery = Number(queryParams.get('price')) || 0;

  const [activeTab, setActiveTab] = useState(() => (routeCode ? 'TICKET' : 'CHOOSE_SERVICE'));
  const [searchInput, setSearchInput] = useState(routeCode || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(routeCode));
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('VIETQR'); // 'VIETQR' | 'CASH' | 'POS'

  // Trạng thái chọn dịch vụ trực tiếp
  const [selectedService, setSelectedService] = useState(() => {
    if (serviceFromQuery) {
      return {
        id: 'custom-query',
        title: serviceFromQuery,
        price: priceFromQuery || 150000,
        icon: '⚡',
        desc: 'Dịch vụ được chọn từ bảng giá / menu dịch vụ'
      };
    }
    return null;
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isStudentDirect, setIsStudentDirect] = useState(false);

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
        setActiveTab('TICKET');
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
          setActiveTab('TICKET');
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2500);
    }
  };

  // Tính toán số tiền đối với phiếu sửa chữa có sẵn
  const totalRaw = Number(ticket?.tong_tien || 0);
  const isStudent = Boolean(ticket?.uu_dai_sinh_vien?.la_sinh_vien || ticket?.la_sinh_vien);
  const finalAmount = isStudent ? Math.round(totalRaw * 0.85) : totalRaw;
  const isPaid = ticket?.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN';

  // Tính toán số tiền khi khách chọn dịch vụ trực tiếp
  const directServiceRaw = selectedService ? selectedService.price : 0;
  const directFinalAmount = isStudentDirect ? Math.round(directServiceRaw * 0.85) : directServiceRaw;
  const directDiscount = isStudentDirect ? directServiceRaw - directFinalAmount : 0;

  // VietQR link cho phiếu sửa chữa
  const vietQrUrlTicket = ticket
    ? `https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(`TT ${ticket.ma_tra_cuu}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`
    : '';

  // VietQR link khi chọn dịch vụ trực tiếp
  const serviceCode = selectedService ? (selectedService.id.substring(0, 8).toUpperCase()) : 'DV';
  const vietQrUrlDirect = selectedService
    ? `https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${directFinalAmount}&addInfo=${encodeURIComponent(`TT ${serviceCode} ${customerPhone.slice(-4) || 'CSKH'}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`
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
            Chọn dịch vụ bạn cần thanh toán hoặc nhập mã phiếu sửa chữa đã nhận từ quầy tiếp nhận 615 Âu Cơ.
          </p>
        </div>

        {/* Tab Switcher: 1. Chọn Dịch Vụ | 2. Nhập Mã Phiếu Có Sẵn */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-200/70 p-1 rounded-2xl flex max-w-md w-full shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('CHOOSE_SERVICE')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'CHOOSE_SERVICE'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛠️</span>
              <span>1. Chọn Dịch Vụ</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TICKET')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'TICKET'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔍</span>
              <span>2. Đã Có Mã Phiếu</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CHỌN DỊCH VỤ TRONG -> VÔ TRONG MỚI CHỌN THANH TOÁN                 */}
        {/* ========================================================================= */}
        {activeTab === 'CHOOSE_SERVICE' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* NẾU CHƯA CHỌN DỊCH VỤ: HIỂN THỊ DANH SÁCH DỊCH VỤ ĐỂ CHỌN */}
            {!selectedService ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Chọn Dịch Vụ Cần Thanh Toán</h2>
                    <p className="text-xs text-slate-500">Bấm vào bất kỳ dịch vụ nào dưới đây để vào chi tiết thanh toán</p>
                  </div>
                  <Link
                    to="/bang-gia"
                    className="text-xs text-brand-blue hover:underline font-semibold"
                  >
                    Xem tất cả 30+ bảng giá chi tiết →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {POPULAR_SERVICES.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-brand-blue hover:shadow-md cursor-pointer transition-all group bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl p-2 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition">{s.icon}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                            {s.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-brand-blue transition">
                          {s.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {s.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Chi phí dịch vụ:</span>
                          <span className="text-base font-extrabold text-brand-orange">
                            {s.price.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold group-hover:bg-blue-800 transition flex items-center gap-1"
                        >
                          <span>Chọn &amp; Thanh toán</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* NẾU ĐÃ CHỌN DỊCH VỤ: VÔ TRONG NÀY MỚI HIỂN THỊ PHƯƠNG THỨC THANH TOÁN & VIETQR */
              <div className="space-y-6">
                
                {/* Banner Dịch Vụ Đã Chọn */}
                <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-3xl flex items-center justify-center shrink-0">
                        {selectedService.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-blue font-bold">
                            Dịch vụ đã chọn
                          </span>
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 mt-0.5">
                          {selectedService.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedService.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="text-xs font-bold text-brand-blue hover:underline px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition shrink-0"
                    >
                      ↺ Chọn dịch vụ khác
                    </button>
                  </div>

                  {/* Thông tin khách hàng & Ưu đãi sinh viên */}
                  <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Họ tên của bạn (Tùy chọn)</label>
                      <input
                        type="text"
                        placeholder="VD: Nguyễn Văn A"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                      <input
                        type="tel"
                        placeholder="VD: 0901234567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Toggle Ưu Đãi Sinh Viên */}
                  <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-indigo-900">
                      <input
                        type="checkbox"
                        checked={isStudentDirect}
                        onChange={(e) => setIsStudentDirect(e.target.checked)}
                        className="w-4 h-4 text-brand-blue rounded focus:ring-0 cursor-pointer"
                      />
                      <span>🎓 Tôi là Học sinh / Sinh viên (Áp dụng giảm ngay 15%)</span>
                    </label>
                    {isStudentDirect && (
                      <span className="text-xs font-extrabold text-emerald-700">
                        - {directDiscount.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                </div>

                {/* Khối Lựa Chọn Phương Thức Thanh Toán (Payment Methods) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>💳</span>
                    <span>Chọn Phương Thức Thanh Toán</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('VIETQR')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'VIETQR'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">📱</span>
                      <span className="text-xs">Quét VietQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('CASH')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'CASH'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">🏢</span>
                      <span className="text-xs">Tiền Mặt Quầy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('POS')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'POS'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">💳</span>
                      <span className="text-xs">Quẹt Thẻ POS</span>
                    </button>
                  </div>

                  {/* TH1: VIETQR */}
                  {selectedMethod === 'VIETQR' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-2xl bg-slate-50/70 border border-slate-200 p-5">
                      <div className="text-center">
                        <img
                          src={vietQrUrlDirect}
                          alt="Mã VietQR Thanh Toán"
                          className="mx-auto w-56 h-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                        />
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">
                          Quét bằng ứng dụng của bất kỳ ngân hàng nào (Vietcombank, MB, Techcombank, MoMo...)
                        </p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ngân hàng:</span>
                            <span className="font-bold text-slate-800 text-sm">MB Bank (Quân Đội)</span>
                          </div>
                          <span className="px-2 py-1 rounded bg-blue-50 text-brand-blue text-[10px] font-bold">24/7 NAPAS</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">02838604999</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('02838604999', 'account')}
                            className="text-brand-blue hover:underline font-bold text-[11px]"
                          >
                            {copiedField === 'account' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Chủ tài khoản:</span>
                            <span className="font-bold text-slate-800 uppercase">HUNGHAU IT SUPPORT</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Số tiền cần thanh toán:</span>
                            <span className="text-base font-black text-brand-orange">
                              {directFinalAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(directFinalAmount), 'amount')}
                            className="text-brand-blue hover:underline font-bold text-[11px]"
                          >
                            {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TH2: TIỀN MẶT */}
                  {selectedMethod === 'CASH' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
                      <span className="text-4xl block mb-2">🏢</span>
                      <p className="text-sm font-bold text-slate-800">Thanh Toán Tiền Mặt Sau Khi Nhận Máy</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Bạn có thể mang thiết bị đến cửa hàng để KTV kiểm tra và thanh toán trực tiếp tại:
                      </p>
                      <div className="mt-3 inline-block rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs text-slate-700 font-semibold shadow-2xs">
                        📍 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">Giờ mở cửa: 07:30 - 20:30 (Thứ 2 đến Thứ 7)</p>
                    </div>
                  )}

                  {/* TH3: QUẸT THẺ POS */}
                  {selectedMethod === 'POS' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-center">
                      <span className="text-4xl block mb-2">💳</span>
                      <p className="text-sm font-bold text-slate-800">Quẹt Thẻ ATM / Visa / Napas / Apple Pay</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Hỗ trợ quẹt thẻ và chạm thanh toán không tiếp xúc trực tiếp tại quầy Thu Ngân 615 Âu Cơ.
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold mt-2">✓ Miễn phí phí quẹt thẻ cho mọi khách hàng</p>
                    </div>
                  )}

                  {/* Nút Đặt lịch với dịch vụ này */}
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <Link
                      to={`/dat-lich?service=${encodeURIComponent(selectedService.title)}`}
                      className="text-xs font-bold text-brand-blue hover:underline"
                    >
                      📅 Đặt lịch hẹn trước cho dịch vụ này →
                    </Link>
                    <Link
                      to="/"
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                    >
                      Trở về Trang Chủ
                    </Link>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ĐÃ CÓ MÃ PHIẾU SỬA CHỮA                                             */}
        {/* ========================================================================= */}
        {activeTab === 'TICKET' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Search Ticket Input Box */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
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
                <div className={`rounded-3xl border p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
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
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
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
                  </div>

                  {/* Summary Totals */}
                  <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tổng chi phí niêm yết:</span>
                      <span className="font-semibold">{totalRaw.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {isStudent && (
                      <div className="flex justify-between text-indigo-700 font-bold bg-indigo-50/60 p-2.5 rounded-xl">
                        <span>🎓 Ưu đãi Học sinh / Sinh viên (-15%):</span>
                        <span>- {Math.round(totalRaw * 0.15).toLocaleString('vi-VN')} đ</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm md:text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                      <span>Số tiền thực thanh toán:</span>
                      <span className="text-brand-blue text-lg md:text-xl font-black">
                        {finalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Khối Thanh Toán Cho Phiếu Sửa Chữa */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-7">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>💳</span>
                    <span>Phương Thức Thanh Toán Phiếu</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('VIETQR')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'VIETQR'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">📱</span>
                      <span className="text-xs">Quét VietQR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('CASH')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'CASH'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">🏢</span>
                      <span className="text-xs">Tiền Mặt Quầy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMethod('POS')}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        selectedMethod === 'POS'
                          ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span className="text-2xl">💳</span>
                      <span className="text-xs">Quẹt Thẻ POS</span>
                    </button>
                  </div>

                  {selectedMethod === 'VIETQR' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-2xl bg-slate-50/70 border border-slate-200 p-5">
                      <div className="text-center">
                        <img
                          src={vietQrUrlTicket}
                          alt="Mã VietQR"
                          className="mx-auto w-56 h-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
                        />
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">
                          Quét bằng bất kỳ ứng dụng ngân hàng nào
                        </p>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Ngân hàng:</span>
                            <span className="font-bold text-slate-800 text-sm">MB Bank (Quân Đội)</span>
                          </div>
                          <span className="px-2 py-1 rounded bg-blue-50 text-brand-blue text-[10px] font-bold">24/7 NAPAS</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Số tài khoản:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">02838604999</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard('02838604999', 'account')}
                            className="text-brand-blue hover:underline font-bold text-[11px]"
                          >
                            {copiedField === 'account' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Nội dung chuyển khoản:</span>
                            <span className="font-mono font-bold text-brand-blue text-sm">TT {ticket.ma_tra_cuu}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(`TT ${ticket.ma_tra_cuu}`, 'memo')}
                            className="text-brand-blue hover:underline font-bold text-[11px]"
                          >
                            {copiedField === 'memo' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Số tiền:</span>
                            <span className="text-base font-black text-brand-orange">
                              {finalAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(finalAmount), 'amount')}
                            className="text-brand-blue hover:underline font-bold text-[11px]"
                          >
                            {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
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
                    to={`/track/${ticket.ma_tra_cuu}`}
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
        )}

      </div>
    </div>
  );
}
