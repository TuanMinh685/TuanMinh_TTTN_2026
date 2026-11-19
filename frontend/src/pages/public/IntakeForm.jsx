import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon from '../../components/SvgIcon';

function IntakeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    zaloId: '',
    deviceName: '',
    serialImei: '',
    issueDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  // 'IDLE' | 'CHECKING' | 'LINKED' | 'INVALID'
  const [zaloCheckStatus, setZaloCheckStatus] = useState('IDLE');

  // Tự động kiểm tra tài khoản Zalo từ SĐT ngay khi nhập (không cần nhập 2 lần)
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
        navigate(`/track/${response.data.data.ticketCode}`, {
          state: { isNew: true, ticketCode: response.data.data.ticketCode }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-4 sm:my-10 px-3 sm:px-4">
      <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm border border-slate-200 border-t-4 border-t-brand-blue">
        <div className="text-center mb-5 sm:mb-7">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <SvgIcon name="qr" className="w-3.5 h-3.5 text-brand-blue" />
            <ResponsiveText mobile="Tiếp Nhận CSKH" desktop="Tiếp Nhận Thiết Bị & Hỗ Trợ Kỹ Thuật" />
          </span>
          <h1 className="text-xl sm:text-3xl font-bold text-brand-blue mb-1.5 sm:mb-2">
            <ResponsiveText mobile="Tạo Phiếu Tiếp Nhận" desktop="Tạo Phiếu Tiếp Nhận Chăm Sóc Khách Hàng" />
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            <ResponsiveText
              mobile="Điền thông tin để nhận Mã QR theo dõi tiến độ & bảo hành."
              desktop={
                <>
                  Điền thông tin thiết bị máy tính hoặc yêu cầu phần mềm để hệ thống cấp <strong>Mã QR</strong> theo dõi tiến độ kiểm tra, sửa chữa và bảo hành điện tử.
                </>
              }
            />
          </p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-end">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                <ResponsiveText mobile="Họ và tên *" desktop="Họ và Tên khách hàng *" />
              </label>
              <input required type="text" name="fullName" onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm sm:text-base" placeholder="VD: Lê Trần Tuấn Minh" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                  <ResponsiveText mobile="Số điện thoại *" desktop="Số điện thoại liên hệ *" />
                </label>
                {zaloCheckStatus === 'LINKED' && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <SvgIcon name="check" className="w-3 h-3" />
                    <span>SĐT hợp lệ</span>
                  </span>
                )}
                {zaloCheckStatus === 'INVALID' && (
                  <span className="text-[11px] font-bold text-red-500">SĐT không hợp lệ</span>
                )}
              </div>
              <input required type="tel" name="phone" onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm sm:text-base" placeholder="0901234567" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-end">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                <ResponsiveText mobile="Thiết bị / Dịch vụ *" desktop="Thiết bị máy tính / Phần mềm cần hỗ trợ *" />
              </label>
              <input required type="text" name="deviceName" onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm sm:text-base" placeholder="VD: Laptop Dell XPS, MacBook M1, Windows 11..." />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                <ResponsiveText mobile="Số Serial / Service Tag" desktop="Số Serial / Service Tag máy" />
              </label>
              <input type="text" name="serialImei" onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm sm:text-base" placeholder="VD: C02X9082JG5H (Không bắt buộc)" />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              <ResponsiveText mobile="Mô tả sự cố *" desktop="Mô tả sự cố máy tính / Yêu cầu hỗ trợ phần mềm *" />
            </label>
            <textarea required name="issueDescription" onChange={handleChange} rows="3" className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm sm:text-base" placeholder="Mô tả tình trạng lỗi phần cứng hoặc sự cố phần mềm cần hỗ trợ..."></textarea>
          </div>

          {/* Khối Tải ảnh minh chứng hiện trạng lúc tiếp nhận */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800">
                  <SvgIcon name="camera" className="w-4 h-4 text-brand-blue" />
                  <ResponsiveText
                    mobile="Ảnh hiện trạng (Tùy chọn)"
                    desktop="Ảnh chụp ngoại quan máy / Màn hình lỗi (Tùy chọn)"
                  />
                </label>
                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                  Chụp hoặc tải ảnh ngoại quan máy lúc bàn giao hoặc màn hình báo lỗi để lưu hồ sơ.
                </p>
              </div>
              <label className="cursor-pointer shrink-0 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition inline-flex items-center gap-1">
                <SvgIcon name="plus" className="w-3.5 h-3.5" />
                <span>Chọn ảnh</span>
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
                      aria-label="Xóa ảnh"
                    >
                      <SvgIcon name="x" className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button disabled={loading} type="submit" className="w-full py-3.5 sm:py-4 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-sm sm:text-base">
            {loading ? (
              'Đang tạo phiếu...'
            ) : (
              <ResponsiveText mobile="Tạo Phiếu & Nhận Mã QR →" desktop="Tạo Phiếu CSKH & Nhận Mã QR Theo Dõi →" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default IntakeForm;

