import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function IntakeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    deviceName: '',
    serialImei: '',
    issueDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [
          ...prev, 
          {
            duong_dan_anh: event.target.result,
            loai_anh: 'NGOAI_QUAN',
            ghi_chu: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Gọi API Tiếp nhận hồ sơ CSKH & cấp Mã QR
      const response = await api.post('/tickets/intake', {
        ...formData,
        photos
      });
      if (response.data.success) {
        // Chuyển sang trang Hồ sơ QR & Tra cứu tiến độ ngay lập tức với mã phiếu
        navigate(`/track/${response.data.data.ticketCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 px-4">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-t-4 border-brand-blue relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-bold uppercase tracking-wider mb-2">
            📷 Cổng Tiếp Nhận QR – Mảng Sửa Chữa Máy Tính &amp; Phần Mềm
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-2">Tạo Phiếu QR Chăm Sóc Khách Hàng</h1>
          <p className="text-slate-500 text-sm">
            Điền thông tin thiết bị máy tính hoặc yêu cầu phần mềm để hệ thống cấp ngay <strong>Mã QR định danh</strong> theo dõi tiến độ kiểm tra, sửa chữa và kích hoạt bảo hành điện tử.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên khách hàng *</label>
              <input required type="text" name="fullName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: Lê Trần Tuấn Minh" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
              <input required type="tel" name="phone" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="0987..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thiết bị máy tính / Phần mềm cần hỗ trợ *</label>
              <input required type="text" name="deviceName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: Laptop Dell XPS, MacBook M1, Windows 11..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số Serial / Service Tag máy</label>
              <input type="text" name="serialImei" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: C02X9082JG5H (Không bắt buộc)" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả sự cố máy tính / Yêu cầu hỗ trợ phần mềm *</label>
            <textarea required name="issueDescription" onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="Mô tả chi tiết tình trạng lỗi phần cứng máy tính hoặc sự cố phần mềm cần bộ phận CSKH & Kỹ thuật hỗ trợ..."></textarea>
          </div>

          {/* Khối Tải ảnh minh chứng hiện trạng lúc tiếp nhận */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-slate-800">
                  📸 Ảnh chụp ngoại quan máy / Màn hình lỗi phần mềm (Tùy chọn)
                </label>
                <p className="text-xs text-slate-500">
                  Chụp hoặc tải lên hình ảnh ngoại quan máy tính lúc bàn giao hoặc màn hình báo lỗi để lưu hồ sơ CSKH minh bạch.
                </p>
              </div>
              <label className="cursor-pointer shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition">
                + Chọn ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white h-20">
                    <img src={photo.duong_dan_anh} alt={`Minh chứng ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-90 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} type="submit" className="w-full py-4 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer">
            {loading ? 'Đang khởi tạo Mã QR...' : 'Tạo Phiếu CSKH & Nhận Mã QR Theo Dõi →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default IntakeForm;

