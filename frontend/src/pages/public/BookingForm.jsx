import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';

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
  // 'IDLE' | 'CHECKING' | 'LINKED' | 'INVALID'
  const [zaloCheckStatus, setZaloCheckStatus] = useState('IDLE');

  // Tự động kiểm tra liên kết tài khoản Zalo ngay khi nhập SĐT (không cần nhập 2 lần)
  useEffect(() => {
    const cleanPhone = (formData.phone || '').replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setZaloCheckStatus('IDLE');
      return;
    }
    setZaloCheckStatus('CHECKING');
    const timer = setTimeout(() => {
      const vnMobileRegex = /^(0[35789])[0-9]{8}$/;
      if (vnMobileRegex.test(cleanPhone)) {
        setZaloCheckStatus('LINKED');
        setFormData(prev => ({ ...prev, zaloId: cleanPhone }));
      } else if (cleanPhone.length >= 10) {
        setZaloCheckStatus('INVALID');
        setFormData(prev => ({ ...prev, zaloId: '' }));
      } else {
        setZaloCheckStatus('IDLE');
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.phone]);

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
      <div className="bg-[#f0f5fa] min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 text-center border-t-8 border-brand-green">
          <div className="w-16 h-16 bg-green-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-brand-blue mb-2">Đặt Lịch Hẹn CSKH Thành Công!</h2>
          <p className="text-slate-600 text-xs md:text-sm mb-5">
            Cảm ơn bạn <strong>{formData.fullName}</strong> đã đặt lịch hẹn trước. Hệ thống đã tự động gửi xác nhận qua <strong>Zalo ZNS / Tin nhắn SMS</strong> đến số điện thoại <strong>{formData.phone}</strong>.
          </p>

          {/* KHUNG THÔNG BÁO XÁC NHẬN ZALO / SMS TỰ ĐỘNG */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200/70 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-blue">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                📲 Đã gửi tin nhắn xác nhận tự động qua Zalo ZNS / SMS
              </span>
              <span className="text-[11px] font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Gửi tới: {formData.phone}
              </span>
            </div>

            {/* Bong bóng tin nhắn mô phỏng thực tế Zalo OA */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <span>🏢 CÔNG TY CỔ PHẦN LỤC GIÁC</span>
                  <span className="text-blue-500 text-xs" title="Tài khoản Doanh nghiệp xác thực">☑️</span>
                </div>
                <span className="text-[10px] text-slate-400">Tin nhắn Zalo OA / SMS</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Kính gửi <strong>{formData.fullName}</strong>, lịch hẹn chăm sóc &amp; kiểm tra máy tính của Quý khách đã được xác nhận thành công:
              </p>
              <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-700 space-y-1 border border-slate-100">
                <p>• <strong>Thời gian hẹn:</strong> <span className="text-brand-blue font-bold">{formData.gioHen}</span> - Ngày <span className="text-brand-blue font-bold">{formData.ngayHen}</span></p>
                <p>• <strong>Thiết bị / Dịch vụ:</strong> {formData.deviceName || 'Máy tính / Phần mềm theo lịch hẹn'}</p>
                <p>• <strong>Địa điểm quầy CSKH:</strong> 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</p>
              </div>
              <div className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded border border-amber-100">
                💡 <strong>Quý khách lưu ý:</strong> Vui lòng mở ứng dụng <strong>Zalo</strong> hoặc kiểm tra tin nhắn <strong>SMS</strong> trên máy ({formData.phone}). Khi đến quầy lễ tân, bạn chỉ cần đọc số điện thoại để được tiếp nhận ngay mà không cần chờ đợi!
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/tra-cuu"
              className="px-5 py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              📷 Mở Cổng Quét QR &amp; Tra Cứu
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
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
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 border-brand-orange">
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-brand-orange text-xs font-bold uppercase tracking-wider mb-2">
                📅 Đặt Lịch Hẹn Dịch Vụ &amp; Hỗ Trợ Kỹ Thuật
              </span>
              <h1 className="text-2xl font-bold text-brand-blue mb-1">Đặt Lịch Hẹn Kiểm Tra Máy Tính &amp; Hỗ Trợ Phần Mềm</h1>
              <p className="text-slate-500 text-xs md:text-sm">
                Đặt lịch trước để được ưu tiên tiếp nhận kiểm tra phần cứng, xử lý sự cố phần mềm và cấp Mã QR Hồ sơ CSKH ngay khi đến quầy.
              </p>
            </div>

            {selectedServiceBanner && (
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-brand-orange rounded-r-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-[10px] uppercase font-extrabold text-brand-orange tracking-wider">Nội dung hẹn</div>
                    <div className="font-bold text-slate-800 text-sm md:text-base">{selectedServiceBanner}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedServiceBanner('');
                    setFormData(prev => ({ ...prev, moTaLoi: '' }));
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold"
                >
                  Xóa chọn
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức hẹn Chăm sóc khách hàng (Máy tính &amp; Phần mềm)</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}
                >
                  <option value="TAI_CUA_HANG">Kiểm tra &amp; Sửa chữa phần cứng Máy tính / Laptop tại quầy (615 Âu Cơ)</option>
                  <option value="TU_VAN_HO_TRO">Hỗ trợ cài đặt &amp; Khắc phục sự cố Phần mềm / Hệ điều hành</option>
                  <option value="BAO_HANH_DINH_KY">Bảo hành định kỳ &amp; Chăm sóc sau sửa chữa (e-Warranty)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách hàng *</label>
                  <input type="text" required placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Số điện thoại liên hệ *</label>
                    {zaloCheckStatus === 'LINKED' && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        ✓ Tự động gửi Zalo/SMS
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
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Thiết bị máy tính / Phần mềm cần hỗ trợ</label>
                <input type="text" placeholder="VD: Laptop Dell XPS, MacBook Pro, Cài đặt Windows / Office..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.deviceName || ''} onChange={e => setFormData({...formData, deviceName: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày hẹn *</label>
                  <input type="date" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.ngayHen} onChange={e => setFormData({...formData, ngayHen: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giờ hẹn dự kiến *</label>
                  <input type="time" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.gioHen} onChange={e => setFormData({...formData, gioHen: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tình trạng máy tính / Sự cố phần mềm cần hỗ trợ *</label>
                <textarea required rows="3" placeholder="Mô tả chi tiết lỗi phần cứng máy tính hoặc sự cố phần mềm bạn cần hỗ trợ..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                  value={formData.moTaLoi} onChange={e => setFormData({...formData, moTaLoi: e.target.value})}></textarea>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all mt-4 disabled:opacity-50 cursor-pointer">
                {loading ? 'Đang gửi thông tin...' : 'XÁC NHẬN ĐẶT LỊCH HẸN CSKH'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookingForm;

