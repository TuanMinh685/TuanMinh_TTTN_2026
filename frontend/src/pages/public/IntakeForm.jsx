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
  const [isStudent, setIsStudent] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');
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
      // Gọi API Tiếp nhận máy & cấp Mã QR
      const response = await api.post('/tickets/intake', {
        ...formData,
        isStudent,
        schoolName,
        studentId,
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
            📷 Cổng Tiếp Nhận Tự Phục Vụ Bằng Mã QR
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-blue mb-2">Tạo Phiếu Tiếp Nhận & CSKH</h1>
          <p className="text-slate-500 text-sm">
            Điền thông tin thiết bị để hệ thống cấp ngay <strong>Mã QR định danh</strong> theo dõi tiến độ và kích hoạt bảo hành điện tử.
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ Tên *</label>
              <input required type="text" name="fullName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: Lê Trần Tuấn Minh" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input required type="tel" name="phone" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="0987..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Thiết Bị *</label>
              <input required type="text" name="deviceName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: Laptop Dell XPS 15" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số IMEI / Serial</label>
              <input type="text" name="serialImei" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="(Không bắt buộc)" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tình trạng cần hỗ trợ / chăm sóc kỹ thuật *</label>
            <textarea required name="issueDescription" onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="Mô tả chi tiết tình trạng thiết bị hoặc yêu cầu kiểm tra, bảo hành..."></textarea>
          </div>

          {/* Khối Ưu đãi Học sinh - Sinh viên toàn quốc */}
          <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/70 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isStudent}
                onChange={(e) => setIsStudent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold text-indigo-950 text-sm block">
                  🎓 Tôi là Học sinh / Sinh viên (Giảm ngay 15% tổng hóa đơn)
                </span>
                <span className="text-xs text-indigo-700">
                  Áp dụng cho tất cả các trường Đại học, Cao đẳng, THPT trên toàn quốc (VHU, Bách Khoa, UEH, HUTECH, Văn Lang...).
                </span>
              </div>
            </label>

            {isStudent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-indigo-200/80">
                <div>
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">Tên Trường ĐH / CĐ / THPT *</label>
                  <input
                    type="text"
                    required={isStudent}
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="VD: ĐH Văn Hiến (VHU)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">Mã số Sinh viên / Học sinh (MSSV) *</label>
                  <input
                    type="text"
                    required={isStudent}
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="VD: 221A010993"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Khối Tải ảnh ngoại quan thiết bị lúc nhận (Chống khiếu nại) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-800">
                  📸 Ảnh hiện trạng ngoại quan máy (Tùy chọn)
                </label>
                <p className="text-xs text-slate-500">
                  Chụp/tải lên ảnh các góc máy, vết trầy xước hiện có để lưu biên bản đối chiếu minh bạch.
                </p>
              </div>
              <label className="cursor-pointer shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 transition">
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
                    <img src={photo.duong_dan_anh} alt={`Ngoại quan ${idx + 1}`} className="w-full h-full object-cover" />
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

          <button disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-brand-orange to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer">
            {loading ? 'Đang khởi tạo Mã QR...' : 'Tạo Phiếu & Nhận Mã QR Theo Dõi →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default IntakeForm;
