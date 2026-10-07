import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Gọi API Tiếp nhận máy
      const response = await api.post('/tickets/intake', formData);
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

          <button disabled={loading} type="submit" className="w-full py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2">
            {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU NGAY'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OnlineIntakeForm;
