import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Pricing() {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/public/pricing')
      .then(response => {
        if (active) setParts(response.data.data || []);
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || 'Không tải được bảng giá.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredParts = parts.filter(part =>
    part.ten_linh_kien.toLowerCase().includes(search.toLowerCase())
  );

  const handleBookService = (serviceName) => {
    navigate('/dat-lich', { state: { serviceName } });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-blue mb-4">Bảng Giá Dịch Vụ & Linh Kiện</h1>
          <p className="text-slate-500 text-lg">Cam kết giá cả minh bạch - Không phát sinh chi phí ẩn - Linh kiện chính hãng</p>
        </div>

        {/* Banner Trợ giá Học sinh - Sinh viên toàn quốc */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white rounded-2xl p-6 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 text-9xl">🎓</div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-900 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                ★ Ưu đãi học đường toàn quốc
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Giảm ngay 15% Cho Tất Cả Học Sinh - Sinh Viên Các Trường ĐH / CĐ
              </h2>
              <p className="text-blue-100 text-sm max-w-2xl">
                Áp dụng cho sinh viên toàn bộ các trường (VHU, Bách Khoa, KHTN, UEH, HUTECH, Văn Lang, IUH, Tôn Đức Thắng...) khi xuất trình thẻ SV hoặc nhập MSSV khi đặt lịch!
              </p>
            </div>
            <button 
              onClick={() => navigate('/dat-lich')}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl whitespace-nowrap shadow-lg transition-transform hover:scale-105"
            >
              Đặt lịch nhận ưu đãi →
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t-4 border-brand-orange">
          <div className="flex-1 w-full">
             <input 
               type="text" 
               placeholder="🔍 Tìm kiếm linh kiện, dịch vụ (VD: Màn hình, Pin, Cài win...)" 
               className="w-full px-6 py-4 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-brand-blue text-lg outline-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-red-700">
            {error}
          </div>
        )}

        {loading && <p className="py-10 text-center text-slate-500 font-semibold">Đang tải bảng giá dịch vụ...</p>}

        {/* Bảng giá */}
        {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-blue text-white">
                <th className="py-4 px-6 text-lg">Tên Dịch Vụ / Linh Kiện</th>
                <th className="py-4 px-6 text-lg text-right w-40">Giá Niêm Yết</th>
                <th className="py-4 px-6 text-lg text-right w-44 text-amber-300">Giá Sinh Viên (-15%)</th>
                <th className="py-4 px-6 text-lg text-center w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length > 0 ? filteredParts.map((item, idx) => {
                const regularPrice = Number(item.gia_ban);
                const studentPrice = Math.round(regularPrice * 0.85);
                return (
                  <tr key={item.id} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{item.ten_linh_kien}</div>
                      <div className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5">
                        <span>🛡️ Bảo hành chính hãng 12 - 36 tháng</span>
                        <span className="text-slate-300">•</span>
                        <span>Serial/IMEI kiểm soát</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-400 text-base line-through whitespace-nowrap">
                      {regularPrice.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-brand-orange text-lg whitespace-nowrap">
                      <div>{studentPrice.toLocaleString('vi-VN')} đ</div>
                      <span className="inline-block text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">🎓 Tiết kiệm 15%</span>
                    </td>
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleBookService(item.ten_linh_kien)}
                        className="px-4 py-2 bg-brand-green/10 text-brand-green font-bold text-sm rounded-lg hover:bg-brand-green hover:text-white transition-colors"
                      >
                        Đặt lịch →
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400 text-lg">
                    {parts.length === 0
                      ? 'Chưa có dịch vụ hoặc linh kiện trong bảng giá.'
                      : 'Không tìm thấy dịch vụ hoặc linh kiện phù hợp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}

      </div>
    </div>
  );
}

export default Pricing;
