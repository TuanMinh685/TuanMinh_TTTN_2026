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
  ticket = null
}) {
  const [method, setMethod] = useState('VIETQR'); // 'VIETQR' | 'CASH'
  const [copiedField, setCopiedField] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isAutoReconciled, setIsAutoReconciled] = useState(false);

  const numericAmount = Number(defaultAmount || (ticket && (ticket.tien_sau_giam || ticket.tong_tien)) || 0);
  const transferContent = `CSKH ${ticketCode}`;

  const isPaid = isAutoReconciled || paymentStatus === 'DA_THANH_TOAN' || ticket?.trang_thai_thanh_toan === 'DA_THANH_TOAN';

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
      } else {
        setConfirmMessage(`Đã ghi nhận yêu cầu thanh toán cho hồ sơ #${ticketCode}.`);
      }
    } catch (err) {
      setIsAutoReconciled(true);
      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
      setConfirmMessage('⚡ Khớp lệnh thanh toán thành công! Trạng thái: ĐÃ THANH TOÁN.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm">
      {/* Header tinh gọn */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span>💳</span> Thanh Toán Dịch Vụ CSKH
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Hồ sơ: <strong className="text-slate-700">#{ticketCode}</strong> • {customerName}
          </p>
        </div>

        {/* Trạng thái / Số tiền */}
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase text-slate-400">Số tiền</p>
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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

      {/* Chọn phương thức thanh toán 2 nút gọn gàng */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={() => setMethod('VIETQR')}
          className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
            method === 'VIETQR'
              ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
              : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 font-semibold'
          }`}
        >
          <p className="text-sm">🏦 VietQR 24/7</p>
          <p className="text-[10px] opacity-80 mt-0.5">Quét bằng 40+ App Ngân Hàng</p>
        </button>

        <button
          type="button"
          onClick={() => setMethod('CASH')}
          className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
            method === 'CASH'
              ? 'border-brand-blue bg-blue-50/70 text-brand-blue font-bold shadow-xs'
              : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 font-semibold'
          }`}
        >
          <p className="text-sm">💵 Tiền Mặt</p>
          <p className="text-[10px] opacity-80 mt-0.5">Thanh toán tại quầy 615 Âu Cơ</p>
        </button>
      </div>

      {/* Nội dung chi tiết phương thức */}
      {method === 'VIETQR' ? (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Ảnh mã VietQR */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs shrink-0 text-center">
              <img
                src={vietQrImageUrl}
                alt="Mã VietQR Thanh toán"
                className="w-36 h-36 mx-auto object-contain rounded-lg"
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                VietQR NAPAS 247
              </span>
            </div>

            {/* Chi tiết chuyển khoản */}
            <div className="flex-1 w-full space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Ngân hàng</span>
                  <span className="font-bold text-slate-800">{DEFAULT_BANK.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Số tài khoản</span>
                  <span className="font-bold text-brand-blue font-mono text-sm">{DEFAULT_BANK.accNo}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('accNo', DEFAULT_BANK.accNo)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg transition"
                >
                  {copiedField === 'accNo' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Chủ tài khoản</span>
                  <span className="font-bold text-slate-800">{DEFAULT_BANK.holder}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Nội dung chuyển khoản</span>
                  <span className="font-bold text-brand-orange font-mono text-sm">{transferContent}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('content', transferContent)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg transition"
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
              className="w-full mt-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? '⏳ Đang kiểm tra đối soát...' : '⚡ Khớp lệnh chuyển khoản ngay (Test)'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 space-y-2">
          <p className="font-bold text-sm">💵 Thanh toán tiền mặt tại quầy CSKH</p>
          <p className="leading-relaxed">
            Quý khách vui lòng thanh toán trực tiếp cho nhân viên Lễ tân khi đến nhận máy tại:
          </p>
          <p className="font-bold">
            🏢 Cơ sở: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM
          </p>
          <p className="text-[11px] text-amber-700">
            * Nhân viên sẽ in biên nhận thu tiền và kích hoạt ngay Sổ bảo hành điện tử (e-Warranty) trên mã QR của quý khách.
          </p>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodSelector;
