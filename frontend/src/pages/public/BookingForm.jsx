import { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tickets/booking', {
        ...formData
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
      <div className="bg-[#f0f5fa] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 text-center border-t-8 border-brand-green">
          <div className="w-16 h-16 bg-green-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-brand-blue mb-2">Đặt lịch hẹn CSKH thành công!</h2>
          <p className="text-slate-600 text-xs md:text-sm mb-6">
            Cảm ơn bạn <strong>{formData.fullName}</strong> đã đặt hẹn trước. Khi bạn đến quầy lễ tân tại <strong>Tập đoàn MYH Group (615 Âu Cơ)</strong>, nhân viên sẽ xác nhận lịch hẹn và khởi tạo <strong>Mã QR Hồ Sơ CSKH</strong> ngay lập tức!
          </p>

          <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-slate-600 text-left space-y-1">
            <span className="font-bold text-brand-blue block mb-1">📋 Thông tin lịch hẹn đã ghi nhận:</span>
            <p>• <strong>Khách hàng:</strong> {formData.fullName} ({formData.phone})</p>
            <p>• <strong>Thời gian hẹn:</strong> {formData.gioHen} - Ngày {formData.ngayHen}</p>
            <p>• <strong>Địa điểm:</strong> Trung tâm CSKH 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/tra-cuu"
              className="px-5 py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
            >
              📷 Mở Cổng Quét QR & Tra Cứu
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
                📅 Đặt Lịch Hẹn CSKH – Sửa Chữa Máy Tính &amp; Phần Mềm
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                  <input type="tel" required placeholder="0901234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Zalo (để nhận thông báo QR tiến độ)</label>
                  <input type="tel" placeholder="Nhập số Zalo (nếu khác SĐT)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.zaloId} onChange={e => setFormData({...formData, zaloId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thiết bị máy tính / Phần mềm cần hỗ trợ</label>
                  <input type="text" placeholder="VD: Laptop Dell XPS, MacBook Pro, Cài đặt Windows / Office..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-sm"
                    value={formData.deviceName || ''} onChange={e => setFormData({...formData, deviceName: e.target.value})} />
                </div>
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

