import { useEffect, useState } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('TICKETS');
  const [stats, setStats] = useState({ revenueData: [], statusData: [] }); // TICKETS or BOOKINGS
  const [parts, setParts] = useState([]);
  const [showPartModal, setShowPartModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  useEffect(() => {
    fetchTickets();
    if (role === 'LE_TAN' || role === 'QUAN_LY' || role === 'ADMIN') { fetchBookings(); }
    if (role === 'QUAN_LY' || role === 'ADMIN') { fetchStats(); }
    if (role === 'KY_THUAT_VIEN') fetchParts();

    /* Socket.io temporarily disabled for Vercel deployment */
  }, [role]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard-stats');
      setStats(res.data.data);
    } catch (err) {}
  };

  const fetchParts = async () => {
    try {
      const res = await api.get('/tickets/parts');
      setParts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addPartToTicket = async () => {
    if (!selectedPartId || partQuantity < 1) return alert('Vui lòng chọn linh kiện và số lượng hợp lệ');
    try {
      await api.post(`/tickets/${selectedTicketId}/parts`, { partId: selectedPartId, quantity: partQuantity });
      alert('Thêm linh kiện thành công!');
      setShowPartModal(false);
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm linh kiện');
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/tickets/booking');
      setBookings(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}/status`, { trang_thai: status });
      fetchTickets();
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/booking/${id}/status`, { trang_thai: status });
      fetchBookings();
    } catch (err) {
      alert('Lỗi cập nhật lịch hẹn');
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-blue">
            Bảng điều khiển - {role === 'LE_TAN' ? 'Lễ Tân' : (role === 'QUAN_LY' || role === 'ADMIN') ? 'Quản Lý' : 'Kỹ Thuật Viên'}
          </h2>
          <p className="text-slate-500">Xin chào, {fullName}</p>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded font-bold hover:bg-red-600">Đăng Xuất</button>
      </div>

      {(role === 'LE_TAN' || role === 'QUAN_LY' || role === 'ADMIN') && (
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => setActiveTab('TICKETS')}
            className={`px-6 py-2 rounded font-bold ${activeTab === 'TICKETS' ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
            Phiếu Yêu Cầu
          </button>
          <button 
            onClick={() => setActiveTab('BOOKINGS')}
            className={`px-6 py-2 rounded font-bold ${activeTab === 'BOOKINGS' ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
            Lịch Hẹn Khách Hàng
          </button>
          {(role === 'QUAN_LY' || role === 'ADMIN') && (
            <button 
              onClick={() => setActiveTab('STATS')}
              className={`px-6 py-2 rounded font-bold ${activeTab === 'STATS' ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
              Thống Kê Doanh Thu
            </button>
          )}
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-brand-green">
          <h3 className="text-xl font-bold mb-4">Danh sách phiếu yêu cầu</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4">Mã Phiếu</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Lỗi mô tả</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-brand-blue">{ticket.ma_phieu}</td>
                  <td className="py-3 px-4">{ticket.ho_ten_khach} <br/><span className="text-xs text-slate-400">{ticket.so_dien_thoai}</span></td>
                  <td className="py-3 px-4">{ticket.mo_ta_loi}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      ticket.trang_thai === 'CHỜ_KHÁM' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' ? 'bg-orange-100 text-orange-700' :
                      ticket.trang_thai === 'ĐANG_SỬA' ? 'bg-blue-100 text-blue-700' :
                      ticket.trang_thai === 'ĐÃ_SỬA_XONG' ? 'bg-green-100 text-green-700' : 
                      ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.trang_thai.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-red-500 text-right">{Number(ticket.tong_tien || 0).toLocaleString('vi-VN')} đ</td>
                  <td className="py-3 px-4 text-center space-y-2 flex flex-col items-center">
                    {role === 'LE_TAN' && ticket.trang_thai === 'CHỜ_KHÁM' && (
                      <button onClick={() => updateStatus(ticket.id, 'ĐANG_CHUẨN_ĐOÁN')} className="bg-brand-orange text-white px-3 py-1 rounded font-bold text-sm w-full">Chuyển Kỹ Thuật</button>
                    )}
                    {role === 'LE_TAN' && ticket.trang_thai === 'ĐÃ_SỬA_XONG' && (
                      <button onClick={() => updateStatus(ticket.id, 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN')} className="bg-purple-500 text-white px-3 py-1 rounded font-bold text-sm w-full">Giao Khách</button>
                    )}
                    {role === 'KY_THUAT_VIEN' && ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' && (
                      <button onClick={() => updateStatus(ticket.id, 'ĐANG_SỬA')} className="bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm w-full">Tiến hành Sửa</button>
                    )}
                    {role === 'KY_THUAT_VIEN' && ticket.trang_thai === 'ĐANG_SỬA' && (
                      <>
                        <button onClick={() => { setSelectedTicketId(ticket.id); setShowPartModal(true); }} className="bg-yellow-500 text-white px-3 py-1 rounded font-bold text-sm w-full mb-2">Thêm Linh Kiện</button>
                        <button onClick={() => updateStatus(ticket.id, 'ĐÃ_SỬA_XONG')} className="bg-brand-green text-white px-3 py-1 rounded font-bold text-sm w-full">Sửa Xong</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Không có phiếu nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'STATS' && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-purple-500">
          <h3 className="text-xl font-bold mb-6 text-brand-blue">Biểu Đồ Thống Kê Doanh Thu & Hiệu Suất</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 border rounded-xl">
              <h4 className="font-bold mb-4 text-slate-600">Doanh thu 7 ngày qua</h4>
              <BarChart width={500} height={300} data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('vi-VN')} />
                <YAxis />
                <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN') + ' đ'} />
                <Bar dataKey="total_revenue" fill="#1a7f45" />
              </BarChart>
            </div>
            <div className="p-4 border rounded-xl flex flex-col items-center">
              <h4 className="font-bold mb-4 text-slate-600">Tỷ lệ Trạng thái (Phiếu)</h4>
              <PieChart width={400} height={300}>
                <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#64748b'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'BOOKINGS' && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-brand-orange">
          <h3 className="text-xl font-bold mb-4">Lịch hẹn chưa xử lý / Sắp tới</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4">Ngày / Giờ Hẹn</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Lỗi mô tả</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(bk => (
                <tr key={bk.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-brand-blue">
                    {new Date(bk.ngay_hen).toLocaleDateString('vi-VN')} <br/>
                    <span className="text-red-500">{bk.gio_hen}</span>
                  </td>
                  <td className="py-3 px-4">{bk.ho_ten_khach} <br/><span className="text-xs text-slate-400">{bk.so_dien_thoai}</span></td>
                  <td className="py-3 px-4">{bk.mo_ta_loi}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      bk.trang_thai === 'CHO_XAC_NHAN' ? 'bg-yellow-100 text-yellow-700' :
                      bk.trang_thai === 'DA_XAC_NHAN' ? 'bg-blue-100 text-blue-700' :
                      bk.trang_thai === 'KHACH_DA_DEN' ? 'bg-green-100 text-green-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {bk.trang_thai === 'CHO_XAC_NHAN' ? 'CHỜ XÁC NHẬN' : 
                       bk.trang_thai === 'DA_XAC_NHAN' ? 'ĐÃ XÁC NHẬN' : 
                       bk.trang_thai === 'KHACH_DA_DEN' ? 'KHÁCH ĐÃ ĐẾN' : 'ĐÃ HỦY'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-y-2 flex flex-col items-center">
                    {bk.trang_thai === 'CHO_XAC_NHAN' && (
                      <>
                        <button onClick={() => updateBookingStatus(bk.id, 'DA_XAC_NHAN')} className="bg-brand-blue text-white px-3 py-1 rounded font-bold text-sm w-full">Gọi & Chốt</button>
                        <button onClick={() => updateBookingStatus(bk.id, 'HUY')} className="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm w-full">Hủy Lịch</button>
                      </>
                    )}
                    {bk.trang_thai === 'DA_XAC_NHAN' && (
                      <button onClick={() => updateBookingStatus(bk.id, 'KHACH_DA_DEN')} className="bg-brand-green text-white px-3 py-1 rounded font-bold text-sm w-full">Khách Đã Đến</button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Không có lịch hẹn nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    
      {/* Modal Thêm Linh Kiện */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 max-w-[90%] shadow-2xl">
            <h3 className="text-xl font-bold text-brand-blue mb-4">Thêm Linh Kiện / Dịch Vụ</h3>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Chọn linh kiện:</label>
              <select 
                value={selectedPartId} 
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none"
              >
                <option value="">-- Chọn --</option>
                {parts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.ten_linh_kien} - {Number(p.gia_ban).toLocaleString('vi-VN')}đ (Tồn: {p.so_luong})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng:</label>
              <input 
                type="number" 
                min="1" 
                value={partQuantity} 
                onChange={(e) => setPartQuantity(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPartModal(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300">Hủy</button>
              <button onClick={addPartToTicket} className="flex-1 py-2 bg-brand-blue text-white font-bold rounded hover:bg-blue-700">Xác Nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

