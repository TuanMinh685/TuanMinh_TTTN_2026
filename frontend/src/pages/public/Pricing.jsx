import { useEffect, useState } from 'react';
import api from '../../services/api';

function Pricing() {
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

  return (
    <div className="bg-slate-50 min-h-screen py-16 font-sans">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-blue mb-4">Bảng Giá Dịch Vụ & Linh Kiện</h1>
          <p className="text-slate-500 text-lg">Cam kết giá cả minh bạch - Không phát sinh chi phí ẩn - Linh kiện chính hãng</p>
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

        {loading && <p className="py-10 text-center text-slate-500">Đang tải bảng giá...</p>}

        {/* Bảng giá */}
        {!loading && !error && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-blue text-white">
                <th className="py-4 px-6 text-lg">Tên Dịch Vụ / Linh Kiện</th>
                <th className="py-4 px-6 text-lg text-right w-48">Giá Tham Khảo</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length > 0 ? filteredParts.map((item, idx) => (
                <tr key={item.id} className={`border-b border-slate-100 hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="py-4 px-6 font-semibold text-slate-700">{item.ten_linh_kien}</td>
                  <td className="py-4 px-6 text-right font-bold text-brand-orange text-lg">
                    {Number(item.gia_ban).toLocaleString('vi-VN')} đ
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="2" className="py-12 text-center text-slate-400 text-lg">
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
