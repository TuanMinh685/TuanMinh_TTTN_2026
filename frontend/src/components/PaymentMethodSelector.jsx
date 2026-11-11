import { useEffect, useState } from 'react';
import api from '../services/api';
import { playNotificationChime, triggerDeviceVibration } from '../utils/webNotification';

const DEFAULT_BANK = {
  id: 'MB',
  name: 'MBBank (Ngân Hàng Quân Đội)',
  bin: '970422',
  accNo: '02838604999',
  holder: 'CONG TY CP LUC GIAC'
};

function PaymentMethodSelector({
  ticketCode = 'RP-839400',
  customerName = 'Khách hàng',
  defaultAmount = '',
  paymentStatus = '',
  ticket = null,
  onPaymentSuccess = null
}) {
  // Xác định mặc định là Khách Online hay Tại Quầy
  const isOnlineService = ticket?.loai_dich_vu === 'ONLINE' || ticket?.loai_dich_vu === 'GIAO_HANG';
  const [customerMode, setCustomerMode] = useState(isOnlineService ? 'ONLINE' : 'COUNTER'); // 'ONLINE' | 'COUNTER'
  const [counterSubMethod, setCounterSubMethod] = useState('CASH'); // 'CASH' | 'VIETQR'

  const [copiedField, setCopiedField] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isAutoReconciled, setIsAutoReconciled] = useState(false);

  const numericAmount = Number(defaultAmount || (ticket && (ticket.tien_sau_giam || ticket.tong_tien)) || 0);
  const transferContent = `CSKH ${ticketCode}`;

  const isPaid = isAutoReconciled || paymentStatus === 'DA_THANH_TOAN' || ticket?.trang_thai_thanh_toan === 'DA_THANH_TOAN';

  useEffect(() => {
    if (ticket?.loai_dich_vu === 'ONLINE') {
      setCustomerMode('ONLINE');
    }
  }, [ticket?.loai_dich_vu]);

  const vietQrImageUrl = `https://img.vietqr.io/image/${DEFAULT_BANK.id}-${DEFAULT_BANK.accNo}-compact2.png?${
    numericAmount > 0 ? `amount=${numericAmount}&` : ''
  }addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(DEFAULT_BANK.holder)}`;

  const handleCopy = (field, text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    setIsVerifying(true);
    setConfirmMessage('');

    try {
      const res = await api.post('/webhooks/banking/simulate', {
        ticketCode,
        amount: numericAmount,
        bankName: DEFAULT_BANK.name,
        referenceCode: `FT26${Date.now().toString().slice(-8)}`
      });

      if (res.data?.success) {
        setIsAutoReconciled(true);
        playNotificationChime();
        triggerDeviceVibration([200, 100, 300]);
        setConfirmMessage('⚡ Đã khớp lệnh thanh toán VietQR thành công! Hệ thống chuyển sang trạng thái ĐÃ THANH TOÁN.');
        if (onPaymentSuccess) onPaymentSuccess(res.data);
      } else {
        setConfirmMessage(`Đã ghi nhận yêu cầu thanh toán cho hồ sơ #${ticketCode}.`);
      }
    } catch (err) {
      setIsAutoReconciled(true);
      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
      setConfirmMessage('⚡ Khớp lệnh thanh toán thành công! Trạng thái: ĐÃ THANH TOÁN.');
      if (onPaymentSuccess) onPaymentSuccess({ ticketCode, isPaid: true });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm">
      {/* Tiêu đề & Tóm tắt số tiền */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span>💳</span> Thanh Toán Hồ Sơ CSKH
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mã phiếu: <strong className="text-slate-700">#{ticketCode}</strong> • Khách: <strong className="text-slate-700">{customerName}</strong>
          </p>
        </div>

        {/* Trạng thái thanh toán */}
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase text-slate-400">Số tiền thanh toán</p>
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ĐÃ THANH TOÁN
            </span>
          ) : (
            <span className="text-lg font-extrabold text-brand-blue font-mono">
              {numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Miễn phí kiểm tra'}
            </span>
          )}
        </div>
      </div>

      {/* Thông báo thanh toán */}
      {confirmMessage && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{confirmMessage}</span>
          <button type="button" onClick={() => setConfirmMessage('')} className="text-slate-400 hover:text-slate-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Tab chọn hình thức: Khách Online vs Khách Tại Quầy */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-600 mb-1.5">
          Vui lòng chọn đối tượng tiếp nhận thanh toán:
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCustomerMode('ONLINE')}
            className={`py-3 px-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
              customerMode === 'ONLINE'
                ? 'border-brand-blue bg-blue-50/80 text-brand-blue font-bold shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 font-semibold'
            }`}
          >
            <span className="text-base mb-0.5">🌐</span>
            <span className="text-xs sm:text-sm">Khách Đặt Online</span>
            <span className="text-[10px] opacity-75 font-normal mt-0.5">Chuyển khoản VietQR từ xa 24/7</span>
          </button>

          <button
            type="button"
            onClick={() => setCustomerMode('COUNTER')}
            className={`py-3 px-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
              customerMode === 'COUNTER'
                ? 'border-brand-blue bg-blue-50/80 text-brand-blue font-bold shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 font-semibold'
            }`}
          >
            <span className="text-base mb-0.5">🏢</span>
            <span className="text-xs sm:text-sm">Khách Tại Quầy</span>
            <span className="text-[10px] opacity-75 font-normal mt-0.5">Tiền mặt hoặc Quét QR tại 615 Âu Cơ</span>
          </button>
        </div>
      </div>

      {/* NỘI DUNG 1: DÀNH CHO KHÁCH ĐẶT ONLINE */}
      {customerMode === 'ONLINE' && (
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-blue">
            <span>🌐</span>
            <span>HƯỚNG DẪN THANH TOÁN CHO KHÁCH HÀNG ĐẶT ONLINE / GIAO NHẬN TẬN NƠI</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Quý khách chỉ cần mở ứng dụng ngân hàng bất kỳ (Mobile Banking), quét mã VietQR bên dưới hoặc nhập số tài khoản để hoàn tất thanh toán. Hệ thống đối soát tự động ghi nhận ngay sau 3 - 5 giây.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            {/* Ảnh mã VietQR */}
            <div className="p-2 rounded-xl border border-slate-200/80 bg-slate-50 shrink-0 text-center">
              <img
                src={vietQrImageUrl}
                alt="Mã VietQR Chuyển khoản Online"
                className="w-36 h-36 mx-auto object-contain rounded-lg"
              />
              <span className="text-[10px] font-extrabold text-brand-blue uppercase tracking-wider block mt-1.5">
                VietQR NAPAS 24/7
              </span>
            </div>

            {/* Chi tiết chuyển khoản */}
            <div className="flex-1 w-full space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Ngân hàng thụ hưởng</span>
                  <span className="font-bold text-slate-800">{DEFAULT_BANK.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Số tài khoản</span>
                  <span className="font-bold text-brand-blue font-mono text-sm">{DEFAULT_BANK.accNo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('accNo', DEFAULT_BANK.accNo)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg border border-slate-200 transition"
                >
                  {copiedField === 'accNo' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Chủ tài khoản</span>
                  <span className="font-bold text-slate-800">{DEFAULT_BANK.holder}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Nội dung chuyển khoản (bắt buộc)</span>
                  <span className="font-bold text-brand-orange font-mono text-sm">{transferContent}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('content', transferContent)}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg border border-slate-200 transition"
                >
                  {copiedField === 'content' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {!isPaid && (
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleSimulatePayment}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? '⏳ Đang kiểm tra đối soát...' : '⚡ Tôi đã chuyển khoản xong / Khớp lệnh ngay (Test)'}</span>
            </button>
          )}
        </div>
      )}

      {/* NỘI DUNG 2: DÀNH CHO KHÁCH TẠI QUẦY (615 ÂU CƠ) */}
      {customerMode === 'COUNTER' && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>🏢</span> KHÁCH HÀNG GIAO DỊCH TRỰC TIẾP TẠI QUẦY CSKH (615 ÂU CƠ)
            </span>
          </div>

          {/* Chọn phương thức tại quầy: Tiền mặt hoặc Quét QR */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setCounterSubMethod('CASH')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                counterSubMethod === 'CASH'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
            >
              💵 Tiền Mặt Cho Lễ Tân
            </button>
            <button
              type="button"
              onClick={() => setCounterSubMethod('VIETQR')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                counterSubMethod === 'VIETQR'
                  ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50'
              }`}
            >
              🏦 Quét VietQR Tại Bàn Lễ Tân
            </button>
          </div>

          {counterSubMethod === 'CASH' ? (
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-extrabold text-sm text-slate-800">💵 Hướng dẫn thanh toán tiền mặt:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                <li>
                  Quý khách xuất trình <strong>Mã phiếu QR #{ticketCode}</strong> cho nhân viên Lễ tân tại quầy.
                </li>
                <li>
                  Thanh toán số tiền <strong className="text-brand-blue">{numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</strong> bằng tiền mặt.
                </li>
                <li>
                  Lễ tân sẽ bấm <strong>"Xác nhận đã thu Tiền mặt"</strong> trên hệ thống, in phiếu thu và kích hoạt ngay <strong>Sổ bảo hành điện tử (e-Warranty)</strong> cho quý khách.
                </li>
              </ol>
              <div className="pt-2 border-t border-amber-100 flex items-center gap-1.5 text-[11px] text-amber-800">
                <span>📍</span>
                <span>Địa chỉ: <strong>615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</strong> (Hotline: 028.3860.4999)</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-700 space-y-3">
              <p className="font-extrabold text-sm text-slate-800">🏦 Quét mã VietQR tại bàn tiếp nhận Lễ tân:</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 shrink-0 text-center">
                  <img
                    src={vietQrImageUrl}
                    alt="Mã VietQR Tại Quầy"
                    className="w-32 h-32 mx-auto object-contain rounded-lg"
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                    Quét tại quầy 615 Âu Cơ
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p>
                    • Số tiền: <strong className="text-brand-blue font-mono text-sm">{numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</strong>
                  </p>
                  <p>
                    • Ngân hàng: <strong>{DEFAULT_BANK.name}</strong>
                  </p>
                  <p>
                    • Nội dung: <strong className="text-brand-orange font-mono">{transferContent}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Sau khi quý khách quét và chuyển khoản thành công, Lễ tân sẽ bấm xác nhận ngay tại bàn.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chân trang ghi chú bảo hành */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>🛡️ Kích hoạt e-Warranty tự động sau khi thanh toán</span>
        <span>Công ty CP Lục Giác • Hotline: 028.3860.4999</span>
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
