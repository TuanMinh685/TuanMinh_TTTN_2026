import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { exportEnterpriseExcel } from '../../utils/excelExport';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import { SOFTWARE_PACKAGE_GROUPS, SOFTWARE_PACKAGE_OPTIONS } from '../../components/softwarePackages';

const STATUS_LABELS = {
  'CHỜ_KHÁM': 'Chờ khám',
  'ĐANG_CHUẨN_ĐOÁN': 'Đang chuẩn đoán',
  'CHỜ_KHÁCH_CHỐT_GIÁ': 'Chờ khách chốt giá',
  'ĐANG_SỬA': 'Đang sửa chữa',
  'ĐÃ_SỬA_XONG': 'Đã sửa xong',
  'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': 'Đã giao khách & thu tiền',
  'YÊU_CẦU_BẢO_HÀNH': 'Yêu cầu bảo hành'
};

const ROLE_META = {
  GIAM_DOC: {
    level: 100,
    title: 'Giám Đốc Điều Hành',
    badge: '👑 Giám Đốc Điều Hành',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Toàn quyền tối cao: Tất cả các trang, duyệt mọi trạng thái, tạo/khóa/phân quyền mọi cấp kể cả Quản lý.'
  },
  ADMIN: {
    level: 100,
    title: 'Tổng Quản Trị Hệ Thống',
    badge: '👑 Tổng Quản Trị Hệ Thống',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Toàn quyền tối cao: Tất cả các trang, duyệt mọi trạng thái, tạo/khóa/phân quyền mọi cấp kể cả Quản lý.'
  },
  QUAN_LY: {
    level: 80,
    title: 'Quản Lý Cửa Hàng',
    badge: '🛡️ Quản Lý Cửa Hàng',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Điều hành toàn bộ các trang nghiệp vụ & báo cáo; được tạo/sửa/khóa tài khoản nhân sự cấp dưới (Kế toán, Thủ kho, KTV, Lễ tân).'
  },
  KE_TOAN: {
    level: 60,
    title: 'Kế Toán & Thu Ngân',
    badge: '💰 Kế Toán / Thu Ngân',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Truy cập Phiếu sửa chữa & Báo cáo tài chính; xác nhận thu tiền bàn giao máy, in hóa đơn 80mm VietQR & xuất báo cáo Excel.'
  },
  THU_KHO: {
    level: 50,
    title: 'Thủ Kho Linh Kiện',
    badge: '📦 Thủ Kho Linh Kiện',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Quản lý toàn diện Kho linh kiện (thêm mới, sửa giá bán, nhập tồn kho, xuất báo cáo tồn kho) & đối chiếu phiếu xuất.'
  },
  KY_THUAT_VIEN: {
    level: 40,
    title: 'Kỹ Thuật Viên Sửa Chữa',
    badge: '🔧 Kỹ Thuật Viên Sửa Chữa',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Chẩn đoán kỹ thuật, gắn/gỡ linh kiện kèm mã Serial (S/N), chọn gói phần mềm, gửi báo giá và xác nhận Sửa Xong.'
  },
  LE_TAN: {
    level: 30,
    title: 'Lễ Tân & CSKH',
    badge: '💁 Lễ Tân & CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Tiếp nhận máy trực tiếp tại quầy (POS), chụp biên bản ảnh ngoại quan, xử lý lịch hẹn, bàn giao máy & thu tiền.'
  }
};

const QUICK_SWITCH_ROLES = [
  { username: 'giamdoc', label: '👑 Giám Đốc Điều Hành' },
  { username: 'quanly', label: '🛡️ Quản Lý Cửa Hàng' },
  { username: 'ketoan', label: '💰 Kế Toán / Thu Ngân' },
  { username: 'thukho', label: '📦 Thủ Kho Linh Kiện' },
  { username: 'kythuat', label: '🔧 Kỹ Thuật Viên Sửa Chữa' },
  { username: 'letan', label: '💁 Lễ Tân & CSKH' }
];

function Dashboard() {
  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const currentUsername = localStorage.getItem('username') || '';
  const currentAccountId = Number(localStorage.getItem('accountId') || 0);

  const isExecutive = role === 'GIAM_DOC' || role === 'ADMIN';
  const isManagerOrAbove = isExecutive || role === 'QUAN_LY';
  const canReceptionAction = isManagerOrAbove || role === 'LE_TAN';
  const canTechAction = isManagerOrAbove || role === 'KY_THUAT_VIEN';
  const canCashierAction = isManagerOrAbove || role === 'LE_TAN' || role === 'KE_TOAN';
  const canViewInventory = isManagerOrAbove || role === 'THU_KHO' || role === 'KY_THUAT_VIEN';
  const canManageInventory = isManagerOrAbove || role === 'THU_KHO';
  const canViewStats = isManagerOrAbove || role === 'KE_TOAN';
  const canManageEmployees = isManagerOrAbove;
  const currentRoleLevel = ROLE_META[role]?.level || 30;

  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState(() => (role === 'THU_KHO' ? 'INVENTORY' : 'TICKETS'));
  const [stats, setStats] = useState({ revenueData: [], statusData: [], totalRevenue: 0, completedTickets: 0, totalPartsRevenue: 0 });
  const [ticketSearch, setTicketSearch] = useState('');
  const [parts, setParts] = useState([]);
  const [showPartModal, setShowPartModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);
  const [partSerial, setPartSerial] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTicket, setPhotoTicket] = useState(null);
  const [ticketPhotos, setTicketPhotos] = useState([]);
  const [newPhotoNote, setNewPhotoNote] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);
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
      if (saved && (saved.includes('áº') || saved.includes('á»') || saved.includes('â€') || saved.includes('Ä‘') || saved.includes('Phiá') || saved.includes('Lá»'))) {
        localStorage.removeItem('ticketNotifications');
        return [];
      }
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
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusNote, setStatusNote] = useState('');
  const [modalTicketParts, setModalTicketParts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeError, setEmployeeError] = useState('');
  const [employeeForm, setEmployeeForm] = useState({
    ho_ten: '',
    ten_dang_nhap: '',
    mat_khau: '',
    vai_tro: 'LE_TAN',
    trang_thai: 'HOAT_DONG'
  });
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [savingPos, setSavingPos] = useState(false);
  const [posForm, setPosForm] = useState({
    fullName: '',
    phone: '',
    deviceName: '',
    serialImei: '',
    issueDescription: '',
    isStudent: false,
    schoolName: '',
    studentId: '',
    photoBase64: '',
    photoNote: ''
  });
  const [selectedSoftwareTicketId, setSelectedSoftwareTicketId] = useState('');
  const [selectedSoftwareGroup, setSelectedSoftwareGroup] = useState('ALL');
  const [selectedSoftwarePackages, setSelectedSoftwarePackages] = useState([]);
  const [savingSoftwarePackages, setSavingSoftwarePackages] = useState(false);
  const [softwarePackageError, setSoftwarePackageError] = useState('');
  const knownStatuses = useRef(null);
  const knownBookingStatuses = useRef(null);
  const knownStock = useRef(null);

  const toastTimeoutRef = useRef(null);
  const showToast = (message) => {
    if (!message) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setLatestNotice({
      title: message,
      description: message
    });
    toastTimeoutRef.current = setTimeout(() => {
      setLatestNotice(null);
    }, 2500);
  };

  
  const fetchStats = useCallback(async () => {
    const res = await api.get(`/admin/dashboard-stats?period=${reportPeriod}`);
    return res.data.data;
  }, [reportPeriod]);

  const fetchParts = useCallback(async () => {
    const res = await api.get('/tickets/parts');
    return res.data.data || [];
  }, []);

  const fetchEmployees = useCallback(async () => {
    const res = await api.get('/admin/employees');
    return res.data.data || [];
  }, []);

  const openPartModal = async (ticketId) => {
    setSelectedTicketId(ticketId);
    setShowPartModal(true);
    setPartSerial('');
    try {
      const res = await api.get(`/tickets/${ticketId}/parts`);
      setModalTicketParts(res.data.data || []);
    } catch {
      setModalTicketParts([]);
    }
  };

  const addPartToTicket = async () => {
    if (!selectedPartId || partQuantity < 1) return showToast('⚠️ Vui lòng chọn linh kiện và số lượng hợp lệ');
    try {
      await api.post(`/tickets/${selectedTicketId}/parts`, { 
        partId: selectedPartId, 
        quantity: partQuantity,
        so_serial: partSerial.trim() || undefined
      });
      showToast('✅ Thêm linh kiện và lưu mã Serial thành công!');
      setPartSerial('');
      const res = await api.get(`/tickets/${selectedTicketId}/parts`);
      setModalTicketParts(res.data.data || []);
      await refreshTickets();
      if (canViewInventory) {
        setParts(await fetchParts());
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Lỗi thêm linh kiện'}`);
    }
  };

  const removePartFromTicket = async (partRecordId) => {
    try {
      await api.delete(`/tickets/${selectedTicketId}/parts/${partRecordId}`);
      showToast('🔄 Đã gỡ linh kiện khỏi phiếu và hoàn trả tồn kho!');
      const res = await api.get(`/tickets/${selectedTicketId}/parts`);
      setModalTicketParts(res.data.data || []);
      await refreshTickets();
      if (canViewInventory) {
        setParts(await fetchParts());
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Lỗi gỡ linh kiện'}`);
    }
  };

  const handlePosPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPosForm(prev => ({ ...prev, photoBase64: evt.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const submitPosWalkIn = async (e) => {
    e.preventDefault();
    setSavingPos(true);
    try {
      const payload = {
        fullName: posForm.fullName.trim(),
        phone: posForm.phone.trim(),
        deviceName: posForm.deviceName.trim(),
        serialImei: posForm.serialImei.trim() || undefined,
        issueDescription: posForm.issueDescription.trim(),
        isStudent: posForm.isStudent,
        schoolName: posForm.isStudent ? posForm.schoolName.trim() : '',
        studentId: posForm.isStudent ? posForm.studentId.trim() : '',
        photos: posForm.photoBase64
          ? [{ duong_dan_anh: posForm.photoBase64, loai_anh: 'NGOAI_QUAN', ghi_chu: posForm.photoNote.trim() || 'Ảnh chụp tại quầy POS' }]
          : []
      };
      const res = await api.post('/tickets/intake', payload);
      const newCode = res.data?.data?.ticketCode;
      const latestList = await fetchTickets();
      setTickets(latestList);
      setShowPosModal(false);
      setPosForm({
        fullName: '', phone: '', deviceName: '', serialImei: '', issueDescription: '',
        isStudent: false, schoolName: '', studentId: '', photoBase64: '', photoNote: ''
      });
      showToast(`🎉 Đã tạo phiếu tại quầy ${newCode || ''} thành công! Mở cửa sổ in phiếu 80mm...`);
      const createdTicket = latestList.find(t => t.ma_phieu === newCode);
      if (createdTicket) {
        setReceiptQr('');
        setReceiptParts([]);
        setReceiptPartsLoading(true);
        setReceiptPartsError('');
        setReceiptTicket(createdTicket);
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không tạo được phiếu tại quầy'}`);
    } finally {
      setSavingPos(false);
    }
  };

  const openPhotoModal = async (ticket) => {
    setPhotoTicket(ticket);
    setShowPhotoModal(true);
    setNewPhotoNote('');
    try {
      const res = await api.get(`/tickets/${ticket.id}/photos`);
      setTicketPhotos(res.data.data || []);
    } catch {
      setTicketPhotos([]);
    }
  };

  const handleUploadPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || !photoTicket) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target.result;
      setSavingPhoto(true);
      try {
        const res = await api.post(`/tickets/${photoTicket.id}/photos`, {
          duong_dan_anh: base64,
          loai_anh: 'NGOAI_QUAN',
          ghi_chu: newPhotoNote.trim() || file.name
        });
        setTicketPhotos(prev => [...prev, res.data.data]);
        setNewPhotoNote('');
        showToast('📸 Đã lưu ảnh ngoại quan máy thành công!');
      } catch (err) {
        showToast(`❌ ${err.response?.data?.message || 'Lỗi lưu ảnh'}`);
      } finally {
        setSavingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
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
    if (canReceptionAction) {
      load(fetchBookings, setBookings, 'danh sách lịch hẹn');
    }
    if (canViewStats) {
      load(fetchStats, setStats, 'thống kê dashboard');
    }
    if (canManageEmployees) {
      load(fetchEmployees, setEmployees, 'danh sách nhân sự');
    }
    if (canViewInventory) {
      load(fetchParts, setParts, 'danh sách linh kiện');
    }

    return () => {
      active = false;
    };
  }, [canReceptionAction, canViewStats, canManageEmployees, canViewInventory, fetchTickets, fetchBookings, fetchStats, fetchParts, fetchEmployees]);

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
          canReceptionAction ? fetchBookings() : Promise.resolve(null),
          canViewInventory ? fetchParts() : Promise.resolve(null)
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
                description: `Phiếu ${ticket.ma_phieu} — ${STATUS_LABELS[ticket.trang_thai] || ticket.trang_thai}`,
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
  }, [fetchTickets, fetchBookings, fetchParts, lowStockThreshold, canReceptionAction, canViewInventory]);

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

  const openCreateEmployeeModal = () => {
    setEditingEmployee(null);
    setEmployeeError('');
    setEmployeeForm({
      ho_ten: '',
      ten_dang_nhap: '',
      mat_khau: '',
      vai_tro: 'LE_TAN',
      trang_thai: 'HOAT_DONG'
    });
    setShowEmployeeModal(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditingEmployee(emp);
    setEmployeeError('');
    setEmployeeForm({
      ho_ten: emp.ho_ten || '',
      ten_dang_nhap: emp.ten_dang_nhap || '',
      mat_khau: '',
      vai_tro: emp.vai_tro || 'LE_TAN',
      trang_thai: emp.trang_thai || 'HOAT_DONG'
    });
    setShowEmployeeModal(true);
  };

  const saveEmployee = async (e) => {
    e.preventDefault();
    setSavingEmployee(true);
    setEmployeeError('');
    try {
      if (editingEmployee) {
        const res = await api.patch(`/admin/employees/${editingEmployee.id}`, {
          ho_ten: employeeForm.ho_ten.trim(),
          vai_tro: employeeForm.vai_tro,
          trang_thai: employeeForm.trang_thai,
          mat_khau: employeeForm.mat_khau.trim() || undefined
        });
        showToast(`✅ ${res.data?.message || 'Đã cập nhật tài khoản nhân viên!'}`);
      } else {
        const res = await api.post('/admin/employees', {
          ho_ten: employeeForm.ho_ten.trim(),
          ten_dang_nhap: employeeForm.ten_dang_nhap.trim(),
          mat_khau: employeeForm.mat_khau.trim(),
          vai_tro: employeeForm.vai_tro
        });
        showToast(`🎉 ${res.data?.message || 'Đã tạo tài khoản nhân viên mới!'}`);
      }
      setEmployees(await fetchEmployees());
      setShowEmployeeModal(false);
    } catch (err) {
      setEmployeeError(err.response?.data?.message || 'Không lưu được thông tin nhân viên.');
    } finally {
      setSavingEmployee(false);
    }
  };

  const toggleEmployeeLock = async (emp) => {
    const nextStatus = emp.trang_thai === 'HOAT_DONG' ? 'KHOA' : 'HOAT_DONG';
    try {
      const res = await api.patch(`/admin/employees/${emp.id}`, {
        ho_ten: emp.ho_ten,
        vai_tro: emp.vai_tro,
        trang_thai: nextStatus
      });
      showToast(`🔒 ${res.data?.message || 'Đã cập nhật trạng thái tài khoản!'}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không đổi được trạng thái tài khoản'}`);
    }
  };

  const removeEmployee = async (emp) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${emp.ho_ten}" (@${emp.ten_dang_nhap})?`)) return;
    try {
      const res = await api.delete(`/admin/employees/${emp.id}`);
      showToast(`🗑️ ${res.data?.message || 'Đã xóa tài khoản nhân viên!'}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không xóa được tài khoản'}`);
    }
  };

  const handleQuickSwitchRole = async (targetUsername) => {
    if (!targetUsername || switchingRole) return;
    setSwitchingRole(true);
    try {
      const response = await api.post('/auth/login', {
        username: targetUsername,
        password: '123456'
      });
      if (response.data.success) {
        const { token, role: nextRole, fullName: nextName, accountId, username } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('role', nextRole);
        localStorage.setItem('fullName', nextName);
        if (accountId) localStorage.setItem('accountId', String(accountId));
        if (username) localStorage.setItem('username', username);
        window.location.reload();
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không chuyển được tài khoản demo'}`);
      setSwitchingRole(false);
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
    localStorage.removeItem('ticketNotifications');
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
      await api.patch(`/tickets/${id}/status`, {
        trang_thai: status,
        ghi_chu: statusNote.trim() || undefined
      });
      setStatusNote('');
      showToast(`✅ Đã chuyển trạng thái sang: ${status.replace(/_/g, ' ')}`);
      await refreshTickets();
      if (canViewStats) {
        setStats(await fetchStats());
      }
    } catch (err) {
      console.error('Không cập nhật được trạng thái phiếu:', err);
      showToast(`❌ ${err.response?.data?.message || 'Lỗi cập nhật trạng thái'}`);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await api.patch(`/tickets/booking/${id}/status`, { trang_thai: status });
      await refreshBookings();
      await refreshTickets();
      if (status === 'KHACH_DA_DEN') {
        const createdCode = res.data?.ticketCode;
        showToast(`🎉 Đã tiếp nhận khách & tự động tạo phiếu sửa chữa ${createdCode ? `(${createdCode})` : ''}!`);
        setActiveTab('TICKETS');
      } else {
        showToast(`✅ Đã cập nhật trạng thái lịch hẹn: ${status}`);
      }
    } catch (err) {
      console.error('Không cập nhật được trạng thái lịch hẹn:', err);
      showToast(`❌ ${err.response?.data?.message || 'Lỗi cập nhật lịch hẹn'}`);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const matchesStatusFilter = (ticket) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CHO_KHAM') return ticket.trang_thai === 'CHỜ_KHÁM';
    if (statusFilter === 'DANG_XU_LY') return ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' || ticket.trang_thai === 'ĐANG_SỬA';
    if (statusFilter === 'CHO_CHOT_GIA') return ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ';
    if (statusFilter === 'BAO_HANH') return ticket.trang_thai === 'YÊU_CẦU_BẢO_HÀNH';
    if (statusFilter === 'HOAN_TAT') return ticket.trang_thai === 'ĐÃ_SỬA_XONG' || ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN';
    return true;
  };

  const unreadNotificationCount = notifications.filter(notification => !notification.read).length;
  const filteredTickets = tickets.filter(ticket => matchesStatusFilter(ticket) && [
    ticket.ma_phieu,
    ticket.ho_ten_khach,
    ticket.so_dien_thoai,
    ticket.ten_thiet_bi,
    ticket.trang_thai
  ].some(value => String(value || '').toLocaleLowerCase('vi').includes(ticketSearch.trim().toLocaleLowerCase('vi'))));
  const receiptTotal = Number(receiptTicket?.tong_tien || 0);
  const receiptPartsTotal = receiptParts.reduce((total, item) => total + Number(item.so_luong) * Number(item.don_gia), 0);
  const receiptServiceTotal = Math.max(receiptTotal - receiptPartsTotal, 0);
  const currentRoleInfo = ROLE_META[role] || ROLE_META.LE_TAN;

  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      {/* Header Điều Hành & Chuyển Nhanh Chức Vụ (RBAC Switcher) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-brand-blue">
                Bảng Điều Khiển — {currentRoleInfo.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${currentRoleInfo.badgeClass}`}>
                {currentRoleInfo.badge}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1.5">
              Xin chào <strong className="text-slate-800">{fullName}</strong> {currentUsername ? `(@${currentUsername})` : ''} — <span className="text-slate-500">{currentRoleInfo.permissionsText}</span>
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Bộ chuyển nhanh chức vụ để kiểm thử phân quyền */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">⚡ Test chức vụ:</span>
              <select
                value={currentUsername || (role === 'GIAM_DOC' ? 'giamdoc' : role === 'QUAN_LY' ? 'quanly' : role === 'KE_TOAN' ? 'ketoan' : role === 'THU_KHO' ? 'thukho' : role === 'KY_THUAT_VIEN' ? 'kythuat' : 'letan')}
                disabled={switchingRole}
                onChange={(e) => handleQuickSwitchRole(e.target.value)}
                aria-label="Chuyển nhanh chức vụ phân quyền"
                className="text-xs font-extrabold text-brand-blue bg-transparent outline-none cursor-pointer"
              >
                {QUICK_SWITCH_ROLES.map(item => (
                  <option key={item.username} value={item.username}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowNotifications(open => !open)}
              aria-expanded={showNotifications}
              aria-label={`Thông báo (${unreadNotificationCount})`}
              className="relative rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-blue hover:bg-slate-50"
            >
              🔔 Thông báo
              {unreadNotificationCount > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">{unreadNotificationCount}</span>
              )}
            </button>
            <button onClick={logout} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">
              Đăng Xuất
            </button>
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

        {/* Thanh Điều Hướng Các Trang Quản Trị Cấp Cao */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Chuyển nhanh:
          </span>
          <span className="rounded-xl bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs">
            📋 Bàn Vận Hành Kỹ Thuật
          </span>
          {isExecutive && (
            <Link
              to="/admin/giam-doc"
              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
            >
              <span>👑</span> Trang Giám Đốc
            </Link>
          )}
          {isManagerOrAbove && (
            <Link
              to="/admin/quan-ly"
              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
            >
              <span>🏬</span> Trang Quản Lý
            </Link>
          )}
          {canManageEmployees && (
            <Link
              to="/admin/nhan-su"
              className="flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
            >
              <span>👥</span> Quản Lý Nhân Sự & Phân Quyền
            </Link>
          )}
        </div>
      </div>


      {latestNotice && (
        <div role="status" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs text-white shadow-lg transition-all animate-fade-in-up">
          <p className="font-medium">{latestNotice.description || latestNotice.title}</p>
          <button type="button" onClick={() => setLatestNotice(null)} aria-label="Đóng thông báo" className="ml-2 text-slate-400 hover:text-white text-sm">×</button>
        </div>
      )}

      {/* Thanh Tab Nghiệp Vụ (Hiển thị tự động theo Cấp Bậc Phân Quyền) */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('TICKETS')}
          className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'TICKETS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          📋 Phiếu sửa chữa
        </button>
        {canReceptionAction && (
          <button 
            onClick={() => setActiveTab('BOOKINGS')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'BOOKINGS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            📅 Lịch hẹn
          </button>
        )}
        {canViewInventory && (
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'INVENTORY' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            📦 Kho linh kiện
          </button>
        )}
        {canTechAction && (
          <button
            onClick={() => setActiveTab('SOFTWARE')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'SOFTWARE' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            💿 Gói phần mềm
          </button>
        )}
        {canViewStats && (
          <button
            onClick={() => setActiveTab('STATS')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'STATS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            📊 Báo cáo doanh thu
          </button>
        )}
        {canManageEmployees && (
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'EMPLOYEES' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            👥 Nhân sự &amp; Phân quyền ({employees.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`rounded-t-lg px-4 py-2.5 text-xs font-medium ${activeTab === 'NOTIFICATIONS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          🔔 Thông báo{notifications.length > 0 ? ` (${notifications.length})` : ''}
        </button>
      </div>

      {activeTab === 'TICKETS' && (
        <div className="rounded-xl border-t-4 border-brand-blue bg-white p-5 shadow sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-800">Danh sách phiếu sửa chữa</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="search"
                value={ticketSearch}
                onChange={event => setTicketSearch(event.target.value)}
                placeholder="Tìm mã phiếu, khách hàng, số điện thoại..."
                aria-label="Tìm mã phiếu, khách hàng hoặc số điện thoại"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
              />
              {canReceptionAction && (
                <button
                  type="button"
                  onClick={() => setShowPosModal(true)}
                  className="rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-900 shadow-xs whitespace-nowrap"
                >
                  + Tiếp Nhận Tại Quầy (POS)
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const rows = filteredTickets.map((t, idx) => {
                    const raw = Number(t.tong_tien || 0);
                    const finalAmt = t.la_sinh_vien ? Math.round(raw * 0.85) : raw;
                    return [
                      idx + 1,
                      t.ma_phieu,
                      t.ho_ten_khach,
                      t.so_dien_thoai,
                      t.ten_thiet_bi || '—',
                      t.mo_ta_loi || '—',
                      t.la_sinh_vien ? 'Sinh viên (-15%)' : 'Khách vãng lai',
                      t.truong_hoc || '—',
                      STATUS_LABELS[t.trang_thai] || t.trang_thai,
                      raw,
                      finalAmt,
                      t.han_bao_hanh ? new Date(t.han_bao_hanh).toLocaleDateString('vi-VN') : 'Chưa cấp',
                      t.ngay_tao ? new Date(t.ngay_tao).toLocaleString('vi-VN') : ''
                    ];
                  });
                  const totalRaw = filteredTickets.reduce((acc, t) => acc + Number(t.tong_tien || 0), 0);
                  const totalFinal = filteredTickets.reduce((acc, t) => acc + (t.la_sinh_vien ? Math.round(Number(t.tong_tien || 0) * 0.85) : Number(t.tong_tien || 0)), 0);
                  const summaryRow = ['', 'TỔNG CỘNG', '', '', '', '', '', '', `${filteredTickets.length} phiếu`, totalRaw, totalFinal, '', ''];
                  exportEnterpriseExcel({
                    filename: `Bao_Cao_Phieu_Sua_Chua_${new Date().toISOString().slice(0, 10)}.xlsx`,
                    sheetName: 'DS Phiếu Sửa Chữa',
                    title: 'BÁO CÁO TỔNG HỢP PHIẾU TIẾP NHẬN & TIẾN ĐỘ SỬA CHỮA',
                    headers: ['STT', 'Mã Phiếu', 'Khách Hàng', 'Số Điện Thoại', 'Tên Thiết Bị', 'Mô Tả Sự Cố', 'Đối Tượng', 'Trường Học', 'Trạng Thái', 'Chi Phí Gốc (VNĐ)', 'Thực Thu (VNĐ)', 'Hạn Bảo Hành', 'Thời Điểm Tiếp Nhận'],
                    rows,
                    summaryRow,
                    signRole: 'KẾ TOÁN / THU NGÂN'
                  });
                                  }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs whitespace-nowrap"
              >
                📊 Xuất Báo Cáo Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tất cả', count: tickets.length },
              { id: 'CHO_KHAM', label: 'Chờ khám', count: tickets.filter(t => t.trang_thai === 'CHỜ_KHÁM').length },
              { id: 'DANG_XU_LY', label: 'Đang kiểm tra / sửa', count: tickets.filter(t => t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' || t.trang_thai === 'ĐANG_SỬA').length },
              { id: 'CHO_CHOT_GIA', label: 'Chờ khách chốt giá', count: tickets.filter(t => t.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ').length },
              { id: 'BAO_HANH', label: 'Yêu cầu bảo hành', count: tickets.filter(t => t.trang_thai === 'YÊU_CẦU_BẢO_HÀNH').length },
              { id: 'HOAN_TAT', label: 'Đã hoàn tất', count: tickets.filter(t => t.trang_thai === 'ĐÃ_SỬA_XONG' || t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN').length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  statusFilter === tab.id ? 'bg-brand-blue text-white font-medium shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 font-normal'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Optional Custom Technician Note for Timeline */}
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">📝 Ghi chú nhật ký cho khách:</span>
            <input
              type="text"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="Nhập ghi chú (VD: Đã vệ sinh keo tản nhiệt, đang test nhiệt độ GPU...) trước khi bấm nút đổi trạng thái"
              className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-medium">Mã Phiếu</th>
                <th className="py-2.5 px-4 font-medium">Khách hàng</th>
                <th className="py-2.5 px-4 font-medium">Lỗi mô tả</th>
                <th className="py-2.5 px-4 font-medium">Trạng thái</th>
                <th className="py-2.5 px-4 font-medium text-right">Tổng Tiền</th>
                <th className="py-2.5 px-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => {
                const rawTotal = Number(ticket.tong_tien || 0);
                const finalTotal = ticket.la_sinh_vien ? Math.round(rawTotal * 0.85) : rawTotal;
                return (
                <tr key={ticket.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-blue">{ticket.ma_phieu}</div>
                    {ticket.ten_thiet_bi && (
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">{ticket.ten_thiet_bi}</div>
                    )}
                    {ticket.so_imei_serial && (
                      <div className="text-[10px] font-mono text-slate-400">S/N: {ticket.so_imei_serial}</div>
                    )}
                    {(ticket.loai_dich_vu === 'ONLINE' || ticket.ma_ultraviewer) && (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                          💻 Remote: {ticket.ma_ultraviewer || 'Online'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800 text-sm">{ticket.ho_ten_khach}</div>
                    <div className="text-xs text-slate-400">{ticket.so_dien_thoai}</div>
                    {ticket.la_sinh_vien && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          🎓 {ticket.truong_hoc || 'Sinh viên'} (-15%)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">{ticket.mo_ta_loi}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || ticket.trang_thai === 'ĐÃ_SỬA_XONG'
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : 'bg-blue-50 text-brand-blue border-blue-200'
                    }`}>
                      {(ticket.trang_thai && (STATUS_LABELS[ticket.trang_thai] || ticket.trang_thai.replace(/_/g, ' '))) || '—'}
                    </span>
                    {ticket.han_bao_hanh && (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          🛡️ Đã cấp BH điện tử
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {ticket.la_sinh_vien && rawTotal > 0 ? (
                      <div>
                        <div className="text-xs text-slate-400 line-through">{rawTotal.toLocaleString('vi-VN')} đ</div>
                        <div className="font-extrabold text-brand-blue">{finalTotal.toLocaleString('vi-VN')} đ</div>
                      </div>
                    ) : rawTotal > 0 ? (
                      <span className="font-extrabold text-slate-800">{rawTotal.toLocaleString('vi-VN')} đ</span>
                    ) : (
                      <span className="font-semibold text-slate-400">0 đ</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex flex-col gap-1.5 w-36 mx-auto">
                      {/* Nút hành động chính dịu nhẹ */}
                      {canReceptionAction && ticket.trang_thai === 'CHỜ_KHÁM' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐANG_CHUẨN_ĐOÁN')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          Chuyển Kỹ Thuật
                        </button>
                      )}
                      {(canReceptionAction || canTechAction) && ticket.trang_thai === 'YÊU_CẦU_BẢO_HÀNH' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐANG_SỬA')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          Tiếp Nhận Bảo Hành
                        </button>
                      )}
                      {canTechAction && ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐANG_SỬA')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          Tiến hành Sửa
                        </button>
                      )}
                      {(canReceptionAction || canTechAction) && ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐANG_SỬA')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          Khách Chốt (Sửa)
                        </button>
                      )}
                      {canTechAction && ticket.trang_thai === 'ĐANG_SỬA' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐÃ_SỬA_XONG')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          ✓ Sửa Xong
                        </button>
                      )}
                      {canCashierAction && ticket.trang_thai === 'ĐÃ_SỬA_XONG' && (
                        <button onClick={() => updateStatus(ticket.id, 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN')} className="w-full bg-brand-blue text-white hover:bg-blue-900 px-2 py-1.5 rounded-lg font-medium text-xs transition shadow-2xs">
                          Giao Khách & Thu Tiền
                        </button>
                      )}

                      {/* Nhóm nút tác vụ linh kiện & báo giá */}
                      {canTechAction && (ticket.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' || ticket.trang_thai === 'ĐANG_SỬA') && (
                        <div className="grid grid-cols-2 gap-1">
                          <button onClick={() => openPartModal(ticket.id)} className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-1 py-1 rounded-lg font-normal text-xs transition" title="Thêm linh kiện">
                            + Linh kiện
                          </button>
                          <button onClick={() => updateStatus(ticket.id, 'CHỜ_KHÁCH_CHỐT_GIÁ')} className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 px-1 py-1 rounded-lg font-normal text-xs transition" title="Gửi báo giá">
                            Báo giá
                          </button>
                        </div>
                      )}

                      {/* Tiện ích in ấn & ảnh ngoại quan */}
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => openPhotoModal(ticket)}
                          className="rounded-lg bg-white px-1 py-1 text-[11px] font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                          title="Xem / chụp ảnh ngoại quan"
                        >
                          📸 Ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptQr('');
                            setReceiptParts([]);
                            setReceiptPartsLoading(true);
                            setReceiptPartsError('');
                            setReceiptTicket(ticket);
                          }}
                          className="rounded-lg bg-white px-1 py-1 text-[11px] font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                          title="In hóa đơn nhiệt 80mm"
                        >
                          🖨️ In 80mm
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
              })}
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

      {activeTab === 'STATS' && canViewStats && (
        <div className="rounded-xl border-t-4 border-brand-blue bg-white p-5 shadow sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-brand-blue">Báo cáo doanh thu &amp; hiệu suất</h3>
              <p className="mt-1 text-sm text-slate-500">Doanh thu chỉ tính các phiếu đã giao khách và thu tiền.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              <button
                type="button"
                onClick={() => {
                  const revRows = (stats.revenueData || []).map((row, idx) => [
                    idx + 1,
                    row.date,
                    Number(row.total_revenue || 0),
                    stats.totalRevenue || 0,
                    stats.totalPartsRevenue || 0,
                    stats.completedTickets || 0
                  ]);
                  const summaryRow = ['', 'TỔNG DOANH THU KỲ', '', stats.totalRevenue || 0, stats.totalPartsRevenue || 0, stats.completedTickets || 0];
                  exportEnterpriseExcel({
                    filename: `Bao_Cao_Doanh_Thu_Tai_Chinh_${reportPeriod}.xlsx`,
                    sheetName: 'Doanh Thu Tài Chính',
                    title: `BÁO CÁO TỔNG HỢP DOANH THU & HIỆU SUẤT TÀI CHÍNH KINH DOANH (${reportPeriod === 'month' ? 'THEO THÁNG' : 'THEO TUẦN'})`,
                    headers: ['STT', 'Ngày Ghi Nhận', 'Doanh Thu Ngày (VNĐ)', 'Tổng Doanh Thu Lũy Kế (VNĐ)', 'Doanh Thu Linh Kiện (VNĐ)', 'Số Ca Hoàn Tất'],
                    rows: revRows,
                    summaryRow,
                    signRole: 'KẾ TOÁN TRƯỞNG'
                  });
                                  }}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                📊 Xuất Báo Cáo Doanh Thu (.xlsx)
              </button>
            </div>
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

      {activeTab === 'SOFTWARE' && canTechAction && (
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
                <p className="font-medium text-sm text-slate-800">{notification.title || `Phiếu ${notification.ticketCode}: ${notification.status}`}</p>
                {notification.description && <p className="mt-1 text-xs text-slate-500 font-normal">{notification.description}</p>}
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

      {activeTab === 'INVENTORY' && canViewInventory && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-brand-blue">Kho linh kiện &amp; vật tư</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {canManageInventory
                    ? 'Quản lý danh mục, nhập thêm số lượng tồn kho và cập nhật giá niêm yết.'
                    : 'Chế độ Kỹ thuật viên: Tra cứu tồn kho linh kiện (Quyền sửa giá & nhập hàng thuộc về Thủ kho / Quản lý).'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Cảnh báo: {parts.filter(part => Number(part.so_luong) < Number(lowStockThreshold || 5)).length} linh kiện cần nhập hàng
                </p>
                <button
                  type="button"
                  onClick={() => {
                    let totalQty = 0;
                    let totalValue = 0;
                    const rows = parts.map((p, idx) => {
                      const qty = Number(p.so_luong || 0);
                      const price = Number(p.gia_ban || 0);
                      const itemTotal = qty * price;
                      totalQty += qty;
                      totalValue += itemTotal;
                      const status = qty <= 0 ? 'HẾT HÀNG' : qty < Number(lowStockThreshold || 5) ? 'CẢNH BÁO: SẮP HẾT' : 'ĐỦ TỒN KHO';
                      return [
                        idx + 1,
                        `LK-${String(p.id).padStart(4, '0')}`,
                        p.ten_linh_kien,
                        price,
                        qty,
                        status,
                        itemTotal
                      ];
                    });
                    const summaryRow = ['', 'TỔNG CỘNG TOÀN KHO', `Tổng số mặt hàng: ${parts.length}`, '', totalQty, '', totalValue];
                    exportEnterpriseExcel({
                      filename: `Bao_Cao_Ton_Kho_Linh_Kien_${new Date().toISOString().slice(0, 10)}.xlsx`,
                      sheetName: 'Kiểm Kê Tồn Kho',
                      title: 'BÁO CÁO KIỂM KÊ TỒN KHO LINH KIỆN & VẬT TƯ SỬA CHỮA',
                      headers: ['STT', 'Mã Linh Kiện', 'Tên Linh Kiện & Thông Số', 'Đơn Giá Bán (VNĐ)', 'Số Lượng Tồn Kho', 'Tình Trạng Kho', 'Tổng Giá Trị Tồn (VNĐ)'],
                      rows,
                      summaryRow,
                      signRole: 'THỦ KHO LINH KIỆN'
                    });
                                      }}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-900"
                >
                  📊 Xuất Báo Cáo Tồn Kho (.xlsx)
                </button>
                {canManageInventory && (
                  <button
                    type="button"
                    onClick={() => { resetPartForm(); setShowInventoryForm(true); }}
                    className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    + Thêm linh kiện
                  </button>
                )}
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
                            {canManageInventory ? (
                              <button
                                type="button"
                                onClick={() => editPart(part)}
                                className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand-blue hover:bg-blue-50"
                              >
                                Sửa giá / Nhập kho
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Chỉ xem tồn kho</span>
                            )}
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
      
      {activeTab === 'BOOKINGS' && canReceptionAction && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-brand-orange">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold">Lịch hẹn chưa xử lý / Sắp tới</h3>
            <span className="text-xs font-medium text-slate-500">
              💡 Khi bấm <b>Khách Đã Đến</b>, hệ thống sẽ tự động khởi tạo Phiếu sửa chữa QR &amp; đồng bộ ưu đãi sinh viên.
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-2.5 px-4 font-medium">Ngày / Giờ Hẹn</th>
                <th className="py-2.5 px-4 font-medium">Khách hàng</th>
                <th className="py-2.5 px-4 font-medium">Lỗi mô tả</th>
                <th className="py-2.5 px-4 font-medium">Trạng thái</th>
                <th className="py-2.5 px-4 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(bk => (
                <tr key={bk.id} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-brand-blue">
                    {new Date(bk.ngay_hen).toLocaleDateString('vi-VN')} <br/>
                    <span className="text-red-500">{bk.gio_hen}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{bk.ho_ten_khach}</div>
                    <div className="text-xs text-slate-400">{bk.so_dien_thoai}</div>
                    {bk.la_sinh_vien && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          🎓 {bk.truong_hoc || 'Sinh viên'} (-15%)
                        </span>
                      </div>
                    )}
                  </td>
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
                      <button onClick={() => updateBookingStatus(bk.id, 'KHACH_DA_DEN')} className="bg-brand-green text-white px-3 py-1 rounded font-bold text-sm w-full">Khách Đã Đến (Tạo Phiếu QR)</button>
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

      {activeTab === 'EMPLOYEES' && canManageEmployees && (
        <div className="space-y-6">
          {/* Sơ đồ Ma trận Phân quyền 6 Cấp bậc Từ Trên Xuống (Top-Down RBAC Hierarchy) */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue flex items-center gap-2">
                  <span>🏛️</span> Tháp Phân Quyền 6 Cấp Bậc Từ Trên Xuống (Top-Down RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấp trên quản lý cấp dưới: Giám Đốc (Level 100) cấp phát mọi quyền; Quản Lý (Level 80) chỉ cấp phát và điều hành nhân sự cấp dưới (&lt; Level 80).
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateEmployeeModal}
                className="rounded-xl bg-brand-blue hover:bg-blue-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition flex items-center gap-1.5"
              >
                <span>+</span> Tạo Tài Khoản Nhân Viên Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'GIAM_DOC', pages: 'Tất cả 6 trang + Quản trị tối cao' },
                { key: 'QUAN_LY', pages: 'Tất cả 6 trang (Quản lý nhân sự cấp dưới)' },
                { key: 'KE_TOAN', pages: 'Phiếu sửa chữa • Báo cáo doanh thu • Thu ngân' },
                { key: 'THU_KHO', pages: 'Kho linh kiện (Nhập/Sửa giá) • Đối chiếu phiếu' },
                { key: 'KY_THUAT_VIEN', pages: 'Phiếu sửa chữa • Gói phần mềm • Xem kho' },
                { key: 'LE_TAN', pages: 'Phiếu sửa chữa (POS) • Lịch hẹn • Bàn giao máy' }
              ].map((item) => {
                const meta = ROLE_META[item.key];
                return (
                  <div key={item.key} className="rounded-xl border border-slate-200/90 p-3.5 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}>
                          {meta.badge}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500"></span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{meta.permissionsText}</p>
                    </div>
                    <p className="text-[11px] font-bold text-brand-blue mt-2 pt-2 border-t border-slate-200/70">
                      📌 Trang truy cập: <span className="font-semibold text-slate-700">{item.pages}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sách Tài khoản Nhân sự & Công cụ Cấp phát / Khóa / Đổi chức vụ */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border-t-4 border-brand-blue">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Danh Sách Tài Khoản Nhân Sự ({employees.length})</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đang đăng nhập với quyền: <strong>{currentRoleInfo.title} (Level {currentRoleLevel})</strong> — {isExecutive ? 'Bạn có toàn quyền tạo, đổi chức vụ và khóa mọi tài khoản.' : 'Bạn chỉ được phép tạo, sửa hoặc khóa tài khoản nhân sự cấp dưới (< Level 80).'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-blue border border-blue-200">
                  👨‍🔧 Đang xử lý: {tickets.filter(t => t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' || t.trang_thai === 'ĐANG_SỬA').length} máy
                </span>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  ✅ Đã hoàn tất: {tickets.filter(t => t.trang_thai === 'ĐÃ_SỬA_XONG' || t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN').length} máy
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-4 font-medium">Mã NV</th>
                    <th className="py-2.5 px-4 font-medium">Họ và Tên</th>
                    <th className="py-2.5 px-4 font-medium">Tài khoản</th>
                    <th className="py-2.5 px-4 font-medium">Chức vụ &amp; Cấp bậc</th>
                    <th className="py-2.5 px-4 font-medium text-center">Trạng thái</th>
                    <th className="py-2.5 px-4 font-medium text-right">Thao tác phân quyền</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const empMeta = ROLE_META[emp.vai_tro] || ROLE_META.LE_TAN;
                    const empLevel = empMeta.level;
                    const isSelf = (currentAccountId && Number(emp.id) === currentAccountId) || (currentUsername && emp.ten_dang_nhap === currentUsername);
                    const canModifyTarget = !isSelf && (isExecutive || empLevel < currentRoleLevel);

                    return (
                      <tr key={emp.id} className="border-b hover:bg-slate-50 text-sm">
                        <td className="py-3 px-4 font-bold text-slate-600">NV-{String(emp.id).padStart(3, '0')}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{emp.ho_ten}</span>
                          {isSelf && (
                            <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-brand-blue text-[10px] font-extrabold">
                              Bạn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-blue">@{emp.ten_dang_nhap}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${empMeta.badgeClass}`}>
                            {empMeta.badge}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {emp.trang_thai === 'HOAT_DONG' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              ● Hoạt động
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                              🔒 Đã khóa
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canModifyTarget ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditEmployeeModal(emp)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 text-xs font-bold transition"
                              >
                                ✏️ Phân quyền / Đổi MK
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleEmployeeLock(emp)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                                  emp.trang_thai === 'HOAT_DONG'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {emp.trang_thai === 'HOAT_DONG' ? 'Khóa TK' : 'Mở khóa'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEmployee(emp)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition"
                              >
                                Xóa
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              {isSelf ? '🛡️ Tài khoản đang dùng' : '🔒 Cấp trên / Ngang cấp'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">Chưa có dữ liệu nhân sự.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo mới / Phân quyền & Đặt lại mật khẩu Nhân viên */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">
                  {editingEmployee ? `✏️ Phân Quyền Nhân Viên: ${editingEmployee.ho_ten}` : '👤 Tạo Tài Khoản Nhân Sự Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isExecutive
                    ? 'Quyền Giám Đốc (Level 100): Được phép gán mọi chức vụ trong hệ thống.'
                    : 'Quyền Quản Lý (Level 80): Chỉ được phép gán chức vụ nhân viên cấp dưới (< Level 80).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {employeeError && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                {employeeError}
              </div>
            )}

            <form onSubmit={saveEmployee} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  value={employeeForm.ho_ten}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, ho_ten: e.target.value })}
                  placeholder="VD: Nguyễn Văn Minh"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-blue outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingEmployee)}
                    value={employeeForm.ten_dang_nhap}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, ten_dang_nhap: e.target.value })}
                    placeholder="VD: ktv_minh"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono focus:border-brand-blue outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingEmployee ? 'Mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={employeeForm.mat_khau}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, mat_khau: e.target.value })}
                    placeholder={editingEmployee ? 'Nhập nếu muốn đổi MK...' : 'Tối thiểu 6 ký tự'}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chức vụ &amp; Cấp bậc Phân quyền *</label>
                <select
                  value={employeeForm.vai_tro}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, vai_tro: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-slate-800 focus:border-brand-blue outline-none"
                >
                  {isExecutive && (
                    <>
                      <option value="GIAM_DOC">👑 Giám Đốc Điều Hành</option>
                      <option value="QUAN_LY">🛡️ Quản Lý Cửa Hàng</option>
                    </>
                  )}
                  <option value="KE_TOAN">💰 Kế Toán / Thu Ngân</option>
                  <option value="THU_KHO">📦 Thủ Kho Linh Kiện</option>
                  <option value="KY_THUAT_VIEN">🔧 Kỹ Thuật Viên Sửa Chữa</option>
                  <option value="LE_TAN">💁 Lễ Tân &amp; CSKH</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {ROLE_META[employeeForm.vai_tro]?.permissionsText}
                </p>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={employeeForm.trang_thai}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, trang_thai: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold focus:border-brand-blue outline-none"
                  >
                    <option value="HOAT_DONG">● Đang hoạt động (Cho phép đăng nhập)</option>
                    <option value="KHOA">🔒 Khóa tài khoản (Chặn đăng nhập)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="rounded-xl bg-brand-blue px-5 py-2.5 font-extrabold text-white hover:bg-blue-800 shadow-md disabled:opacity-60"
                >
                  {savingEmployee ? 'Đang lưu...' : editingEmployee ? 'Lưu Phân Quyền' : 'Tạo Tài Khoản →'}
                </button>
              </div>
            </form>
          </div>
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
              {receiptTicket.la_sinh_vien && (
                <div className="mt-1 rounded bg-emerald-50 p-1.5 text-xs text-emerald-800">
                  <p><strong>🎓 Sinh viên:</strong> {receiptTicket.truong_hoc}</p>
                  <p><strong>MSSV:</strong> {receiptTicket.mssv || 'Đã xác thực'}</p>
                </div>
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
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>{item.so_luong} x {Number(item.don_gia).toLocaleString('vi-VN')} đ</span>
                        {item.so_serial && <span className="font-mono text-blue-700">S/N: {item.so_serial}</span>}
                      </div>
                    </div>
                  ))}
                  {receiptParts.length === 0 && receiptServiceTotal === 0 && (
                    <p className="mb-2 text-xs">Chưa có chi tiết thanh toán.</p>
                  )}
                </>
              )}
              <hr className="my-3 border-dashed border-slate-400" />
              {receiptTicket.la_sinh_vien ? (
                <>
                  <div className="flex justify-between gap-2 text-xs text-slate-600">
                    <span>Tổng chi phí gốc</span>
                    <span className="line-through">{receiptTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between gap-2 text-xs font-semibold text-emerald-700">
                    <span>Trợ giá Sinh viên toàn quốc (-15%)</span>
                    <span>-{Math.round(receiptTotal * 0.15).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between gap-2 text-base font-extrabold text-brand-orange mt-1">
                    <span>Tổng thanh toán</span>
                    <span className="whitespace-nowrap">{Math.round(receiptTotal * 0.85).toLocaleString('vi-VN')} đ</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-2 text-base font-extrabold">
                  <span>Tổng tiền</span>
                  <span className="whitespace-nowrap">{receiptTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-600 border border-slate-200 p-1.5 rounded text-center">
                🛡️ Sổ bảo hành điện tử (e-Warranty): Kích hoạt 06 tháng (180 ngày). Quét QR bên dưới để tra cứu hoặc yêu cầu bảo hành.
              </p>
              {receiptQr && (
                <div className="mt-4 text-center">
                  <img src={receiptQr} alt={`QR tra cứu phiếu ${receiptTicket.ma_phieu}`} className="mx-auto h-32 w-32" />
                  <p className="mt-1 break-all text-[10px]">{window.location.origin}/track/{receiptTicket.ma_phieu}</p>
                </div>
              )}
              {receiptTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-300 text-center">
                  <p className="text-[10px] font-bold uppercase text-brand-blue mb-1">💳 Quét VietQR Chuyển khoản Ngân hàng</p>
                  <img
                    src={`https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${receiptTicket.la_sinh_vien ? Math.round(receiptTotal * 0.85) : receiptTotal}&addInfo=${encodeURIComponent(`TT ${receiptTicket.ma_phieu}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`}
                    alt="VietQR Thanh toán"
                    className="mx-auto w-36 h-auto rounded border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">Nội dung CK: <strong>TT {receiptTicket.ma_phieu}</strong></p>
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

      {/* Modal Thêm & Quản Lý Linh Kiện Trên Phiếu */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-brand-blue">Linh Kiện &amp; Dịch Vụ Của Phiếu</h3>
              <button type="button" onClick={() => setShowPartModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            {/* Danh sách linh kiện đã gắn trên phiếu (Cho phép gỡ nếu nhập nhầm) */}
            {modalTicketParts.length > 0 && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">🔧 Linh kiện đã gắn ({modalTicketParts.length}):</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {modalTicketParts.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.ten_linh_kien} (x{item.so_luong})</p>
                        <p className="text-[10px] text-slate-500">
                          {(Number(item.don_gia) * Number(item.so_luong)).toLocaleString('vi-VN')} đ
                          {item.so_serial ? ` • S/N: ${item.so_serial}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePartFromTicket(item.id)}
                        className="rounded bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-100 whitespace-nowrap"
                      >
                        Gỡ &amp; Hoàn kho
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Chọn linh kiện thêm mới:</label>
              <select 
                value={selectedPartId} 
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none"
              >
                <option value="">-- Chọn --</option>
                {parts.map(p => (
                  <option key={p.id} value={p.id} disabled={Number(p.so_luong) <= 0}>
                    {p.ten_linh_kien} - {Number(p.gia_ban).toLocaleString('vi-VN')}đ ({Number(p.so_luong) <= 0 ? 'HẾT HÀNG' : `Tồn: ${p.so_luong}`})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700">Mã Serial / IMEI linh kiện:</label>
                <button
                  type="button"
                  onClick={() => setPartSerial(`SN-${Date.now().toString().slice(-6)}`)}
                  className="text-xs text-brand-blue hover:underline font-semibold"
                >
                  + Tạo mã nhanh
                </button>
              </div>
              <input 
                type="text" 
                value={partSerial} 
                onChange={(e) => setPartSerial(e.target.value)}
                placeholder="VD: SN-SAM-980PRO-2026..."
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none font-mono text-sm"
              />
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
              <button onClick={() => setShowPartModal(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300">Đóng</button>
              <button onClick={addPartToTicket} className="flex-1 py-2 bg-brand-blue text-white font-bold rounded hover:bg-blue-700">Xác Nhận Thêm</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tiếp Nhận Nhanh Tại Quầy (POS Walk-in) */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">🖥️ Tiếp Nhận Máy Trực Tiếp Tại Quầy (POS)</h3>
                <p className="text-xs text-slate-500">Tạo phiếu nhanh cho khách vãng lai &amp; tự động bật cửa sổ in phiếu nhiệt 80mm.</p>
              </div>
              <button type="button" onClick={() => setShowPosModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">×</button>
            </div>

            <form onSubmit={submitPosWalkIn} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={posForm.fullName}
                    onChange={e => setPosForm({ ...posForm, fullName: e.target.value })}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    value={posForm.phone}
                    onChange={e => setPosForm({ ...posForm, phone: e.target.value })}
                    placeholder="VD: 0909123456"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên máy / Model thiết bị *</label>
                  <input
                    type="text"
                    required
                    value={posForm.deviceName}
                    onChange={e => setPosForm({ ...posForm, deviceName: e.target.value })}
                    placeholder="VD: Laptop Dell Inspiron 15 / MacBook Air M2"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Serial / Service Tag máy</label>
                  <input
                    type="text"
                    value={posForm.serialImei}
                    onChange={e => setPosForm({ ...posForm, serialImei: e.target.value })}
                    placeholder="VD: ST-89234X"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tình trạng lỗi &amp; yêu cầu của khách *</label>
                <textarea
                  required
                  rows={2}
                  value={posForm.issueDescription}
                  onChange={e => setPosForm({ ...posForm, issueDescription: e.target.value })}
                  placeholder="VD: Máy bật không lên nguồn, khách yêu cầu kiểm tra IC nguồn và vệ sinh máy..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                />
              </div>

              {/* Ưu đãi Sinh viên */}
              <div className="rounded-xl bg-indigo-50/70 p-3.5 border border-indigo-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-900 text-xs">
                  <input
                    type="checkbox"
                    checked={posForm.isStudent}
                    onChange={e => setPosForm({ ...posForm, isStudent: e.target.checked })}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  🎓 Khách hàng là Học sinh / Sinh viên Toàn quốc (Áp dụng giảm 15% tổng hóa đơn)
                </label>
                {posForm.isStudent && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={posForm.schoolName}
                      onChange={e => setPosForm({ ...posForm, schoolName: e.target.value })}
                      placeholder="Tên trường Đại học / Cao đẳng / THPT *"
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={posForm.studentId}
                      onChange={e => setPosForm({ ...posForm, studentId: e.target.value })}
                      placeholder="Mã số sinh viên (MSSV) *"
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Ảnh ngoại quan tại quầy */}
              <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-2">📸 Đính kèm ảnh ngoại quan lúc nhận máy (Tùy chọn):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={posForm.photoNote}
                    onChange={e => setPosForm({ ...posForm, photoNote: e.target.value })}
                    placeholder="Ghi chú ngoại quan (VD: Trầy nắp lưng...)"
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosPhotoChange}
                    className="text-xs text-slate-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPos}
                  className="rounded-xl bg-brand-blue px-5 py-2.5 font-bold text-white hover:bg-blue-900 shadow-md disabled:opacity-60"
                >
                  {savingPos ? 'Đang tạo phiếu...' : 'Tạo Phiếu & In Hóa Đơn 80mm →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quản lý Ảnh Ngoại Quan Lúc Nhận Máy */}
      {showPhotoModal && photoTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📸</span> Ảnh Ngoại Quan Tiếp Nhận - Phiếu {photoTicket.ma_phieu}
                </h3>
                <p className="text-xs text-slate-500">{photoTicket.ten_thiet_bi} • Khách hàng: {photoTicket.ho_ten_khach}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPhotoModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Form tải ảnh mới */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <h4 className="text-sm font-bold text-brand-blue mb-2">Chụp hoặc Tải Thêm Ảnh Ngoại Quan:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú (vết trầy, cấn móp, tem...):</label>
                    <input
                      type="text"
                      value={newPhotoNote}
                      onChange={(e) => setNewPhotoNote(e.target.value)}
                      placeholder="VD: Cấn góc trái màn hình, rách tem ốc đáy..."
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:border-brand-blue outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className={`w-full flex items-center justify-center px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded cursor-pointer text-sm shadow-sm transition-colors ${savingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                      <span>{savingPhoto ? 'Đang lưu...' : '+ Chọn ảnh'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleUploadPhoto}
                        disabled={savingPhoto}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Danh sách ảnh */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Hình ảnh ngoại quan đã lưu ({ticketPhotos.length}):</h4>
                {ticketPhotos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
                    Chưa có ảnh ngoại quan nào được tải lên cho phiếu này.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ticketPhotos.map((img, i) => (
                      <div key={img.id || i} className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm flex flex-col">
                        <div className="h-36 overflow-hidden bg-black flex items-center justify-center">
                          <img
                            src={img.duong_dan_anh}
                            alt={img.ghi_chu || `Ảnh ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(img.duong_dan_anh, '_blank')}
                          />
                        </div>
                        <div className="p-2.5 text-xs flex-1 flex flex-col justify-between">
                          <p className="font-semibold text-slate-800 line-clamp-2">{img.ghi_chu || 'Ảnh ngoại quan'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {img.thoi_gian_tao ? new Date(img.thoi_gian_tao).toLocaleString('vi-VN') : 'Lúc tiếp nhận'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
