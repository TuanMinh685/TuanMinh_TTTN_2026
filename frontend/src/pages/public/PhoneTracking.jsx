import React, { useState } from 'react';

import { Link } from 'react-router-dom';
import api from '../../services/api';

function PhoneTracking() {
  const [phone, setPhone] = useState('');
  const [tickets, setTickets] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [reviewData, setReviewData] = useState({ ticketCode: null, so_sao: 5, nhan_xet: '' });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/public/track/phone/${phone}`);
      setTickets(res.data.data || []);
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="flex flex-col items-center">
             <img src="/img/logo-HHH-26.png" alt="HungHau Logo" className="h-10 object-contain" />
             <span className="text-[10px] text-brand-orange font-bold tracking-widest leading-none mt-1">IT SUPPORT</span>
          </Link>
          <Link to="/" className="text-brand-blue font-bold hover:underline">Về trang chủ</Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-brand-blue mb-4">Tra Cứu Tiến Độ Sửa Chữa</h1>
          <p className="text-slate-500">Nhập số điện thoại của bạn để xem danh sách các thiết bị đang được bảo hành / sửa chữa.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-8 border-brand-green p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <input 
              type="tel" 
              required 
              placeholder="Nhập số điện thoại (VD: 0901234567)"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:border-brand-blue focus:ring focus:ring-blue-200 outline-none text-lg"
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-brand-blue text-white font-bold text-lg rounded-lg hover:bg-blue-700 shadow-lg transition-all disabled:opacity-50 whitespace-nowrap">
              {loading ? 'Đang tìm...' : 'Tra Cứu'}
            </button>
          </form>
        </div>

        {hasSearched && !loading && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-slate-700 mb-4">Kết quả tìm kiếm cho SĐT: {phone}</h3>
            
            {tickets.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center border border-slate-100">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-slate-500">Không tìm thấy thiết bị nào đang sửa chữa với số điện thoại này.</p>
              </div>
            ) : (
              tickets.map((ticket, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl shadow-md border border-slate-100 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-lg text-brand-blue">{ticket.ten_may}</h4>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">Mã: {ticket.ma_tra_cuu}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Lỗi báo: {ticket.tinh_trang_may}</p>
                    
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        ticket.trang_thai === 'CHỜ_KHÁM' ? 'bg-yellow-100 text-yellow-700' :
                        ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' ? 'bg-orange-100 text-orange-700' :
                        ticket.trang_thai === 'ĐANG_SỬA' ? 'bg-blue-100 text-blue-700' :
                        ticket.trang_thai === 'ĐÃ_SỬA_XONG' ? 'bg-green-100 text-green-700' : 
                        ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {ticket.trang_thai.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <Link 
                    to={`/track/${ticket.ma_tra_cuu}`} 
                    className="px-6 py-2 bg-brand-green/10 text-brand-green font-bold rounded-lg hover:bg-brand-green hover:text-white transition-colors whitespace-nowrap">
                    Xem chi tiết tiến độ
                  </Link>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default PhoneTracking;
