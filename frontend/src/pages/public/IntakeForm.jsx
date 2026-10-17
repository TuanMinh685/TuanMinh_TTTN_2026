import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SoftwarePackageSelector from '../../components/SoftwarePackageSelector';

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
  const [softwarePackage, setSoftwarePackage] = useState('');
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
      const studentNote = isStudent 
        ? `\n[ƯU ĐÃI SINH VIÊN -15%]: Trường ${schoolName || 'Chưa rõ'} - MSSV: ${studentId || 'Chưa cung cấp'}` 
        : '';
      // Gọi API Tiếp nhận máy
      const response = await api.post('/tickets/intake', {
        ...formData,
        isStudent,
        schoolName,
        studentId,
        photos,
        issueDescription: (softwarePackage
          ? `${formData.issueDescription}\nGói phần mềm yêu cầu: ${softwarePackage}`
          : formData.issueDescription) + studentNote
      });
      if (response.data.success) {
        // Chuyển sang trang Tra cứu tiến độ ngay lập tức với mã phiếu
        navigate(`/track/${response.data.data.ticketCode}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border-t-4 border-brand-blue relative overflow-hidden">
        {/* Họa tiết trang trí lục giác */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-brand-blue mb-2">Đăng Ký Sửa Chữa</h1>
          <p className="text-slate-500">Điền thông tin máy để Lễ tân hỗ trợ bạn nhanh nhất</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Họ Tên *</label>
              <input required type="text" name="fullName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: Lê Hào" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại *</label>
              <input required type="tel" name="phone" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="0987..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Máy *</label>
              <input required type="text" name="deviceName" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: iPhone 13 Pro" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Số IMEI/Serial</label>
              <input type="text" name="serialImei" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="(Không bắt buộc)" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tình trạng lỗi *</label>
            <textarea required name="issueDescription" onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="Máy sạc không vào pin, bể màn hình..."></textarea>
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
                <span className="font-bold text-blue-900 text-sm">🎓 Tôi là Học sinh / Sinh viên (Giảm 15%)</span>
                <p className="text-xs text-slate-500 mt-0.5">Áp dụng cho học sinh, sinh viên tất cả các trường trên toàn quốc</p>
              </div>
            </label>

            {isStudent && (
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-blue-200/60">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trường ĐH / CĐ *</label>
                  <input 
                    type="text" 
                    required={isStudent}
                    list="vn-schools-intake"
                    placeholder="VD: ĐH Văn Hiến, Bách Khoa, Hutech..."
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                  />
                  <datalist id="vn-schools-intake">
                    <option value="Trường Đại học Văn Hiến (VHU)" />
                    <option value="Trường Đại học Bách Khoa - ĐHQG TP.HCM" />
                    <option value="Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM" />
                    <option value="Trường Đại học Kinh tế TP.HCM (UEH)" />
                    <option value="Trường Đại học Công nghệ TP.HCM (HUTECH)" />
                    <option value="Trường Đại học Văn Lang" />
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Khối Biên bản ngoại quan & Chụp/Tải ảnh máy */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              📸 Ảnh chụp tình trạng máy lúc tiếp nhận (Chống tranh chấp khiếu nại)
            </label>
            <p className="text-xs text-slate-500 mb-3">Tải ảnh chụp vết trầy xước, nứt vỡ hoặc tem niêm phong nếu có.</p>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoUpload} 
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-800 cursor-pointer"
            />
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {photos.map((p, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300">
                    <img src={p.duong_dan_anh} alt="Ngoại quan" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 text-xs opacity-80 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <SoftwarePackageSelector value={softwarePackage} onChange={setSoftwarePackage} />

          <button disabled={loading} type="submit" className="w-full py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2">
            {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU NGAY'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default IntakeForm;
