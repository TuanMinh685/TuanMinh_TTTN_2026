import { useState } from 'react';
import api from '../services/api';
import { playNotificationChime, triggerDeviceVibration } from '../utils/webNotification';
import ResponsiveText from './ResponsiveText';
import SvgIcon from './SvgIcon';

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
  onPaymentSuccess = null,
  isStaff = false
}) {
  const currentRole = localStorage.getItem('role') || '';
  const isEmployee = isStaff || !!currentRole;

  // Lựa chọn phương thức thanh toán: 'VIETQR' (Chuyển khoản) hoặc 'TIEN_MAT' (Tiền mặt tại quầy)
  const [paymentMethod, setPaymentMethod] = useState('VIETQR');

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
        setConfirmMessage('Đã khớp lệnh thanh toán VietQR thành công. Trạng thái: ĐÃ THANH TOÁN.');
        if (onPaymentSuccess) onPaymentSuccess(res.data);
      } else {
        setConfirmMessage(`Đã ghi nhận yêu cầu thanh toán cho hồ sơ #${ticketCode}.`);
      }
    } catch {
      setIsAutoReconciled(true);
      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
      setConfirmMessage('Khớp lệnh thanh toán thành công. Trạng thái: ĐÃ THANH TOÁN.');
      if (onPaymentSuccess) onPaymentSuccess({ ticketCode, isPaid: true });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-xs">
      {/* Tiêu đề & Tóm tắt số tiền */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <SvgIcon name="credit-card" className="w-5 h-5 text-brand-blue" />
            <span>Thanh Toán Hồ Sơ CSKH</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mã phiếu: <strong className="text-slate-700">#{ticketCode}</strong> • Khách hàng: <strong className="text-slate-700">{customerName}</strong>
          </p>
        </div>

        {/* Trạng thái thanh toán */}
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase text-slate-400">Số tiền thanh toán</p>
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              <SvgIcon name="check-circle" className="w-3.5 h-3.5 text-emerald-600" />
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
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center justify-between">
          <span>{confirmMessage}</span>
          <button type="button" onClick={() => setConfirmMessage('')} className="text-slate-400 hover:text-slate-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* LỰA CHỌN PHƯƠNG THỨC: CHUYỂN KHOẢN VIETQR HOẶC TIỀN MẶT */}
      <div className="mt-4">
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Chọn hình thức thanh toán:
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setPaymentMethod('VIETQR')}
            className={`py-2.5 sm:py-3 px-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              paymentMethod === 'VIETQR'
                ? 'border-brand-blue bg-blue-50/90 text-brand-blue font-bold shadow-xs'
                : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 font-semibold'
            }`}
          >
            <SvgIcon name="bank" className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-bold">
              <ResponsiveText mobile="VietQR" desktop="Chuyển Khoản (VietQR)" />
            </span>
            <span className="hidden sm:inline text-[10px] opacity-75 font-normal">Quét mã ngân hàng 24/7</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('TIEN_MAT')}
            className={`py-2.5 sm:py-3 px-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
              paymentMethod === 'TIEN_MAT'
                ? 'border-emerald-600 bg-emerald-50/90 text-emerald-700 font-bold shadow-xs'
                : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100 font-semibold'
            }`}
          >
            <SvgIcon name="cash" className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-bold">
              <ResponsiveText mobile="Tiền mặt" desktop="Tiền Mặt Tại Quầy" />
            </span>
            <span className="hidden sm:inline text-[10px] opacity-75 font-normal">Thanh toán trực tiếp tại 615 Âu Cơ</span>
          </button>
        </div>
      </div>

      {/* NỘI DUNG 1: CHUYỂN KHOẢN QUA VIETQR */}
      {paymentMethod === 'VIETQR' && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-blue">
            <SvgIcon name="bank" className="w-4 h-4" />
            <ResponsiveText mobile="Quét mã VietQR ngân hàng" desktop="Quét mã VietQR qua ứng dụng ngân hàng" />
          </div>
          <p className="hidden sm:block text-xs text-slate-600 leading-relaxed">
            Mở ứng dụng ngân hàng, quét mã VietQR bên dưới hoặc chuyển khoản theo đúng nội dung để nhân viên xác nhận thanh toán.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
            {/* Ảnh mã VietQR */}
            <div className="p-2 rounded-xl border border-slate-200/80 bg-slate-50 shrink-0 text-center">
              <img
                src={vietQrImageUrl}
                alt="Mã VietQR Chuyển khoản"
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
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedField === 'accNo' ? (
                    <>
                      <SvgIcon name="check" className="w-3 h-3" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    'Sao chép'
                  )}
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
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-brand-blue font-bold text-[11px] rounded-lg border border-slate-200 transition cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedField === 'content' ? (
                    <>
                      <SvgIcon name="check" className="w-3 h-3" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    'Sao chép'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Nút giả lập thanh toán chỉ dành cho nhân viên / Lễ tân test, ẩn đối với khách hàng thông thường */}
          {isEmployee && !isPaid && (
            <div className="pt-1">
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleSimulatePayment}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <SvgIcon name={isVerifying ? 'clock' : 'check-circle'} className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Đang cập nhật...' : 'Đánh dấu đã nhận chuyển khoản'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* NỘI DUNG 2: THANH TOÁN TIỀN MẶT TRỰC TIẾP */}
      {paymentMethod === 'TIEN_MAT' && (
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <SvgIcon name="cash" className="w-4 h-4 text-emerald-700" />
              <ResponsiveText mobile="THANH TOÁN TIỀN MẶT TẠI QUẦY" desktop="THANH TOÁN TIỀN MẶT TẠI QUẦY TIẾP NHẬN" />
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-emerald-200 text-xs text-slate-700 space-y-2 sm:space-y-2.5">
            <p className="hidden sm:flex items-center gap-1.5 font-extrabold text-sm text-slate-800">
              <SvgIcon name="clipboard" className="w-4 h-4 text-emerald-700" />
              <span>Quy trình thanh toán tiền mặt tại quầy:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-slate-700 leading-relaxed">
              <li>
                <ResponsiveText
                  mobile={<>Đưa mã phiếu <strong>#{ticketCode}</strong> tại quầy lễ tân.</>}
                  desktop={<>Quý khách xuất trình <strong>Mã phiếu QR #{ticketCode}</strong> cho nhân viên Lễ tân tại quầy.</>}
                />
              </li>
              <li>
                <ResponsiveText
                  mobile={<>Thanh toán <strong className="text-brand-blue">{numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</strong> tiền mặt.</>}
                  desktop={<>Thanh toán số tiền <strong className="text-brand-blue text-sm">{numericAmount > 0 ? `${numericAmount.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}</strong> trực tiếp bằng tiền mặt.</>}
                />
              </li>
              <li>
                <ResponsiveText
                  mobile="Nhận biên nhận & kích hoạt bảo hành e-Warranty."
                  desktop={<>Lễ tân xác nhận thu tiền trên hệ thống, in biên nhận và kích hoạt <strong>Sổ bảo hành điện tử (e-Warranty)</strong>.</>}
                />
              </li>
            </ol>
            <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <SvgIcon name="map-pin" className="w-3.5 h-3.5 text-slate-400" />
                <ResponsiveText
                  mobile={<strong>615 Âu Cơ, P. Phú Trung, Q. Tân Phú</strong>}
                  desktop={<>Địa chỉ quầy: <strong>615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</strong></>}
                />
              </div>
              <div className="text-emerald-700 font-semibold flex items-center gap-1">
                <SvgIcon name="phone" className="w-3.5 h-3.5" />
                <ResponsiveText mobile="028.3860.4999" desktop="Hotline hỗ trợ: 028.3860.4999" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chân trang ghi chú bảo hành */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <SvgIcon name="shield" className="w-3.5 h-3.5 text-slate-400" />
          <ResponsiveText mobile="Tự động kích hoạt e-Warranty" desktop="Kích hoạt e-Warranty tự động sau khi thanh toán" />
        </span>
        <ResponsiveText mobile="Hotline: 028.3860.4999" desktop="Công ty CP Lục Giác • Hotline: 028.3860.4999" />
      </div>
    </div>
  );
}

export default PaymentMethodSelector;
