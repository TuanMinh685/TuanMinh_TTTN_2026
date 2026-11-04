import { useEffect, useId, useState } from 'react';
import QRCode from 'qrcode';

const BANK_LIST = [
  {
    id: 'BIDV',
    name: 'BIDV',
    fullName: 'TMCP Đầu Tư & Phát Triển VN',
    bin: '970418',
    accNo: '3141000889999',
    holder: 'CONG TY CP LUC GIAC',
    theme: 'border-blue-600 text-blue-700 bg-blue-50/60',
    accentColor: '#005596',
    brandTag: 'BIDV'
  },
  {
    id: 'VCB',
    name: 'Vietcombank',
    fullName: 'TMCP Ngoại Thương VN',
    bin: '970436',
    accNo: '0071008899999',
    holder: 'CONG TY CP LUC GIAC',
    theme: 'border-emerald-600 text-emerald-700 bg-emerald-50/60',
    accentColor: '#008744',
    brandTag: 'VCB'
  },
  {
    id: 'MB',
    name: 'MBBank',
    fullName: 'TMCP Quân Đội',
    bin: '970422',
    accNo: '02838604999',
    holder: 'CONG TY CP LUC GIAC',
    theme: 'border-indigo-600 text-indigo-700 bg-indigo-50/60',
    accentColor: '#1d39c4',
    brandTag: 'MB'
  },
  {
    id: 'TCB',
    name: 'Techcombank',
    fullName: 'TMCP Kỹ Thương VN',
    bin: '970407',
    accNo: '1903889999901',
    holder: 'CONG TY CP LUC GIAC',
    theme: 'border-rose-600 text-rose-700 bg-rose-50/60',
    accentColor: '#e01a22',
    brandTag: 'TCB'
  }
];

const PAYMENT_METHODS = [
  {
    id: 'VIETQR',
    name: 'VietQR Ngân Hàng',
    subtitle: 'Quét mã 40+ App Ngân Hàng',
    badge: 'Khuyên Dùng',
    badgeColor: 'bg-emerald-600 text-white',
    icon: '⚡',
    brand: 'NAPAS 247'
  },
  {
    id: 'EWALLET',
    name: 'Ví MoMo / ZaloPay',
    subtitle: 'Thanh toán tức thì qua App ví',
    badge: 'Siêu Tốc',
    badgeColor: 'bg-pink-600 text-white',
    icon: '📱',
    brand: 'MoMo • Zalo'
  },
  {
    id: 'CARD',
    name: 'Thẻ ATM / Visa / Master',
    subtitle: 'Cổng thẻ nội địa & quốc tế',
    badge: '3D-Secure',
    badgeColor: 'bg-indigo-600 text-white',
    icon: '💳',
    brand: 'PCI-DSS'
  },
  {
    id: 'CASH',
    name: 'Tiền Mặt Tại Quầy',
    subtitle: '615 Âu Cơ, Q. Tân Phú, TP.HCM',
    badge: 'In Phiếu 80mm',
    badgeColor: 'bg-slate-700 text-white',
    icon: '🏢',
    brand: 'Trực Tiếp'
  }
];

const QUICK_AMOUNTS = [150000, 350000, 500000, 1200000];

function PaymentMethodSelector({
  ticketCode = 'RP-839400',
  customerName = 'Khách hàng',
  defaultAmount = '',
  paymentStatus = '',
  ticket = null
}) {
  const baseId = useId();
  const amountInputId = `${baseId}-amount`;
  const ccNumberId = `${baseId}-cc-number`;
  const ccNameId = `${baseId}-cc-name`;
  const ccExpId = `${baseId}-cc-exp`;
  const ccExpHintId = `${baseId}-exp-hint`;
  const ccCscId = `${baseId}-cc-csc`;

  const [selectedMethod, setSelectedMethod] = useState('VIETQR');
  const [selectedBank, setSelectedBank] = useState(BANK_LIST[0]);
  const [walletType, setWalletType] = useState('MOMO'); // 'MOMO' | 'ZALOPAY'

  // Ưu tiên số tiền từ phiếu, nếu không có thì dùng defaultAmount hoặc rỗng
  const initialAmount = defaultAmount || (ticket && (ticket.tien_sau_giam || ticket.tong_tien)) || '';
  const [customAmount, setCustomAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [isEditingAmount, setIsEditingAmount] = useState(false);

  const [walletQrUrl, setWalletQrUrl] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Form thẻ
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: customerName || '',
    expiry: '',
    cvv: '',
    cardType: 'VISA_MASTER'
  });

  const transferContent = `CSKH ${ticketCode}`;
  const numericAmount = Number(String(customAmount).replace(/[^0-9]/g, '')) || 0;

  // Cập nhật số tiền nếu prop defaultAmount thay đổi
  useEffect(() => {
    if (defaultAmount && !customAmount) {
      setCustomAmount(String(defaultAmount));
    }
  }, [defaultAmount]);

  // Sinh QR cho Ví MoMo / ZaloPay
  useEffect(() => {
    const payload = walletType === 'MOMO'
      ? `2|99|02838604999|CONG TY CP LUC GIAC|contact@lucgiac.vn|0|0|${numericAmount}|${transferContent}|transfer_myqr`
      : `https://zalopay.vn/qr/luc-giac-cskh?code=${encodeURIComponent(ticketCode)}&amount=${numericAmount}`;

    QRCode.toDataURL(payload, {
      width: 260,
      margin: 1,
      color: {
        dark: walletType === 'MOMO' ? '#a50064' : '#0068ff',
        light: '#ffffff'
      }
    })
      .then(url => setWalletQrUrl(url))
      .catch(() => setWalletQrUrl(''));
  }, [walletType, numericAmount, ticketCode, transferContent]);

  const handleCopy = (label, text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(''), 2500);
    }
  };

  const formatCardNumber = (val) => {
    const digits = String(val).replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val) => {
    const digits = String(val).replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const handleSimulatePayment = (methodLabel) => {
    setIsVerifying(true);
    setConfirmMessage('');

    setTimeout(() => {
      setIsVerifying(false);
      setConfirmMessage(
        `✅ Hệ thống đã ghi nhận yêu cầu xác nhận thanh toán [${methodLabel}] cho hồ sơ #${ticketCode}${
          numericAmount > 0 ? ` với số tiền ${numericAmount.toLocaleString('vi-VN')} ₫` : ''
        }. Bộ phận kế toán & CSKH đang đối soát tức thì qua NAPAS 24/7!`
      );
    }, 1200);
  };

  const handleCardFormSubmit = (e) => {
    e.preventDefault();
    handleSimulatePayment(cardForm.cardType === 'NAPAS' ? 'Thẻ ATM Nội Địa NAPAS' : 'Thẻ Quốc Tế Visa/Mastercard');
  };

  const vietQrImageUrl = `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.accNo}-compact2.png?${
    numericAmount > 0 ? `amount=${numericAmount}&` : ''
  }addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(selectedBank.holder)}`;

  const isPaid = paymentStatus === 'DA_THANH_TOAN' || ticket?.trang_thai_thanh_toan === 'DA_THANH_TOAN';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xl transition-all">
      {/* Thanh viền gradient nhận diện thương hiệu Lục Giác */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500" />

      <div className="p-5 sm:p-7 md:p-8">
        {/* HEADER: Tiêu đề + Trạng thái cổng thanh toán */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-black tracking-wide uppercase border border-blue-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                CỔNG THANH TOÁN TRỰC TUYẾN 24/7
              </span>
              <span className="text-xs text-slate-400 font-bold">•</span>
              <span className="text-xs font-bold text-slate-500">Chuẩn NAPAS 24/7</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Thanh Toán Dịch Vụ — Hồ Sơ #{ticketCode}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Khách hàng: <strong className="text-slate-700">{customerName}</strong> • Hỗ trợ quét mã VietQR tự động điền STK, Ví điện tử, Thẻ & Tiền mặt tại quầy.
            </p>
          </div>

          {/* KHỐI SỐ TIỀN THANH TOÁN NỔI BẬT (FINTECH AMOUNT BADGE) */}
          <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100/70 border border-slate-200 rounded-2xl p-4 sm:min-w-[280px] shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {isPaid ? 'Trạng thái thanh toán' : 'Số tiền thanh toán'}
              </span>
              {!isPaid && (
                <button
                  type="button"
                  onClick={() => setIsEditingAmount(!isEditingAmount)}
                  className="text-[11px] font-bold text-brand-blue hover:underline cursor-pointer"
                >
                  {isEditingAmount ? '✓ Xong' : '✏️ Thay đổi'}
                </button>
              )}
            </div>

            {isPaid ? (
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                <span>ĐÃ THANH TOÁN ĐỦ</span>
              </div>
            ) : isEditingAmount ? (
              <div className="space-y-2 mt-1">
                <div className="relative">
                  <input
                    id={amountInputId}
                    name="payment-amount"
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={numericAmount > 0 ? numericAmount.toLocaleString('vi-VN') : ''}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Nhập số tiền..."
                    className="w-full rounded-xl border border-brand-blue bg-white px-3 py-1.5 text-sm font-black text-brand-blue outline-none ring-2 ring-blue-100"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₫</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setCustomAmount(String(amt));
                        setIsEditingAmount(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-brand-blue text-[10px] font-bold text-slate-700 transition"
                    >
                      {amt.toLocaleString('vi-VN')}₫
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-brand-blue tracking-tight">
                  {numericAmount > 0 ? numericAmount.toLocaleString('vi-VN') : 'Tự do'}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  {numericAmount > 0 ? 'VNĐ' : '(Nhập khi quét)'}
                </span>
              </div>
            )}

            {!isPaid && numericAmount > 0 && ticket?.giam_gia_sinh_vien > 0 && (
              <p className="text-[10px] font-bold text-emerald-600 mt-1">
                ✓ Đã áp dụng ưu đãi HSSV (-15%)
              </p>
            )}
          </div>
        </div>

        {/* THÔNG BÁO XÁC NHẬN / PHẢN HỒI GIAO DỊCH */}
        {confirmMessage && (
          <div role="status" className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-xs font-bold text-emerald-800 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <span className="text-base">🎉</span>
              <p className="leading-relaxed">{confirmMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmMessage('')}
              className="text-base font-extrabold text-slate-400 hover:text-slate-700 px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* 4 TAB PHƯƠNG THỨC THANH TOÁN THIẾT KẾ HIỆN ĐẠI (TABS) */}
        <div className="mt-6">
          <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
            Chọn Phương Thức Thanh Toán Hỗ Trợ:
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="radiogroup" aria-label="Chọn phương thức thanh toán">
            {PAYMENT_METHODS.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setConfirmMessage('');
                  }}
                  className={`group relative text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 ${
                    active
                      ? 'border-brand-blue bg-blue-50/50 shadow-md ring-2 ring-brand-blue/20 -translate-y-0.5'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{method.icon}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className={`font-black text-sm transition-colors ${active ? 'text-brand-blue' : 'text-slate-800'}`}>
                      {method.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{method.subtitle}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{method.brand}</span>
                    <span className={active ? 'text-brand-blue font-black' : 'text-slate-400'}>
                      {active ? '● Đang chọn' : 'Chọn →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PHƯƠNG THỨC 1: VIETQR NGÂN HÀNG (TRỌNG TÂM GIAO DIỆN) */}
        {/* ========================================================================= */}
        {selectedMethod === 'VIETQR' && (
          <div className="mt-6 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
              
              {/* CỘT TRÁI: KHUNG MÃ VIETQR CHUẨN THIẾT KẾ APP FINTECH */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-[280px] bg-white rounded-3xl p-4 shadow-xl border border-slate-200 text-center">
                  
                  {/* Top Bar của Thẻ QR */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-brand-blue tracking-tight">VietQR</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">NAPAS 247</span>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {selectedBank.name}
                    </span>
                  </div>

                  {/* Ảnh VietQR thực tế */}
                  <div className="relative mx-auto rounded-2xl overflow-hidden p-2 bg-white border border-slate-100 group">
                    <img
                      src={vietQrImageUrl}
                      alt={`Mã VietQR ${selectedBank.name}`}
                      className="w-full h-auto mx-auto object-contain rounded-xl"
                    />
                  </div>

                  {/* Trạng thái quét & Hướng dẫn */}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 py-1.5 rounded-xl border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Quét mã bằng bất kỳ App Ngân Hàng</span>
                  </div>

                  {/* Nút tiện ích: Tải mã QR */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={vietQrImageUrl}
                      download={`VietQR_${ticketCode}_${selectedBank.id}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black transition flex items-center justify-center gap-1"
                    >
                      <span>📥</span> Tải ảnh QR
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy('QR_LINK', vietQrImageUrl)}
                      className="py-2 px-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-brand-blue text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🔗</span> {copiedField === 'QR_LINK' ? '✓ Đã chép' : 'Sao chép link'}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium text-center mt-3">
                  Mã QR tương thích với hơn 40+ ứng dụng ngân hàng và ví điện tử tại Việt Nam.
                </p>
              </div>

              {/* CỘT PHẢI: BỘ CHỌN NGÂN HÀNG & THÔNG TIN CHUYỂN KHOẢN 1-CLICK COPY */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. Chọn Ngân Hàng Thụ Hưởng */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    1. Chọn Ngân Hàng Thụ Hưởng (Chuẩn NAPAS 24/7):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANK_LIST.map((bank) => {
                      const isBankActive = selectedBank.id === bank.id;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`py-2 px-2.5 rounded-xl font-black text-xs border text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            isBankActive
                              ? 'bg-brand-blue text-white border-brand-blue shadow-md scale-[1.02]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-sm font-black">{bank.name}</span>
                          <span className={`text-[9px] font-medium ${isBankActive ? 'text-blue-100' : 'text-slate-400'}`}>
                            {bank.brandTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Bảng Thông Tin Chi Tiết Chuyển Khoản */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    2. Thông Tin Chuyển Khoản Chi Tiết:
                  </label>

                  <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                    
                    {/* Chủ tài khoản */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-bold">Chủ tài khoản thụ hưởng:</span>
                      <span className="font-black text-xs sm:text-sm text-slate-900 tracking-wide uppercase">
                        {selectedBank.holder}
                      </span>
                    </div>

                    {/* Số tài khoản */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block">
                          Số tài khoản ({selectedBank.name}):
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Chi nhánh TP. Hồ Chí Minh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base sm:text-lg text-brand-blue tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                          {selectedBank.accNo}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('STK', selectedBank.accNo)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            copiedField === 'STK'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {copiedField === 'STK' ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>

                    {/* Số tiền */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <span className="text-xs text-slate-500 font-bold">Số tiền thanh toán:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          {numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Khách tự nhập số tiền'}
                        </span>
                        {numericAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleCopy('TIEN', String(numericAmount))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                              copiedField === 'TIEN'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {copiedField === 'TIEN' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nội dung chuyển khoản */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500 font-bold block">
                          Nội dung chuyển khoản (Bắt buộc):
                        </span>
                        <span className="text-[10px] text-amber-700 font-bold">
                          ⚠️ Giữ nguyên cú pháp để hệ thống tự động gạch nợ
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-brand-orange bg-amber-50 px-3 py-1 rounded-lg border border-amber-300 tracking-wider">
                          {transferContent}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('ND', transferContent)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            copiedField === 'ND'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {copiedField === 'ND' ? '✓ Đã chép' : 'Sao chép'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Nút Xác Nhận Thanh Toán */}
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleSimulatePayment(`VietQR - ${selectedBank.name}`)}
                  className="w-full py-3.5 rounded-2xl bg-brand-blue hover:bg-blue-700 active:scale-[0.99] text-white font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 uppercase tracking-wide"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang kiểm tra giao dịch NAPAS 24/7...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Tôi Đã Quét Mã VietQR Chuyển Khoản Thành Công</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHƯƠNG THỨC 2: VÍ ĐIỆN TỬ MOMO & ZALOPAY */}
        {/* ========================================================================= */}
        {selectedMethod === 'EWALLET' && (
          <div className="mt-6 rounded-3xl border border-pink-200 bg-gradient-to-br from-pink-50/40 via-white to-slate-50 p-5 sm:p-7 shadow-xs">
            {/* Chuyển đổi giữa MoMo và ZaloPay */}
            <div className="flex justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => setWalletType('MOMO')}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-2 ${
                  walletType === 'MOMO'
                    ? 'bg-[#a50064] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>📱</span> Ví Điện Tử MoMo
              </button>
              <button
                type="button"
                onClick={() => setWalletType('ZALOPAY')}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-2 ${
                  walletType === 'ZALOPAY'
                    ? 'bg-[#0068ff] text-white shadow-md scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>💠</span> Ví Điện Tử ZaloPay
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
              {/* QR Ví Điện Tử */}
              <div className="lg:col-span-5 flex flex-col items-center text-center">
                <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-200 max-w-[260px] w-full">
                  <div className={`py-1 px-3 rounded-full text-xs font-black text-white mb-3 ${walletType === 'MOMO' ? 'bg-[#a50064]' : 'bg-[#0068ff]'}`}>
                    {walletType === 'MOMO' ? 'MoMo Merchant' : 'ZaloPay Merchant'}
                  </div>

                  {walletQrUrl ? (
                    <img src={walletQrUrl} alt={`Mã QR ${walletType}`} className="w-48 h-48 mx-auto rounded-xl" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Đang khởi tạo QR...</div>
                  )}

                  <p className="mt-3 text-xs font-black text-slate-800">
                    {walletType === 'MOMO' ? 'Mở App MoMo Quét Mã Nhanh' : 'Mở App Zalo / ZaloPay Quét Mã'}
                  </p>
                </div>
              </div>

              {/* Thông tin Ví */}
              <div className="lg:col-span-7 space-y-4 text-xs">
                <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-xs">
                  <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">
                    Thông Tin Tài Khoản {walletType === 'MOMO' ? 'MoMo Doanh Nghiệp' : 'ZaloPay Doanh Nghiệp'}:
                  </h4>
                  <div className="space-y-2">
                    <p className="text-slate-600 flex justify-between">
                      <span className="font-bold">Đơn vị nhận:</span>
                      <strong className="text-slate-900 uppercase">CÔNG TY CỔ PHẦN LỤC GIÁC</strong>
                    </p>
                    <p className="text-slate-600 flex justify-between items-center">
                      <span className="font-bold">Hotline / Ví tiếp nhận:</span>
                      <span className="font-mono font-black text-sm text-slate-900">028 3860 4999</span>
                    </p>
                    <p className="text-slate-600 flex justify-between items-center">
                      <span className="font-bold">Nội dung chuyển:</span>
                      <span className="font-mono font-black text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {transferContent}
                      </span>
                    </p>
                    {numericAmount > 0 && (
                      <p className="text-slate-600 flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="font-bold">Số tiền:</span>
                        <strong className="text-base text-brand-blue font-black">{numericAmount.toLocaleString('vi-VN')} ₫</strong>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(`Ví điện tử ${walletType}`)}
                  className={`w-full py-3.5 rounded-2xl text-white font-black text-xs shadow-md transition-all cursor-pointer uppercase tracking-wider ${
                    walletType === 'MOMO' ? 'bg-[#a50064] hover:bg-[#880052]' : 'bg-[#0068ff] hover:bg-[#0055d4]'
                  }`}
                >
                  ✓ Xác Nhận Đã Thanh Toán Qua Ví {walletType}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHƯƠNG THỨC 3: THẺ QUỐC TẾ VISA/MASTER & ATM NỘI ĐỊA */}
        {/* ========================================================================= */}
        {selectedMethod === 'CARD' && (
          <div className="mt-6 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
              
              {/* MÔ PHỎNG THẺ TÍN DỤNG/ATM ĐỒ HỌA SẮC NÉT */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-900 text-white p-6 shadow-2xl relative overflow-hidden h-52 flex flex-col justify-between border border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest uppercase text-indigo-300">
                      {cardForm.cardType === 'NAPAS' ? 'NAPAS DOMESTIC CARD' : 'INTERNATIONAL CARD'}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-white/20 text-white font-mono">
                      {cardForm.cardType === 'NAPAS' ? 'NAPAS' : 'VISA / MASTER'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 my-1">
                    <div className="w-10 h-7 rounded bg-amber-400/80 border border-amber-200 flex items-center justify-center text-[10px] font-bold text-slate-800">
                      CHIP
                    </div>
                    <span className="text-lg">📶</span>
                  </div>

                  <div className="font-mono text-lg sm:text-xl tracking-widest font-black text-amber-200">
                    {cardForm.cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex items-end justify-between text-xs">
                    <div>
                      <p className="text-[9px] uppercase text-indigo-300 font-bold">Chủ thẻ</p>
                      <p className="font-black tracking-wider truncate max-w-[170px] uppercase text-white">
                        {cardForm.cardHolder || customerName || 'TEN CHU THE'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase text-indigo-300 font-bold">Hết hạn</p>
                      <p className="font-mono font-bold text-white">{cardForm.expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span>🔒 Chuẩn bảo mật quốc tế: <strong>PCI-DSS Level 1 &amp; 3D-Secure 2.0</strong></span>
                </div>
              </div>

              {/* FORM NHẬP THÔNG TIN THẺ */}
              <form onSubmit={handleCardFormSubmit} className="lg:col-span-7 space-y-3.5 text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCardForm({ ...cardForm, cardType: 'VISA_MASTER' })}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                      cardForm.cardType === 'VISA_MASTER'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    🌍 Thẻ Quốc Tế (Visa / Master)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardForm({ ...cardForm, cardType: 'NAPAS' })}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold border transition cursor-pointer ${
                      cardForm.cardType === 'NAPAS'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    🇻🇳 Thẻ ATM Nội Địa (NAPAS)
                  </button>
                </div>

                <div>
                  <label htmlFor={ccNumberId} className="block font-black text-slate-700 mb-1">
                    Số thẻ in trên mặt trước *
                  </label>
                  <input
                    id={ccNumberId}
                    name="cc-number"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    required
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                    placeholder="4111 2222 3333 4444"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm font-bold focus:border-indigo-600 outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label htmlFor={ccNameId} className="block font-black text-slate-700 mb-1">Tên in trên thẻ *</label>
                    <input
                      id={ccNameId}
                      name="cc-name"
                      type="text"
                      autoComplete="cc-name"
                      maxLength={50}
                      required
                      value={cardForm.cardHolder}
                      onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                      placeholder="NGUYEN VAN A"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 uppercase font-bold focus:border-indigo-600 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <label htmlFor={ccExpId} className="font-black text-slate-700">Hết hạn *</label>
                      <span id={ccExpHintId} className="text-[10px] text-slate-400">MM/YY</span>
                    </div>
                    <input
                      id={ccExpId}
                      name="cc-exp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      aria-describedby={ccExpHintId}
                      maxLength={5}
                      required
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold focus:border-indigo-600 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor={ccCscId} className="block font-black text-slate-700 mb-1">CVV / CVC *</label>
                    <input
                      id={ccCscId}
                      name="cc-csc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      maxLength={4}
                      required
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="123"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold focus:border-indigo-600 outline-none bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-black text-xs shadow-md transition cursor-pointer uppercase tracking-wider"
                >
                  🔒 Xác Thực 3D-Secure &amp; Thanh Toán Ngay
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHƯƠNG THỨC 4: TIỀN MẶT / QUẸT THẺ TẠI QUẦY 615 ÂU CƠ */}
        {/* ========================================================================= */}
        {selectedMethod === 'CASH' && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-5 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-blue text-white flex items-center justify-center text-3xl shrink-0 shadow-md">
                🏢
              </div>
              <div className="space-y-2 flex-1 text-xs">
                <h3 className="text-base font-black text-slate-900">
                  Thanh Toán Tiền Mặt Hoặc Quẹt Thẻ POS Trực Tiếp Tại Quầy Tiếp Tân
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Quý khách có thể lựa chọn thanh toán trực tiếp tại Bộ phận Tiếp tân &amp; CSKH{' '}
                  <strong className="text-slate-900">Công ty Cổ phần Lục Giác</strong> khi đến kiểm tra hoặc nhận bàn giao thiết bị.
                </p>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2 font-medium">
                  <p className="flex items-center gap-2 text-slate-700">
                    <span>📍</span>
                    <span><strong>Địa chỉ trung tâm:</strong> 615 Âu Cơ, Phường Phú Trung, Quận Tân Phú, TP. Hồ Chí Minh</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700">
                    <span>⏰</span>
                    <span><strong>Giờ làm việc CSKH:</strong> Thứ Hai – Thứ Bảy: 08:00 – 18:00 (Nghỉ Chủ Nhật &amp; Ngày Lễ)</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700">
                    <span>🖨️</span>
                    <span><strong>Chứng từ bàn giao:</strong> Quý khách sẽ được nhận <strong>Biên nhận nhiệt khổ 80mm</strong> kèm mã QR bảo hành điện tử e-Warranty 180 ngày.</span>
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSimulatePayment('Tiền mặt tại quầy 615 Âu Cơ')}
                    className="py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs shadow-md transition cursor-pointer uppercase tracking-wider"
                  >
                    ✓ Đăng Ký Thanh Toán Tại Quầy Khi Nhận Máy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PaymentMethodSelector;
