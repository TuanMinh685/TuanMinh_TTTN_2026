import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon from '../../components/SvgIcon';

function IntakeForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionToken = (searchParams.get('session') || '').trim();
  const [sessionCheck, setSessionCheck] = useState({ token: '', status: 'VALID', message: '' });
  const sessionState = !sessionToken
    ? 'NONE'
    : sessionCheck.token !== sessionToken
      ? 'CHECKING'
      : sessionCheck.status;
  const sessionMessage = sessionCheck.token === sessionToken ? sessionCheck.message : '';
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

  useEffect(() => {
    if (!sessionToken) return;

    let cancelled = false;
    api.get(`/tickets/session/${encodeURIComponent(sessionToken)}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          setSessionCheck({ token: sessionToken, status: 'VALID', message: '' });
        } else {
          setSessionCheck({
            token: sessionToken,
            status: 'INVALID',
            message: res.data?.message || 'Phiên tiếp nhận mã QR không hợp lệ hoặc đã hết hạn.'
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setSessionCheck({
          token: sessionToken,
          status: 'INVALID',
          message: err.response?.data?.message || 'Mã QR tiếp nhận không tồn tại hoặc đã hết hạn.'
        });
      });

    return () => {
      cancelled = true;
    };
  }, [sessionToken]);
  const vnMobileRegex = /^(0[35789])[0-9]{8}$/;
  const cleanPhone = (formData.phone || '').replace(/\s+/g, '');
  // Kiểm tra định dạng SĐT di động Việt Nam
  const zaloCheckStatus = !cleanPhone || cleanPhone.length < 9
    ? 'IDLE'
    : vnMobileRegex.test(cleanPhone)
      ? 'LINKED'
      : cleanPhone.length >= 10
        ? 'INVALID'
        : 'IDLE';

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = value.replace(/\s+/g, '');
      const validZalo = vnMobileRegex.test(cleaned) ? cleaned : '';
      setFormData(prev => ({ ...prev, phone: value, zaloId: validZalo }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    if (sessionToken && sessionState === 'INVALID') {
      setLoading(false);
      setError(sessionMessage || 'Phiên mã QR đã hết hạn hoặc đã được sử dụng.');
      return;
    }

    try {
      const endpoint = sessionToken
        ? `/tickets/session/${encodeURIComponent(sessionToken)}/submit`
        : '/tickets/intake';
      const response = await api.post(endpoint, {
        ...formData,
        photos
      });
      if (response.data.success) {
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
      <div className="bg-white rounded-xl p-5 sm:p-8 shadow-xs border border-slate-200">
        <div className="text-center mb-5 sm:mb-7">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1.5 sm:mb-2">
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

        {sessionState === 'CHECKING' && (
          <div className="bg-blue-50 text-brand-blue p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-blue-200 font-medium">
            Đang kiểm tra phiên mã QR tiếp nhận...
          </div>
        )}
        {sessionState === 'VALID' && (
          <div className="bg-emerald-50 text-emerald-800 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-emerald-200 font-medium flex items-center gap-2">
            <SvgIcon name="check-circle" className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Phiên QR tiếp nhận tại quầy hợp lệ (dùng 1 lần). Vui lòng điền thông tin thiết bị bên dưới.</span>
          </div>
        )}
        {sessionState === 'INVALID' && (
          <div className="bg-amber-50 text-amber-900 p-4 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-amber-200 space-y-2.5">
            <p className="font-semibold">{sessionMessage}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/intake"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover transition"
              >
                Mở form tiếp nhận mới
              </Link>
              <Link
                to="/"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-xs sm:text-sm border border-red-200">{error}</div>}

        {sessionState !== 'INVALID' && (
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

          <button disabled={loading || sessionState === 'CHECKING'} type="submit" className="w-full py-3.5 sm:py-4 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-sm sm:text-base disabled:opacity-60">
            {loading ? (
              'Đang tạo phiếu...'
            ) : (
              <ResponsiveText mobile="Tạo Phiếu & Nhận Mã QR →" desktop="Tạo Phiếu CSKH & Nhận Mã QR Theo Dõi →" />
            )}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

export default IntakeForm;

