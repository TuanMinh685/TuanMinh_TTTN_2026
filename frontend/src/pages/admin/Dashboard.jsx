import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import QRCode from 'qrcode';

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
  const [partForm, setPartForm] = useState({ ten_linh_kien: '', gia_ban: '', so_luong: '0' });
  const [editingPartId, setEditingPartId] = useState(null);
  const [partFormError, setPartFormError] = useState('');
  const [savingPart, setSavingPart] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [receiptTicket, setReceiptTicket] = useState(null);
  const [receiptQr, setReceiptQr] = useState('');
  const [reportPeriod, setReportPeriod] = useState('week');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [latestNotice, setLatestNotice] = useState(null);
  const knownStatuses = useRef(null);

  const fetchStats = useCallback(async () => {
    const res = await api.get(`/admin/dashboard-stats?period=${reportPeriod}`);
    return res.data.data;
  }, [reportPeriod]);

  const fetchParts = useCallback(async () => {
    const res = await api.get('/tickets/parts');
    return res.data.data || [];
  }, []);

  const addPartToTicket = async () => {
    if (!selectedPartId || partQuantity < 1) return alert('Vui lòng chọn linh kiện và số lượng hợp lệ');
    try {
      await api.post(`/tickets/${selectedTicketId}/parts`, { partId: selectedPartId, quantity: partQuantity });
      alert('Thêm linh kiện thành công!');
      setShowPartModal(false);
      await refreshTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm linh kiện');
    }
  };

  const fetchTickets = useCallback(async () => {
    const res = await api.get('/tickets');
    return res.data.data || [];
  }, []);

  const fetchBookings = useCallback(async () => {
    const res = await api.get('/tickets/booking');
    return res.data.data || [];
  }, []);

  useEffect(() => {
    let active = true;
    const load = (request, setData, description) => {
      request()
        .then(data => {
          if (active) setData(data);
        })
        .catch(error => console.error(`Không tải được ${description}:`, error));
    };

    load(fetchTickets, setTickets, 'danh sách phiếu');
    if (role === 'LE_TAN' || role === 'QUAN_LY' || role === 'ADMIN') {
      load(fetchBookings, setBookings, 'danh sách lịch hẹn');
    }
    if (role === 'QUAN_LY' || role === 'ADMIN') {
      load(fetchStats, setStats, 'thống kê dashboard');
    }
    if (role === 'KY_THUAT_VIEN' || role === 'QUAN_LY' || role === 'ADMIN') {
      load(fetchParts, setParts, 'danh sách linh kiện');
    }

    /* Socket.io temporarily disabled for Vercel deployment */
    return () => {
      active = false;
    };
  }, [role, fetchTickets, fetchBookings, fetchStats, fetchParts]);

  useEffect(() => {
    const saved = localStorage.getItem('ticketNotifications');
    if (!saved) return;
    const timeoutId = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setNotifications(parsed.slice(0, 20));
      } catch (error) {
        console.error('Không đọc được thông báo đã lưu:', error);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    localStorage.setItem('ticketNotifications', JSON.stringify(notifications.slice(0, 20)));
  }, [notifications]);

  useEffect(() => {
    let active = true;
    const pollTicketStatuses = async () => {
      try {
        const latestTickets = await fetchTickets();
        if (!active) return;
        setTickets(latestTickets);
        const currentStatuses = new Map(latestTickets.map(ticket => [ticket.id, ticket.trang_thai]));
        if (knownStatuses.current) {
          const changedTickets = latestTickets.filter(ticket =>
            knownStatuses.current.has(ticket.id) &&
            knownStatuses.current.get(ticket.id) !== ticket.trang_thai
          );
          if (changedTickets.length) {
            const updates = changedTickets.map(ticket => ({
              id: `${ticket.id}-${Date.now()}`,
              ticketCode: ticket.ma_phieu,
              status: ticket.trang_thai,
              createdAt: new Date().toLocaleString('vi-VN')
            }));
            setNotifications(previous => [...updates, ...previous].slice(0, 20));
            setLatestNotice(updates[0]);
          }
        }
        knownStatuses.current = currentStatuses;
      } catch (error) {
        if (active) console.error('Không kiểm tra được cập nhật trạng thái phiếu:', error);
      }
    };

    pollTicketStatuses();
    const intervalId = window.setInterval(pollTicketStatuses, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchTickets]);

  useEffect(() => {
    if (!receiptTicket) {
      return;
    }

    let active = true;
    QRCode.toDataURL(`${window.location.origin}/track/${receiptTicket.ma_phieu}`, {
      width: 180,
      margin: 1
    }).then(dataUrl => {
      if (active) setReceiptQr(dataUrl);
    }).catch(error => {
      console.error('Không tạo được mã QR trên phiếu in:', error);
    });

    return () => {
      active = false;
    };
  }, [receiptTicket]);

  const refreshTickets = async () => {
    try {
      setTickets(await fetchTickets());
    } catch (error) {
      console.error('Không tải lại được danh sách phiếu:', error);
    }
  };

  const refreshBookings = async () => {
    try {
      setBookings(await fetchBookings());
    } catch (error) {
      console.error('Không tải lại được danh sách lịch hẹn:', error);
    }
  };

  const resetPartForm = () => {
    setPartForm({ ten_linh_kien: '', gia_ban: '', so_luong: '0' });
    setEditingPartId(null);
    setPartFormError('');
  };

  const editPart = (part) => {
    setEditingPartId(part.id);
    setPartForm({
      ten_linh_kien: part.ten_linh_kien,
      gia_ban: String(part.gia_ban),
      so_luong: String(part.so_luong)
    });
    setPartFormError('');
  };

  const savePart = async (event) => {
    event.preventDefault();
    const price = Number(partForm.gia_ban);
    const quantity = Number(partForm.so_luong);
    if (!partForm.ten_linh_kien.trim() || partForm.ten_linh_kien.trim().length > 150) {
      setPartFormError('Tên linh kiện cần có từ 1 đến 150 ký tự.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setPartFormError('Giá bán phải là số không âm.');
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setPartFormError('Số lượng tồn phải là số nguyên không âm.');
      return;
    }

    setSavingPart(true);
    setPartFormError('');
    const payload = {
      ten_linh_kien: partForm.ten_linh_kien.trim(),
      gia_ban: price,
      so_luong: quantity
    };

    try {
      if (editingPartId) {
        await api.patch(`/tickets/parts/${editingPartId}`, payload);
      } else {
        await api.post('/tickets/parts', payload);
      }
      setParts(await fetchParts());
      resetPartForm();
    } catch (err) {
      setPartFormError(err.response?.data?.message || 'Không lưu được linh kiện. Vui lòng thử lại.');
    } finally {
      setSavingPart(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/${id}/status`, { trang_thai: status });
      await refreshTickets();
    } catch (err) {
      console.error('Không cập nhật được trạng thái phiếu:', err);
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      await api.patch(`/tickets/booking/${id}/status`, { trang_thai: status });
      await refreshBookings();
    } catch (err) {
      console.error('Không cập nhật được trạng thái lịch hẹn:', err);
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
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNotifications(open => !open)}
            aria-expanded={showNotifications}
            aria-label={`Thông báo (${notifications.length})`}
            className="relative rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-brand-blue hover:bg-slate-50"
          >
            Thông báo
            {notifications.length > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{notifications.length}</span>
            )}
          </button>
          <button onClick={logout} className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600">Đăng Xuất</button>
          {showNotifications && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Trung tâm thông báo</h3>
                <button type="button" onClick={() => setNotifications([])} className="text-xs font-semibold text-brand-blue hover:underline">
                  Xóa tất cả
                </button>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {notifications.map(notification => (
                  <div key={notification.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <p className="font-semibold">Phiếu {notification.ticketCode}: {notification.status}</p>
                    <p className="mt-1 text-xs text-slate-500">{notification.createdAt}</p>
                  </div>
                ))}
                {notifications.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Chưa có thông báo mới.</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {latestNotice && (
        <div role="status" className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-xl bg-green-700 p-4 text-white shadow-xl">
          <p className="flex-1">Phiếu {latestNotice.ticketCode} vừa đổi trạng thái: {latestNotice.status}</p>
          <button type="button" onClick={() => setLatestNotice(null)} aria-label="Đóng thông báo" className="font-bold">×</button>
        </div>
      )}

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
          {(role === 'QUAN_LY' || role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`px-6 py-2 rounded font-bold ${activeTab === 'INVENTORY' ? 'bg-brand-blue text-white' : 'bg-slate-200 text-slate-600'}`}>
              Kho & Bảng Giá
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
                    <button
                      type="button"
                      onClick={() => { setReceiptQr(''); setReceiptTicket(ticket); }}
                      className="w-full rounded bg-slate-700 px-3 py-1 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      In phiếu 80mm
                    </button>
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-brand-blue">Báo cáo doanh thu & hiệu suất</h3>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Khoảng thời gian
              <select
                value={reportPeriod}
                onChange={event => setReportPeriod(Number(event.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="week">7 ngày gần nhất</option>
                <option value="month">Tháng này</option>
              </select>
            </label>
          </div>
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <span className="text-sm text-slate-600">Doanh thu linh kiện trong kỳ: </span>
            <strong className="text-lg text-brand-blue">{Number(stats.totalPartsRevenue || 0).toLocaleString('vi-VN')} đ</strong>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-4 border rounded-xl">
              <h4 className="font-bold mb-4 text-slate-600">{reportPeriod === 'week' ? 'Doanh thu 7 ngày gần nhất' : 'Doanh thu tháng này'}</h4>
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

      {activeTab === 'INVENTORY' && (role === 'QUAN_LY' || role === 'ADMIN') && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="rounded-xl border-t-4 border-brand-blue bg-white p-6 shadow">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold text-brand-blue">Kho linh kiện</h3>
                <p className="mt-1 text-sm text-slate-500">Cảnh báo tồn thấp khi số lượng còn dưới 5.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={partSearch}
                  onChange={event => setPartSearch(event.target.value)}
                  placeholder="Tìm tên linh kiện"
                  aria-label="Tìm tên linh kiện"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                />
                <select
                  value={stockFilter}
                  onChange={event => setStockFilter(event.target.value)}
                  aria-label="Lọc tình trạng tồn kho"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="ALL">Tất cả tồn kho</option>
                  <option value="LOW">Sắp hết (0-4)</option>
                  <option value="AVAILABLE">Còn hàng (5+)</option>
                </select>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Mã hàng</p>
                <p className="mt-1 text-2xl font-bold text-brand-blue">{parts.length}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-800">Mã hàng sắp hết</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {parts.filter(part => Number(part.so_luong) < 5).length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-sm text-slate-600">
                    <th className="px-3 py-3">Tên linh kiện</th>
                    <th className="px-3 py-3 text-right">Giá bán</th>
                    <th className="px-3 py-3 text-center">Tồn kho</th>
                    <th className="px-3 py-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {parts
                    .filter(part => part.ten_linh_kien.toLowerCase().includes(partSearch.toLowerCase()))
                    .filter(part => stockFilter === 'LOW'
                      ? Number(part.so_luong) < 5
                      : stockFilter === 'AVAILABLE'
                        ? Number(part.so_luong) >= 5
                        : true)
                    .map(part => (
                      <tr key={part.id} className="border-b border-slate-100">
                        <td className="px-3 py-3 font-semibold text-slate-700">{part.ten_linh_kien}</td>
                        <td className="px-3 py-3 text-right">{Number(part.gia_ban).toLocaleString('vi-VN')} đ</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            Number(part.so_luong) < 5 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {Number(part.so_luong) < 5 ? 'Sắp hết: ' : ''}{part.so_luong}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => editPart(part)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-brand-blue hover:bg-blue-100"
                          >
                            Sửa giá / tồn
                          </button>
                        </td>
                      </tr>
                    ))}
                  {parts.length === 0 && (
                    <tr><td colSpan="4" className="py-8 text-center text-slate-400">Chưa có linh kiện trong kho.</td></tr>
                  )}

                  {receiptTicket && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
                      <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between print:hidden">
                          <h3 className="text-lg font-bold text-brand-blue">Phiếu tiếp nhận / hóa đơn</h3>
                          <button type="button" onClick={() => setReceiptTicket(null)} className="rounded px-3 py-1 text-slate-600 hover:bg-slate-100">
                            Đóng
                          </button>
                        </div>
                        <div id="thermal-receipt" className="mx-auto w-full max-w-[72mm] border border-dashed border-slate-300 p-4 text-sm text-slate-900">
                          <div className="text-center">
                            <h1 className="text-base font-extrabold">HUNGHAU IT SUPPORT</h1>
                            <p className="mt-1 text-xs">PHIẾU TIẾP NHẬN / THANH TOÁN</p>
                            <p className="mt-2 text-lg font-bold">{receiptTicket.ma_phieu}</p>
                          </div>
                          <hr className="my-3 border-dashed border-slate-400" />
                          <p><strong>Ngày nhận:</strong> {receiptTicket.ngay_tao ? new Date(receiptTicket.ngay_tao).toLocaleString('vi-VN') : 'Chưa cập nhật'}</p>
                          <p className="mt-1"><strong>Khách hàng:</strong> {receiptTicket.ho_ten_khach}</p>
                          <p className="mt-1"><strong>Điện thoại:</strong> {receiptTicket.so_dien_thoai}</p>
                          <p className="mt-1"><strong>Thiết bị:</strong> {receiptTicket.ten_thiet_bi || 'Không có thông tin'}</p>
                          <p className="mt-1"><strong>Mô tả lỗi:</strong> {receiptTicket.mo_ta_loi}</p>
                          <p className="mt-1"><strong>Trạng thái:</strong> {receiptTicket.trang_thai}</p>
                          <hr className="my-3 border-dashed border-slate-400" />
                          <div className="flex justify-between gap-2 text-base font-extrabold">
                            <span>Tổng tiền</span>
                            <span>{Number(receiptTicket.tong_tien || 0).toLocaleString('vi-VN')} đ</span>
                          </div>
                          {receiptQr && (
                            <div className="mt-4 text-center">
                              <img src={receiptQr} alt={`QR tra cứu phiếu ${receiptTicket.ma_phieu}`} className="mx-auto h-32 w-32" />
                              <p className="mt-1 break-all text-[10px]">{window.location.origin}/track/{receiptTicket.ma_phieu}</p>
                            </div>
                          )}
                          <p className="mt-4 text-center text-xs">Cảm ơn quý khách đã sử dụng dịch vụ!</p>
                        </div>
                        <div className="mt-4 flex justify-end print:hidden">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            disabled={!receiptQr}
                            className="rounded-lg bg-brand-blue px-5 py-2 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                          >
                            In hóa đơn (80mm)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="h-fit rounded-xl border-t-4 border-brand-orange bg-white p-6 shadow">
            <h3 className="text-xl font-bold text-brand-blue">
              {editingPartId ? 'Cập nhật linh kiện' : 'Thêm linh kiện'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Thông tin giá và số lượng dùng chung cho kho và bảng giá công khai.</p>

            {partFormError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{partFormError}</p>
            )}

            <form onSubmit={savePart} className="mt-5 space-y-4">
              <div>
                <label htmlFor="part-name" className="mb-1 block text-sm font-semibold text-slate-700">Tên linh kiện *</label>
                <input
                  id="part-name"
                  required
                  maxLength={150}
                  value={partForm.ten_linh_kien}
                  onChange={event => setPartForm({ ...partForm, ten_linh_kien: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="part-price" className="mb-1 block text-sm font-semibold text-slate-700">Giá bán (VNĐ) *</label>
                <input
                  id="part-price"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={partForm.gia_ban}
                  onChange={event => setPartForm({ ...partForm, gia_ban: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="part-stock" className="mb-1 block text-sm font-semibold text-slate-700">Số lượng tồn *</label>
                <input
                  id="part-stock"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={partForm.so_luong}
                  onChange={event => setPartForm({ ...partForm, so_luong: event.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingPart}
                  className="flex-1 rounded-lg bg-brand-blue px-4 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {savingPart ? 'Đang lưu...' : editingPartId ? 'Lưu thay đổi' : 'Thêm vào kho'}
                </button>
                {editingPartId && (
                  <button
                    type="button"
                    onClick={resetPartForm}
                    className="rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
            </form>
          </section>
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
