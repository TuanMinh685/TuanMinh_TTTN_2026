import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import SoftwarePackageSelector from '../../components/SoftwarePackageSelector';

function BookingForm() {
  const location = useLocation();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    zaloId: '',
    ngayHen: '',
    gioHen: '',
    moTaLoi: '',
    loaiDichVu: 'TAI_CUA_HANG'
  });
  const [selectedServiceBanner, setSelectedServiceBanner] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [softwarePackage, setSoftwarePackage] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');

  // Tự động nhận diện Dịch vụ & Gói phần mềm được bấm từ Header Menu hoặc Bảng giá
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const serviceFromQuery = searchParams.get('service');
    const pkgFromQuery = searchParams.get('pkg');
    const serviceFromState = location.state?.serviceName;
    const targetService = serviceFromQuery || serviceFromState || '';

    if (targetService) {
      setSelectedServiceBanner(targetService);
      setFormData(prev => ({
        ...prev,
        moTaLoi: `Cần dịch vụ / thay thế: ${targetService}`
      }));
    }

    if (pkgFromQuery) {
      setSoftwarePackage(pkgFromQuery);
    }
  }, [location.search, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/tickets/booking', {
        ...formData,
        isStudent,
        schoolName,
        studentId,
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
            <p className="text-slate-500 text-center mb-6">Điền thông tin để chúng tôi sắp xếp nhân viên kỹ thuật đón tiếp bạn chu đáo nhất.</p>

            {selectedServiceBanner && (
              <div className="mb-6 p-4 bg-orange-50 border-l-4 border-brand-orange rounded-r-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-xs uppercase font-extrabold text-brand-orange tracking-wider">Dịch vụ đã chọn từ menu</div>
                    <div className="font-bold text-slate-800 text-base">{selectedServiceBanner}</div>
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

              {/* Khối Ưu đãi Học sinh - Sinh viên toàn quốc */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isStudent} 
                    onChange={e => setIsStudent(e.target.checked)}
                    className="w-5 h-5 text-brand-blue rounded focus:ring-brand-blue"
                  />
                  <div>
                    <span className="font-bold text-blue-900 text-sm md:text-base">🎓 Bạn là Học sinh / Sinh viên?</span>
                    <span className="ml-2 text-xs bg-amber-400 text-slate-900 font-black px-2 py-0.5 rounded-full uppercase">Giảm ngay 15%</span>
                    <p className="text-xs text-slate-500 mt-0.5">Áp dụng cho học sinh, sinh viên tất cả các trường ĐH/CĐ trên toàn quốc</p>
                  </div>
                </label>

                {isStudent && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-3 border-t border-blue-200/60">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trường ĐH / CĐ / Trường học *</label>
                      <input 
                        type="text" 
                        required={isStudent}
                        list="vn-schools"
                        placeholder="VD: ĐH Văn Hiến, Bách Khoa, KHTN, UEH..."
                        value={schoolName}
                        onChange={e => setSchoolName(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                      />
                      <datalist id="vn-schools">
                        <option value="Trường Đại học Văn Hiến (VHU)" />
                        <option value="Trường Đại học Bách Khoa - ĐHQG TP.HCM" />
                        <option value="Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM" />
                        <option value="Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM" />
                        <option value="Trường Đại học Sư phạm Kỹ thuật TP.HCM" />
                        <option value="Trường Đại học Kinh tế TP.HCM (UEH)" />
                        <option value="Trường Đại học Công nghệ TP.HCM (HUTECH)" />
                        <option value="Trường Đại học Văn Lang" />
                        <option value="Trường Đại học Tôn Đức Thắng" />
                        <option value="Trường Đại học Công nghiệp TP.HCM (IUH)" />
                        <option value="Trường Đại học Tài chính - Marketing (UFM)" />
                        <option value="Trường Đại học Sài Gòn" />
                        <option value="Trường Đại học Mở TP.HCM" />
                        <option value="Trường Đại học FPT TP.HCM" />
                        <option value="Học sinh / Sinh viên trường khác trên toàn quốc" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Mã số sinh viên (MSSV) *</label>
                      <input 
                        type="text" 
                        required={isStudent}
                        placeholder="VD: 221A010123"
                        value={studentId}
                        onChange={e => setStudentId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                      />
                    </div>
                  </div>
                )}
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
