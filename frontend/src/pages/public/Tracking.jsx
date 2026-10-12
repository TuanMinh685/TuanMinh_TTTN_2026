import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

function Tracking() {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTicket = useCallback(
    () => api.get(`/public/track/${ticketCode}`),
    [ticketCode]
  );

  useEffect(() => {
    let active = true;

    fetchTicket()
      .then(response => {
        if (active && response.data.success) setTicket(response.data.data);
      })
      .catch(err => {
        if (active) setError(err.response?.data?.message || 'Không tìm thấy thông tin phiếu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchTicket]);

  const handleApproveQuote = async (isApproved) => {
    try {
      setLoading(true);
      const response = await api.post(`/public/track/${ticketCode}/approve-quote`, { isApproved });
      if (response.data.success) {
        alert(isApproved ? 'Cảm ơn bạn đã đồng ý sửa chữa!' : 'Bạn đã từ chối báo giá.');
        try {
          const ticketResponse = await fetchTicket();
          if (ticketResponse.data.success) setTicket(ticketResponse.data.data);
        } catch (refreshError) {
          console.error('Không tải lại được thông tin phiếu sau khi xác nhận báo giá:', refreshError);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !ticket) return <div className="text-center mt-20">Đang tải thông tin...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 font-bold">{error}</div>;
  if (!ticket) return null;

  // Render theo phong cách Điện Thoại Vui x Lục Giác
  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 mb-6 flex gap-2 items-center">
        <span>Trang chủ</span> <span className="text-xs">▶</span> 
        <span>Tra cứu phiếu</span> <span className="text-xs">▶</span> 
        <span className="text-brand-blue font-semibold">{ticketCode}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hình ảnh mô phỏng Lục Giác */}
        <div className="bg-slate-100 rounded-2xl flex items-center justify-center p-12 relative overflow-hidden h-96">
          <div className="w-64 h-64 bg-brand-blue/10 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
            <span className="text-6xl text-brand-blue font-bold opacity-30">LG</span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl text-center shadow-sm border border-white">
            <h3 className="font-bold text-slate-800">{ticket.ten_thiet_bi}</h3>
            <p className="text-sm text-slate-500">Mã: {ticket.so_imei || 'Không có'}</p>
          </div>
        </div>

        {/* Thông tin Báo giá (Phong cách Điện Thoại Vui) */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Sửa chữa {ticket.ten_thiet_bi}
          </h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-yellow-400 text-xl">★★★★★</span>
            <span className="text-sm text-brand-blue underline cursor-pointer">15 đánh giá</span>
          </div>

          <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 mb-6 relative">
            <div className="absolute top-0 right-0 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              TRẠNG THÁI: {ticket.trang_thai}
            </div>
            
            <p className="text-slate-600 mb-1">Mô tả bệnh: <span className="font-semibold text-slate-800">{ticket.mo_ta_loi}</span></p>
            
            {ticket.trang_thai !== 'CHỜ_TIẾP_NHẬN' && ticket.trang_thai !== 'CHỜ_KHÁM' && ticket.bao_gia && (
              <div className="mt-4">
                <p className="text-slate-500 text-sm mb-1">KTV báo lỗi: {ticket.loi_thuc_te}</p>
                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-4xl font-bold text-brand-orange">
                    {Number(ticket.bao_gia).toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="text-slate-400 line-through text-lg">
                    {(Number(ticket.bao_gia) + 500000).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <p className="text-green-600 text-sm font-semibold mt-1 flex items-center gap-1">
                  ✓ Cam kết giá rẻ nhất thị trường
                </p>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex gap-3 items-center p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
              <div className="w-10 h-10 bg-brand-blue/10 flex items-center justify-center text-brand-blue" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>🛡️</div>
              <span className="text-sm font-medium text-slate-700">Bảo hành 6 tháng</span>
            </div>
            <div className="flex gap-3 items-center p-3 border border-slate-100 rounded-xl bg-white shadow-sm">
              <div className="w-10 h-10 bg-brand-blue/10 flex items-center justify-center text-brand-blue" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>⚡</div>
              <span className="text-sm font-medium text-slate-700">Sửa siêu tốc 1h</span>
            </div>
          </div>

          {/* Call to Action */}
          {ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ' ? (
            <div className="flex gap-4">
              <button 
                onClick={() => handleApproveQuote(true)}
                disabled={loading}
                className="flex-1 py-4 bg-brand-orange hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 text-lg uppercase"
              >
                Đồng Ý Sửa Ngay
              </button>
              <button 
                onClick={() => handleApproveQuote(false)}
                disabled={loading}
                className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-xl transition-all uppercase"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="w-full py-4 bg-slate-100 text-slate-500 font-semibold rounded-xl text-center">
              Phiếu đang ở trạng thái: {ticket.trang_thai}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Tracking;
