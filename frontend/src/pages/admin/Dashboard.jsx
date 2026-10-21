import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import { SOFTWARE_PACKAGE_GROUPS, SOFTWARE_PACKAGE_OPTIONS } from '../../components/softwarePackages';

const ROLE_META = {
  GIAM_DOC: {
    level: 100,
    title: 'GiÃ¡m Äá»‘c Äiá»u HÃ nh',
    badge: 'ðŸ‘‘ GiÃ¡m Äá»‘c (Cáº¥p 1 - ToÃ n quyá»n)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    permissionsText: 'ToÃ n quyá»n tá»‘i cao: Táº¥t cáº£ cÃ¡c trang, duyá»‡t má»i tráº¡ng thÃ¡i, táº¡o/khÃ³a/phÃ¢n quyá»n má»i cáº¥p ká»ƒ cáº£ Quáº£n lÃ½.'
  },
  ADMIN: {
    level: 100,
    title: 'Tá»•ng Quáº£n Trá»‹ Há»‡ Thá»‘ng',
    badge: 'ðŸ‘‘ Tá»•ng Quáº£n Trá»‹ (Cáº¥p 1 - ToÃ n quyá»n)',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    permissionsText: 'ToÃ n quyá»n tá»‘i cao: Táº¥t cáº£ cÃ¡c trang, duyá»‡t má»i tráº¡ng thÃ¡i, táº¡o/khÃ³a/phÃ¢n quyá»n má»i cáº¥p ká»ƒ cáº£ Quáº£n lÃ½.'
  },
  QUAN_LY: {
    level: 80,
    title: 'Quáº£n LÃ½ Cá»­a HÃ ng',
    badge: 'ðŸ›¡ï¸ Quáº£n LÃ½ Cá»­a HÃ ng (Cáº¥p 2)',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    permissionsText: 'Äiá»u hÃ nh toÃ n bá»™ cÃ¡c trang nghiá»‡p vá»¥ & bÃ¡o cÃ¡o; Ä‘Æ°á»£c táº¡o/sá»­a/khÃ³a tÃ i khoáº£n nhÃ¢n sá»± cáº¥p dÆ°á»›i (Káº¿ toÃ¡n, Thá»§ kho, KTV, Lá»… tÃ¢n).'
  },
  KE_TOAN: {
    level: 60,
    title: 'Káº¿ ToÃ¡n & Thu NgÃ¢n',
    badge: 'ðŸ’° Káº¿ ToÃ¡n / Thu NgÃ¢n (Cáº¥p 3)',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    permissionsText: 'Truy cáº­p Phiáº¿u sá»­a chá»¯a & BÃ¡o cÃ¡o tÃ i chÃ­nh; xÃ¡c nháº­n thu tiá»n bÃ n giao mÃ¡y, in hÃ³a Ä‘Æ¡n 80mm VietQR & xuáº¥t bÃ¡o cÃ¡o Excel.'
  },
  THU_KHO: {
    level: 50,
    title: 'Thá»§ Kho Linh Kiá»‡n',
    badge: 'ðŸ“¦ Thá»§ Kho Linh Kiá»‡n (Cáº¥p 4)',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    permissionsText: 'Quáº£n lÃ½ toÃ n diá»‡n Kho linh kiá»‡n (thÃªm má»›i, sá»­a giÃ¡ bÃ¡n, nháº­p tá»“n kho, xuáº¥t bÃ¡o cÃ¡o tá»“n kho) & Ä‘á»‘i chiáº¿u phiáº¿u xuáº¥t.'
  },
  KY_THUAT_VIEN: {
    level: 40,
    title: 'Ká»¹ Thuáº­t ViÃªn Sá»­a Chá»¯a',
    badge: 'ðŸ”§ Ká»¹ Thuáº­t ViÃªn (Cáº¥p 5)',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    permissionsText: 'Cháº©n Ä‘oÃ¡n ká»¹ thuáº­t, gáº¯n/gá»¡ linh kiá»‡n kÃ¨m mÃ£ Serial (S/N), chá»n gÃ³i pháº§n má»m, gá»­i bÃ¡o giÃ¡ vÃ  xÃ¡c nháº­n Sá»­a Xong.'
  },
  LE_TAN: {
    level: 30,
    title: 'Lá»… TÃ¢n & CSKH',
    badge: 'ðŸ’ Lá»… TÃ¢n & CSKH (Cáº¥p 6)',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
    permissionsText: 'Tiáº¿p nháº­n mÃ¡y trá»±c tiáº¿p táº¡i quáº§y (POS), chá»¥p biÃªn báº£n áº£nh ngoáº¡i quan, xá»­ lÃ½ lá»‹ch háº¹n, bÃ n giao mÃ¡y & thu tiá»n.'
  }
};

const QUICK_SWITCH_ROLES = [
  { username: 'giamdoc', label: 'ðŸ‘‘ GiÃ¡m Äá»‘c (Cáº¥p 1)' },
  { username: 'quanly', label: 'ðŸ›¡ï¸ Quáº£n LÃ½ (Cáº¥p 2)' },
  { username: 'ketoan', label: 'ðŸ’° Káº¿ ToÃ¡n (Cáº¥p 3)' },
  { username: 'thukho', label: 'ðŸ“¦ Thá»§ Kho (Cáº¥p 4)' },
  { username: 'kythuat', label: 'ðŸ”§ Ká»¹ Thuáº­t ViÃªn (Cáº¥p 5)' },
  { username: 'letan', label: 'ðŸ’ Lá»… TÃ¢n (Cáº¥p 6)' }
];

function Dashboard() {
  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'NhÃ¢n viÃªn';
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
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 50).map(item => ({ ...item, read: item.read ?? true })) : [];
    } catch (error) {
      console.error('KhÃ´ng Ä‘á»c Ä‘Æ°á»£c thÃ´ng bÃ¡o Ä‘Ã£ lÆ°u:', error);
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

  const showToast = (message) => {
    setLatestNotice({
      title: message,
      description: message
    });
  };

  const exportToCsv = (filename, headers, rows) => {
    const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`ðŸ“¥ ÄÃ£ xuáº¥t file bÃ¡o cÃ¡o Excel/CSV: ${filename}`);
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
    if (!selectedPartId || partQuantity < 1) return showToast('âš ï¸ Vui lÃ²ng chá»n linh kiá»‡n vÃ  sá»‘ lÆ°á»£ng há»£p lá»‡');
    try {
      await api.post(`/tickets/${selectedTicketId}/parts`, { 
        partId: selectedPartId, 
        quantity: partQuantity,
        so_serial: partSerial.trim() || undefined
      });
      showToast('âœ… ThÃªm linh kiá»‡n vÃ  lÆ°u mÃ£ Serial thÃ nh cÃ´ng!');
      setPartSerial('');
      const res = await api.get(`/tickets/${selectedTicketId}/parts`);
      setModalTicketParts(res.data.data || []);
      await refreshTickets();
      if (canViewInventory) {
        setParts(await fetchParts());
      }
    } catch (err) {
      showToast(`âŒ ${err.response?.data?.message || 'Lá»—i thÃªm linh kiá»‡n'}`);
    }
  };

  const removePartFromTicket = async (partRecordId) => {
    try {
      await api.delete(`/tickets/${selectedTicketId}/parts/${partRecordId}`);
      showToast('ðŸ”„ ÄÃ£ gá»¡ linh kiá»‡n khá»i phiáº¿u vÃ  hoÃ n tráº£ tá»“n kho!');
      const res = await api.get(`/tickets/${selectedTicketId}/parts`);
      setModalTicketParts(res.data.data || []);
      await refreshTickets();
      if (canViewInventory) {
        setParts(await fetchParts());
      }
    } catch (err) {
      showToast(`âŒ ${err.response?.data?.message || 'Lá»—i gá»¡ linh kiá»‡n'}`);
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
          ? [{ duong_dan_anh: posForm.photoBase64, loai_anh: 'NGOAI_QUAN', ghi_chu: posForm.photoNote.trim() || 'áº¢nh chá»¥p táº¡i quáº§y POS' }]
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
      showToast(`ðŸŽ‰ ÄÃ£ táº¡o phiáº¿u táº¡i quáº§y ${newCode || ''} thÃ nh cÃ´ng! Má»Ÿ cá»­a sá»• in phiáº¿u 80mm...`);
      const createdTicket = latestList.find(t => t.ma_phieu === newCode);
      if (createdTicket) {
        setReceiptQr('');
        setReceiptParts([]);
        setReceiptPartsLoading(true);
        setReceiptPartsError('');
        setReceiptTicket(createdTicket);
      }
    } catch (err) {
      showToast(`âŒ ${err.response?.data?.message || 'KhÃ´ng táº¡o Ä‘Æ°á»£c phiáº¿u táº¡i quáº§y'}`);
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
        showToast('ðŸ“¸ ÄÃ£ lÆ°u áº£nh ngoáº¡i quan mÃ¡y thÃ nh cÃ´ng!');
      } catch (err) {
        showToast(`âŒ ${err.response?.data?.message || 'Lá»—i lÆ°u áº£nh'}`);
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
        .catch(error => console.error(`KhÃ´ng táº£i Ä‘Æ°á»£c ${description}:`, error));
    };

    load(fetchTickets, setTickets, 'danh sÃ¡ch phiáº¿u');
    if (canReceptionAction) {
      load(fetchBookings, setBookings, 'danh sÃ¡ch lá»‹ch háº¹n');
    }
    if (canViewStats) {
      load(fetchStats, setStats, 'thá»‘ng kÃª dashboard');
    }
    if (canManageEmployees) {
      load(fetchEmployees, setEmployees, 'danh sÃ¡ch nhÃ¢n sá»±');
    }
    if (canViewInventory) {
      load(fetchParts, setParts, 'danh sÃ¡ch linh kiá»‡n');
    }

    return () => {
      active = false;
    };
  }, [canReceptionAction, canViewStats, canManageEmployees, canViewInventory, fetchTickets, fetchBookings, fetchStats, fetchParts, fetchEmployees]);

  useEffect(() => {
    try {
      localStorage.setItem('ticketNotifications', JSON.stringify(notifications.slice(0, 50)));
    } catch (error) {
      console.error('KhÃ´ng lÆ°u Ä‘Æ°á»£c lá»‹ch sá»­ thÃ´ng bÃ¡o:', error);
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
                title: isNewTicket ? 'Phiáº¿u sá»­a chá»¯a má»›i' : 'Phiáº¿u Ä‘Ã£ cáº­p nháº­t tráº¡ng thÃ¡i',
                description: `Phiáº¿u ${ticket.ma_phieu} â€” ${ticket.trang_thai.replace(/_/g, ' ')}`,
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
                  title: isNewBooking ? 'Lá»‹ch háº¹n má»›i Ä‘Æ°á»£c tiáº¿p nháº­n' : 'Lá»‹ch háº¹n Ä‘Æ°á»£c cáº­p nháº­t',
                  description: `${booking.ho_ten_khach} â€” ${booking.trang_thai.replace(/_/g, ' ')}`,
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
                  title: quantity <= 0 ? 'Linh kiá»‡n Ä‘Ã£ háº¿t hÃ ng' : 'Cáº£nh bÃ¡o linh kiá»‡n sáº¯p háº¿t',
                  description: `${part.ten_linh_kien} â€” cÃ²n ${quantity} chiáº¿c`,
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
        if (active) console.error('KhÃ´ng kiá»ƒm tra Ä‘Æ°á»£c cáº­p nháº­t phiáº¿u, lá»‹ch háº¹n vÃ  tá»“n kho:', error);
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
      console.error('KhÃ´ng táº¡o Ä‘Æ°á»£c mÃ£ QR trÃªn phiáº¿u in:', error);
    });
    api.get(`/tickets/${receiptTicket.id}/parts`)
      .then(response => {
        if (active) setReceiptParts(response.data.data || []);
      })
      .catch(error => {
        console.error('KhÃ´ng táº£i Ä‘Æ°á»£c chi tiáº¿t linh kiá»‡n trÃªn phiáº¿u in:', error);
        if (active) setReceiptPartsError('KhÃ´ng táº£i Ä‘Æ°á»£c chi tiáº¿t linh kiá»‡n. Vui lÃ²ng Ä‘Ã³ng phiáº¿u vÃ  thá»­ láº¡i.');
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
      console.error('KhÃ´ng táº£i láº¡i Ä‘Æ°á»£c danh sÃ¡ch phiáº¿u:', error);
    }
  };

  const refreshBookings = async () => {
    try {
      setBookings(await fetchBookings());
    } catch (error) {
      console.error('KhÃ´ng táº£i láº¡i Ä‘Æ°á»£c danh sÃ¡ch lá»‹ch háº¹n:', error);
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
        showToast(`âœ… ${res.data?.message || 'ÄÃ£ cáº­p nháº­t tÃ i khoáº£n nhÃ¢n viÃªn!'}`);
      } else {
        const res = await api.post('/admin/employees', {
          ho_ten: employeeForm.ho_ten.trim(),
          ten_dang_nhap: employeeForm.ten_dang_nhap.trim(),
          mat_khau: employeeForm.mat_khau.trim(),
          vai_tro: employeeForm.vai_tro
        });
        showToast(`ðŸŽ‰ ${res.data?.message || 'ÄÃ£ táº¡o tÃ i khoáº£n nhÃ¢n viÃªn má»›i!'}`);
      }
      setEmployees(await fetchEmployees());
      setShowEmployeeModal(false);
    } catch (err) {
      setEmployeeError(err.response?.data?.message || 'KhÃ´ng lÆ°u Ä‘Æ°á»£c thÃ´ng tin nhÃ¢n viÃªn.');
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
      showToast(`ðŸ”’ ${res.data?.message || 'ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i tÃ i khoáº£n!'}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`âŒ ${err.response?.data?.message || 'KhÃ´ng Ä‘á»•i Ä‘Æ°á»£c tráº¡ng thÃ¡i tÃ i khoáº£n'}`);
    }
  };

  const removeEmployee = async (emp) => {
    if (!window.confirm(`Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a tÃ i khoáº£n "${emp.ho_ten}" (@${emp.ten_dang_nhap})?`)) return;
    try {
      const res = await api.delete(`/admin/employees/${emp.id}`);
      showToast(`ðŸ—‘ï¸ ${res.data?.message || 'ÄÃ£ xÃ³a tÃ i khoáº£n nhÃ¢n viÃªn!'}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`âŒ ${err.response?.data?.message || 'KhÃ´ng xÃ³a Ä‘Æ°á»£c tÃ i khoáº£n'}`);
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
      showToast(`âŒ ${err.response?.data?.message || 'KhÃ´ng chuyá»ƒn Ä‘Æ°á»£c tÃ i khoáº£n demo'}`);
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
      setSoftwarePackageError('Vui lÃ²ng chá»n phiáº¿u sá»­a chá»¯a.');
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
        title: 'ÄÃ£ cáº­p nháº­t gÃ³i pháº§n má»m',
        description: `Phiáº¿u ${tickets.find(ticket => String(ticket.id) === selectedSoftwareTicketId)?.ma_phieu || ''} â€” ${savedPackages.length ? savedPackages.join(', ') : 'Ä‘Ã£ xÃ³a lá»±a chá»n gÃ³i'}`,
        createdAt: new Date().toLocaleString('vi-VN'),
        read: false
      }, ...previous].slice(0, 50));
    } catch (error) {
      setSoftwarePackageError(error.response?.data?.message || 'KhÃ´ng lÆ°u Ä‘Æ°á»£c cÃ¡c gÃ³i pháº§n má»m. Vui lÃ²ng thá»­ láº¡i.');
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
      setPartFormError('TÃªn linh kiá»‡n cáº§n cÃ³ tá»« 1 Ä‘áº¿n 150 kÃ½ tá»±.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setPartFormError('GiÃ¡ bÃ¡n pháº£i lÃ  sá»‘ khÃ´ng Ã¢m.');
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setPartFormError('Sá»‘ lÆ°á»£ng tá»“n pháº£i lÃ  sá»‘ nguyÃªn khÃ´ng Ã¢m.');
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
      setPartFormError(err.response?.data?.message || 'KhÃ´ng lÆ°u Ä‘Æ°á»£c linh kiá»‡n. Vui lÃ²ng thá»­ láº¡i.');
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
      showToast(`âœ… ÄÃ£ chuyá»ƒn tráº¡ng thÃ¡i sang: ${status.replace(/_/g, ' ')}`);
      await refreshTickets();
      if (canViewStats) {
        setStats(await fetchStats());
      }
    } catch (err) {
      console.error('KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i phiáº¿u:', err);
      showToast(`âŒ ${err.response?.data?.message || 'Lá»—i cáº­p nháº­t tráº¡ng thÃ¡i'}`);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await api.patch(`/tickets/booking/${id}/status`, { trang_thai: status });
      await refreshBookings();
      await refreshTickets();
      if (status === 'KHACH_DA_DEN') {
        const createdCode = res.data?.ticketCode;
        showToast(`ðŸŽ‰ ÄÃ£ tiáº¿p nháº­n khÃ¡ch & tá»± Ä‘á»™ng táº¡o phiáº¿u sá»­a chá»¯a ${createdCode ? `(${createdCode})` : ''}!`);
        setActiveTab('TICKETS');
      } else {
        showToast(`âœ… ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i lá»‹ch háº¹n: ${status}`);
      }
    } catch (err) {
      console.error('KhÃ´ng cáº­p nháº­t Ä‘Æ°á»£c tráº¡ng thÃ¡i lá»‹ch háº¹n:', err);
      showToast(`âŒ ${err.response?.data?.message || 'Lá»—i cáº­p nháº­t lá»‹ch háº¹n'}`);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const matchesStatusFilter = (ticket) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CHO_KHAM') return ticket.trang_thai === 'CHá»œ_KHÃM';
    if (statusFilter === 'DANG_XU_LY') return ticket.trang_thai === 'ÄANG_CHUáº¨N_ÄOÃN' || ticket.trang_thai === 'ÄANG_Sá»¬A';
    if (statusFilter === 'CHO_CHOT_GIA') return ticket.trang_thai === 'CHá»œ_KHÃCH_CHá»T_GIÃ';
    if (statusFilter === 'BAO_HANH') return ticket.trang_thai === 'YÃŠU_Cáº¦U_Báº¢O_HÃ€NH';
    if (statusFilter === 'HOAN_TAT') return ticket.trang_thai === 'ÄÃƒ_Sá»¬A_XONG' || ticket.trang_thai === 'ÄÃƒ_GIAO_KHÃCH_VÃ€_THU_TIá»€N';
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
      {/* Header Dieu Hanh & Chuyen Nhanh Chuc Vu (RBAC Switcher) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-extrabold text-brand-blue">
                Báº£ng Äiá»u Khiá»ƒn â€” {currentRoleInfo.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${currentRoleInfo.badgeClass}`}>
                {currentRoleInfo.badge} â€¢ Level {currentRoleInfo.level}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-1.5">
              Xin chÃ o <strong className="text-slate-800">{fullName}</strong> {currentUsername ? `(@${currentUsername})` : ''} â€” <span className="text-slate-500">{currentRoleInfo.permissionsText}</span>
            </p>
          </div>

          <div className="relative flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Bá»™ chuyá»ƒn nhanh chá»©c vá»¥ Ä‘á»ƒ kiá»ƒm thá»­ phÃ¢n quyá»n */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">âš¡ Test chá»©c vá»¥:</span>
              <select
                value={currentUsername || (role === 'GIAM_DOC' ? 'giamdoc' : role === 'QUAN_LY' ? 'quanly' : role === 'KE_TOAN' ? 'ketoan' : role === 'THU_KHO' ? 'thukho' : role === 'KY_THUAT_VIEN' ? 'kythuat' : 'letan')}
                disabled={switchingRole}
                onChange={(e) => handleQuickSwitchRole(e.target.value)}
                aria-label="Chuyá»ƒn nhanh chá»©c vá»¥ phÃ¢n quyá»n"
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
              aria-label={`ThÃ´ng bÃ¡o (${unreadNotificationCount})`}
              className="relative rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-blue hover:bg-slate-50"
            >
              ðŸ”” ThÃ´ng bÃ¡o
              {unreadNotificationCount > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">{unreadNotificationCount}</span>
              )}
            </button>
            <button onClick={logout} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">
              ÄÄƒng Xuáº¥t
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Trung tÃ¢m thÃ´ng bÃ¡o</h3>
                  <button type="button" onClick={clearNotifications} className="text-xs font-semibold text-brand-blue hover:underline">
                    XÃ³a táº¥t cáº£
                  </button>
                </div>
                <button type="button" onClick={markAllNotificationsRead} className="mb-2 text-xs font-semibold text-brand-blue hover:underline">
                  ÄÃ¡nh dáº¥u táº¥t cáº£ Ä‘Ã£ Ä‘á»c
                </button>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`rounded-lg p-3 text-sm ${notification.read ? 'bg-slate-50' : 'bg-blue-50'}`}>
                      <p className="font-semibold">{notification.title || `Phiáº¿u ${notification.ticketCode}: ${notification.status}`}</p>
                      {notification.description && <p className="mt-1 text-slate-700">{notification.description}</p>}
                      <p className="mt-1 text-xs text-slate-500">{notification.createdAt}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && <p className="py-6 text-center text-sm text-slate-500">ChÆ°a cÃ³ thÃ´ng bÃ¡o má»›i.</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      
        {/* Thanh Dieu Huong Cac Trang Quan Tri Cap Cao */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
            Chuyển nhanh:
          </span>
          <span className="rounded-xl bg-brand-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs">
            📋 Bàn Vận Hành Kỹ Thuật (Hiện tại)
          </span>
          {isExecutive && (
            <Link
              to="/admin/giam-doc"
              className="flex items-center gap-1.5 rounded-xl bg-purple-50 border border-purple-200 px-3.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
            >
              <span>👑</span> Trang Giám Đốc
            </Link>
          )}
          {isManagerOrAbove && (
            <Link
              to="/admin/quan-ly"
              className="flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
            >
              <span>🏬</span> Trang Quản Lý
            </Link>
          )}
          {canManageEmployees && (
            <Link
              to="/admin/nhan-su"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
            >
              <span>👥</span> Quản Lý Nhân Sự & Phân Quyền
            </Link>
          )}
        </div>
      </div>

      {latestNotice && (
        <div role="status" className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-xl bg-green-700 p-4 text-white shadow-xl">
          <p className="flex-1">{latestNotice.description || latestNotice.title}</p>
          <button type="button" onClick={() => setLatestNotice(null)} aria-label="ÄÃ³ng thÃ´ng bÃ¡o" className="font-bold">Ã—</button>
        </div>
      )}

      {/* Thanh Tab Nghiá»‡p Vá»¥ (Hiá»ƒn thá»‹ tá»± Ä‘á»™ng theo Cáº¥p Báº­c PhÃ¢n Quyá»n) */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('TICKETS')}
          className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'TICKETS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          ðŸ“‹ Phiáº¿u sá»­a chá»¯a
        </button>
        {canReceptionAction && (
          <button 
            onClick={() => setActiveTab('BOOKINGS')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'BOOKINGS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            ðŸ“… Lá»‹ch háº¹n
          </button>
        )}
        {canViewInventory && (
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'INVENTORY' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            ðŸ“¦ Kho linh kiá»‡n
          </button>
        )}
        {canTechAction && (
          <button
            onClick={() => setActiveTab('SOFTWARE')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'SOFTWARE' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            ðŸ’¿ GÃ³i pháº§n má»m
          </button>
        )}
        {canViewStats && (
          <button
            onClick={() => setActiveTab('STATS')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'STATS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            ðŸ“Š BÃ¡o cÃ¡o doanh thu
          </button>
        )}
        {canManageEmployees && (
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'EMPLOYEES' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
            ðŸ‘¥ NhÃ¢n sá»± &amp; PhÃ¢n quyá»n ({employees.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`rounded-t-lg px-5 py-3 text-sm font-bold ${activeTab === 'NOTIFICATIONS' ? 'bg-brand-blue text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          ðŸ”” ThÃ´ng bÃ¡o{notifications.length > 0 ? ` (${notifications.length})` : ''}
        </button>
      </div>

      {activeTab === 'TICKETS' && (
        <div className="rounded-xl border-t-4 border-brand-green bg-white p-5 shadow sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Danh sÃ¡ch phiáº¿u sá»­a chá»¯a</h3>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="search"
                value={ticketSearch}
                onChange={event => setTicketSearch(event.target.value)}
                placeholder="TÃ¬m mÃ£ phiáº¿u, khÃ¡ch hÃ ng, sá»‘ Ä‘iá»‡n thoáº¡i..."
                aria-label="TÃ¬m mÃ£ phiáº¿u, khÃ¡ch hÃ ng hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
              />
              {canReceptionAction && (
                <button
                  type="button"
                  onClick={() => setShowPosModal(true)}
                  className="rounded-lg bg-brand-orange px-3.5 py-2 text-xs font-bold text-white hover:bg-orange-600 shadow-sm whitespace-nowrap"
                >
                  + Tiáº¿p Nháº­n Táº¡i Quáº§y (POS)
                </button>
              )}
              <button
                type="button"
                onClick={() => exportToCsv(
                  'Bao_Cao_Phieu_Sua_Chua.csv',
                  ['MÃ£ Phiáº¿u', 'KhÃ¡ch HÃ ng', 'Sá»‘ Äiá»‡n Thoáº¡i', 'Thiáº¿t Bá»‹', 'Lá»—i MÃ´ Táº£', 'Äá»‘i TÆ°á»£ng', 'TrÆ°á»ng Há»c', 'Tráº¡ng ThÃ¡i', 'Chi PhÃ­ Gá»‘c (VNÄ)', 'Thá»±c Thu (VNÄ)', 'Háº¡n Báº£o HÃ nh', 'NgÃ y Táº¡o'],
                  filteredTickets.map(t => {
                    const raw = Number(t.tong_tien || 0);
                    const finalAmt = t.la_sinh_vien ? Math.round(raw * 0.85) : raw;
                    return [
                      t.ma_phieu,
                      t.ho_ten_khach,
                      t.so_dien_thoai,
                      t.ten_thiet_bi || '',
                      t.mo_ta_loi || '',
                      t.la_sinh_vien ? 'Sinh viÃªn (-15%)' : 'KhÃ¡ch thÆ°á»ng',
                      t.truong_hoc || '',
                      t.trang_thai,
                      raw,
                      finalAmt,
                      t.han_bao_hanh ? new Date(t.han_bao_hanh).toLocaleDateString('vi-VN') : '',
                      t.ngay_tao ? new Date(t.ngay_tao).toLocaleString('vi-VN') : ''
                    ];
                  })
                )}
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm whitespace-nowrap"
              >
                ðŸ“¥ Xuáº¥t Excel (CSV)
              </button>
            </div>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Táº¥t cáº£', count: tickets.length },
              { id: 'CHO_KHAM', label: 'Chá» khÃ¡m', count: tickets.filter(t => t.trang_thai === 'CHá»œ_KHÃM').length },
              { id: 'DANG_XU_LY', label: 'Äang kiá»ƒm tra / sá»­a', count: tickets.filter(t => t.trang_thai === 'ÄANG_CHUáº¨N_ÄOÃN' || t.trang_thai === 'ÄANG_Sá»¬A').length },
              { id: 'CHO_CHOT_GIA', label: 'Chá» khÃ¡ch chá»‘t giÃ¡', count: tickets.filter(t => t.trang_thai === 'CHá»œ_KHÃCH_CHá»T_GIÃ').length },
              { id: 'BAO_HANH', label: 'YÃªu cáº§u báº£o hÃ nh', count: tickets.filter(t => t.trang_thai === 'YÃŠU_Cáº¦U_Báº¢O_HÃ€NH').length },
              { id: 'HOAN_TAT', label: 'ÄÃ£ hoÃ n táº¥t', count: tickets.filter(t => t.trang_thai === 'ÄÃƒ_Sá»¬A_XONG' || t.trang_thai === 'ÄÃƒ_GIAO_KHÃCH_VÃ€_THU_TIá»€N').length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Optional Custom Technician Note for Timeline */}
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">ðŸ“ Ghi chÃº nháº­t kÃ½ cho khÃ¡ch:</span>
            <input
              type="text"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              placeholder="Nháº­p ghi chÃº (VD: ÄÃ£ vá»‡ sinh keo táº£n nhiá»‡t, Ä‘ang test nhiá»‡t Ä‘á»™ GPU...) trÆ°á»›c khi báº¥m nÃºt Ä‘á»•i tráº¡ng thÃ¡i"
              className="flex-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-brand-blue focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4">MÃ£ Phiáº¿u</th>
                <th className="py-3 px-4">KhÃ¡ch hÃ ng</th>
                <th className="py-3 px-4">Lá»—i mÃ´ táº£</th>
                <th className="py-3 px-4">Tráº¡ng thÃ¡i</th>
                <th className="py-3 px-4 text-right">Tá»•ng Tiá»n</th>
                <th className="py-3 px-4 text-center">Thao tÃ¡c</th>
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
                          ðŸ’» Remote: {ticket.ma_ultraviewer || 'Online'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{ticket.ho_ten_khach}</div>
                    <div className="text-xs text-slate-400">{ticket.so_dien_thoai}</div>
                    {ticket.la_sinh_vien && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          ðŸŽ“ {ticket.truong_hoc || 'Sinh viÃªn'} (-15%)
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">{ticket.mo_ta_loi}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      ticket.trang_thai === 'CHá»œ_KHÃM' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.trang_thai === 'ÄANG_CHUáº¨N_ÄOÃN' ? 'bg-orange-100 text-orange-700' :
                      ticket.trang_thai === 'CHá»œ_KHÃCH_CHá»T_GIÃ' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      ticket.trang_thai === 'ÄANG_Sá»¬A' ? 'bg-blue-100 text-blue-700' :
                      ticket.trang_thai === 'ÄÃƒ_Sá»¬A_XONG' ? 'bg-green-100 text-green-700' : 
                      ticket.trang_thai === 'ÄÃƒ_GIAO_KHÃCH_VÃ€_THU_TIá»€N' ? 'bg-purple-100 text-purple-700' :
                      ticket.trang_thai === 'YÃŠU_Cáº¦U_Báº¢O_HÃ€NH' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.trang_thai.replace(/_/g, ' ')}
                    </span>
                    {ticket.han_bao_hanh && (
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ðŸ›¡ï¸ ÄÃ£ cáº¥p BH Ä‘iá»‡n tá»­
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {ticket.la_sinh_vien && rawTotal > 0 ? (
                      <div>
                        <div className="text-xs text-slate-400 line-through">{rawTotal.toLocaleString('vi-VN')} Ä‘</div>
                        <div className="font-bold text-red-600">{finalTotal.toLocaleString('vi-VN')} Ä‘</div>
                      </div>
                    ) : (
                      <span className="font-bold text-red-500">{rawTotal.toLocaleString('vi-VN')} Ä‘</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center space-y-1.5 flex flex-col items-center">
                    {canReceptionAction && ticket.trang_thai === 'CHá»œ_KHÃM' && (
                      <button onClick={() => updateStatus(ticket.id, 'ÄANG_CHUáº¨N_ÄOÃN')} className="bg-brand-orange text-white px-3 py-1 rounded font-bold text-xs w-full">Chuyá»ƒn Ká»¹ Thuáº­t</button>
                    )}
                    {(canReceptionAction || canTechAction) && ticket.trang_thai === 'YÃŠU_Cáº¦U_Báº¢O_HÃ€NH' && (
                      <button onClick={() => updateStatus(ticket.id, 'ÄANG_Sá»¬A')} className="bg-red-600 text-white px-3 py-1 rounded font-bold text-xs w-full">Tiáº¿p Nháº­n Báº£o HÃ nh</button>
                    )}
                    {canTechAction && ticket.trang_thai === 'ÄANG_CHUáº¨N_ÄOÃN' && (
                      <>
                        <button onClick={() => openPartModal(ticket.id)} className="bg-yellow-500 text-white px-3 py-1 rounded font-bold text-xs w-full">ThÃªm Linh Kiá»‡n</button>
                        <button onClick={() => updateStatus(ticket.id, 'CHá»œ_KHÃCH_CHá»T_GIÃ')} className="bg-amber-600 text-white px-3 py-1 rounded font-bold text-xs w-full">Gá»­i BÃ¡o GiÃ¡</button>
                        <button onClick={() => updateStatus(ticket.id, 'ÄANG_Sá»¬A')} className="bg-blue-500 text-white px-3 py-1 rounded font-bold text-xs w-full">Tiáº¿n hÃ nh Sá»­a</button>
                      </>
                    )}
                    {(canReceptionAction || canTechAction) && ticket.trang_thai === 'CHá»œ_KHÃCH_CHá»T_GIÃ' && (
                      <button onClick={() => updateStatus(ticket.id, 'ÄANG_Sá»¬A')} className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xs w-full">KhÃ¡ch Chá»‘t (Sá»­a)</button>
                    )}
                    {canTechAction && ticket.trang_thai === 'ÄANG_Sá»¬A' && (
                      <>
                        <button onClick={() => openPartModal(ticket.id)} className="bg-yellow-500 text-white px-3 py-1 rounded font-bold text-xs w-full mb-1">ThÃªm Linh Kiá»‡n</button>
                        <button onClick={() => updateStatus(ticket.id, 'CHá»œ_KHÃCH_CHá»T_GIÃ')} className="bg-amber-600 text-white px-3 py-1 rounded font-bold text-xs w-full">Gá»­i BÃ¡o GiÃ¡</button>
                        <button onClick={() => updateStatus(ticket.id, 'ÄÃƒ_Sá»¬A_XONG')} className="bg-brand-green text-white px-3 py-1 rounded font-bold text-xs w-full">Sá»­a Xong</button>
                      </>
                    )}
                    {canCashierAction && ticket.trang_thai === 'ÄÃƒ_Sá»¬A_XONG' && (
                      <button onClick={() => updateStatus(ticket.id, 'ÄÃƒ_GIAO_KHÃCH_VÃ€_THU_TIá»€N')} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded font-bold text-xs w-full">Giao KhÃ¡ch &amp; Thu Tiá»n</button>
                    )}
                    <button
                      type="button"
                      onClick={() => openPhotoModal(ticket)}
                      className="w-full rounded bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-300 hover:bg-amber-100"
                    >
                      ðŸ“¸ áº¢nh ngoáº¡i quan
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
                      className="w-full rounded bg-slate-700 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      In phiáº¿u 80mm
                    </button>
                  </td>
                </tr>
              );
              })}
              {filteredTickets.length === 0 && (
                <tr><td colSpan="6" className="text-center py-8 text-slate-400">
                  {tickets.length === 0 ? 'KhÃ´ng cÃ³ phiáº¿u nÃ o.' : 'KhÃ´ng tÃ¬m tháº¥y phiáº¿u phÃ¹ há»£p.'}
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'STATS' && canViewStats && (
        <div className="rounded-xl border-t-4 border-purple-500 bg-white p-5 shadow sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-brand-blue">BÃ¡o cÃ¡o doanh thu &amp; hiá»‡u suáº¥t</h3>
              <p className="mt-1 text-sm text-slate-500">Doanh thu chá»‰ tÃ­nh cÃ¡c phiáº¿u Ä‘Ã£ giao khÃ¡ch vÃ  thu tiá»n.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                Khoáº£ng thá»i gian
                <select
                  value={reportPeriod}
                  onChange={event => setReportPeriod(event.target.value)}
                  aria-label="Khoáº£ng thá»i gian bÃ¡o cÃ¡o"
                  className="rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="week">7 ngÃ y gáº§n nháº¥t</option>
                  <option value="month">ThÃ¡ng nÃ y</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => exportToCsv(
                  'Bao_Cao_Doanh_Thu_Kinh_Doanh.csv',
                  ['NgÃ y', 'Doanh Thu NgÃ y (VNÄ)', 'Tá»•ng Doanh Thu Ká»³ (VNÄ)', 'Doanh Thu Linh Kiá»‡n Ká»³ (VNÄ)', 'Sá»‘ Phiáº¿u HoÃ n Táº¥t Ká»³'],
                  (stats.revenueData || []).map(row => [
                    row.date,
                    row.total_revenue,
                    stats.totalRevenue || 0,
                    stats.totalPartsRevenue || 0,
                    stats.completedTickets || 0
                  ])
                )}
                className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
              >
                ðŸ“¥ Xuáº¥t BÃ¡o CÃ¡o Káº¿ ToÃ¡n (CSV)
              </button>
            </div>
          </div>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <article className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm font-semibold text-slate-600">Doanh thu trong ká»³</p>
              <p className="mt-2 text-2xl font-extrabold text-brand-blue">{Number(stats.totalRevenue || 0).toLocaleString('vi-VN')} Ä‘</p>
              <p className="mt-1 text-xs text-slate-500">{reportPeriod === 'week' ? '7 ngÃ y gáº§n nháº¥t' : 'Tá»« Ä‘áº§u thÃ¡ng Ä‘áº¿n hiá»‡n táº¡i'}</p>
            </article>
            <article className="rounded-xl bg-green-50 p-5">
              <p className="text-sm font-semibold text-slate-600">Phiáº¿u Ä‘Ã£ hoÃ n táº¥t</p>
              <p className="mt-2 text-2xl font-extrabold text-green-800">{Number(stats.completedTickets || 0)} phiáº¿u</p>
              <p className="mt-1 text-xs text-slate-500">ÄÃ£ giao khÃ¡ch vÃ  thu tiá»n trong ká»³</p>
            </article>
          </div>
          <div className="mb-5 rounded-lg bg-slate-50 px-4 py-3">
            <span className="text-sm text-slate-600">Doanh thu linh kiá»‡n trong ká»³: </span>
            <strong className="text-brand-blue">{Number(stats.totalPartsRevenue || 0).toLocaleString('vi-VN')} Ä‘</strong>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-4 font-bold text-slate-700">{reportPeriod === 'week' ? 'Doanh thu tá»«ng ngÃ y â€” 7 ngÃ y qua' : 'Doanh thu tá»«ng ngÃ y â€” thÃ¡ng nÃ y'}</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={tick => new Date(`${tick}T12:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} />
                    <YAxis tickFormatter={value => Number(value).toLocaleString('vi-VN')} width={72} />
                    <Tooltip labelFormatter={label => new Date(`${label}T12:00:00`).toLocaleDateString('vi-VN')} formatter={value => `${Number(value).toLocaleString('vi-VN')} Ä‘`} />
                    <Bar dataKey="total_revenue" name="Doanh thu" fill="#1a7f45" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="min-w-0 rounded-xl border border-slate-200 p-4">
              <h4 className="mb-4 font-bold text-slate-700">PhÃ¢n bá»• tráº¡ng thÃ¡i phiáº¿u</h4>
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
            BÃ¡o cÃ¡o tÃ­nh doanh thu tá»« cÃ¡c phiáº¿u Ä‘Ã£ thanh toÃ¡n vÃ  phÃ¢n loáº¡i sá»‘ lÆ°á»£ng phiáº¿u theo tráº¡ng thÃ¡i hiá»‡n táº¡i.
          </p>
        </div>
      )}

      {activeTab === 'SOFTWARE' && canTechAction && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-xl font-bold text-brand-blue">GÃ³i pháº§n má»m &amp; cÃ i Ä‘áº·t</h3>
          <p className="mt-1 text-sm text-slate-500">Chá»n nhiá»u gÃ³i pháº§n má»m cho cÃ¹ng má»™t phiáº¿u sá»­a chá»¯a.</p>
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Lá»±a chá»n cÃ¡c gÃ³i khÃ¡ch yÃªu cáº§u; ká»¹ thuáº­t viÃªn xÃ¡c nháº­n kháº£ nÄƒng cÃ i Ä‘áº·t vÃ  chi phÃ­ trÆ°á»›c khi thá»±c hiá»‡n.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Phiáº¿u sá»­a chá»¯a
              <select
                value={selectedSoftwareTicketId}
                onChange={event => selectSoftwareTicket(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="">Chá»n phiáº¿u sá»­a chá»¯a</option>
                {tickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ma_phieu} â€” {ticket.ho_ten_khach} ({ticket.trang_thai.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              NhÃ³m pháº§n má»m
              <select
                value={selectedSoftwareGroup}
                onChange={event => setSelectedSoftwareGroup(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
              >
                <option value="ALL">Táº¥t cáº£ nhÃ³m</option>
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
            <p className="text-sm text-slate-600">ÄÃ£ chá»n {selectedSoftwarePackages.length} gÃ³i pháº§n má»m.</p>
            <button
              type="button"
              onClick={saveSoftwarePackages}
              disabled={!selectedSoftwareTicketId || savingSoftwarePackages}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingSoftwarePackages ? 'Äang lÆ°u...' : 'LÆ°u gÃ³i cho phiáº¿u'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'NOTIFICATIONS' && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-brand-blue">Trung tÃ¢m thÃ´ng bÃ¡o</h3>
              <p className="mt-1 text-sm text-slate-500">Theo dÃµi phiáº¿u sá»­a chá»¯a, lá»‹ch háº¹n vÃ  cáº£nh bÃ¡o kho.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                disabled={unreadNotificationCount === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ÄÃ¡nh dáº¥u Ä‘Ã£ Ä‘á»c
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                disabled={notifications.length === 0}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                XÃ³a táº¥t cáº£
              </button>
            </div>
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
            Hiá»ƒn thá»‹
            <select
              value={notificationFilter}
              onChange={event => setNotificationFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="ALL">Táº¥t cáº£ thÃ´ng bÃ¡o</option>
              <option value="UNREAD">ChÆ°a Ä‘á»c</option>
            </select>
            <span className="ml-auto text-xs font-normal">{unreadNotificationCount} chÆ°a Ä‘á»c</span>
          </label>
          <div className="space-y-2">
            {notifications
              .filter(notification => notificationFilter !== 'UNREAD' || !notification.read)
              .map(notification => (
              <article key={notification.id} className={`rounded-lg border p-4 ${notification.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50'}`}>
                <p className="font-semibold text-slate-800">{notification.title || `Phiáº¿u ${notification.ticketCode}: ${notification.status}`}</p>
                {notification.description && <p className="mt-1 text-sm text-slate-600">{notification.description}</p>}
                <p className="mt-1 text-xs text-slate-500">{notification.createdAt}</p>
              </article>
            ))}
            {notifications.filter(notification => notificationFilter !== 'UNREAD' || !notification.read).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                {notificationFilter === 'UNREAD' ? 'KhÃ´ng cÃ³ thÃ´ng bÃ¡o chÆ°a Ä‘á»c.' : 'ChÆ°a cÃ³ thÃ´ng bÃ¡o má»›i.'}
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
                <h3 className="text-xl font-bold text-brand-blue">Kho linh kiá»‡n &amp; váº­t tÆ°</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {canManageInventory
                    ? 'Quáº£n lÃ½ danh má»¥c, nháº­p thÃªm sá»‘ lÆ°á»£ng tá»“n kho vÃ  cáº­p nháº­t giÃ¡ niÃªm yáº¿t.'
                    : 'Cháº¿ Ä‘á»™ Ká»¹ thuáº­t viÃªn: Tra cá»©u tá»“n kho linh kiá»‡n (Quyá»n sá»­a giÃ¡ & nháº­p hÃ ng thuá»™c vá» Thá»§ kho / Quáº£n lÃ½).'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
                  Cáº£nh bÃ¡o: {parts.filter(part => Number(part.so_luong) < Number(lowStockThreshold || 5)).length} linh kiá»‡n cáº§n nháº­p hÃ ng
                </p>
                <button
                  type="button"
                  onClick={() => exportToCsv(
                    'Bao_Cao_Ton_Kho_Linh_Kien.csv',
                    ['MÃ£ Linh Kiá»‡n', 'TÃªn Linh Kiá»‡n', 'GiÃ¡ BÃ¡n (VNÄ)', 'Sá»‘ LÆ°á»£ng Tá»“n', 'TÃ¬nh Tráº¡ng'],
                    parts.map(p => {
                      const qty = Number(p.so_luong);
                      const status = qty <= 0 ? 'Háº¿t hÃ ng' : qty < Number(lowStockThreshold || 5) ? 'Sáº¯p háº¿t' : 'CÃ²n hÃ ng';
                      return [p.id, p.ten_linh_kien, p.gia_ban, qty, status];
                    })
                  )}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  ðŸ“¥ Xuáº¥t Kho (CSV)
                </button>
                {canManageInventory && (
                  <button
                    type="button"
                    onClick={() => { resetPartForm(); setShowInventoryForm(true); }}
                    className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-800"
                  >
                    + ThÃªm linh kiá»‡n
                  </button>
                )}
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_auto_auto]">
              <input
                type="search"
                value={partSearch}
                onChange={event => setPartSearch(event.target.value)}
                placeholder="TÃ¬m theo tÃªn linh kiá»‡n..."
                aria-label="TÃ¬m theo tÃªn linh kiá»‡n"
                className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                Cáº£nh bÃ¡o dÆ°á»›i
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={lowStockThreshold}
                  onChange={event => {
                    const value = event.target.value;
                    if (value === '' || Number(value) >= 1) setLowStockThreshold(value);
                  }}
                  aria-label="NgÆ°á»¡ng cáº£nh bÃ¡o tá»“n kho tháº¥p"
                  className="w-20 rounded-lg border border-slate-300 px-3 py-2"
                />
                chiáº¿c
              </label>
              <select
                value={stockFilter}
                onChange={event => setStockFilter(event.target.value)}
                aria-label="Lá»c tÃ¬nh tráº¡ng linh kiá»‡n"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="ALL">Táº¥t cáº£ linh kiá»‡n</option>
                <option value="LOW">Sáº¯p háº¿t</option>
                <option value="OUT">Háº¿t hÃ ng</option>
                <option value="AVAILABLE">CÃ²n hÃ ng</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">TÃªn linh kiá»‡n</th>
                    <th className="px-3 py-3 text-right">GiÃ¡ bÃ¡n</th>
                    <th className="px-3 py-3 text-center">Tá»“n kho</th>
                    <th className="px-3 py-3 text-center">TÃ¬nh tráº¡ng</th>
                    <th className="px-3 py-3 text-right">Thao tÃ¡c</th>
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
                          <td className="px-3 py-3 text-right tabular-nums">{Number(part.gia_ban).toLocaleString('vi-VN')} Ä‘</td>
                          <td className="px-3 py-3 text-center font-semibold tabular-nums">{quantity}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                              outOfStock ? 'bg-red-50 text-red-700' : lowStock ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-700'
                            }`}>
                              {outOfStock ? 'Háº¿t hÃ ng' : lowStock ? 'Sáº¯p háº¿t' : 'CÃ²n hÃ ng'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            {canManageInventory ? (
                              <button
                                type="button"
                                onClick={() => editPart(part)}
                                className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand-blue hover:bg-blue-50"
                              >
                                Sá»­a giÃ¡ / Nháº­p kho
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">Chá»‰ xem tá»“n kho</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {parts.length === 0 && (
                    <tr><td colSpan="5" className="py-10 text-center text-sm text-slate-400">ChÆ°a cÃ³ linh kiá»‡n trong kho.</td></tr>
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
                    <tr><td colSpan="5" className="py-10 text-center text-sm text-slate-400">KhÃ´ng tÃ¬m tháº¥y linh kiá»‡n phÃ¹ há»£p.</td></tr>
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
                  {editingPartId ? 'Cáº­p nháº­t linh kiá»‡n' : 'ThÃªm linh kiá»‡n'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">GiÃ¡ vÃ  sá»‘ lÆ°á»£ng Ä‘Æ°á»£c dÃ¹ng cho kho vÃ  báº£ng giÃ¡ cÃ´ng khai.</p>
              </div>
              <button type="button" onClick={resetPartForm} aria-label="ÄÃ³ng" className="rounded px-2 py-1 text-xl text-slate-500 hover:bg-slate-100">Ã—</button>
            </div>

            {partFormError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{partFormError}</p>
            )}

            <form onSubmit={savePart} className="mt-5 space-y-4">
              <div>
                <label htmlFor="part-name" className="mb-1 block text-sm font-semibold text-slate-700">TÃªn linh kiá»‡n *</label>
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
                <label htmlFor="part-price" className="mb-1 block text-sm font-semibold text-slate-700">GiÃ¡ bÃ¡n (VNÄ) *</label>
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
                <label htmlFor="part-stock" className="mb-1 block text-sm font-semibold text-slate-700">Sá»‘ lÆ°á»£ng tá»“n *</label>
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
                  {savingPart ? 'Äang lÆ°u...' : editingPartId ? 'LÆ°u thay Ä‘á»•i' : 'ThÃªm vÃ o kho'}
                </button>
                <button
                  type="button"
                  onClick={resetPartForm}
                  className="rounded-lg bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Há»§y
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
            <h3 className="text-xl font-bold">Lá»‹ch háº¹n chÆ°a xá»­ lÃ½ / Sáº¯p tá»›i</h3>
            <span className="text-xs font-medium text-slate-500">
              ðŸ’¡ Khi báº¥m <b>KhÃ¡ch ÄÃ£ Äáº¿n</b>, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng khá»Ÿi táº¡o Phiáº¿u sá»­a chá»¯a QR &amp; Ä‘á»“ng bá»™ Æ°u Ä‘Ã£i sinh viÃªn.
            </span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 px-4">NgÃ y / Giá» Háº¹n</th>
                <th className="py-3 px-4">KhÃ¡ch hÃ ng</th>
                <th className="py-3 px-4">Lá»—i mÃ´ táº£</th>
                <th className="py-3 px-4">Tráº¡ng thÃ¡i</th>
                <th className="py-3 px-4 text-center">Thao tÃ¡c</th>
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
                          ðŸŽ“ {bk.truong_hoc || 'Sinh viÃªn'} (-15%)
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
                      {bk.trang_thai === 'CHO_XAC_NHAN' ? 'CHá»œ XÃC NHáº¬N' : 
                       bk.trang_thai === 'DA_XAC_NHAN' ? 'ÄÃƒ XÃC NHáº¬N' : 
                       bk.trang_thai === 'KHACH_DA_DEN' ? 'KHÃCH ÄÃƒ Äáº¾N' : 'ÄÃƒ Há»¦Y'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center space-y-2 flex flex-col items-center">
                    {bk.trang_thai === 'CHO_XAC_NHAN' && (
                      <>
                        <button onClick={() => updateBookingStatus(bk.id, 'DA_XAC_NHAN')} className="bg-brand-blue text-white px-3 py-1 rounded font-bold text-sm w-full">Gá»i & Chá»‘t</button>
                        <button onClick={() => updateBookingStatus(bk.id, 'HUY')} className="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm w-full">Há»§y Lá»‹ch</button>
                      </>
                    )}
                    {bk.trang_thai === 'DA_XAC_NHAN' && (
                      <button onClick={() => updateBookingStatus(bk.id, 'KHACH_DA_DEN')} className="bg-brand-green text-white px-3 py-1 rounded font-bold text-sm w-full">KhÃ¡ch ÄÃ£ Äáº¿n (Táº¡o Phiáº¿u QR)</button>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">KhÃ´ng cÃ³ lá»‹ch háº¹n nÃ o.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'EMPLOYEES' && canManageEmployees && (
        <div className="space-y-6">
          {/* SÆ¡ Ä‘á»“ Ma tráº­n PhÃ¢n quyá»n 6 Cáº¥p báº­c Tá»« TrÃªn Xuá»‘ng (Top-Down RBAC Hierarchy) */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue flex items-center gap-2">
                  <span>ðŸ›ï¸</span> ThÃ¡p PhÃ¢n Quyá»n 6 Cáº¥p Báº­c Tá»« TrÃªn Xuá»‘ng (Top-Down RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cáº¥p trÃªn quáº£n lÃ½ cáº¥p dÆ°á»›i: GiÃ¡m Äá»‘c (Level 100) cáº¥p phÃ¡t má»i quyá»n; Quáº£n LÃ½ (Level 80) chá»‰ cáº¥p phÃ¡t vÃ  Ä‘iá»u hÃ nh nhÃ¢n sá»± cáº¥p dÆ°á»›i (&lt; Level 80).
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateEmployeeModal}
                className="rounded-xl bg-brand-blue hover:bg-blue-800 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition flex items-center gap-1.5"
              >
                <span>+</span> Táº¡o TÃ i Khoáº£n NhÃ¢n ViÃªn Má»›i
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'GIAM_DOC', pages: 'Táº¥t cáº£ 6 trang + Quáº£n trá»‹ tá»‘i cao' },
                { key: 'QUAN_LY', pages: 'Táº¥t cáº£ 6 trang (Quáº£n lÃ½ nhÃ¢n sá»± cáº¥p dÆ°á»›i)' },
                { key: 'KE_TOAN', pages: 'Phiáº¿u sá»­a chá»¯a â€¢ BÃ¡o cÃ¡o doanh thu â€¢ Thu ngÃ¢n' },
                { key: 'THU_KHO', pages: 'Kho linh kiá»‡n (Nháº­p/Sá»­a giÃ¡) â€¢ Äá»‘i chiáº¿u phiáº¿u' },
                { key: 'KY_THUAT_VIEN', pages: 'Phiáº¿u sá»­a chá»¯a â€¢ GÃ³i pháº§n má»m â€¢ Xem kho' },
                { key: 'LE_TAN', pages: 'Phiáº¿u sá»­a chá»¯a (POS) â€¢ Lá»‹ch háº¹n â€¢ BÃ n giao mÃ¡y' }
              ].map((item) => {
                const meta = ROLE_META[item.key];
                return (
                  <div key={item.key} className="rounded-xl border border-slate-200/90 p-3.5 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}>
                          {meta.badge}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">Level {meta.level}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{meta.permissionsText}</p>
                    </div>
                    <p className="text-[11px] font-bold text-brand-blue mt-2 pt-2 border-t border-slate-200/70">
                      ðŸ“Œ Trang truy cáº­p: <span className="font-semibold text-slate-700">{item.pages}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sach Tai khoan Nhan su & Cong cu Cap phat / Khoa / Doi chuc vu */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border-t-4 border-brand-blue">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Danh SÃ¡ch TÃ i Khoáº£n NhÃ¢n Sá»± ({employees.length})</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Äang Ä‘Äƒng nháº­p vá»›i quyá»n: <strong>{currentRoleInfo.title} (Level {currentRoleLevel})</strong> â€” {isExecutive ? 'Báº¡n cÃ³ toÃ n quyá»n táº¡o, Ä‘á»•i chá»©c vá»¥ vÃ  khÃ³a má»i tÃ i khoáº£n.' : 'Báº¡n chá»‰ Ä‘Æ°á»£c phÃ©p táº¡o, sá»­a hoáº·c khÃ³a tÃ i khoáº£n nhÃ¢n sá»± cáº¥p dÆ°á»›i (< Level 80).'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-blue border border-blue-200">
                  ðŸ‘¨â€ðŸ”§ Äang xá»­ lÃ½: {tickets.filter(t => t.trang_thai === 'ÄANG_CHUáº¨N_ÄOÃN' || t.trang_thai === 'ÄANG_Sá»¬A').length} mÃ¡y
                </span>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  âœ… ÄÃ£ hoÃ n táº¥t: {tickets.filter(t => t.trang_thai === 'ÄÃƒ_Sá»¬A_XONG' || t.trang_thai === 'ÄÃƒ_GIAO_KHÃCH_VÃ€_THU_TIá»€N').length} mÃ¡y
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <th className="py-3 px-4">MÃ£ NV</th>
                    <th className="py-3 px-4">Há» vÃ  TÃªn</th>
                    <th className="py-3 px-4">TÃ i khoáº£n</th>
                    <th className="py-3 px-4">Chá»©c vá»¥ &amp; Cáº¥p báº­c</th>
                    <th className="py-3 px-4 text-center">Tráº¡ng thÃ¡i</th>
                    <th className="py-3 px-4 text-right">Thao tÃ¡c phÃ¢n quyá»n</th>
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
                              Báº¡n
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-brand-blue">@{emp.ten_dang_nhap}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${empMeta.badgeClass}`}>
                            {empMeta.badge} â€¢ Lv.{empLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {emp.trang_thai === 'HOAT_DONG' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              â— Hoáº¡t Ä‘á»™ng
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                              ðŸ”’ ÄÃ£ khÃ³a
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
                                âœï¸ PhÃ¢n quyá»n / Äá»•i MK
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
                                {emp.trang_thai === 'HOAT_DONG' ? 'KhÃ³a TK' : 'Má»Ÿ khÃ³a'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEmployee(emp)}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition"
                              >
                                XÃ³a
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              {isSelf ? 'ðŸ›¡ï¸ TÃ i khoáº£n Ä‘ang dÃ¹ng' : 'ðŸ”’ Cáº¥p trÃªn / Ngang cáº¥p'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-8 text-slate-400">ChÆ°a cÃ³ dá»¯ liá»‡u nhÃ¢n sá»±.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Táº¡o má»›i / PhÃ¢n quyá»n & Äáº·t láº¡i máº­t kháº©u NhÃ¢n viÃªn */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">
                  {editingEmployee ? `âœï¸ PhÃ¢n Quyá»n NhÃ¢n ViÃªn: ${editingEmployee.ho_ten}` : 'ðŸ‘¤ Táº¡o TÃ i Khoáº£n NhÃ¢n Sá»± Má»›i'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isExecutive
                    ? 'Quyá»n GiÃ¡m Äá»‘c (Level 100): ÄÆ°á»£c phÃ©p gÃ¡n má»i chá»©c vá»¥ trong há»‡ thá»‘ng.'
                    : 'Quyá»n Quáº£n LÃ½ (Level 80): Chá»‰ Ä‘Æ°á»£c phÃ©p gÃ¡n chá»©c vá»¥ nhÃ¢n viÃªn cáº¥p dÆ°á»›i (< Level 80).'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
              >
                Ã—
              </button>
            </div>

            {employeeError && (
              <div role="alert" className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                {employeeError}
              </div>
            )}

            <form onSubmit={saveEmployee} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Há» vÃ  tÃªn nhÃ¢n viÃªn *</label>
                <input
                  type="text"
                  required
                  value={employeeForm.ho_ten}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, ho_ten: e.target.value })}
                  placeholder="VD: Nguyá»…n VÄƒn Minh"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-blue outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">TÃªn Ä‘Äƒng nháº­p *</label>
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
                    {editingEmployee ? 'Máº­t kháº©u má»›i (Äá»ƒ trá»‘ng náº¿u giá»¯ nguyÃªn)' : 'Máº­t kháº©u khá»Ÿi táº¡o *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={employeeForm.mat_khau}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, mat_khau: e.target.value })}
                    placeholder={editingEmployee ? 'Nháº­p náº¿u muá»‘n Ä‘á»•i MK...' : 'Tá»‘i thiá»ƒu 6 kÃ½ tá»±'}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chá»©c vá»¥ &amp; Cáº¥p báº­c PhÃ¢n quyá»n *</label>
                <select
                  value={employeeForm.vai_tro}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, vai_tro: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-slate-800 focus:border-brand-blue outline-none"
                >
                  {isExecutive && (
                    <>
                      <option value="GIAM_DOC">ðŸ‘‘ GiÃ¡m Äá»‘c Äiá»u HÃ nh (Cáº¥p 1 - Level 100 - ToÃ n quyá»n)</option>
                      <option value="QUAN_LY">ðŸ›¡ï¸ Quáº£n LÃ½ Cá»­a HÃ ng (Cáº¥p 2 - Level 80 - Quáº£n lÃ½ váº­n hÃ nh)</option>
                    </>
                  )}
                  <option value="KE_TOAN">ðŸ’° Káº¿ ToÃ¡n / Thu NgÃ¢n (Cáº¥p 3 - Level 60 - BÃ¡o cÃ¡o &amp; Thu tiá»n)</option>
                  <option value="THU_KHO">ðŸ“¦ Thá»§ Kho Linh Kiá»‡n (Cáº¥p 4 - Level 50 - Quáº£n lÃ½ xuáº¥t nháº­p kho)</option>
                  <option value="KY_THUAT_VIEN">ðŸ”§ Ká»¹ Thuáº­t ViÃªn (Cáº¥p 5 - Level 40 - Sá»­a chá»¯a, Serial &amp; Pháº§n má»m)</option>
                  <option value="LE_TAN">ðŸ’ Lá»… TÃ¢n &amp; CSKH (Cáº¥p 6 - Level 30 - Tiáº¿p nháº­n POS &amp; Lá»‹ch háº¹n)</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {ROLE_META[employeeForm.vai_tro]?.permissionsText}
                </p>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tráº¡ng thÃ¡i tÃ i khoáº£n</label>
                  <select
                    value={employeeForm.trang_thai}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, trang_thai: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-semibold focus:border-brand-blue outline-none"
                  >
                    <option value="HOAT_DONG">â— Äang hoáº¡t Ä‘á»™ng (Cho phÃ©p Ä‘Äƒng nháº­p)</option>
                    <option value="KHOA">ðŸ”’ KhÃ³a tÃ i khoáº£n (Cháº·n Ä‘Äƒng nháº­p)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Há»§y
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="rounded-xl bg-brand-blue px-5 py-2.5 font-extrabold text-white hover:bg-blue-800 shadow-md disabled:opacity-60"
                >
                  {savingEmployee ? 'Äang lÆ°u...' : editingEmployee ? 'LÆ°u PhÃ¢n Quyá»n' : 'Táº¡o TÃ i Khoáº£n â†’'}
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
              <h3 className="text-lg font-bold text-brand-blue">Phiáº¿u tiáº¿p nháº­n / hÃ³a Ä‘Æ¡n</h3>
              <button type="button" onClick={() => setReceiptTicket(null)} className="rounded px-3 py-1 text-slate-600 hover:bg-slate-100">
                ÄÃ³ng
              </button>
            </div>
            <div id="thermal-receipt" className="mx-auto w-full max-w-[72mm] border border-dashed border-slate-300 p-4 text-sm text-slate-900">
              <div className="text-center">
                <h1 className="text-base font-extrabold">HUNGHAU IT SUPPORT</h1>
                <p className="text-[10px] text-slate-600">615 Ã‚u CÆ¡, P. PhÃº Trung, Q. TÃ¢n PhÃº, TP.HCM</p>
                <p className="text-[10px] text-slate-600">Hotline: (028) 3860 4999</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider">PHIáº¾U TIáº¾P NHáº¬N / THANH TOÃN</p>
                <p className="mt-2 text-lg font-bold">{receiptTicket.ma_phieu}</p>
              </div>
              <hr className="my-3 border-dashed border-slate-400" />
              <p><strong>NgÃ y nháº­n:</strong> {receiptTicket.ngay_tao ? new Date(receiptTicket.ngay_tao).toLocaleString('vi-VN') : 'ChÆ°a cáº­p nháº­t'}</p>
              <p className="mt-1"><strong>KhÃ¡ch hÃ ng:</strong> {receiptTicket.ho_ten_khach}</p>
              <p className="mt-1"><strong>Äiá»‡n thoáº¡i:</strong> {receiptTicket.so_dien_thoai}</p>
              <p className="mt-1"><strong>Thiáº¿t bá»‹:</strong> {receiptTicket.ten_thiet_bi || 'KhÃ´ng cÃ³ thÃ´ng tin'}</p>
              <p className="mt-1"><strong>MÃ´ táº£ lá»—i:</strong> {receiptTicket.mo_ta_loi}</p>
              {receiptTicket.software_packages?.length > 0 && (
                <p className="mt-1"><strong>GÃ³i pháº§n má»m:</strong> {receiptTicket.software_packages.join(', ')}</p>
              )}
              {receiptTicket.la_sinh_vien && (
                <div className="mt-1 rounded bg-emerald-50 p-1.5 text-xs text-emerald-800">
                  <p><strong>ðŸŽ“ Sinh viÃªn:</strong> {receiptTicket.truong_hoc}</p>
                  <p><strong>MSSV:</strong> {receiptTicket.mssv || 'ÄÃ£ xÃ¡c thá»±c'}</p>
                </div>
              )}
              <p className="mt-1"><strong>Tráº¡ng thÃ¡i:</strong> {receiptTicket.trang_thai.replace(/_/g, ' ')}</p>
              <hr className="my-3 border-dashed border-slate-400" />
              <p className="mb-2 text-xs font-bold uppercase">Chi tiáº¿t thanh toÃ¡n</p>
              {receiptPartsLoading && <p className="text-xs">Äang táº£i chi tiáº¿t linh kiá»‡n...</p>}
              {receiptPartsError && <p className="text-xs font-semibold">{receiptPartsError}</p>}
              {!receiptPartsLoading && !receiptPartsError && (
                <>
                  {receiptServiceTotal > 0 && (
                    <div className="mb-2 flex justify-between gap-2">
                      <span>PhÃ­ sá»­a chá»¯a / dá»‹ch vá»¥</span>
                      <span className="whitespace-nowrap">{receiptServiceTotal.toLocaleString('vi-VN')} Ä‘</span>
                    </div>
                  )}
                  {receiptParts.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="mb-2">
                      <div className="flex justify-between gap-2">
                        <span>{item.ten_linh_kien}</span>
                        <span className="whitespace-nowrap">{(Number(item.so_luong) * Number(item.don_gia)).toLocaleString('vi-VN')} Ä‘</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span>{item.so_luong} x {Number(item.don_gia).toLocaleString('vi-VN')} Ä‘</span>
                        {item.so_serial && <span className="font-mono text-blue-700">S/N: {item.so_serial}</span>}
                      </div>
                    </div>
                  ))}
                  {receiptParts.length === 0 && receiptServiceTotal === 0 && (
                    <p className="mb-2 text-xs">ChÆ°a cÃ³ chi tiáº¿t thanh toÃ¡n.</p>
                  )}
                </>
              )}
              <hr className="my-3 border-dashed border-slate-400" />
              {receiptTicket.la_sinh_vien ? (
                <>
                  <div className="flex justify-between gap-2 text-xs text-slate-600">
                    <span>Tá»•ng chi phÃ­ gá»‘c</span>
                    <span className="line-through">{receiptTotal.toLocaleString('vi-VN')} Ä‘</span>
                  </div>
                  <div className="flex justify-between gap-2 text-xs font-semibold text-emerald-700">
                    <span>Trá»£ giÃ¡ Sinh viÃªn toÃ n quá»‘c (-15%)</span>
                    <span>-{Math.round(receiptTotal * 0.15).toLocaleString('vi-VN')} Ä‘</span>
                  </div>
                  <div className="flex justify-between gap-2 text-base font-extrabold text-brand-orange mt-1">
                    <span>Tá»•ng thanh toÃ¡n</span>
                    <span className="whitespace-nowrap">{Math.round(receiptTotal * 0.85).toLocaleString('vi-VN')} Ä‘</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-2 text-base font-extrabold">
                  <span>Tá»•ng tiá»n</span>
                  <span className="whitespace-nowrap">{receiptTotal.toLocaleString('vi-VN')} Ä‘</span>
                </div>
              )}
              <p className="mt-2 text-[10px] text-slate-600 border border-slate-200 p-1.5 rounded text-center">
                ðŸ›¡ï¸ Sá»• báº£o hÃ nh Ä‘iá»‡n tá»­ (e-Warranty): KÃ­ch hoáº¡t 06 thÃ¡ng (180 ngÃ y). QuÃ©t QR bÃªn dÆ°á»›i Ä‘á»ƒ tra cá»©u hoáº·c yÃªu cáº§u báº£o hÃ nh.
              </p>
              {receiptQr && (
                <div className="mt-4 text-center">
                  <img src={receiptQr} alt={`QR tra cá»©u phiáº¿u ${receiptTicket.ma_phieu}`} className="mx-auto h-32 w-32" />
                  <p className="mt-1 break-all text-[10px]">{window.location.origin}/track/{receiptTicket.ma_phieu}</p>
                </div>
              )}
              {receiptTotal > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-slate-300 text-center">
                  <p className="text-[10px] font-bold uppercase text-brand-blue mb-1">ðŸ’³ QuÃ©t VietQR Chuyá»ƒn khoáº£n NgÃ¢n hÃ ng</p>
                  <img
                    src={`https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${receiptTicket.la_sinh_vien ? Math.round(receiptTotal * 0.85) : receiptTotal}&addInfo=${encodeURIComponent(`TT ${receiptTicket.ma_phieu}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`}
                    alt="VietQR Thanh toÃ¡n"
                    className="mx-auto w-36 h-auto rounded border border-slate-200"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">Ná»™i dung CK: <strong>TT {receiptTicket.ma_phieu}</strong></p>
                </div>
              )}
              <p className="mt-4 text-center text-xs">Cáº£m Æ¡n quÃ½ khÃ¡ch Ä‘Ã£ sá»­ dá»¥ng dá»‹ch vá»¥!</p>
            </div>
            <div className="mt-4 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!receiptQr || receiptPartsLoading || Boolean(receiptPartsError)}
                className="rounded-lg bg-brand-blue px-5 py-2 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
              >
                In hÃ³a Ä‘Æ¡n (80mm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ThÃªm & Quáº£n LÃ½ Linh Kiá»‡n TrÃªn Phiáº¿u */}
      {showPartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-brand-blue">Linh Kiá»‡n &amp; Dá»‹ch Vá»¥ Cá»§a Phiáº¿u</h3>
              <button type="button" onClick={() => setShowPartModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">Ã—</button>
            </div>

            {/* Danh sÃ¡ch linh kiá»‡n Ä‘Ã£ gáº¯n trÃªn phiáº¿u (Cho phÃ©p gá»¡ náº¿u nháº­p nháº§m) */}
            {modalTicketParts.length > 0 && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">ðŸ”§ Linh kiá»‡n Ä‘Ã£ gáº¯n ({modalTicketParts.length}):</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {modalTicketParts.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.ten_linh_kien} (x{item.so_luong})</p>
                        <p className="text-[10px] text-slate-500">
                          {(Number(item.don_gia) * Number(item.so_luong)).toLocaleString('vi-VN')} Ä‘
                          {item.so_serial ? ` â€¢ S/N: ${item.so_serial}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePartFromTicket(item.id)}
                        className="rounded bg-red-50 px-2 py-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-100 whitespace-nowrap"
                      >
                        Gá»¡ &amp; HoÃ n kho
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Chá»n linh kiá»‡n thÃªm má»›i:</label>
              <select 
                value={selectedPartId} 
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none"
              >
                <option value="">-- Chá»n --</option>
                {parts.map(p => (
                  <option key={p.id} value={p.id} disabled={Number(p.so_luong) <= 0}>
                    {p.ten_linh_kien} - {Number(p.gia_ban).toLocaleString('vi-VN')}Ä‘ ({Number(p.so_luong) <= 0 ? 'Háº¾T HÃ€NG' : `Tá»“n: ${p.so_luong}`})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-700">MÃ£ Serial / IMEI linh kiá»‡n:</label>
                <button
                  type="button"
                  onClick={() => setPartSerial(`SN-${Date.now().toString().slice(-6)}`)}
                  className="text-xs text-brand-blue hover:underline font-semibold"
                >
                  + Táº¡o mÃ£ nhanh
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
              <label className="block text-sm font-bold text-slate-700 mb-2">Sá»‘ lÆ°á»£ng:</label>
              <input 
                type="number" 
                min="1" 
                value={partQuantity} 
                onChange={(e) => setPartQuantity(Number(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-brand-blue outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowPartModal(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300">ÄÃ³ng</button>
              <button onClick={addPartToTicket} className="flex-1 py-2 bg-brand-blue text-white font-bold rounded hover:bg-blue-700">XÃ¡c Nháº­n ThÃªm</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tiáº¿p Nháº­n Nhanh Táº¡i Quáº§y (POS Walk-in) */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">ðŸ–¥ï¸ Tiáº¿p Nháº­n MÃ¡y Trá»±c Tiáº¿p Táº¡i Quáº§y (POS)</h3>
                <p className="text-xs text-slate-500">Táº¡o phiáº¿u nhanh cho khÃ¡ch vÃ£ng lai &amp; tá»± Ä‘á»™ng báº­t cá»­a sá»• in phiáº¿u nhiá»‡t 80mm.</p>
              </div>
              <button type="button" onClick={() => setShowPosModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl font-bold">Ã—</button>
            </div>

            <form onSubmit={submitPosWalkIn} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Há» vÃ  tÃªn khÃ¡ch hÃ ng *</label>
                  <input
                    type="text"
                    required
                    value={posForm.fullName}
                    onChange={e => setPosForm({ ...posForm, fullName: e.target.value })}
                    placeholder="VD: Nguyá»…n VÄƒn An"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sá»‘ Ä‘iá»‡n thoáº¡i *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">TÃªn mÃ¡y / Model thiáº¿t bá»‹ *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sá»‘ Serial / Service Tag mÃ¡y</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">MÃ´ táº£ tÃ¬nh tráº¡ng lá»—i &amp; yÃªu cáº§u cá»§a khÃ¡ch *</label>
                <textarea
                  required
                  rows={2}
                  value={posForm.issueDescription}
                  onChange={e => setPosForm({ ...posForm, issueDescription: e.target.value })}
                  placeholder="VD: MÃ¡y báº­t khÃ´ng lÃªn nguá»“n, khÃ¡ch yÃªu cáº§u kiá»ƒm tra IC nguá»“n vÃ  vá»‡ sinh mÃ¡y..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                />
              </div>

              {/* Æ¯u Ä‘Ã£i Sinh viÃªn */}
              <div className="rounded-xl bg-indigo-50/70 p-3.5 border border-indigo-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-900 text-xs">
                  <input
                    type="checkbox"
                    checked={posForm.isStudent}
                    onChange={e => setPosForm({ ...posForm, isStudent: e.target.checked })}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  ðŸŽ“ KhÃ¡ch hÃ ng lÃ  Há»c sinh / Sinh viÃªn ToÃ n quá»‘c (Ãp dá»¥ng giáº£m 15% tá»•ng hÃ³a Ä‘Æ¡n)
                </label>
                {posForm.isStudent && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={posForm.schoolName}
                      onChange={e => setPosForm({ ...posForm, schoolName: e.target.value })}
                      placeholder="TÃªn trÆ°á»ng Äáº¡i há»c / Cao Ä‘áº³ng / THPT *"
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={posForm.studentId}
                      onChange={e => setPosForm({ ...posForm, studentId: e.target.value })}
                      placeholder="MÃ£ sá»‘ sinh viÃªn (MSSV) *"
                      className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* áº¢nh ngoáº¡i quan táº¡i quáº§y */}
              <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-2">ðŸ“¸ ÄÃ­nh kÃ¨m áº£nh ngoáº¡i quan lÃºc nháº­n mÃ¡y (TÃ¹y chá»n):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={posForm.photoNote}
                    onChange={e => setPosForm({ ...posForm, photoNote: e.target.value })}
                    placeholder="Ghi chÃº ngoáº¡i quan (VD: Tráº§y náº¯p lÆ°ng...)"
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
                  Há»§y
                </button>
                <button
                  type="submit"
                  disabled={savingPos}
                  className="rounded-xl bg-brand-orange px-5 py-2.5 font-bold text-white hover:bg-orange-600 shadow-md disabled:opacity-60"
                >
                  {savingPos ? 'Äang táº¡o phiáº¿u...' : 'Táº¡o Phiáº¿u & In HÃ³a ÄÆ¡n 80mm â†’'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quáº£n lÃ½ áº¢nh Ngoáº¡i Quan LÃºc Nháº­n MÃ¡y */}
      {showPhotoModal && photoTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>ðŸ“¸</span> áº¢nh Ngoáº¡i Quan Tiáº¿p Nháº­n - Phiáº¿u {photoTicket.ma_phieu}
                </h3>
                <p className="text-xs text-slate-500">{photoTicket.ten_thiet_bi} â€¢ KhÃ¡ch hÃ ng: {photoTicket.ho_ten_khach}</p>
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
              {/* Form táº£i áº£nh má»›i */}
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <h4 className="text-sm font-bold text-brand-blue mb-2">Chá»¥p hoáº·c Táº£i ThÃªm áº¢nh Ngoáº¡i Quan:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chÃº (váº¿t tráº§y, cáº¥n mÃ³p, tem...):</label>
                    <input
                      type="text"
                      value={newPhotoNote}
                      onChange={(e) => setNewPhotoNote(e.target.value)}
                      placeholder="VD: Cáº¥n gÃ³c trÃ¡i mÃ n hÃ¬nh, rÃ¡ch tem á»‘c Ä‘Ã¡y..."
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:border-brand-blue outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className={`w-full flex items-center justify-center px-4 py-2 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded cursor-pointer text-sm shadow-sm transition-colors ${savingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                      <span>{savingPhoto ? 'Äang lÆ°u...' : '+ Chá»n áº£nh'}</span>
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

              {/* Danh sÃ¡ch áº£nh */}
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">HÃ¬nh áº£nh ngoáº¡i quan Ä‘Ã£ lÆ°u ({ticketPhotos.length}):</h4>
                {ticketPhotos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
                    ChÆ°a cÃ³ áº£nh ngoáº¡i quan nÃ o Ä‘Æ°á»£c táº£i lÃªn cho phiáº¿u nÃ y.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {ticketPhotos.map((img, i) => (
                      <div key={img.id || i} className="group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm flex flex-col">
                        <div className="h-36 overflow-hidden bg-black flex items-center justify-center">
                          <img
                            src={img.duong_dan_anh}
                            alt={img.ghi_chu || `áº¢nh ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(img.duong_dan_anh, '_blank')}
                          />
                        </div>
                        <div className="p-2.5 text-xs flex-1 flex flex-col justify-between">
                          <p className="font-semibold text-slate-800 line-clamp-2">{img.ghi_chu || 'áº¢nh ngoáº¡i quan'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {img.thoi_gian_tao ? new Date(img.thoi_gian_tao).toLocaleString('vi-VN') : 'LÃºc tiáº¿p nháº­n'}
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
                ÄÃ³ng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
