import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import { SOFTWARE_PACKAGE_GROUPS, SOFTWARE_PACKAGE_OPTIONS } from '../../components/softwarePackages';

function Dashboard() {
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('TICKETS');
  const [stats, setStats] = useState({ revenueData: [], statusData: [], totalRevenue: 0, completedTickets: 0, totalPartsRevenue: 0 });
  const [ticketSearch, setTicketSearch] = useState('');
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
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [receiptTicket, setReceiptTicket] = useState(null);
  const [receiptQr, setReceiptQr] = useState('');
  const [receiptParts, setReceiptParts] = useState([]);
  const [receiptPartsLoading, setReceiptPartsLoading] = useState(false);
  const [receiptPartsError, setReceiptPartsError] = useState('');
  const [reportPeriod, setReportPeriod] = useState('week');
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketNotifications');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 50).map(item => ({ ...item, read: item.read ?? true })) : [];
    } catch (error) {
      console.error('Không đọc được thông báo đã lưu:', error);
      return [];
    }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState('ALL');
  const [latestNotice, setLatestNotice] = useState(null);
  const [selectedSoftwareTicketId, setSelectedSoftwareTicketId] = useState('');
  const [selectedSoftwareGroup, setSelectedSoftwareGroup] = useState('ALL');
  const [selectedSoftwarePackages, setSelectedSoftwarePackages] = useState([]);
  const [savingSoftwarePackages, setSavingSoftwarePackages] = useState(false);
  const [softwarePackageError, setSoftwarePackageError] = useState('');
  const knownStatuses = useRef(null);
  const knownBookingStatuses = useRef(null);
  const knownStock = useRef(null);

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
    try {
      localStorage.setItem('ticketNotifications', JSON.stringify(notifications.slice(0, 50)));
    } catch (error) {
      console.error('Không lưu được lịch sử thông báo:', error);
    }
  }, [notifications]);

  useEffect(() => {
    let active = true;
    const pushNotifications = (updates) => {
      if (updates.length === 0) return;
      setNotifications(previous => [...updates, ...previous].slice(0, 50));
      setLatestNotice(updates[0]);
    };
    const pollDashboardEvents = async () => {
      try {
        const [latestTickets, latestBookings, latestParts] = await Promise.all([
          fetchTickets(),
          role === 'LE_TAN' || role === 'QUAN_LY' || role === 'ADMIN' ? fetchBookings() : Promise.resolve(null),
          role === 'KY_THUAT_VIEN' || role === 'QUAN_LY' || role === 'ADMIN' ? fetchParts() : Promise.resolve(null)
        ]);
        if (!active) return;
        setTickets(latestTickets);

        const now = new Date().toLocaleString('vi-VN');
        const updates = [];
        const currentStatuses = new Map(latestTickets.map(ticket => [ticket.id, ticket.trang_thai]));
        if (knownStatuses.current) {
          latestTickets.forEach(ticket => {
            const previousStatus = knownStatuses.current.get(ticket.id);
            const isNewTicket = !knownStatuses.current.has(ticket.id);
            if (isNewTicket || previousStatus !== ticket.trang_thai) {
              updates.push({
                id: `ticket-${ticket.id}-${Date.now()}-${updates.length}`,
                type: 'ticket',
                ticketCode: ticket.ma_phieu,
                status: ticket.trang_thai,
                title: isNewTicket ? 'Phiếu sửa chữa mới' : 'Phiếu đã cập nhật trạng thái',
                description: `Phiếu ${ticket.ma_phieu} — ${ticket.trang_thai.replace(/_/g, ' ')}`,
                createdAt: now,
                read: false
              });
            }
          });
        }
        knownStatuses.current = currentStatuses;

        if (latestBookings) {
          setBookings(latestBookings);
          const currentBookingStatuses = new Map(latestBookings.map(booking => [booking.id, booking.trang_thai]));
          if (knownBookingStatuses.current) {
            latestBookings.forEach(booking => {
              const previousStatus = knownBookingStatuses.current.get(booking.id);
              const isNewBooking = !knownBookingStatuses.current.has(booking.id);
              if (isNewBooking || previousStatus !== booking.trang_thai) {
                updates.push({
                  id: `booking-${booking.id}-${Date.now()}-${updates.length}`,
                  type: 'booking',
                  title: isNewBooking ? 'Lịch hẹn mới được tiếp nhận' : 'Lịch hẹn được cập nhật',
                  description: `${booking.ho_ten_khach} — ${booking.trang_thai.replace(/_/g, ' ')}`,
                  createdAt: now,
                  read: false
                });
              }
            });
          }
          knownBookingStatuses.current = currentBookingStatuses;
        }

        if (latestParts) {
          setParts(latestParts);
          const currentStock = new Map(latestParts.map(part => [part.id, Number(part.so_luong)]));
          if (knownStock.current) {
            latestParts.forEach(part => {
              const quantity = Number(part.so_luong);
              const previousQuantity = knownStock.current.get(part.id);
              if (previousQuantity !== undefined && previousQuantity >= Number(lowStockThreshold || 5) &&
                  quantity < Number(lowStockThreshold || 5)) {
                updates.push({
                  id: `stock-${part.id}-${Date.now()}-${updates.length}`,
                  type: 'stock',
                  title: quantity <= 0 ? 'Linh kiện đã hết hàng' : 'Cảnh báo linh kiện sắp hết',
                  description: `${part.ten_linh_kien} — còn ${quantity} chiếc`,
                  createdAt: now,
                  read: false
                });
              }
            });
          }
          knownStock.current = currentStock;
        }
        pushNotifications(updates);
      } catch (error) {
        if (active) console.error('Không kiểm tra được cập nhật phiếu, lịch hẹn và tồn kho:', error);
      }
    };

    pollDashboardEvents();
    const intervalId = window.setInterval(pollDashboardEvents, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchTickets, fetchBookings, fetchParts, lowStockThreshold, role]);

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
    api.get(`/tickets/${receiptTicket.id}/parts`)
      .then(response => {
        if (active) setReceiptParts(response.data.data || []);
      })
      .catch(error => {
        console.error('Không tải được chi tiết linh kiện trên phiếu in:', error);
        if (active) setReceiptPartsError('Không tải được chi tiết linh kiện. Vui lòng đóng phiếu và thử lại.');
      })
      .finally(() => {
        if (active) setReceiptPartsLoading(false);
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

  const selectSoftwareTicket = (ticketId) => {
    setSelectedSoftwareTicketId(ticketId);
    const ticket = tickets.find(item => String(item.id) === ticketId);
    setSelectedSoftwarePackages(ticket?.software_packages || []);
    setSoftwarePackageError('');
  };

  const toggleSoftwarePackage = (packageName) => {
    setSelectedSoftwarePackages(previous => previous.includes(packageName)
      ? previous.filter(item => item !== packageName)
      : [...previous, packageName]);
  };

  const saveSoftwarePackages = async () => {
    if (!selectedSoftwareTicketId) {
      setSoftwarePackageError('Vui lòng chọn phiếu sửa chữa.');
      return;
    }

    setSavingSoftwarePackages(true);
    setSoftwarePackageError('');
    try {
      const response = await api.patch(`/tickets/${selectedSoftwareTicketId}/software-packages`, {
        packages: selectedSoftwarePackages
      });
      const savedPackages = response.data.data.softwarePackages || [];
      setTickets(previous => previous.map(ticket => String(ticket.id) === selectedSoftwareTicketId
        ? { ...ticket, software_packages: savedPackages }
        : ticket));
      setSelectedSoftwarePackages(savedPackages);
      setNotifications(previous => [{
        id: `software-${selectedSoftwareTicketId}-${Date.now()}`,
        type: 'software',
        title: 'Đã cập nhật gói phần mềm',
        description: `Phiếu ${tickets.find(ticket => String(ticket.id) === selectedSoftwareTicketId)?.ma_phieu || ''} — ${savedPackages.length ? savedPackages.join(', ') : 'đã xóa lựa chọn gói'}`,
        createdAt: new Date().toLocaleString('vi-VN'),
        read: false
      }, ...previous].slice(0, 50));
    } catch (error) {
      setSoftwarePackageError(error.response?.data?.message || 'Không lưu được các gói phần mềm. Vui lòng thử lại.');
    } finally {
      setSavingSoftwarePackages(false);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(previous => previous.map(notification => ({ ...notification, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setLatestNotice(null);
  };

  const resetPartForm = () => {
    setPartForm({ ten_linh_kien: '', gia_ban: '', so_luong: '0' });
    setEditingPartId(null);
    setPartFormError('');
    setShowInventoryForm(false);
  };

  const editPart = (part) => {
    setEditingPartId(part.id);
    setPartForm({
      ten_linh_kien: part.ten_linh_kien,
      gia_ban: String(part.gia_ban),
      so_luong: String(part.so_luong)
    });
    setPartFormError('');
    setShowInventoryForm(true);
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

  const unreadNotificationCount = notifications.filter(notification => !notification.read).length;
  const filteredTickets = tickets.filter(ticket => [
    ticket.ma_phieu,
    ticket.ho_ten_khach,
    ticket.so_dien_thoai,
    ticket.ten_thiet_bi,
    ticket.trang_thai
  ].some(value => String(value || '').toLocaleLowerCase('vi').includes(ticketSearch.trim().toLocaleLowerCase('vi'))));
  const receiptTotal = Number(receiptTicket?.tong_tien || 0);
  const receiptPartsTotal = receiptParts.reduce((total, item) => total + Number(item.so_luong) * Number(item.don_gia), 0);
  const receiptServiceTotal = Math.max(receiptTotal - receiptPartsTotal, 0);

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
            aria-label={`Thông báo (${unreadNotificationCount})`}
            className="relative rounded-lg border border-slate-200 bg-white px-4 py-2 font-bold text-brand-blue hover:bg-slate-50"
          >
            Thông báo
            {unreadNotificationCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{unreadNotificationCount}</span>
            )}
          </button>
          <button onClick={logout} className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-600">Đăng Xuất</button>
          {showNotifications && (
            <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Trung tâm thông báo</h3>
                <button type="button" onClick={clearNotifications} className="text-xs font-semibold text-brand-blue hover:underline">
                  Xóa tất cả
                </button>
              </div>
              <button type="button" onClick={markAllNotificationsRead} className="mb-2 text-xs font-semibold text-brand-blue hover:underline">
                Đánh dấu tất cả đã đọc
              </button>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {notifications.map(notification => (
                  <div key={notification.id} className={`rounded-lg p-3 text-sm ${notification.read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                    <p className="font-semibold">{notification.title || `Phiếu ${notification.ticketCode}: ${notification.status}`}</p>
                    {notification.description && <p className="mt-1 text-slate-700">{notification.description}</p>}
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
          <p className="flex-1">{latestNotice.description || latestNotice.title}</p>
          <button type="button" onClick={() => setLatestNotice(null)} aria-label="Đóng thông báo" className="font-bold">×</button>
        </div>
      )}

      {(role === 'LE_TAN' || role === 'QUAN_LY' || role === 'ADMIN') && (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('TICKETS')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'TICKETS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Phiếu sửa chữa
          </button>
          <button 
            onClick={() => setActiveTab('BOOKINGS')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'BOOKINGS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Lịch hẹn
          </button>
          {(role === 'QUAN_LY' || role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('INVENTORY')}
              className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'INVENTORY' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
              Kho linh kiện
            </button>
          )}
          {(role === 'QUAN_LY' || role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('SOFTWARE')}
              className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'SOFTWARE' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
              Gói phần mềm
            </button>
          )}
          {(role === 'QUAN_LY' || role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('STATS')}
              className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'STATS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
              Báo cáo
            </button>
          )}
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'NOTIFICATIONS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            Thông báo{notifications.length > 0 ? ` (${notifications.length})` : ''}
          </button>
        </div>
      )}

      {activeTab === 'TICKETS' && (
        <div className="rounded-xl border-t-4 border-brand-green bg-white p-5 shadow sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Danh sách phiếu sửa chữa</h3>
            <input
              type="search"
              value={ticketSearch}
              onChange={event => setTicketSearch(event.target.value)}
              placeholder="Tìm mã phiếu, khách hàng, số điện thoại..."
              aria-label="Tìm mã phiếu, khách hàng hoặc số điện thoại"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
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
              {filteredTickets.map(ticket => (
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
                      onClick={() => {
                        setReceiptQr('');
                        setReceiptParts([]);
                        setReceiptPartsLoading(true);
                        setReceiptPartsError('');
                        setReceiptTicket(ticket);
                      }}
                      className="w-full rounded bg-slate-700 px-3 py-1 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      In phiếu 80mm
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">
                  {tickets.length === 0 ? 'Không có phiếu nào.' : 'Không tìm thấy phiếu phù hợp.'}
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'STATS' && (
        <div className="rounded-xl border-t-4 border-purple-500 bg-white p-5 shadow sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-brand-blue">Báo cáo doanh thu &amp; hiệu suất</h3>
              <p className="mt-1 text-sm text-slate-500">Doanh thu chỉ tính các phiếu đã giao khách và thu tiền.</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              Khoảng thời gian
              <select
                value={reportPeriod}
                onChange={event => setReportPeriod(event.target.value)}
                aria-label="Khoảng thời gian báo cáo"
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="week">7 ngày gần nhất</option>
                <option value="month">Tháng này</option>
              </select>
            </label>
          </div>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm font-semibold text-slate-600">Doanh thu trong kỳ</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-blue">{Number(stats.totalRevenue || 0).toLocaleString('vi-VN')} đ</p>
              <p className="mt-1 text-xs text-slate-500">{reportPeriod === 'week' ? '7 ngày gần nhất' : 'Từ đầu tháng đến hiện tại'}</p>
            </article>
            <article className="rounded-xl bg-green-50 p-5">
              <p className="text-sm font-semibold text-slate-600">Phiếu đã hoàn tất</p>
              <p className="mt-2 text-2xl font-extrabold text-green-800">{Number(stats.completedTickets || 0)} phiếu</p>
              <p className="mt-1 text-xs text-slate-500">Đã giao khách và thu tiền trong kỳ</p>
            </article>
          </div>
          <div className="mb-5 rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Doanh thu linh kiện trong kỳ: </span>
            <strong className="text-brand-blue">{Number(stats.totalPartsRevenue || 0).toLocaleString('vi-VN')} đ</strong>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-4 font-bold text-slate-700">{reportPeriod === 'week' ? 'Doanh thu từng ngày — 7 ngày qua' : 'Doanh thu từng ngày — tháng này'}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={tick => new Date(`${tick}T12:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                    <YAxis tickFormatter={value => Number(value).toLocaleString('vi-VN')} width={72} />
                    <Tooltip labelFormatter={label => new Date(`${label}T12:00:00`).toLocaleDateString('vi-VN')} formatter={value => `${Number(value).toLocaleString('vi-VN')} đ`} />
                    <Bar dataKey="total_revenue" name="Doanh thu" fill="#1a7f45" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-4 font-bold text-slate-700">Phân bổ trạng thái phiếu</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={98} fill="#8884d8" label>
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#64748b'][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Báo cáo tính doanh thu từ các phiếu đã thanh toán và phân loại số lượng phiếu theo trạng thái hiện tại.
          </p>
        </div>
      )}

      {activeTab === 'SOFTWARE' && (role === 'QUAN_LY' || role === 'ADMIN') && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold text-brand-blue">Gói phần mềm &amp; cài đặt</h3>
          <p className="mt-1 text-sm text-slate-500">Chọn nhiều gói phần mềm cho cùng một phiếu sửa chữa.</p>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Lựa chọn các gói khách yêu cầu; kỹ thuật viên xác nhận khả năng cài đặt và chi phí trước khi thực hiện.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Phiếu sửa chữa
              <select
                value={selectedSoftwareTicketId}
                onChange={event => selectSoftwareTicket(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="">Chọn phiếu sửa chữa</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ma_phieu} — {ticket.ho_ten_khach} ({ticket.trang_thai.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Nhóm phần mềm
              <select
                value={selectedSoftwareGroup}
                onChange={event => setSelectedSoftwareGroup(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="ALL">Tất cả nhóm</option>
                {Object.entries(SOFTWARE_PACKAGE_GROUPS).map(([key, groupName]) => (
                  <option key={key} value={key}>{groupName}</option>
                ))}
              </select>
            </label>
          </div>

          {softwarePackageError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{softwarePackageError}</p>}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SOFTWARE_PACKAGE_OPTIONS
              .filter(option => selectedSoftwareGroup === 'ALL' || option.group === selectedSoftwareGroup)
              .map(option => {
                const checked = selectedSoftwarePackages.includes(option.name);
                return (
                  <label
                    key={option.name}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      checked ? 'border-brand-blue bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSoftwarePackage(option.name)}
                      disabled={!selectedSoftwareTicketId}
                      className="mt-1 h-4 w-4 accent-[#0b5b9c]"
                    />
                    <span>
                      <span className="block font-semibold text-slate-800">{option.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                    </span>
                  </label>
                );
              })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">Đã chọn {selectedSoftwarePackages.length} gói phần mềm.</p>
            <button
              type="button"
              onClick={saveSoftwarePackages}
              disabled={!selectedSoftwareTicketId || savingSoftwarePackages}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSoftwarePackages ? 'Đang lưu...' : 'Lưu gói cho phiếu'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'NOTIFICATIONS' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-brand-blue">Trung tâm thông báo</h3>
              <p className="mt-1 text-sm text-slate-500">Theo dõi phiếu sửa chữa, lịch hẹn và cảnh báo kho.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                disabled={unreadNotificationCount === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đánh dấu đã đọc
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
            Hiển thị
            <select
              value={notificationFilter}
              onChange={event => setNotificationFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="ALL">Tất cả thông báo</option>
              <option value="UNREAD">Chưa đọc</option>
            </select>
            <span className="ml-auto text-xs font-normal">{unreadNotificationCount} chưa đọc</span>
          </label>
          <div className="space-y-2">
            {notifications
              .filter(notification => notificationFilter !== 'UNREAD' || !notification.read)
              .map(notification => (
              <article key={notification.id} className={`rounded-lg border p-4 ${notification.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50'}`}>
                <p className="font-semibold text-slate-800">{notification.title || `Phiếu ${notification.ticketCode}: ${notification.status}`}</p>
                {notification.description && <p className="mt-1 text-sm text-slate-600">{notification.description}</p>}
                <p className="mt-1 text-xs text-slate-500">{notification.createdAt}</p>
              </article>
            ))}
            {notifications.filter(notification => notificationFilter !== 'UNREAD' || !notification.read).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                {notificationFilter === 'UNREAD' ? 'Không có thông báo chưa đọc.' : 'Chưa có thông báo mới.'}
              </p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'INVENTORY' && (role === 'QUAN_LY' || role === 'ADMIN') && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-brand-blue">Kho linh kiện &amp; vật tư</h3>
                <p className="mt-1 text-sm text-slate-500">Theo dõi số lượng tồn kho và giá bán linh kiện.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Cảnh báo: {parts.filter(part => Number(part.so_luong) < Number(lowStockThreshold || 5)).length} linh kiện cần nhập hàng
                </p>
                <button
                  type="button"
                  onClick={() => { resetPartForm(); setShowInventoryForm(true); }}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                >
                  + Thêm linh kiện
                </button>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto]">
              <input
                type="search"
                value={partSearch}
                onChange={event => setPartSearch(event.target.value)}
                placeholder="Tìm theo tên linh kiện..."
                aria-label="Tìm theo tên linh kiện"
                className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                Cảnh báo dưới
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={lowStockThreshold}
                  onChange={event => {
                    const value = event.target.value;
                    if (value === '' || Number(value) >= 1) setLowStockThreshold(value);
                  }}
                  aria-label="Ngưỡng cảnh báo tồn kho thấp"
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2"
                />
                chiếc
              </label>
              <select
                value={stockFilter}
                onChange={event => setStockFilter(event.target.value)}
                aria-label="Lọc tình trạng linh kiện"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ALL">Tất cả linh kiện</option>
                <option value="LOW">Sắp hết</option>
                <option value="OUT">Hết hàng</option>
                <option value="AVAILABLE">Còn hàng</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Tên linh kiện</th>
                    <th className="px-3 py-3 text-right">Giá bán</th>
                    <th className="px-3 py-3 text-center">Tồn kho</th>
                    <th className="px-3 py-3 text-center">Tình trạng</th>
                    <th className="px-3 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {parts
                    .filter(part => part.ten_linh_kien.toLowerCase().includes(partSearch.toLowerCase()))
                    .filter(part => {
                      const quantity = Number(part.so_luong);
                      const threshold = Number(lowStockThreshold || 5);
                      if (stockFilter === 'LOW') return quantity > 0 && quantity < threshold;
                      if (stockFilter === 'OUT') return quantity <= 0;
                      if (stockFilter === 'AVAILABLE') return quantity >= threshold;
                      return true;
                    })
                    .map(part => {
                      const quantity = Number(part.so_luong);
                      const threshold = Number(lowStockThreshold || 5);
                      const outOfStock = quantity <= 0;
                      const lowStock = !outOfStock && quantity < threshold;
                      return (
                        <tr key={part.id} className="border-b border-slate-100 text-sm last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-3 font-semibold text-slate-700">{part.ten_linh_kien}</td>
                          <td className="px-3 py-3 text-right tabular-nums">{Number(part.gia_ban).toLocaleString('vi-VN')} đ</td>
                          <td className="px-3 py-3 text-center font-semibold tabular-nums">{quantity}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              outOfStock ? 'bg-red-50 text-red-700' : lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'
                            }`}>
                              {outOfStock ? 'Hết hàng' : lowStock ? 'Sắp hết' : 'Còn hàng'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => editPart(part)}
                              className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand-blue hover:bg-blue-50"
                            >
                              Sửa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {parts.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-sm text-slate-400">Chưa có linh kiện trong kho.</td></tr>
                  )}
                  {parts.length > 0 && parts.filter(part =>
                    part.ten_linh_kien.toLowerCase().includes(partSearch.toLowerCase())
                  ).filter(part => {
                    const quantity = Number(part.so_luong);
                    const threshold = Number(lowStockThreshold || 5);
                    if (stockFilter === 'LOW') return quantity > 0 && quantity < threshold;
                    if (stockFilter === 'OUT') return quantity <= 0;
                    if (stockFilter === 'AVAILABLE') return quantity >= threshold;
                    return true;
                  }).length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-sm text-slate-400">Không tìm thấy linh kiện phù hợp.</td></tr>
                  )}

                </tbody>
              </table>
            </div>
          </section>

          {showInventoryForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="inventory-form-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="inventory-form-title" className="text-xl font-bold text-brand-blue">
                  {editingPartId ? 'Cập nhật linh kiện' : 'Thêm linh kiện'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">Giá và số lượng được dùng cho kho và bảng giá công khai.</p>
              </div>
              <button type="button" onClick={resetPartForm} aria-label="Đóng" className="rounded px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">×</button>
            </div>

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
                <button
                  type="button"
                  onClick={resetPartForm}
                  className="rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
              </div>
            </form>
          </section>
          </div>
          )}
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
                <p className="text-[10px] text-slate-600">615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</p>
                <p className="text-[10px] text-slate-600">Hotline: (028) 3860 4999</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider">PHIẾU TIẾP NHẬN / THANH TOÁN</p>
                <p className="mt-2 text-lg font-bold">{receiptTicket.ma_phieu}</p>
              </div>
              <hr className="my-3 border-dashed border-slate-400" />
              <p><strong>Ngày nhận:</strong> {receiptTicket.ngay_tao ? new Date(receiptTicket.ngay_tao).toLocaleString('vi-VN') : 'Chưa cập nhật'}</p>
              <p className="mt-1"><strong>Khách hàng:</strong> {receiptTicket.ho_ten_khach}</p>
              <p className="mt-1"><strong>Điện thoại:</strong> {receiptTicket.so_dien_thoai}</p>
              <p className="mt-1"><strong>Thiết bị:</strong> {receiptTicket.ten_thiet_bi || 'Không có thông tin'}</p>
              <p className="mt-1"><strong>Mô tả lỗi:</strong> {receiptTicket.mo_ta_loi}</p>
              {receiptTicket.software_packages?.length > 0 && (
                <p className="mt-1"><strong>Gói phần mềm:</strong> {receiptTicket.software_packages.join(', ')}</p>
              )}
              <p className="mt-1"><strong>Trạng thái:</strong> {receiptTicket.trang_thai.replace(/_/g, ' ')}</p>
              <hr className="my-3 border-dashed border-slate-400" />
              <p className="mb-2 text-xs font-bold uppercase">Chi tiết thanh toán</p>
              {receiptPartsLoading && <p className="text-xs">Đang tải chi tiết linh kiện...</p>}
              {receiptPartsError && <p className="text-xs font-semibold">{receiptPartsError}</p>}
              {!receiptPartsLoading && !receiptPartsError && (
                <>
                  {receiptServiceTotal > 0 && (
                    <div className="mb-2 flex justify-between gap-2">
                      <span>Phí sửa chữa / dịch vụ</span>
                      <span className="whitespace-nowrap">{receiptServiceTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  {receiptParts.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="mb-2">
                      <div className="flex justify-between gap-2">
                        <span>{item.ten_linh_kien}</span>
                        <span className="whitespace-nowrap">{(Number(item.so_luong) * Number(item.don_gia)).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <p className="text-[10px] text-slate-600">{item.so_luong} x {Number(item.don_gia).toLocaleString('vi-VN')} đ</p>
                    </div>
                  ))}
                  {receiptParts.length === 0 && receiptServiceTotal === 0 && (
                    <p className="mb-2 text-xs">Chưa có chi tiết thanh toán.</p>
                  )}
                </>
              )}
              <hr className="my-3 border-dashed border-slate-400" />
              <div className="flex justify-between gap-2 text-base font-extrabold">
                <span>Tổng tiền</span>
                <span className="whitespace-nowrap">{receiptTotal.toLocaleString('vi-VN')} đ</span>
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
                disabled={!receiptQr || receiptPartsLoading || Boolean(receiptPartsError)}
                className="rounded-lg bg-brand-blue px-5 py-2 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                In hóa đơn (80mm)
              </button>
            </div>
          </div>
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
