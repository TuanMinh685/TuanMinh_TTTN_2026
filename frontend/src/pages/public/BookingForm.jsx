import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import SoftwarePackageSelector from '../../components/SoftwarePackageSelector';

function BookingForm() {
  const location = useLocation();
  const initialServiceName = location.state?.serviceName || '';

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    zaloId: '',
    ngayHen: '',
    gioHen: '',
    moTaLoi: initialServiceName ? `Cần dịch vụ / thay thế: ${initialServiceName}` : '',
    loaiDichVu: 'TAI_CUA_HANG'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [softwarePackage, setSoftwarePackage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tickets/booking', {
        ...formData,
        moTaLoi: softwarePackage
          ? `${formData.moTaLoi}\nGói phần mềm yêu cầu: ${softwarePackage}`
          : formData.moTaLoi
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-8 border-brand-green">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
          <h2 className="text-2xl font-bold text-brand-blue mb-4">Đặt lịch thành công!</h2>
          <p className="text-slate-600 mb-8">
            Cảm ơn bạn đã đặt lịch hẹn. Lễ tân tại <strong>615 Âu Cơ</strong> sẽ gọi điện xác nhận trong thời gian sớm nhất!
          </p>
          <Link to="/" className="px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Trở về Trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-brand-orange">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-brand-blue mb-2 text-center">Đặt Lịch Hẹn Sửa Chữa</h1>
            <p className="text-slate-500 text-center mb-8">Điền thông tin để chúng tôi sắp xếp nhân viên kỹ thuật đón tiếp bạn chu đáo nhất.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Phương thức sửa chữa</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                  value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}
                >
                  <option value="TAI_CUA_HANG">Mang máy đến cửa hàng (615 Âu Cơ, Q. Tân Phú)</option>
                  <option value="ONLINE_TUXA">Hỗ trợ phần mềm từ xa qua UltraViewer</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <input type="text" required placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                    value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input type="tel" required placeholder="0901234567"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Số Zalo liên hệ (Tùy chọn)</label>
                <input type="text" placeholder="Nhập số Zalo để nhận cập nhật nhanh"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                  value={formData.zaloId} onChange={e => setFormData({...formData, zaloId: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Ngày hẹn *</label>
                  <input type="date" required 
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                    value={formData.ngayHen} onChange={e => setFormData({...formData, ngayHen: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Giờ hẹn dự kiến *</label>
                  <input type="time" required 
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                    value={formData.gioHen} onChange={e => setFormData({...formData, gioHen: e.target.value})} />
                </div>
              </div>

              <SoftwarePackageSelector value={softwarePackage} onChange={setSoftwarePackage} />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả chi tiết lỗi / Yêu cầu sửa chữa *</label>
                <textarea required rows="4" placeholder="Ví dụ: Máy bật không lên nguồn, cần thay màn hình..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                  value={formData.moTaLoi} onChange={e => setFormData({...formData, moTaLoi: e.target.value})}></textarea>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-brand-orange text-white font-bold text-lg rounded-xl hover:brightness-110 shadow-lg hover:shadow-xl transition-all mt-4 disabled:opacity-50">
                {loading ? 'Đang gửi...' : 'ĐẶT LỊCH NGAY'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BookingForm;
