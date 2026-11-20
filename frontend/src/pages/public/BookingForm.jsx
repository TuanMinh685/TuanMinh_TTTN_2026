import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon from '../../components/SvgIcon';

function BookingForm() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const targetService = searchParams.get('service') || location.state?.serviceName || '';

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    zaloId: '',
    deviceName: '',
    ngayHen: '',
    gioHen: '',
    moTaLoi: targetService ? `Cần hỗ trợ / CSKH: ${targetService}` : '',
    loaiDichVu: 'TAI_CUA_HANG'
  });
  const [selectedServiceBanner, setSelectedServiceBanner] = useState(targetService);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const vnMobileRegex = /^(0[35789])[0-9]{8}$/;
  const cleanPhoneInput = (formData.phone || '').replace(/\s+/g, '');
  // Tự động kiểm tra liên kết tài khoản Zalo ngay khi nhập SĐT (không cần nhập 2 lần)
  // 'IDLE' | 'LINKED' | 'INVALID'
  const zaloCheckStatus = !cleanPhoneInput || cleanPhoneInput.length < 9
    ? 'IDLE'
    : vnMobileRegex.test(cleanPhoneInput)
      ? 'LINKED'
      : cleanPhoneInput.length >= 10
        ? 'INVALID'
        : 'IDLE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanPhone = (formData.phone || '').replace(/\s+/g, '');
      await api.post('/tickets/booking', {
        ...formData,
        phone: cleanPhone,
        zaloId: zaloCheckStatus === 'LINKED' ? cleanPhone : ''
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra!');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#f0f5fa] min-h-[80vh] flex items-center justify-center p-3 sm:p-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm p-5 sm:p-6 md:p-8 text-center border border-slate-200 border-t-4 border-t-brand-green">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <SvgIcon name="check" className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-blue mb-1.5 sm:mb-2">
            <ResponsiveText mobile="Đặt lịch thành công" desktop="Đặt Lịch Hẹn Thành Công" />
          </h2>
          <p className="text-slate-600 text-xs md:text-sm mb-4 sm:mb-5">
            <ResponsiveText
              mobile={
                <>
                  Cảm ơn <strong>{formData.fullName}</strong>. Tin nhắn xác nhận đã gửi tới <strong>{formData.phone}</strong>.
                </>
              }
              desktop={
                <>
                  Cảm ơn <strong>{formData.fullName}</strong> đã đặt lịch. Hệ thống đã gửi tin nhắn SMS xác nhận đến số điện thoại <strong>{formData.phone}</strong>.
                </>
              }
            />
          </p>

          {/* Khung tóm tắt lịch hẹn */}
          <div className="mb-5 sm:mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                <SvgIcon name="building" className="w-4 h-4 text-brand-blue" />
                <span>CÔNG TY CỔ PHẦN LỤC GIÁC</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200">
                <SvgIcon name="check-circle" className="w-3.5 h-3.5" />
                <span>Đã ghi nhận ({formData.phone})</span>
              </span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <p>
                <strong>Thời gian hẹn:</strong>{' '}
                <span className="text-brand-blue font-bold">{formData.gioHen}</span> - Ngày{' '}
                <span className="text-brand-blue font-bold">{formData.ngayHen}</span>
              </p>
              <p>
                <strong>Thiết bị / Dịch vụ:</strong> {formData.deviceName || 'Máy tính / Phần mềm theo lịch hẹn'}
              </p>
              <p>
                <strong>Địa điểm quầy CSKH:</strong> 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM
              </p>
            </div>

            <p className="hidden sm:flex items-start gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
              <SvgIcon name="info" className="w-3.5 h-3.5 text-brand-blue mt-0.5 shrink-0" />
              <span>
                Vui lòng kiểm tra tin nhắn SMS trên số <strong>{formData.phone}</strong>. Khi đến quầy lễ tân, bạn chỉ cần đọc số điện thoại để được tiếp nhận nhanh.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3">
            <Link
              to="/tra-cuu"
              className="px-5 py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-brand-blue-hover transition shadow-2xs inline-flex items-center justify-center gap-1.5"
            >
              <SvgIcon name="qr" className="w-4 h-4" />
              <span>Mở Cổng Quét QR &amp; Tra Cứu</span>
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition inline-flex items-center justify-center"
            >
              Trở về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f5fa] flex flex-col">
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-slate-200">
          <div className="p-5 sm:p-6 md:p-8">
            <div className="text-center mb-5 sm:mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                <ResponsiveText mobile="Đặt Lịch Kiểm Tra & Hỗ Trợ" desktop="Đặt Lịch Hẹn Kiểm Tra Máy Tính & Phần Mềm" />
              </h1>
              <p className="text-slate-500 text-xs md:text-sm">
                <ResponsiveText
                  mobile="Đặt lịch trước để được ưu tiên tiếp nhận tại quầy 615 Âu Cơ."
                  desktop="Đặt lịch trước để được ưu tiên tiếp nhận khi đến quầy 615 Âu Cơ."
                />
              </p>
            </div>

            {selectedServiceBanner && (
              <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 bg-orange-50/70 border-l-4 border-brand-orange rounded-r-xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <SvgIcon name="wrench" className="w-5 h-5 text-brand-orange shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-extrabold text-brand-orange tracking-wider">Nội dung hẹn</div>
                    <div className="font-bold text-slate-800 text-sm md:text-base truncate">{selectedServiceBanner}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceBanner('');
                    setFormData(prev => ({ ...prev, moTaLoi: '' }));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold shrink-0 ml-2"
                >
                  Xóa chọn
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <ResponsiveText mobile="Hình thức hỗ trợ" desktop="Hình thức hẹn Chăm sóc khách hàng (Máy tính & Phần mềm)" />
                </label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}
                >
                  <option value="TAI_CUA_HANG">Kiểm tra &amp; Sửa chữa phần cứng Máy tính / Laptop tại quầy (615 Âu Cơ)</option>
                  <option value="TU_VAN_HO_TRO">Hỗ trợ cài đặt &amp; Khắc phục sự cố Phần mềm / Hệ điều hành</option>
                  <option value="BAO_HANH_DINH_KY">Bảo hành định kỳ &amp; Chăm sóc sau sửa chữa</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <ResponsiveText mobile="Họ và tên *" desktop="Họ và tên khách hàng *" />
                  </label>
                  <input type="text" required placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      <ResponsiveText mobile="Số điện thoại *" desktop="Số điện thoại liên hệ *" />
                    </label>
                    {zaloCheckStatus === 'LINKED' && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <SvgIcon name="check" className="w-3 h-3" />
                        <span>Tự động gửi SMS</span>
                      </span>
                    )}
                    {zaloCheckStatus === 'INVALID' && (
                      <span className="text-[11px] font-bold text-red-500">
                        SĐT chưa đúng định dạng
                      </span>
                    )}
                  </div>
                  <input type="tel" required placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.phone} onChange={e => {
                      const phoneVal = e.target.value;
                      const cleaned = phoneVal.replace(/\s+/g, '');
                      const validZalo = vnMobileRegex.test(cleaned) ? cleaned : '';
                      setFormData(prev => ({ ...prev, phone: phoneVal, zaloId: validZalo }));
                    }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <ResponsiveText mobile="Thiết bị / Dịch vụ" desktop="Thiết bị máy tính / Phần mềm cần hỗ trợ" />
                </label>
                <input type="text" placeholder="VD: Laptop Dell XPS, MacBook Pro, Cài đặt Windows / Office..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.deviceName || ''} onChange={e => setFormData({...formData, deviceName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hẹn *</label>
                  <input type="date" required 
                    className="w-full px-3 sm:px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.ngayHen} onChange={e => setFormData({...formData, ngayHen: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <ResponsiveText mobile="Giờ hẹn *" desktop="Giờ hẹn dự kiến *" />
                  </label>
                  <input type="time" required 
                    className="w-full px-3 sm:px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.gioHen} onChange={e => setFormData({...formData, gioHen: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <ResponsiveText mobile="Mô tả sự cố *" desktop="Mô tả tình trạng máy tính / Sự cố phần mềm cần hỗ trợ *" />
                </label>
                <textarea required rows="3" placeholder="Mô tả tình trạng lỗi phần cứng hoặc sự cố phần mềm cần hỗ trợ..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.moTaLoi} onChange={e => setFormData({...formData, moTaLoi: e.target.value})}></textarea>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm sm:text-base rounded-xl shadow-xs transition-all mt-3 sm:mt-4 disabled:opacity-50 cursor-pointer">
                {loading ? (
                  'Đang gửi thông tin...'
                ) : (
                  <ResponsiveText mobile="Xác nhận đặt lịch →" desktop="Xác nhận đặt lịch hẹn" />
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookingForm;

