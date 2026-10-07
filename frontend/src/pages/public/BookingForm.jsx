import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

function BookingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '', phone: '', zaloId: '', ngayHen: '', gioHen: '', moTaLoi: '', loaiDichVu: 'TAI_CUA_HANG'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tickets/booking', formData);
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
            Cảm ơn bạn đã đặt lịch hẹn. Lễ tân của chúng tôi sẽ gọi điện xác nhận trong thời gian sớm nhất!
          </p>
          <Link to="/" className="px-6 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700">Trở về Trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex flex-col items-center">
             <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 object-contain" />
             <span className="text-[10px] text-brand-orange font-bold tracking-widest leading-none mt-1">IT SUPPORT</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-brand-orange">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-brand-blue mb-2 text-center">Đặt Lịch Hẹn Sửa Chữa</h1>
            <p className="text-slate-500 text-center mb-8">Xin vui lòng điền thông tin để chúng tôi sắp xếp lịch phục vụ tốt nhất.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Loại dịch vụ</label>
                <select 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none"
                  value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}
                >
                  <option value="TAI_CUA_HANG">Mang máy đến cửa hàng</option>
                  <option value="ONLINE_TUXA">Hỗ trợ phần mềm từ xa (Ultraviewer)</option>
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

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả chi tiết lỗi *</label>
                <textarea required rows="4" placeholder="Ví dụ: Máy bật không lên nguồn..."
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
