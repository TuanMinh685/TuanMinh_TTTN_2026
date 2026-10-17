import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import SoftwarePackageSelector from '../../components/SoftwarePackageSelector';

function OnlineIntakeForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    deviceName: '',
    ultraviewerCode: '',
    issueDescription: '',
    loaiDichVu: 'ONLINE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [softwarePackage, setSoftwarePackage] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Gọi API Tiếp nhận máy
      const response = await api.post('/tickets/intake', {
        ...formData,
        isStudent,
        schoolName: isStudent ? schoolName.trim() : null,
        studentId: isStudent ? studentId.trim() : null,
        issueDescription: softwarePackage
          ? `${formData.issueDescription}\nGói phần mềm yêu cầu: ${softwarePackage}`
          : formData.issueDescription
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
          <h1 className="text-3xl font-bold text-brand-blue mb-2">Cấp Cứu Phần Mềm (Online)</h1>
          <p className="text-slate-500">Kỹ thuật viên sẽ Remote điều khiển máy bạn từ xa để kiểm tra</p>
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
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mã UltraViewer / TeamViewer</label>
              <input type="text" name="ultraviewerCode" onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="VD: 12 345 678 - 1234" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả tình trạng lỗi *</label>
            <textarea required name="issueDescription" onChange={handleChange} rows="3" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/50" placeholder="Máy sạc không vào pin, bể màn hình..."></textarea>
          </div>

          {/* Ưu đãi Sinh viên toàn quốc (-15%) */}
          <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isStudent} 
                onChange={e => setIsStudent(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" 
              />
              <span className="font-bold text-slate-800 text-sm">
                🎓 Bạn là Học sinh / Sinh viên toàn quốc? <span className="text-emerald-700 font-extrabold">(Giảm ngay 15%)</span>
              </span>
            </label>

            {isStudent && (
              <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trường ĐH / CĐ *</label>
                  <input 
                    type="text" 
                    required={isStudent}
                    list="vn-schools-online"
                    placeholder="VD: ĐH Văn Hiến, Bách Khoa, UEH..."
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-blue outline-none bg-white"
                  />
                  <datalist id="vn-schools-online">
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

          <SoftwarePackageSelector value={softwarePackage} onChange={setSoftwarePackage} />

          <button disabled={loading} type="submit" className="w-full py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2">
            {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU NGAY'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OnlineIntakeForm;
