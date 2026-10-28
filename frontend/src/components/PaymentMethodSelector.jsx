import { useEffect, useId, useState } from 'react';
import QRCode from 'qrcode';

const BANK_LIST = [
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)', bin: '970422', accNo: '02838604999', holder: 'CONG TY CP PHAT TRIEN HUNG HAU' },
  { id: 'VCB', name: 'Vietcombank (Ngoại Thương VN)', bin: '970436', accNo: '0071008899999', holder: 'CONG TY CP PHAT TRIEN HUNG HAU' },
  { id: 'BIDV', name: 'BIDV (Đầu Tư & Phát Triển VN)', bin: '970418', accNo: '3141000889999', holder: 'CONG TY CP PHAT TRIEN HUNG HAU' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương VN)', bin: '970407', accNo: '1903889999901', holder: 'CONG TY CP PHAT TRIEN HUNG HAU' }
];

const PAYMENT_METHODS = [
  {
    id: 'VIETQR',
    name: 'VietQR Ngân Hàng 24/7',
    subtitle: 'Quét QR 40+ Ngân hàng NAPAS',
    badge: 'Khuyên dùng',
    icon: '🏦',
    color: 'border-brand-blue bg-blue-50/70 text-brand-blue'
  },
  {
    id: 'EWALLET',
    name: 'Ví MoMo / ZaloPay',
    subtitle: 'Quét mã QR Ví điện tử',
    badge: 'Siêu tốc',
    icon: '📱',
    color: 'border-brand-blue bg-blue-50/70 text-brand-blue'
  },
  {
    id: 'CARD',
    name: 'Thẻ ATM / Visa / Master',
    subtitle: 'Cổng thẻ nội địa & quốc tế',
    badge: '3D-Secure',
    icon: '💳',
    color: 'border-brand-blue bg-blue-50/70 text-brand-blue'
  },
  {
    id: 'CASH',
    name: 'Tiền Mặt Tại Quầy POS',
    subtitle: 'Thanh toán trực tiếp tại 615 Âu Cơ',
    badge: 'In phiếu 80mm',
    icon: '💵',
    color: 'border-brand-blue bg-blue-50/70 text-brand-blue'
  }
];

function PaymentMethodSelector({ ticketCode = 'RP-839400', customerName = 'Khách hàng', defaultAmount = '' }) {
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
  const [customAmount, setCustomAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [walletQrUrl, setWalletQrUrl] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // State cho biểu mẫu Thẻ ATM / Visa / Mastercard
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolder: customerName || '',
    expiry: '',
    cvv: '',
    cardType: 'VISA_MASTER'
  });

  const transferContent = `CSKH ${ticketCode}`;
  const numericAmount = Number(String(customAmount).replace(/[^0-9]/g, '')) || 0;

  // Sinh mã QR cho Ví điện tử MoMo / ZaloPay
  useEffect(() => {
    const payload = walletType === 'MOMO'
      ? `2|99|02838604999|MYH GROUP CSKH|info@hunghau.vn|0|0|${numericAmount}|${transferContent}|transfer_myqr`
      : `https://zalopay.vn/qr/myh-group-cskh?code=${encodeURIComponent(ticketCode)}&amount=${numericAmount}`;

    QRCode.toDataURL(payload, {
      width: 220,
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(''), 2000);
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

  const handleConfirmDemoPayment = (methodLabel) => {
    setConfirmMessage(
      `✅ Đã ghi nhận phương thức thanh toán [${methodLabel}] cho hồ sơ #${ticketCode}${
        numericAmount > 0 ? ` với số tiền ${numericAmount.toLocaleString('vi-VN')} ₫` : ''
      }. Bộ phận CSKH sẽ đối soát và xác nhận ngay!`
    );
  };

  const handleCardFormSubmit = (e) => {
    e.preventDefault();
    handleConfirmDemoPayment(cardForm.cardType === 'NAPAS' ? 'Thẻ ATM Nội Địa NAPAS' : 'Thẻ Quốc Tế Visa/Mastercard');
  };

  const vietQrImageUrl = `https://img.vietqr.io/image/${selectedBank.id}-${selectedBank.accNo}-compact2.png?${
    numericAmount > 0 ? `amount=${numericAmount}&` : ''
  }addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(selectedBank.holder)}`;

  return (
    <div className="rounded-3xl bg-white p-6 md:p-7 shadow-sm border border-slate-200/90">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-extrabold uppercase tracking-wider mb-1">
            💳 Cổng Thanh Toán Đa Phương Thức (Multi-Payment Gateway)
          </span>
          <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <span>Phương Thức Thanh Toán Hỗ Trợ — Hồ Sơ #{ticketCode}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ quét mã VietQR NAPAS 24/7, Ví điện tử MoMo/ZaloPay, Thẻ ATM/Visa/Mastercard và Tiền mặt tại quầy.
          </p>
        </div>

        {/* Ô nhập số tiền tùy chọn (để tạo mã QR động có sẵn số tiền) */}
        <div className="w-full sm:w-60">
          <label htmlFor={amountInputId} className="block text-[11px] font-bold text-slate-600 mb-1">
            Số tiền thanh toán (VNĐ - Tùy chọn):
          </label>
          <div className="relative">
            <input
              id={amountInputId}
              name="payment-amount"
              type="text"
              inputMode="numeric"
              value={numericAmount > 0 ? numericAmount.toLocaleString('vi-VN') : ''}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Nhập số tiền để tạo QR..."
              className="w-full rounded-xl border border-slate-300 pl-3 pr-10 py-2 text-xs font-extrabold text-brand-blue focus:border-brand-blue outline-none"
            />
            <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">₫</span>
          </div>
        </div>
      </div>

      {/* Lưới 4 Thẻ Chọn Phương Thức Thanh Toán */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6" role="radiogroup" aria-label="Chọn phương thức thanh toán">
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
              className={`text-left rounded-2xl p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                active
                  ? `${method.color} shadow-md scale-[1.01]`
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-2xl">{method.icon}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  active ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {method.badge}
                </span>
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">{method.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{method.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {confirmMessage && (
        <div role="status" className="mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3">
          <span>{confirmMessage}</span>
          <button type="button" onClick={() => setConfirmMessage('')} className="text-base font-extrabold px-2">×</button>
        </div>
      )}

      {/* NỘI DUNG PHƯƠNG THỨC 1: VIETQR NGÂN HÀNG 24/7 */}
      {selectedMethod === 'VIETQR' && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Cột hiển thị mã VietQR */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="bg-white p-3.5 rounded-2xl shadow-md border border-blue-100">
                <img
                  src={vietQrImageUrl}
                  alt={`Mã VietQR ${selectedBank.name}`}
                  className="w-52 h-auto mx-auto rounded-lg object-contain"
                />
              </div>
              <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-blue bg-blue-100/80 px-3 py-1 rounded-full">
                📲 Mở App Ngân hàng bất kỳ để quét mã VietQR
              </span>
            </div>

            {/* Cột thông tin chuyển khoản & chọn ngân hàng */}
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <p className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Ngân hàng thụ hưởng (Chuẩn NAPAS 247):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BANK_LIST.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border text-left transition cursor-pointer ${
                        selectedBank.id === bank.id
                          ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      🏦 {bank.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-extrabold text-slate-800">{selectedBank.holder}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Số tài khoản ({selectedBank.id}):</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-brand-blue text-sm">{selectedBank.accNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('STK', selectedBank.accNo)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                    >
                      {copiedField === 'STK' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-brand-orange bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('ND', transferContent)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700"
                    >
                      {copiedField === 'ND' ? '✓ Đã chép' : 'Sao chép'}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmDemoPayment(`VietQR - ${selectedBank.name}`)}
                className="w-full py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                ✓ Xác Nhận Đã Quét Mã VietQR Chuyển Khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG PHƯƠNG THỨC 2: VÍ ĐIỆN TỬ MOMO / ZALOPAY */}
      {selectedMethod === 'EWALLET' && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-5">
          <div className="flex justify-center gap-3 mb-5">
            <button
              type="button"
              onClick={() => setWalletType('MOMO')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${
                walletType === 'MOMO'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <span>📱</span> Ví Điện Tử MoMo
            </button>
            <button
              type="button"
              onClick={() => setWalletType('ZALOPAY')}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center gap-2 ${
                walletType === 'ZALOPAY'
                  ? 'bg-brand-blue text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <span>💠</span> Ví Điện Tử ZaloPay
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200">
                {walletQrUrl ? (
                  <img src={walletQrUrl} alt={`Mã QR ${walletType}`} className="w-48 h-48 mx-auto rounded-lg" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Đang tạo QR...</div>
                )}
                <p className="mt-2 text-xs font-extrabold text-brand-blue">
                  {walletType === 'MOMO' ? 'QUÉT MÃ BẰNG ỨNG DỤNG MOMO' : 'QUÉT MÃ BẰNG ZALOPAY / ZALO'}
                </p>
              </div>
            </div>

            <div className="md:col-span-7 space-y-3 text-xs">
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
                <p className="font-extrabold text-sm text-slate-800">
                  Thông tin Ví {walletType === 'MOMO' ? 'MoMo Doanh Nghiệp' : 'ZaloPay Merchant'}:
                </p>
                <p className="text-slate-600">• <strong>Đơn vị tiếp nhận:</strong> TRUNG TÂM CSKH MYH GROUP</p>
                <p className="text-slate-600">• <strong>Số điện thoại Ví:</strong> <span className="font-mono font-bold text-slate-900">02838604999</span></p>
                <p className="text-slate-600">• <strong>Lời nhắn tự động:</strong> <span className="font-mono font-bold text-brand-blue">{transferContent}</span></p>
                {numericAmount > 0 && (
                  <p className="text-slate-600">• <strong>Số tiền:</strong> <span className="font-extrabold text-brand-blue">{numericAmount.toLocaleString('vi-VN')} ₫</span></p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleConfirmDemoPayment(`Ví điện tử ${walletType}`)}
                className="w-full py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                ✓ Xác Nhận Đã Thanh Toán Qua Ví {walletType}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG PHƯƠNG THỨC 3: THẺ ATM NỘI ĐỊA / VISA / MASTERCARD */}
      {selectedMethod === 'CARD' && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Thẻ mô phỏng trực quan */}
            <div className="md:col-span-5">
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-brand-blue text-white p-5 shadow-xl relative overflow-hidden h-48 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-widest uppercase text-blue-200">
                    {cardForm.cardType === 'NAPAS' ? 'NAPAS DOMESTIC ATM' : 'VISA • MASTERCARD • JCB'}
                  </span>
                  <span className="text-xl">💳</span>
                </div>
                <div className="font-mono text-lg sm:text-xl tracking-widest font-bold text-amber-300">
                  {cardForm.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex items-end justify-between text-xs">
                  <div>
                    <p className="text-[9px] uppercase text-blue-300">Chủ thẻ (Cardholder)</p>
                    <p className="font-bold tracking-wider truncate max-w-[160px] uppercase">
                      {cardForm.cardHolder || 'TEN CHU THE'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase text-blue-300">Hiệu lực</p>
                    <p className="font-mono font-bold">{cardForm.expiry || 'MM/YY'}</p>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                🔒 Bảo mật chuẩn quốc tế <strong>PCI-DSS &amp; 3D-Secure 2.0</strong>
              </p>
            </div>

            {/* Form nhập thông tin thẻ tuân thủ chuẩn Autofill Payment Form */}
            <form onSubmit={handleCardFormSubmit} className="md:col-span-7 space-y-3 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCardForm({ ...cardForm, cardType: 'VISA_MASTER' })}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                    cardForm.cardType === 'VISA_MASTER'
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  🌍 Thẻ Quốc Tế (Visa / Master / JCB)
                </button>
                <button
                  type="button"
                  onClick={() => setCardForm({ ...cardForm, cardType: 'NAPAS' })}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                    cardForm.cardType === 'NAPAS'
                      ? 'bg-brand-blue text-white border-brand-blue'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  🇻🇳 Thẻ ATM Nội Địa (NAPAS)
                </button>
              </div>

              <div>
                <label htmlFor={ccNumberId} className="block font-bold text-slate-700 mb-1">Số thẻ in trên mặt trước *</label>
                <input
                  id={ccNumberId}
                  name="cc-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  enterKeyHint="next"
                  maxLength={19}
                  pattern="[\d ]{13,19}"
                  required
                  value={cardForm.cardNumber}
                  onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardNumber(e.target.value) })}
                  placeholder="4111 2222 3333 4444"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm focus:border-indigo-600 outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <label htmlFor={ccNameId} className="block font-bold text-slate-700 mb-1">Tên chủ thẻ *</label>
                  <input
                    id={ccNameId}
                    name="cc-name"
                    type="text"
                    autoComplete="cc-name"
                    enterKeyHint="next"
                    maxLength={50}
                    pattern="[\p{L} \-\.]+"
                    required
                    value={cardForm.cardHolder}
                    onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                    placeholder="NGUYEN VAN A"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 uppercase font-semibold focus:border-indigo-600 outline-none bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <label htmlFor={ccExpId} className="font-bold text-slate-700">Ngày hết hạn *</label>
                    <span id={ccExpHintId} className="text-[10px] text-slate-500">MM/YY</span>
                  </div>
                  <input
                    id={ccExpId}
                    name="cc-exp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    enterKeyHint="next"
                    aria-describedby={ccExpHintId}
                    maxLength={5}
                    required
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono focus:border-indigo-600 outline-none bg-white"
                  />
                </div>
                <div>
                  <label htmlFor={ccCscId} className="block font-bold text-slate-700 mb-1">Mã bảo mật CSC/CVV *</label>
                  <input
                    id={ccCscId}
                    name="cc-csc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    enterKeyHint="done"
                    maxLength={4}
                    pattern="[0-9]{3,4}"
                    required
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono focus:border-indigo-600 outline-none bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                🔒 Xác Thực &amp; Thanh Toán Qua Cổng Thẻ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NỘI DUNG PHƯƠNG THỨC 4: TIỀN MẶT TẠI QUẦY POS */}
      {selectedMethod === 'CASH' && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 text-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-blue text-white flex items-center justify-center text-2xl shrink-0">
              💵
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-brand-blue">
                Thanh Toán Tiền Mặt Hoặc Quẹt Thẻ POS Trực Tiếp Tại Quầy
              </h3>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Quý khách có thể thanh toán trực tiếp tại Quầy Lễ tân &amp; CSKH <strong>Tập đoàn MYH Group (615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM)</strong> khi nhận bàn giao máy tính và nhận <strong>Phiếu in nhiệt QR 80mm</strong>.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleConfirmDemoPayment('Tiền mặt trực tiếp tại quầy POS')}
              className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition cursor-pointer"
            >
              ✓ Đăng Ký Thanh Toán Tại Quầy Khi Nhận Máy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;

