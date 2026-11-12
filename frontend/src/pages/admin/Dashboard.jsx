import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { exportEnterpriseExcel } from '../../utils/excelExport';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import QRCode from 'qrcode';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import { getAccessibleBaseUrl } from '../../utils/network';
import { playNotificationChime, triggerDeviceVibration } from '../../utils/webNotification';

const STATUS_LABELS = {
  'CHỜ_KHÁM': 'Chờ tiếp nhận máy',
  'ĐANG_CHUẨN_ĐOÁN': 'Đang kiểm tra & chẩn đoán',
  'ĐANG_SỬA': 'Đang sửa chữa & xử lý PM',
  'ĐÃ_SỬA_XONG': 'Đã khắc phục xong',
  'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': 'Hoàn tất & Bảo hành QR',
  'YÊU_CẦU_BẢO_HÀNH': 'Yêu cầu bảo hành'
};

const CHART_COLORS = ['#1E3A8A', '#2563EB', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];

const isNotificationCorrupted = (item) => {
  if (!item) return false;
  const text = `${item.title || ''} ${item.description || ''}`;
  return /[¿»º¯›]|â€|Ä‘|Æ°|áº|á»|Phiá|Lá»/.test(text);
};

const ROLE_META = {
  ADMIN: {
    level: 100,
    title: 'Quản Trị Hệ Thống CSKH',
    badge: '🛡️ Quản Trị Hệ Thống CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Toàn quyền quản trị hệ thống CSKH, cấu hình kỹ thuật và quản lý nhân sự.'
  },
  GIAM_DOC: {
    level: 100,
    title: 'Quản Trị Hệ Thống CSKH',
    badge: '🛡️ Quản Trị Hệ Thống CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    permissionsText: 'Toàn quyền điều hành dịch vụ CSKH, phê duyệt chi phí và phân quyền nhân sự.'
  },
  QUAN_LY: {
    level: 80,
    title: 'Trưởng Bộ Phận CSKH',
    badge: '🏬 Trưởng Bộ Phận CSKH',
    badgeClass: 'bg-blue-50 text-brand-blue border-blue-200',
    permissionsText: 'Điều hành toàn bộ hoạt động Chăm sóc khách hàng, giám sát tiến độ xử lý hồ sơ QR và quản lý nhân sự CSKH.'
  },
  KY_THUAT_VIEN: {
    level: 40,
    title: 'Chuyên Viên Hỗ Trợ CSKH',
    badge: '🎧 Chuyên Viên Hỗ Trợ CSKH',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    permissionsText: 'Tiếp nhận phân loại yêu cầu, cập nhật nhật ký xử lý tiến độ thời gian thực và kích hoạt bảo hành điện tử (e-Warranty).'
  },
  LE_TAN: {
    level: 30,
    title: 'Lễ Tân & Tiếp Nhận QR',
    badge: '👩‍💼 Lễ Tân & Tiếp Nhận QR',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    permissionsText: 'Khởi tạo hồ sơ QR tại quầy, lưu biên bản ảnh hiện trạng, tiếp nhận lịch hẹn và in phiếu nhiệt QR 80mm.'
  }
};

function Dashboard() {
  const role = localStorage.getItem('role') || 'LE_TAN';
  const fullName = localStorage.getItem('fullName') || 'Nhân viên';
  const currentUsername = localStorage.getItem('username') || '';
  const currentAccountId = Number(localStorage.getItem('accountId') || 0);

  const isExecutive = role === 'GIAM_DOC' || role === 'ADMIN';
  const isManagerOrAbove = isExecutive || role === 'QUAN_LY';
  const canReceptionAction = isManagerOrAbove || role === 'LE_TAN';
  const canTechAction = isManagerOrAbove || role === 'KY_THUAT_VIEN';
  const canViewStats = isManagerOrAbove;
  const canManageEmployees = isManagerOrAbove;
  const currentRoleLevel = ROLE_META[role]?.level || 30;
  const currentRoleInfo = ROLE_META[role] || ROLE_META.LE_TAN;

  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('TICKETS');
  const [ticketSearch, setTicketSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusNote, setStatusNote] = useState('');
  const [reportPeriod, setReportPeriod] = useState('week');
  const [searchParams] = useSearchParams();

  // Tự động mở hồ sơ phiếu tương ứng khi bấm vào thông báo hệ thống
  useEffect(() => {
    const ticketParam = searchParams.get('ticket') || searchParams.get('search');
    const tabParam = searchParams.get('tab');
    if (ticketParam) {
      setActiveTab('TICKETS');
      setStatusFilter('ALL');
      setTicketSearch(ticketParam.trim().toUpperCase());
    } else if (tabParam) {
      setActiveTab(tabParam.toUpperCase());
    }
  }, [searchParams]);

  const [stats, setStats] = useState({
    statusData: [],
    totalTickets: 0,
    completedTickets: 0,
    avgRating: 5.0,
    totalReviews: 0
  });

  // Photo evidence modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoTicket, setPhotoTicket] = useState(null);
  const [ticketPhotos, setTicketPhotos] = useState([]);
  const [newPhotoNote, setNewPhotoNote] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // 80mm QR thermal receipt modal state
  const [receiptTicket, setReceiptTicket] = useState(null);
  const [receiptQr, setReceiptQr] = useState('');

  // Zalo ZNS / SMS Notification modal state
  const [showZaloModal, setShowZaloModal] = useState(false);
  const [zaloTicket, setZaloTicket] = useState(null);
  const [zaloCustomNote, setZaloCustomNote] = useState('');
  const [zaloSending, setZaloSending] = useState(false);
  const [zaloAlert, setZaloAlert] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ticketNotifications');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const clean = parsed.filter(item => !isNotificationCorrupted(item));
      return clean.slice(0, 50).map(item => ({ ...item, read: item.read ?? true }));
    } catch {
      localStorage.removeItem('ticketNotifications');
      return [];
    }
  });
  const [notificationFilter, setNotificationFilter] = useState('ALL');
  const [latestNotice, setLatestNotice] = useState(null);

  // Employee management state
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

  // Enterprise Security & Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [paymentTicketCode, setPaymentTicketCode] = useState('RP-839400');
  const [cashierAmount, setCashierAmount] = useState('');
  const [cashierNote, setCashierNote] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [cashierSuccessMsg, setCashierSuccessMsg] = useState('');
  const [cashierFilter, setCashierFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [cashierSearch, setCashierSearch] = useState('');

  // POS Walk-in QR Intake modal state
  const [showPosModal, setShowPosModal] = useState(false);
  const [savingPos, setSavingPos] = useState(false);
  const [posForm, setPosForm] = useState({
    fullName: '',
    phone: '',
    deviceName: '',
    serialImei: '',
    issueDescription: '',
    photoBase64: '',
    photoNote: ''
  });

  const knownStatuses = useRef(null);
  const knownBookingStatuses = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message) => {
    if (!message) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setLatestNotice({ title: message, description: message });
    toastTimeoutRef.current = setTimeout(() => {
      setLatestNotice(null);
    }, 2500);
  };

  const fetchTickets = useCallback(async () => {
    const res = await api.get('/tickets');
    return res.data.data || [];
  }, []);

  const fetchBookings = useCallback(async () => {
    const res = await api.get('/tickets/booking');
    return res.data.data || [];
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await api.get(`/admin/dashboard-stats?period=${reportPeriod}`);
    return res.data.data || {};
  }, [reportPeriod]);

  const fetchEmployees = useCallback(async () => {
    const res = await api.get('/admin/employees');
    return res.data.data || [];
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    const res = await api.get('/admin/audit-logs');
    return res.data.data || { logs: [], securityStatus: null };
  }, []);

  const submitChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return showToast('⚠️ Mật khẩu xác nhận không khớp!');
    }
    setSavingPw(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      showToast(`🔒 ${res.data?.message || 'Đã đổi mật khẩu bảo mật thành công!'}`);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (canManageEmployees) {
        const auditData = await fetchAuditLogs();
        setAuditLogs(auditData.logs || []);
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Lỗi đổi mật khẩu'}`);
    } finally {
      setSavingPw(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = (request, setData, description) => {
      request()
        .then(data => {
          if (active) setData(data);
        })
        .catch(error => console.error(`Không tải được ${description}:`, error));
    };

    load(fetchTickets, setTickets, 'danh sách hồ sơ QR');
    if (canReceptionAction) {
      load(fetchBookings, setBookings, 'danh sách lịch hẹn CSKH');
    }
    if (canViewStats) {
      load(fetchStats, setStats, 'thống kê CSKH');
    }
    if (canManageEmployees) {
      load(fetchEmployees, setEmployees, 'danh sách nhân sự CSKH');
      fetchAuditLogs()
        .then(data => {
          if (active) {
            setAuditLogs(data.logs || []);
            setSecurityStatus(data.securityStatus || null);
          }
        })
        .catch(err => console.error('Không tải được nhật ký bảo mật:', err));
    }

    return () => {
      active = false;
    };
  }, [canReceptionAction, canViewStats, canManageEmployees, fetchTickets, fetchBookings, fetchStats, fetchEmployees, fetchAuditLogs]);

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
      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
      setNotifications(previous => [...updates, ...previous].slice(0, 50));
      setLatestNotice(updates[0]);
    };

    const pollDashboardEvents = async () => {
      try {
        const [latestTickets, latestBookings] = await Promise.all([
          fetchTickets(),
          canReceptionAction ? fetchBookings() : Promise.resolve(null)
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
                title: isNewTicket ? 'Hồ sơ QR CSKH mới' : 'Hồ sơ QR đã cập nhật trạng thái',
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
                  title: isNewBooking ? 'Lịch hẹn CSKH mới' : 'Lịch hẹn CSKH được cập nhật',
                  description: `${booking.ho_ten_khach} — ${booking.trang_thai.replace(/_/g, ' ')}`,
                  createdAt: now,
                  read: false
                });
              }
            });
          }
          knownBookingStatuses.current = currentBookingStatuses;
        }

        pushNotifications(updates);
      } catch (error) {
        if (active) console.error('Không kiểm tra được cập nhật hồ sơ CSKH:', error);
      }
    };

    pollDashboardEvents();
    const intervalId = window.setInterval(pollDashboardEvents, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchTickets, fetchBookings, canReceptionAction]);

  useEffect(() => {
    if (!receiptTicket) return;
    let active = true;
    getAccessibleBaseUrl().then(origin => {
      if (!active) return;
      QRCode.toDataURL(`${origin}/track/${receiptTicket.ma_phieu}`, {
        width: 180,
        margin: 1
      }).then(dataUrl => {
        if (active) setReceiptQr(dataUrl);
      }).catch(error => {
        console.error('Không tạo được mã QR trên phiếu in:', error);
      });
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

  const updateStatus = async (id, status, defaultNote = '') => {
    const customNote = statusNote.trim();
    const noteToSave = customNote || defaultNote || `Chuyển sang trạng thái: ${STATUS_LABELS[status] || status}`;
    try {
      await api.patch(`/tickets/${id}/status`, { status, note: noteToSave });
      setStatusNote('');
      await refreshTickets();
      if (canViewStats) {
        setStats(await fetchStats());
      }
      showToast(`✅ Đã cập nhật trạng thái: ${STATUS_LABELS[status] || status}`);
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Lỗi cập nhật trạng thái hồ sơ'}`);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await api.patch(`/tickets/booking/${id}/status`, { status });
      await refreshBookings();
      await refreshTickets();
      const autoTicketCode = res.data?.data?.autoCreatedTicketCode;
      if (autoTicketCode) {
        showToast(`🎉 Đã tiếp nhận khách & tự động khởi tạo Hồ sơ QR: ${autoTicketCode}`);
      } else {
        showToast('✅ Đã cập nhật trạng thái lịch hẹn CSKH');
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Lỗi cập nhật lịch hẹn'}`);
    }
  };

  const handleConfirmCashierPayment = async (targetTicket, method) => {
    if (!targetTicket) return;
    setConfirmingPayment(true);
    setCashierSuccessMsg('');
    try {
      const finalAmount = Number(cashierAmount) || Number(targetTicket.tien_sau_giam || targetTicket.tong_tien || 0);
      await api.post(`/tickets/${targetTicket.id}/confirm-payment`, {
        method,
        amount: finalAmount,
        note: cashierNote.trim() || (method === 'TIEN_MAT'
          ? `Lễ tân [${fullName || 'Quầy CSKH'}] đã thu tiền mặt tại quầy 615 Âu Cơ.`
          : `Lễ tân [${fullName || 'Quầy CSKH'}] đã đối soát nhận chuyển khoản VietQR thành công.`)
      });

      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
      showToast(`✓ Đã xác nhận thanh toán [${method === 'VIETQR' ? 'VietQR' : 'Tiền mặt'}] cho phiếu #${targetTicket.ma_phieu}!`);
      setCashierSuccessMsg(`⚡ Xác nhận thành công! Hồ sơ #${targetTicket.ma_phieu} đã chuyển sang trạng thái ĐÃ THANH TOÁN.`);
      setCashierNote('');

      await refreshTickets();
      if (canViewStats) {
        setStats(await fetchStats());
      }
    } catch (err) {
      showToast(`❌ Lỗi xác nhận thanh toán: ${err.response?.data?.message || err.message}`);
    } finally {
      setConfirmingPayment(false);
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
        photos: posForm.photoBase64
          ? [{ duong_dan_anh: posForm.photoBase64, loai_anh: 'NGOAI_QUAN', ghi_chu: posForm.photoNote.trim() || 'Ảnh hiện trạng chụp tại quầy CSKH' }]
          : []
      };
      const res = await api.post('/tickets/intake', payload);
      const newCode = res.data?.data?.ticketCode;
      const latestList = await fetchTickets();
      setTickets(latestList);
      setShowPosModal(false);
      setPosForm({
        fullName: '', phone: '', deviceName: '', serialImei: '', issueDescription: '',
        photoBase64: '', photoNote: ''
      });
      showToast(`🎉 Đã tạo hồ sơ QR tại quầy ${newCode || ''} thành công! Mở cửa sổ in phiếu 80mm...`);
      const createdTicket = latestList.find(t => t.ma_phieu === newCode);
      if (createdTicket) {
        setReceiptQr('');
        setReceiptTicket(createdTicket);
      }
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không tạo được hồ sơ tại quầy'}`);
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
        showToast('📸 Đã lưu ảnh minh chứng hiện trạng thành công!');
      } catch (err) {
        showToast(`❌ ${err.response?.data?.message || 'Lỗi lưu ảnh'}`);
      } finally {
        setSavingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const openReceipt = (ticket) => {
    setReceiptQr('');
    setReceiptTicket(ticket);
  };

  const openZaloModal = (ticket) => {
    setZaloTicket(ticket);
    setZaloCustomNote('');
    setZaloAlert(null);
    setShowZaloModal(true);
  };

  const handleSendZalo = async () => {
    if (!zaloTicket) return;
    setZaloSending(true);
    setZaloAlert(null);
    try {
      const res = await api.post(`/tickets/${zaloTicket.id}/notify-zalo`, {
        customMessage: zaloCustomNote.trim() || undefined
      });
      setZaloAlert({
        type: 'success',
        message: res.data?.message || 'Đã gửi thông báo Zalo ZNS thành công!'
      });
      showToast(`📲 Đã gửi Zalo ZNS tới ${zaloTicket.ho_ten_khach} (${zaloTicket.so_dien_thoai})!`);
      fetchTickets().then(setTickets).catch(() => {});
      setTimeout(() => {
        setShowZaloModal(false);
      }, 1800);
    } catch (err) {
      setZaloAlert({
        type: 'error',
        message: err.response?.data?.message || 'Không thể gửi thông báo Zalo ZNS!'
      });
    } finally {
      setZaloSending(false);
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
        showToast(`✅ ${res.data?.message || 'Đã cập nhật tài khoản nhân sự!'}`);
      } else {
        const res = await api.post('/admin/employees', {
          ho_ten: employeeForm.ho_ten.trim(),
          ten_dang_nhap: employeeForm.ten_dang_nhap.trim(),
          mat_khau: employeeForm.mat_khau.trim(),
          vai_tro: employeeForm.vai_tro
        });
        showToast(`🎉 ${res.data?.message || 'Đã tạo tài khoản nhân sự mới!'}`);
      }
      setEmployees(await fetchEmployees());
      setShowEmployeeModal(false);
    } catch (err) {
      setEmployeeError(err.response?.data?.message || 'Không lưu được thông tin nhân sự.');
    } finally {
      setSavingEmployee(false);
    }
  };

  const toggleEmployeeLock = async (emp) => {
    const nextStatus = emp.trang_thai === 'HOAT_DONG' ? 'KHOA' : 'HOAT_DONG';
    try {
      await api.patch(`/admin/employees/${emp.id}`, { trang_thai: nextStatus });
      showToast(nextStatus === 'KHOA' ? `🔒 Đã khóa tài khoản @${emp.ten_dang_nhap}` : `🔓 Đã mở khóa tài khoản @${emp.ten_dang_nhap}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không cập nhật được trạng thái tài khoản'}`);
    }
  };

  const removeEmployee = async (emp) => {
    if (!window.confirm(`Xác nhận xóa tài khoản @${emp.ten_dang_nhap} (${emp.ho_ten})?`)) return;
    try {
      await api.delete(`/admin/employees/${emp.id}`);
      showToast(`🗑️ Đã xóa tài khoản @${emp.ten_dang_nhap}`);
      setEmployees(await fetchEmployees());
    } catch (err) {
      showToast(`❌ ${err.response?.data?.message || 'Không xóa được tài khoản'}`);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(previous => previous.map(item => ({ ...item, read: true })));
    setLatestNotice(null);
  };

  const unreadNotificationCount = notifications.filter(item => !isNotificationCorrupted(item) && !item.read).length;

  const filteredTickets = tickets.filter(t => {
    const q = ticketSearch.toLowerCase();
    const matchesSearch = !q ||
      (t.ma_phieu && t.ma_phieu.toLowerCase().includes(q)) ||
      (t.so_dien_thoai && t.so_dien_thoai.includes(q)) ||
      (t.ho_ten_khach && t.ho_ten_khach.toLowerCase().includes(q)) ||
      (t.ten_thiet_bi && t.ten_thiet_bi.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || t.trang_thai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Trung Tâm Điều Hành Dịch Vụ &amp; Chăm Sóc Khách Hàng</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={`px-2 py-0.5 rounded-md font-semibold border ${currentRoleInfo.badgeClass}`}>
              {currentRoleInfo.badge}
            </span>
            <span>Nhân sự: <strong className="text-slate-700">{fullName}</strong></span>
            <span>•</span>
            <span>Công ty Cổ phần Lục Giác</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'TICKETS' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Hồ Sơ Phiếu QR ({tickets.length})
          </button>
          {canReceptionAction && (
            <button
              onClick={() => setActiveTab('BOOKINGS')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'BOOKINGS' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Lịch Hẹn CSKH ({bookings.filter(b => b.trang_thai === 'CHO_XAC_NHAN').length})
            </button>
          )}
          {canViewStats && (
            <button
              onClick={() => setActiveTab('STATS')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'STATS' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Thống Kê &amp; Đánh Giá CSKH
            </button>
          )}
          {canManageEmployees && (
            <button
              onClick={() => setActiveTab('EMPLOYEES')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'EMPLOYEES' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Nhân Sự CSKH ({employees.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('PAYMENT_GATEWAY')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${activeTab === 'PAYMENT_GATEWAY' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <span>💵 Quầy Thu Ngân &amp; Xác Nhận TT</span>
            {tickets.filter(t => t.trang_thai_thanh_toan !== 'DA_THANH_TOAN').length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'PAYMENT_GATEWAY' ? 'bg-white text-brand-blue' : 'bg-amber-100 text-amber-800'
              }`}>
                {tickets.filter(t => t.trang_thai_thanh_toan !== 'DA_THANH_TOAN').length}
              </span>
            )}
          </button>
          {isManagerOrAbove && (
            <button
              onClick={async () => {
                setActiveTab('SECURITY');
                if (canManageEmployees) {
                  try {
                    const data = await fetchAuditLogs();
                    setAuditLogs(data.logs || []);
                    setSecurityStatus(data.securityStatus || null);
                  } catch {}
                }
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'SECURITY' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              🛡️ Bảo Mật &amp; Audit
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('NOTIFICATIONS');
              markAllNotificationsRead();
            }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'NOTIFICATIONS' ? 'bg-brand-blue text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Thông Báo ({unreadNotificationCount})
          </button>
        </div>
      </div>

      {latestNotice && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-brand-blue">
          <span
            onClick={() => {
              if (latestNotice.ticketCode) {
                setActiveTab('TICKETS');
                setStatusFilter('ALL');
                setTicketSearch(latestNotice.ticketCode);
              } else if (latestNotice.type === 'booking') {
                setActiveTab('BOOKINGS');
              }
              setLatestNotice(null);
            }}
            className="cursor-pointer hover:underline font-medium"
            title="Bấm để mở trực tiếp hồ sơ"
          >
            <strong>Thông báo mới:</strong> {latestNotice.description || latestNotice.title} {latestNotice.ticketCode && ' (Bấm để xem hồ sơ phiếu →)'}
          </span>
          <button type="button" onClick={() => setLatestNotice(null)} className="font-bold underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* TAB 1: DANH SÁCH HỒ SƠ PHIẾU QR CSKH */}
      {activeTab === 'TICKETS' && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-brand-blue">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Danh Sách Hồ Sơ CSKH Qua Mã QR (Máy Tính &amp; Phần Mềm)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản lý tiếp nhận thiết bị máy tính &amp; yêu cầu phần mềm, cập nhật nhật ký kiểm tra - sửa chữa, lưu ảnh ngoại quan và cấp Sổ bảo hành điện tử (e-Warranty).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {canReceptionAction && (
                  <button
                    type="button"
                    onClick={() => setShowPosModal(true)}
                    className="rounded-lg bg-brand-blue px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>📷</span> + Tiếp Nhận Nhanh Tại Quầy (POS)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const rows = filteredTickets.map((t, idx) => [
                      idx + 1,
                      t.ma_phieu,
                      t.ho_ten_khach,
                      t.so_dien_thoai,
                      t.ten_thiet_bi || 'Sản phẩm / Dịch vụ CSKH',
                      t.so_imei_serial || 'N/A',
                      t.mo_ta_loi || '',
                      STATUS_LABELS[t.trang_thai] || t.trang_thai,
                      t.han_bao_hanh ? new Date(t.han_bao_hanh).toLocaleDateString('vi-VN') : 'Chưa kích hoạt',
                      t.ngay_tao ? new Date(t.ngay_tao).toLocaleString('vi-VN') : ''
                    ]);
                    const summaryRow = ['', 'TỔNG SỐ HỒ SƠ CSKH', `${filteredTickets.length} hồ sơ`, '', '', '', '', '', '', ''];
                    exportEnterpriseExcel({
                      filename: `Danh_Sach_Ho_So_CSKH_QR_${new Date().toISOString().slice(0, 10)}.xlsx`,
                      sheetName: 'Hồ Sơ CSKH QR',
                      title: 'DANH SÁCH HỒ SƠ CHĂM SÓC KHÁCH HÀNG QUA MÃ QR - CÔNG TY CỔ PHẦN LỤC GIÁC',
                      headers: ['STT', 'Mã Phiếu QR', 'Họ Tên Khách Hàng', 'Số Điện Thoại', 'Sản Phẩm / Dịch Vụ', 'Mã Serial / IMEI', 'Nội Dung Yêu Cầu CSKH', 'Trạng Thái Xử Lý', 'Hạn Bảo Hành (e-Warranty)', 'Thời Gian Tiếp Nhận'],
                      rows,
                      summaryRow,
                      signRole: 'TRƯỞNG BỘ PHẬN CSKH'
                    });
                  }}
                  className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 shadow-2xs whitespace-nowrap transition cursor-pointer"
                >
                  📊 Xuất Danh Sách Hồ Sơ (.xlsx)
                </button>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="🔍 Tìm mã QR, SĐT, tên KH..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-blue"
                  />
                  {ticketSearch && (
                    <button
                      onClick={() => setTicketSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bộ lọc nhanh theo trạng thái CSKH & ô nhập ghi chú nhật ký */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'CHỜ_KHÁM', label: 'Chờ tiếp nhận' },
                  { key: 'ĐANG_CHUẨN_ĐOÁN', label: 'Đang kiểm tra & phân loại' },
                  { key: 'ĐANG_SỬA', label: 'Đang xử lý hỗ trợ' },
                  { key: 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN', label: 'Hoàn tất CSKH & Bảo hành' },
                  { key: 'YÊU_CẦU_BẢO_HÀNH', label: '🛡️ Yêu cầu bảo hành' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      statusFilter === tab.key
                        ? 'bg-brand-blue text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="✍️ Ghi chú nhật ký CSKH (hiển thị khi khách quét QR)..."
                  className="w-full px-3 py-1.5 text-xs border border-blue-200 bg-blue-50/40 rounded-lg focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-4">Mã Phiếu QR</th>
                  <th className="py-2.5 px-4">Khách Hàng &amp; SĐT</th>
                  <th className="py-2.5 px-4">Thiết Bị Máy Tính / Phần Mềm &amp; Tình Trạng Lỗi</th>
                  <th className="py-2.5 px-4">Trạng Thái Xử Lý CSKH</th>
                  <th className="py-2.5 px-4">Sổ Bảo Hành (e-Warranty)</th>
                  <th className="py-2.5 px-4 text-center">Thao Tác Điều Hành CSKH</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => {
                  const warrantyRemainingDays = t.han_bao_hanh
                    ? Math.ceil((new Date(t.han_bao_hanh).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0;
                  return (
                    <tr key={t.id} className="border-b hover:bg-slate-50 text-sm">
                      <td className="py-3 px-4 font-bold text-brand-blue">
                        <Link to={`/track/${t.ma_phieu}`} target="_blank" className="hover:underline flex items-center gap-1" title="Mở trang khách hàng quét QR">
                          <span>{t.ma_phieu}</span>
                          <span className="text-xs">↗</span>
                        </Link>
                        <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                          {t.ngay_tao ? new Date(t.ngay_tao).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{t.ho_ten_khach}</div>
                        <div className="text-xs font-mono text-slate-500">{t.so_dien_thoai}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                          <span>{t.ten_thiet_bi}</span>
                          {t.so_imei_serial && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              S/N: {t.so_imei_serial}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{t.mo_ta_loi}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' ? 'bg-emerald-500' :
                            t.trang_thai === 'YÊU_CẦU_BẢO_HÀNH' ? 'bg-amber-500' :
                            t.trang_thai === 'CHỜ_KHÁM' ? 'bg-slate-400' :
                            'bg-brand-blue'
                          }`} />
                          <span>{STATUS_LABELS[t.trang_thai] || t.trang_thai.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.trang_thai === 'YÊU_CẦU_BẢO_HÀNH' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            🛡️ Yêu cầu BH qua QR
                          </span>
                        ) : warrantyRemainingDays > 0 ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                              🛡️ Còn {warrantyRemainingDays} ngày BH
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Hạn: {new Date(t.han_bao_hanh).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa kích hoạt</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* 1. NÚT CHÍNH DUY NHẤT: BƯỚC QUY TRÌNH KẾ TIẾP (Màu xanh nhận diện) */}
                          {canTechAction && (t.trang_thai === 'CHỜ_KHÁM' || t.trang_thai === 'YÊU_CẦU_BẢO_HÀNH') && (
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'ĐANG_CHUẨN_ĐOÁN', 'Đã tiếp nhận thiết bị / yêu cầu phần mềm, Kỹ thuật viên đang kiểm tra và chẩn đoán lỗi.')}
                              className="bg-brand-blue hover:bg-brand-blue-hover text-white px-2.5 py-1 rounded text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
                            >
                              🔍 Khám &amp; Chẩn đoán
                            </button>
                          )}
                          {canTechAction && t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'ĐANG_SỬA', 'Kỹ thuật viên đang tiến hành sửa chữa máy tính và khắc phục sự cố phần mềm cho khách hàng.')}
                              className="bg-brand-blue hover:bg-brand-blue-hover text-white px-2.5 py-1 rounded text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
                            >
                              🔧 Sửa chữa &amp; Xử lý
                            </button>
                          )}
                          {(canTechAction || canReceptionAction) && t.trang_thai === 'ĐANG_SỬA' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN', 'Đã hoàn tất sửa chữa máy tính / phần mềm, bàn giao khách hàng và kích hoạt Sổ bảo hành điện tử (e-Warranty) 06 tháng.')}
                              className="bg-brand-blue hover:bg-brand-blue-hover text-white px-2.5 py-1 rounded text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer"
                            >
                              ✅ Hoàn tất &amp; Cấp e-Warranty
                            </button>
                          )}
                          {t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              ✓ Đã bàn giao
                            </span>
                          )}

                          {/* 2. CÁC NÚT PHỤ: TIỆN ÍCH HỒ SƠ (Màu trung tính: nền trắng viền xám tinh gọn) */}
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentTicketCode(t.ma_phieu);
                              setCashierAmount(t.tien_sau_giam || t.tong_tien || '');
                              setActiveTab('PAYMENT_GATEWAY');
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                              t.trang_thai_thanh_toan === 'DA_THANH_TOAN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-bold'
                            }`}
                            title={t.trang_thai_thanh_toan === 'DA_THANH_TOAN' ? 'Đã thanh toán - Bấm để xem chi tiết / in biên lai' : 'Chưa thanh toán - Bấm để mở quầy thu ngân xác nhận'}
                          >
                            <span>{t.trang_thai_thanh_toan === 'DA_THANH_TOAN' ? '✓ Đã TT' : '💵 Thu tiền'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openPhotoModal(t)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded text-xs font-medium transition shrink-0 cursor-pointer"
                            title="Xem & Tải ảnh ngoại quan thiết bị"
                          >
                            📸 Ảnh ngoại quan
                          </button>
                          <button
                            type="button"
                            onClick={() => openReceipt(t)}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-2 py-1 rounded text-xs font-medium transition shrink-0 cursor-pointer"
                            title="In phiếu nhiệt 80mm có mã QR"
                          >
                            🖨️ In Phiếu QR
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      Không tìm thấy hồ sơ phiếu QR nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ LỊCH HẸN TƯ VẤN & CSKH */}
      {activeTab === 'BOOKINGS' && canReceptionAction && (
        <div className="bg-white p-6 rounded-xl shadow border-t-4 border-brand-blue">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Lịch Hẹn Tư Vấn &amp; Chăm Sóc Khách Hàng Qua Web QR</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                💡 Khi bấm <b>Khách Đã Đến (Tạo Phiếu QR)</b>, hệ thống sẽ tự động khởi tạo Hồ sơ phiếu QR CSKH cho khách hàng.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-4">Ngày / Giờ Hẹn</th>
                  <th className="py-2.5 px-4">Khách Hàng &amp; SĐT</th>
                  <th className="py-2.5 px-4">Nội Dung Yêu Cầu Tư Vấn / Hỗ Trợ</th>
                  <th className="py-2.5 px-4">Trạng Thái</th>
                  <th className="py-2.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(bk => (
                  <tr key={bk.id} className="border-b hover:bg-slate-50 text-sm">
                    <td className="py-3 px-4 font-bold text-brand-blue">
                      {new Date(bk.ngay_hen).toLocaleDateString('vi-VN')} <br />
                      <span className="text-red-500">{bk.gio_hen}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{bk.ho_ten_khach}</div>
                      <div className="text-xs font-mono text-slate-500">{bk.so_dien_thoai}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{bk.mo_ta_loi}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          bk.trang_thai === 'KHACH_DA_DEN' ? 'bg-emerald-500' :
                          bk.trang_thai === 'DA_XAC_NHAN' ? 'bg-brand-blue' :
                          bk.trang_thai === 'HUY' ? 'bg-slate-300' :
                          'bg-slate-400'
                        }`} />
                        <span>
                          {bk.trang_thai === 'CHO_XAC_NHAN' ? 'Chờ xác nhận' :
                           bk.trang_thai === 'DA_XAC_NHAN' ? 'Đã xác nhận' :
                           bk.trang_thai === 'KHACH_DA_DEN' ? 'Khách đã đến' : 'Đã hủy'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {bk.trang_thai === 'CHO_XAC_NHAN' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(bk.id, 'DA_XAC_NHAN')}
                              className="bg-brand-blue hover:bg-brand-blue-hover text-white px-3 py-1 rounded text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                              📞 Xác Nhận
                            </button>
                            <button
                              type="button"
                              onClick={() => updateBookingStatus(bk.id, 'HUY')}
                              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-medium transition cursor-pointer"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {bk.trang_thai === 'DA_XAC_NHAN' && (
                          <button
                            type="button"
                            onClick={() => updateBookingStatus(bk.id, 'KHACH_DA_DEN')}
                            className="bg-brand-blue hover:bg-brand-blue-hover text-white px-3 py-1 rounded text-xs font-semibold shadow-2xs transition cursor-pointer"
                          >
                            ✅ Đã Đến (Tạo Phiếu QR)
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      Chưa có lịch hẹn CSKH nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: THỐNG KÊ HIỆU SUẤT CSKH & ĐÁNH GIÁ HÀI LÒNG (CSAT) */}
      {activeTab === 'STATS' && canViewStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng Hồ Sơ QR Tiếp Nhận</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-blue">{stats.totalTickets || tickets.length}</p>
              <p className="mt-1 text-xs text-slate-500">Hồ sơ khởi tạo qua QR &amp; tại quầy</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đã Hoàn Tất &amp; Cấp e-Warranty</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-600">{stats.completedTickets || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Khách hàng đã nhận bàn giao &amp; sổ BH</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Chỉ Số Hài Lòng (CSAT)</p>
              <p className="mt-2 text-3xl font-extrabold text-amber-500">{stats.avgRating || '5.0'} / 5.0 ⭐</p>
              <p className="mt-1 text-xs text-slate-500">Đánh giá trực tiếp sau khi quét mã QR</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tổng Lượt Đánh Giá QR</p>
              <p className="mt-2 text-3xl font-extrabold text-indigo-600">{stats.totalReviews || 0} lượt</p>
              <p className="mt-1 text-xs text-slate-500">Phản hồi chất lượng phục vụ CSKH</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Biểu Đồ Phân Bổ Trạng Thái Hồ Sơ Chăm Sóc Khách Hàng</h3>
                <p className="text-xs text-slate-500">Thống kê trực quan tiến độ xử lý các phiếu yêu cầu hỗ trợ qua mã QR.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={reportPeriod}
                  onChange={e => setReportPeriod(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  <option value="week">7 ngày gần nhất</option>
                  <option value="month">30 ngày gần nhất</option>
                  <option value="year">12 tháng gần nhất</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const rows = (stats.statusData || []).map((item, idx) => [
                      idx + 1,
                      STATUS_LABELS[item.name] || item.name,
                      Number(item.value || 0)
                    ]);
                    const summaryRow = ['', 'TỔNG CỘNG HỒ SƠ QR', stats.totalTickets || tickets.length];
                    exportEnterpriseExcel({
                      filename: `Bao_Cao_Thong_Ke_CSKH_QR_${new Date().toISOString().slice(0, 10)}.xlsx`,
                      sheetName: 'Thống Kê CSKH',
                      title: 'BÁO CÁO THỐNG KÊ HIỆU SUẤT CHĂM SÓC KHÁCH HÀNG QUA MÃ QR - CÔNG TY CỔ PHẦN LỤC GIÁC',
                      headers: ['STT', 'Trạng Thái Hồ Sơ CSKH', 'Số Lượng Hồ Sơ (Phiếu)'],
                      rows,
                      summaryRow,
                      signRole: 'TRƯỞNG BỘ PHẬN CSKH'
                    });
                  }}
                  className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
                >
                  📊 Xuất Báo Cáo Thống Kê (.xlsx)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-72 rounded-xl border border-slate-100 p-4">
                <p className="mb-3 text-xs font-bold uppercase text-slate-500">Số lượng hồ sơ theo trạng thái</p>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={(stats.statusData || []).map(d => ({ ...d, label: STATUS_LABELS[d.name] || d.name }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Số hồ sơ" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="h-72 rounded-xl border border-slate-100 p-4">
                <p className="mb-3 text-xs font-bold uppercase text-slate-500">Tỷ trọng xử lý hồ sơ QR</p>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={(stats.statusData || []).map(d => ({ ...d, label: STATUS_LABELS[d.name] || d.name }))}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={({ label, value }) => `${label}: ${value}`}
                    >
                      {(stats.statusData || []).map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUẢN LÝ & PHÂN QUYỀN NHÂN SỰ CSKH */}
      {activeTab === 'EMPLOYEES' && canManageEmployees && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue flex items-center gap-2">
                  <span>🏛️</span> Phân Quyền &amp; Nhân Sự CSKH (RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quản trị viên (ADMIN) và Trưởng bộ phận CSKH (QUAN_LY) cấp phát tài khoản và phân quyền vận hành cho nhân sự.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateEmployeeModal}
                className="rounded-xl bg-brand-blue hover:bg-blue-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition flex items-center gap-1.5"
              >
                <span>+</span> Tạo Tài Khoản Nhân Sự Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { key: 'ADMIN', pages: 'Toàn quyền hệ thống • Phân quyền nhân sự' },
                { key: 'QUAN_LY', pages: 'Giám sát CSKH • Thống kê • Nhân sự cấp dưới' },
                { key: 'KY_THUAT_VIEN', pages: 'Tiếp nhận phân loại • Xử lý hỗ trợ • Cấp e-Warranty' },
                { key: 'LE_TAN', pages: 'Khởi tạo phiếu QR tại quầy • Lịch hẹn • In phiếu 80mm' }
              ].map((item) => {
                const meta = ROLE_META[item.key];
                return (
                  <div key={item.key} className="rounded-xl border border-slate-200/90 p-3.5 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${meta.badgeClass}`}>
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{meta.permissionsText}</p>
                    </div>
                    <p className="text-[11px] font-bold text-brand-blue mt-2 pt-2 border-t border-slate-200/70">
                      📌 Nghiệp vụ: <span className="font-semibold text-slate-700">{item.pages}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xs border-t-4 border-brand-blue">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Danh Sách Tài Khoản Nhân Sự CSKH ({employees.length})</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Đang đăng nhập với quyền: <strong>{currentRoleInfo.title}</strong>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-blue border border-blue-200">
                  🎧 Đang xử lý: {tickets.filter(t => t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN' || t.trang_thai === 'ĐANG_SỬA').length} hồ sơ
                </span>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  ✅ Đã hoàn tất: {tickets.filter(t => t.trang_thai === 'ĐÃ_SỬA_XONG' || t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN').length} hồ sơ
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <th className="py-2.5 px-4">Mã NV</th>
                    <th className="py-2.5 px-4">Họ và Tên</th>
                    <th className="py-2.5 px-4">Tài Khoản</th>
                    <th className="py-2.5 px-4">Vai Trò CSKH</th>
                    <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-4 text-right">Thao Tác Phân Quyền</th>
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
                                className="px-2.5 py-1 rounded bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold shadow-2xs transition"
                              >
                                ✏️ Phân quyền / Đổi MK
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleEmployeeLock(emp)}
                                className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition"
                              >
                                {emp.trang_thai === 'HOAT_DONG' ? 'Khóa TK' : 'Mở khóa'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEmployee(emp)}
                                className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 text-xs font-medium transition"
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4B: QUẦY THU NGÂN & XÁC NHẬN THANH TOÁN (LỄ TÂN TẠI QUẦY) */}
      {activeTab === 'PAYMENT_GATEWAY' && (() => {
        const currentTicket = tickets.find(t => t.ma_phieu === paymentTicketCode) || tickets[0] || null;
        const unpaidCount = tickets.filter(t => t.trang_thai_thanh_toan !== 'DA_THANH_TOAN').length;
        const paidCount = tickets.filter(t => t.trang_thai_thanh_toan === 'DA_THANH_TOAN').length;

        const filteredCashierTickets = tickets.filter(t => {
          if (cashierFilter === 'UNPAID' && t.trang_thai_thanh_toan === 'DA_THANH_TOAN') return false;
          if (cashierFilter === 'PAID' && t.trang_thai_thanh_toan !== 'DA_THANH_TOAN') return false;
          if (!cashierSearch) return true;
          const q = cashierSearch.toLowerCase();
          return (
            (t.ma_phieu && t.ma_phieu.toLowerCase().includes(q)) ||
            (t.ho_ten_khach && t.ho_ten_khach.toLowerCase().includes(q)) ||
            (t.so_dien_thoai && t.so_dien_thoai.toLowerCase().includes(q)) ||
            (t.ten_thiet_bi && t.ten_thiet_bi.toLowerCase().includes(q))
          );
        });

        const isCurrentPaid = currentTicket?.trang_thai_thanh_toan === 'DA_THANH_TOAN';
        const displayAmount = Number(cashierAmount !== '' ? cashierAmount : (currentTicket?.tien_sau_giam || currentTicket?.tong_tien || 0));

        return (
          <div className="space-y-5">
            {/* Thanh tiêu đề Quầy Thu Ngân */}
            <div className="bg-white p-5 rounded-2xl border-t-4 border-emerald-500 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <span>💵</span> Quầy Thu Ngân &amp; Xác Nhận Thanh Toán Tại Quầy
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Dành riêng cho <strong>Lễ Tân / CSKH</strong> thu tiền mặt hoặc xác nhận chuyển khoản VietQR, in biên nhận và kích hoạt bảo hành điện tử e-Warranty.
                </p>
              </div>

              {/* Thống kê thu ngân */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Chờ thu: <strong>{unpaidCount} hồ sơ</strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Đã thu: <strong>{paidCount} hồ sơ</strong>
                </span>
              </div>
            </div>

            {/* Thông báo thao tác */}
            {cashierSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-between shadow-xs">
                <span>{cashierSuccessMsg}</span>
                <button type="button" onClick={() => setCashierSuccessMsg('')} className="text-slate-400 hover:text-slate-700 font-extrabold text-base">×</button>
              </div>
            )}

            {/* Bố cục 2 cột: Cột 1 = Chọn & Xác nhận thanh toán | Cột 2 = Hiển thị cho khách quét */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* CỘT TRÁI: KHU VỰC THAO TÁC CỦA LỄ TÂN (7 CỘT) */}
              <div className="lg:col-span-7 space-y-4">
                {/* 1. Bộ tìm kiếm và chọn nhanh hồ sơ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. Chọn hồ sơ khách hàng cần thu tiền:
                    </label>
                    {/* Filter pills */}
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'UNPAID', label: '⏳ Chờ thu' },
                        { key: 'PAID', label: '✓ Đã thu' }
                      ].map(f => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setCashierFilter(f.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            cashierFilter === f.key
                              ? 'bg-brand-blue text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="🔍 Gõ mã phiếu, tên KH, SĐT..."
                      value={cashierSearch}
                      onChange={(e) => setCashierSearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                    <select
                      value={paymentTicketCode}
                      onChange={(e) => {
                        setPaymentTicketCode(e.target.value);
                        const sel = tickets.find(t => t.ma_phieu === e.target.value);
                        if (sel) {
                          setCashierAmount(sel.tien_sau_giam || sel.tong_tien || '');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-blue truncate"
                    >
                      {filteredCashierTickets.map((t) => (
                        <option key={t.id} value={t.ma_phieu}>
                          {t.ma_phieu} — {t.ho_ten_khach} ({t.trang_thai_thanh_toan === 'DA_THANH_TOAN' ? '✓ Đã TT' : 'Chờ TT'})
                        </option>
                      ))}
                      {filteredCashierTickets.length === 0 && <option value="">Không có hồ sơ nào phù hợp</option>}
                    </select>
                  </div>
                </div>

                {/* 2. Chi tiết hồ sơ phiếu được chọn */}
                {currentTicket ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    {/* Header thông tin phiếu */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold text-brand-blue font-mono">
                            #{currentTicket.ma_phieu}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                            isCurrentPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {isCurrentPaid ? '✓ ĐÃ THANH TOÁN' : '⏳ CHỜ THU TIỀN'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ngày tạo: {currentTicket.ngay_tao ? new Date(currentTicket.ngay_tao).toLocaleString('vi-VN') : 'N/A'}
                        </p>
                      </div>

                      <a
                        href={`/track/${currentTicket.ma_phieu}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-blue hover:underline font-bold flex items-center gap-1"
                      >
                        <span>Mở trang QR khách xem</span>
                        <span>↗</span>
                      </a>
                    </div>

                    {/* Lưới thông tin khách hàng & thiết bị */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">Khách hàng</span>
                        <p className="font-extrabold text-slate-800 text-sm">{currentTicket.ho_ten_khach}</p>
                        <p className="font-mono text-slate-600">📞 {currentTicket.so_dien_thoai}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-slate-400 font-bold uppercase text-[10px] block">Thiết bị / Dịch vụ</span>
                        <p className="font-extrabold text-slate-800 text-sm truncate">{currentTicket.ten_thiet_bi}</p>
                        <p className="text-slate-500 text-[11px] truncate">
                          {currentTicket.so_imei_serial ? `S/N: ${currentTicket.so_imei_serial}` : currentTicket.mo_ta_loi || 'Sửa chữa máy tính'}
                        </p>
                      </div>
                    </div>

                    {/* Đã thanh toán: Chi tiết giao dịch */}
                    {isCurrentPaid && (
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            ĐÃ XÁC NHẬN HOÀN TẤT THANH TOÁN
                          </span>
                          <span className="text-emerald-700 font-mono text-sm">
                            {Number(currentTicket.tien_sau_giam || currentTicket.tong_tien || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800 pt-1">
                          <p>• Hình thức: <strong>{currentTicket.phuong_thuc_thanh_toan === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Tiền mặt tại quầy'}</strong></p>
                          <p>• Mã tham chiếu: <strong className="font-mono">{currentTicket.ma_giao_dich || 'CASH_DIRECT'}</strong></p>
                        </div>
                        <p className="text-[10px] text-emerald-700">
                          * Bảo hành điện tử e-Warranty đã được kích hoạt và đồng bộ theo mã QR khách hàng.
                        </p>
                      </div>
                    )}

                    {/* Khu vực nhập tiền và nút bấm xác nhận cho Lễ tân */}
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Số tiền thực thu (VNĐ):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={cashierAmount}
                            onChange={(e) => setCashierAmount(e.target.value)}
                            placeholder="Nhập số tiền..."
                            className="w-full px-3.5 py-2 text-sm font-extrabold text-brand-blue font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Ghi chú giao dịch thu ngân:
                          </label>
                          <input
                            type="text"
                            value={cashierNote}
                            onChange={(e) => setCashierNote(e.target.value)}
                            placeholder="Vd: Thu tiền mặt tại quầy 615 Âu Cơ..."
                            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-brand-blue"
                          />
                        </div>
                      </div>

                      {/* HAI NÚT BẤM XÁC NHẬN NỔI BẬT CHO LỄ TÂN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={confirmingPayment}
                          onClick={() => handleConfirmCashierPayment(currentTicket, 'TIEN_MAT')}
                          className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <span className="text-base">💵</span>
                          <span>{confirmingPayment ? 'Đang xử lý...' : 'Xác Nhận ĐÃ THU TIỀN MẶT'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={confirmingPayment}
                          onClick={() => handleConfirmCashierPayment(currentTicket, 'VIETQR')}
                          className="py-3 px-4 rounded-xl bg-brand-blue hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <span className="text-base">🏦</span>
                          <span>{confirmingPayment ? 'Đang xử lý...' : 'Xác Nhận ĐÃ CHUYỂN KHOẢN'}</span>
                        </button>
                      </div>

                      {/* In phiếu thu ngân nhanh */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => openReceipt(currentTicket)}
                          className="text-xs font-bold text-slate-600 hover:text-brand-blue flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <span>🖨️</span>
                          <span>In Phiếu Thu Ngân / Hóa Đơn Nhiệt 80mm</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                    Vui lòng chọn một hồ sơ phiếu từ danh sách trên để thực hiện thu ngân.
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: MÀN HÌNH HIỂN THỊ MÃ CHO KHÁCH TẠI BÀN (5 CỘT) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 text-white p-3 rounded-2xl text-xs flex items-center justify-between">
                  <span className="font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    MÀN HÌNH HIỂN THỊ KHÁCH HÀNG (CUSTOMER DISPLAY)
                  </span>
                  <span className="text-[10px] text-slate-400">Quầy Lễ Tân 615 Âu Cơ</span>
                </div>

                {currentTicket ? (
                  <PaymentMethodSelector
                    ticketCode={currentTicket.ma_phieu}
                    customerName={currentTicket.ho_ten_khach || 'Khách hàng'}
                    defaultAmount={displayAmount}
                    paymentStatus={currentTicket.trang_thai_thanh_toan}
                    ticket={currentTicket}
                    onPaymentSuccess={async () => {
                      await refreshTickets();
                      showToast(`✓ Đã nhận thanh toán cho hồ sơ #${currentTicket.ma_phieu}!`);
                    }}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                    Chưa chọn hồ sơ.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 5: BẢO MẬT DOANH NGHIỆP & NHẬT KÝ KIỂM TOÁN (ENTERPRISE SECURITY & AUDIT - CHỈ QUẢN LÝ / GIÁM ĐỐC) */}
      {activeTab === 'SECURITY' && isManagerOrAbove && (
        <div className="space-y-6">
          {/* BANNER TỔNG QUAN KIẾN TRÚC BẢO MẬT CHUẨN DOANH NGHIỆP */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center text-2xl shadow-xs">
                  🛡️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Kiến Trúc An Toàn Thông Tin Chuẩn Doanh Nghiệp
                    </h3>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-brand-blue border border-blue-200 uppercase tracking-wider">
                      Enterprise Suite v2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Hệ thống tự động phòng thủ chủ động 6 lớp, bảo vệ toàn vẹn dữ liệu khách hàng, xác thực phiên làm việc thời gian thực và ghi vết mọi thao tác điều hành vào Nhật ký Kiểm toán.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  6/6 Lớp Bảo Mật Đang Hoạt Động (100%)
                </span>
              </div>
            </div>

            {/* 4 CHỈ SỐ NHANH BẢO MẬT */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Xác Thực Phiên</span>
                <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>🔐</span> JWT HS256 Strict
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Xác thực token theo thời gian thực</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Mã Hóa Mật Khẩu</span>
                <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>🧬</span> Bcrypt (10 Salt Rounds)
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Chống tấn công từ điển & Rainbow</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Cơ Chế Lọc Dữ Liệu</span>
                <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>🧼</span> SQLi, XSS & HPP Sanitizer
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Tự động làm sạch input ở mọi API</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Kết Nối Đám Mây</span>
                <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>☁️</span> Supabase Cloud TLS/SSL
                </p>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Transaction Pooler mã hóa cổng 6543</span>
              </div>
            </div>

            {/* 6 LÁ CHẮN BẢO MẬT CHI TIẾT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {[
                {
                  icon: '🔐',
                  badge: 'Lớp 01 • Authentication',
                  title: '1. Xác Thực JWT HS256 & Thu Hồi Tức Thì',
                  desc: securityStatus?.jwtAlgorithm || 'Kiểm tra chữ ký số HS256 nghiêm ngặt, đối chiếu trạng thái hoạt động của tài khoản trực tiếp từ CSDL ở từng request.'
                },
                {
                  icon: '🧬',
                  badge: 'Lớp 02 • One-Way Hash',
                  title: '2. Mã Hóa Mật Khẩu Một Chiều Bcrypt',
                  desc: securityStatus?.passwordHashing || 'Mật khẩu nhân sự được băm một chiều với 10 vòng muối (10 Salt Rounds), đảm bảo an toàn tuyệt đối không thể giải mã ngược.'
                },
                {
                  icon: '🧼',
                  badge: 'Lớp 03 • Input Sanitizer',
                  title: '3. Lọc & Chống Mã Độc XSS, SQLi & HPP',
                  desc: securityStatus?.inputProtection || 'Tự động làm sạch thẻ độc hại, chống Prototype Pollution và loại trừ tham số trùng lặp (HTTP Parameter Pollution).'
                },
                {
                  icon: '🧱',
                  badge: 'Lớp 04 • HTTP Hardening',
                  title: '4. Helmet HTTP Security Headers & CSP',
                  desc: securityStatus?.httpHeaders || 'Thiết lập Content-Security-Policy (CSP), cấm nhúng iframe trái phép (X-Frame-Options: DENY) và chặn đoán MIME-type.'
                },
                {
                  icon: '🚦',
                  badge: 'Lớp 05 • Rate Limiting',
                  title: '5. Chống Dò Mật Khẩu (Brute-Force Lockout)',
                  desc: securityStatus?.rateLimiting || 'Tự động khóa tài khoản tạm thời 15 phút nếu đăng nhập sai 5 lần liên tiếp; giới hạn tần suất tạo phiếu QR để ngăn spam.'
                },
                {
                  icon: '☁️',
                  badge: 'Lớp 06 • Transport Security',
                  title: '6. Kết Nối CSDL Đám Mây Mã Hóa SSL/TLS',
                  desc: securityStatus?.databaseEncryption || 'Truyền tải dữ liệu qua Supabase PostgreSQL Cloud Transaction Pooler (Cổng :6543) chuẩn mã hóa SSL/TLS 1.3.'
                }
              ].map((shield, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{shield.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {shield.badge}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">
                      {shield.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      {shield.desc}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Trạng thái bảo vệ:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-extrabold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Đang Bảo Vệ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI ĐỔI MẬT KHẨU BẢO MẬT CÁ NHÂN */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🔑</span> Đổi Mật Khẩu Bảo Mật Cá Nhân
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    @{currentUsername || role}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mật khẩu mới sẽ được mã hóa tự động bằng thuật toán Bcrypt (10 Salt Rounds) và lưu vết vào Nhật ký Kiểm toán.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Tối thiểu 6 ký tự • Khuyến nghị kèm số &amp; ký tự đặc biệt
              </span>
            </div>

            <form onSubmit={submitChangePassword} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  required
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu đang dùng..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-blue focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mật khẩu mới (&gt;= 6 ký tự) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-blue focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:border-brand-blue focus:outline-none transition"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={savingPw}
                  className="w-full rounded-xl bg-brand-blue hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs py-2.5 px-4 shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🔐</span>
                  <span>{savingPw ? 'Đang mã hóa Bcrypt...' : 'Cập Nhật Mật Khẩu'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* BẢNG NHẬT KÝ KIỂM TOÁN BẢO MẬT DOANH NGHIỆP (SECURITY AUDIT TRAIL) */}
          {canManageEmployees && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>📋</span> Nhật Ký Kiểm Toán Bảo Mật Thời Gian Thực (Security Audit Trail)
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {auditLogs.length} sự kiện
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ghi vết bất biến toàn bộ sự kiện: đăng nhập hệ thống, phân quyền nhân sự, khởi tạo mã QR và thay đổi trạng thái hồ sơ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const rows = auditLogs.map((log, idx) => [
                      idx + 1,
                      log.timestamp,
                      log.actor,
                      log.role,
                      log.action,
                      log.target,
                      log.ip,
                      log.status,
                      log.details
                    ]);
                    exportEnterpriseExcel({
                      filename: `Nhat_Ky_Bao_Mat_Audit_Log_${new Date().toISOString().slice(0, 10)}.xlsx`,
                      sheetName: 'Security Audit Log',
                      title: 'BÁO CÁO NHẬT KÝ KIỂM TOÁN BẢO MẬT HỆ THỐNG (SECURITY AUDIT TRAIL) - CÔNG TY CỔ PHẦN LỤC GIÁC',
                      headers: ['STT', 'Thời Gian (+07:00)', 'Tài Khoản Thực Hiện', 'Vai Trò', 'Hành Động (Action)', 'Đối Tượng Tác Động', 'Địa Chỉ IP', 'Trạng Thái', 'Chi Tiết Sự Kiện Bảo Mật'],
                      rows,
                      summaryRow: ['', 'TỔNG SỐ SỰ KIỆN GHI VẾT', `${auditLogs.length} bản ghi`, '', '', '', '', '', ''],
                      signRole: 'QUẢN TRỊ AN TOÀN THÔNG TIN'
                    });
                  }}
                  className="rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold text-xs px-4 py-2.5 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>📊</span>
                  <span>Xuất Nhật Ký Bảo Mật (.xlsx)</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[860px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3 px-3.5">Thời Gian</th>
                      <th className="py-3 px-3.5">Tác Nhân (Actor)</th>
                      <th className="py-3 px-3.5">Sự Kiện (Action)</th>
                      <th className="py-3 px-3.5">Đối Tượng</th>
                      <th className="py-3 px-3.5">Địa Chỉ IP</th>
                      <th className="py-3 px-3.5">Trạng Thái</th>
                      <th className="py-3 px-3.5">Chi Tiết Kiểm Toán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-3.5 font-black text-slate-900">
                          {log.actor} <span className="text-[10px] font-bold text-slate-400 block sm:inline">({log.role})</span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-black text-brand-blue text-[11px] px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-700">
                          {log.target}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-[11px] text-slate-500">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {log.ip}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                            log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            log.status === 'WARNING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              log.status === 'SUCCESS' ? 'bg-emerald-500' :
                              log.status === 'WARNING' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}></span>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 max-w-xs leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-400 font-medium">
                          Chưa có bản ghi kiểm toán bảo mật nào trong phiên hiện tại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: THÔNG BÁO THỜI GIAN THỰC */}
      {activeTab === 'NOTIFICATIONS' && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thông Báo Hoạt Động CSKH Thời Gian Thực</h3>
              <p className="text-xs text-slate-500">Tự động ghi nhận khi có hồ sơ QR mới, thay đổi trạng thái xử lý hoặc lịch hẹn mới.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Đánh dấu đã đọc
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotifications([]);
                  setLatestNotice(null);
                  localStorage.removeItem('ticketNotifications');
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Xóa lịch sử
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
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
              .filter(item => !isNotificationCorrupted(item))
              .filter(notification => notificationFilter !== 'UNREAD' || !notification.read)
              .map(notification => (
                <article
                  key={notification.id}
                  onClick={() => {
                    // Đánh dấu đã đọc
                    const updated = notifications.map(item => item.id === notification.id ? { ...item, read: true } : item);
                    setNotifications(updated);
                    try {
                      localStorage.setItem('ticketNotifications', JSON.stringify(updated));
                    } catch {}

                    if (notification.ticketCode) {
                      setActiveTab('TICKETS');
                      setStatusFilter('ALL');
                      setTicketSearch(notification.ticketCode);
                    } else if (notification.type === 'booking') {
                      setActiveTab('BOOKINGS');
                    }
                  }}
                  className={`group flex items-start justify-between gap-3 rounded-xl border p-4 transition cursor-pointer ${
                    notification.read
                      ? 'border-slate-200 bg-white hover:bg-slate-50'
                      : 'border-blue-200 bg-blue-50/80 hover:bg-blue-100/70 shadow-2xs'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.read && <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0"></span>}
                      <p className="font-bold text-sm text-slate-800">
                        {notification.title || `Phiếu ${notification.ticketCode}: ${notification.status}`}
                      </p>
                    </div>
                    {notification.description && <p className="mt-1 text-xs text-slate-600 font-normal">{notification.description}</p>}
                    <p className="mt-1.5 text-xs text-slate-400">{notification.createdAt}</p>
                  </div>
                  <span className="text-xs font-semibold text-brand-blue group-hover:translate-x-1 transition-transform shrink-0 pt-1">
                    Mở phiếu →
                  </span>
                </article>
              ))}
            {notifications.filter(item => !isNotificationCorrupted(item)).filter(notification => notificationFilter !== 'UNREAD' || !notification.read).length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                {notificationFilter === 'UNREAD' ? 'Không có thông báo chưa đọc.' : 'Chưa có thông báo mới.'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* MODAL 1: TẠO MỚI / PHÂN QUYỀN NHÂN VIÊN */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">
                  {editingEmployee ? `✏️ Phân Quyền Nhân Sự: ${editingEmployee.ho_ten}` : '👤 Tạo Tài Khoản Nhân Sự CSKH Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cấp phát tài khoản vận hành hệ thống CSKH và Dịch vụ Kỹ thuật.
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
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
                    placeholder="VD: cskh_minh"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Vai trò &amp; Cấp bậc Phân quyền CSKH *</label>
                <select
                  value={employeeForm.vai_tro}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, vai_tro: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-slate-800 focus:border-brand-blue outline-none"
                >
                  {isExecutive && (
                    <>
                      <option value="ADMIN">🛡️ Quản Trị Hệ Thống CSKH (ADMIN)</option>
                      <option value="QUAN_LY">🏬 Trưởng Bộ Phận CSKH (QUAN_LY)</option>
                    </>
                  )}
                  <option value="KY_THUAT_VIEN">🎧 Chuyên Viên Hỗ Trợ CSKH (KY_THUAT_VIEN)</option>
                  <option value="LE_TAN">👩‍💼 Lễ Tân &amp; Tiếp Nhận QR (LE_TAN)</option>
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
                  className="rounded-xl bg-brand-blue px-5 py-2.5 font-extrabold text-white hover:bg-blue-700 shadow-md disabled:opacity-60"
                >
                  {savingEmployee ? 'Đang lưu...' : editingEmployee ? 'Lưu Phân Quyền' : 'Tạo Tài Khoản →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IN PHIẾU TIẾP NHẬN & TRA CỨU MÃ QR CSKH (80MM) */}
      {receiptTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="max-h-[95vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between print:hidden">
              <h3 className="text-lg font-bold text-brand-blue">Phiếu Tiếp Nhận &amp; Tra Cứu Mã QR (80mm)</h3>
              <button type="button" onClick={() => setReceiptTicket(null)} className="rounded px-3 py-1 text-slate-600 hover:bg-slate-100">
                Đóng
              </button>
            </div>
            <div id="thermal-receipt" className="mx-auto w-full max-w-[72mm] border border-dashed border-slate-300 p-4 text-sm text-slate-900">
              <div className="text-center">
                <h1 className="text-base font-extrabold">CÔNG TY CỔ PHẦN LỤC GIÁC</h1>
                <p className="text-[10px] text-slate-600">615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM</p>
                <p className="text-[10px] text-slate-600">Hotline CSKH: (028) 3860 4999</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider">PHIẾU TIẾP NHẬN &amp; TRA CỨU QR</p>
                <p className="mt-2 text-lg font-bold text-brand-blue">{receiptTicket.ma_phieu}</p>
              </div>
              <hr className="my-3 border-dashed border-slate-400" />
              <p><strong>Ngày tiếp nhận:</strong> {receiptTicket.ngay_tao ? new Date(receiptTicket.ngay_tao).toLocaleString('vi-VN') : 'Chưa cập nhật'}</p>
              <p className="mt-1"><strong>Khách hàng:</strong> {receiptTicket.ho_ten_khach}</p>
              <p className="mt-1"><strong>Điện thoại:</strong> {receiptTicket.so_dien_thoai}</p>
              <p className="mt-1"><strong>Sản phẩm / Dịch vụ:</strong> {receiptTicket.ten_thiet_bi || 'Không có thông tin'}</p>
              {receiptTicket.so_imei_serial && (
                <p className="mt-1"><strong>Mã định danh (S/N):</strong> {receiptTicket.so_imei_serial}</p>
              )}
              <p className="mt-1"><strong>Nội dung yêu cầu CSKH:</strong> {receiptTicket.mo_ta_loi}</p>
              <p className="mt-1"><strong>Trạng thái hiện tại:</strong> {STATUS_LABELS[receiptTicket.trang_thai] || receiptTicket.trang_thai}</p>
              <hr className="my-3 border-dashed border-slate-400" />
              <p className="mt-2 text-[10px] text-slate-600 border border-slate-200 p-2 rounded text-center">
                🛡️ <strong>Sổ bảo hành điện tử (e-Warranty):</strong> Kích hoạt 06 tháng (180 ngày) sau khi hoàn tất hỗ trợ. Quý khách quét mã QR bên dưới để theo dõi tiến độ xử lý thời gian thực hoặc gửi yêu cầu bảo hành.
              </p>
              {receiptQr && (
                <div className="mt-4 text-center">
                  <img src={receiptQr} alt={`QR tra cứu phiếu ${receiptTicket.ma_phieu}`} className="mx-auto h-32 w-32" />
                  <p className="mt-1 break-all text-[10px] font-mono">{window.location.origin}/track/{receiptTicket.ma_phieu}</p>
                </div>
              )}
              <p className="mt-4 text-center text-xs font-semibold">Cảm ơn quý khách đã tin tưởng Công ty Cổ phần Lục Giác!</p>
            </div>
            <div className="mt-4 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!receiptQr}
                className="rounded-lg bg-brand-blue px-5 py-2 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                🖨️ In Phiếu QR (80mm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TIẾP NHẬN NHANH TẠI QUẦY (POS WALK-IN) */}
      {showPosModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-extrabold text-brand-blue">📷 Khởi Tạo Hồ Sơ QR Tại Quầy (CSKH)</h3>
                <p className="text-xs text-slate-500">Tạo nhanh phiếu yêu cầu CSKH &amp; tự động bật cửa sổ in phiếu nhiệt QR 80mm.</p>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sản phẩm / Dịch vụ cần hỗ trợ *</label>
                  <input
                    type="text"
                    required
                    value={posForm.deviceName}
                    onChange={e => setPosForm({ ...posForm, deviceName: e.target.value })}
                    placeholder="VD: Sản phẩm / Thiết bị / Dịch vụ cần CSKH..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã định danh / Số Serial</label>
                  <input
                    type="text"
                    value={posForm.serialImei}
                    onChange={e => setPosForm({ ...posForm, serialImei: e.target.value })}
                    placeholder="VD: SN-89234X"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung yêu cầu Chăm sóc khách hàng *</label>
                <textarea
                  required
                  rows={2}
                  value={posForm.issueDescription}
                  onChange={e => setPosForm({ ...posForm, issueDescription: e.target.value })}
                  placeholder="Mô tả chi tiết nội dung cần tư vấn, hỗ trợ, bảo hành của khách hàng..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-blue outline-none"
                />
              </div>

              <div className="rounded-xl bg-amber-50/70 p-3.5 border border-amber-200">
                <label className="block text-xs font-bold text-amber-900 mb-2">📸 Đính kèm ảnh minh chứng hiện trạng lúc tiếp nhận (Tùy chọn):</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={posForm.photoNote}
                    onChange={e => setPosForm({ ...posForm, photoNote: e.target.value })}
                    placeholder="Ghi chú hiện trạng..."
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
                  {savingPos ? 'Đang tạo hồ sơ...' : 'Tạo Hồ Sơ & In Mã QR 80mm →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: QUẢN LÝ ẢNH MINH CHỨNG HIỆN TRẠNG ĐÍNH KÈM HỒ SƠ QR */}
      {showPhotoModal && photoTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📸</span> Ảnh Minh Chứng Hiện Trạng — Hồ Sơ {photoTicket.ma_phieu}
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
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                <h4 className="text-sm font-bold text-brand-blue mb-2">Chụp hoặc Tải Thêm Ảnh Minh Chứng Hiện Trạng:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú hiện trạng đính kèm ảnh:</label>
                    <input
                      type="text"
                      value={newPhotoNote}
                      onChange={(e) => setNewPhotoNote(e.target.value)}
                      placeholder="VD: Ảnh hiện trạng sản phẩm lúc tiếp nhận tại quầy..."
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

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Hình ảnh minh chứng đã lưu ({ticketPhotos.length}):</h4>
                {ticketPhotos.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm">
                    Chưa có ảnh minh chứng nào được tải lên cho hồ sơ này.
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
                          <p className="font-semibold text-slate-800 line-clamp-2">{img.ghi_chu || 'Ảnh hiện trạng tiếp nhận'}</p>
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

      {/* MODAL 5: TÍCH HỢP GỬI THÔNG BÁO ZALO ZNS / SMS TỰ ĐỘNG (GIẢ LẬP CLOUD & CHAT THỰC TẾ) */}
      {showZaloModal && zaloTicket && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border-t-4 border-brand-blue">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0068ff] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  💬
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    Trung Tâm Gửi Thông Báo Zalo ZNS CSKH
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0068ff]">
                      Tự động qua mã QR
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hồ sơ: <strong className="text-brand-blue">{zaloTicket.ma_phieu}</strong> • Khách hàng: <strong>{zaloTicket.ho_ten_khach}</strong> ({zaloTicket.so_dien_thoai})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZaloModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Thông báo kết quả gửi */}
              {zaloAlert && (
                <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  zaloAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span>{zaloAlert.message}</span>
                  <button type="button" onClick={() => setZaloAlert(null)} className="text-base font-bold">×</button>
                </div>
              )}

              {/* MÔ PHỎNG GIAO DIỆN TIN NHẮN ZALO ZNS TRÊN ĐIỆN THOẠI KHÁCH HÀNG */}
              <div className="bg-[#eef3f8] p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 text-[11px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1 text-[#0068ff]">
                    <span>📱</span> Bản xem trước tin nhắn Zalo ZNS trên điện thoại khách hàng:
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-emerald-600 font-bold">
                    ✓ Official Account Đã Xác Thực
                  </span>
                </div>

                {/* Bong bóng tin nhắn Zalo OA */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 max-w-lg mx-auto space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <img src="/img/logo-luc-giac.png" alt="Logo Lục Giác" className="w-8 h-8 object-contain rounded-full bg-slate-50 p-1 border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">CSKH CÔNG TY CỔ PHẦN LỤC GIÁC</span>
                        <span className="text-blue-500 text-xs" title="Tài khoản Zalo doanh nghiệp xác thực">☑️</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Zalo Notification Service (ZNS)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Vừa xong</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#0068ff] uppercase tracking-wide">
                      THÔNG BÁO HOÀN TẤT DỊCH VỤ SỬA CHỮA & CSKH
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Kính gửi <strong>{zaloTicket.ho_ten_khach}</strong>, thiết bị của Quý khách đã được Bộ phận Kỹ thuật kiểm tra và xử lý hoàn tất.
                    </p>
                  </div>

                  {/* Bảng chi tiết trong tin nhắn */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 font-sans">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mã tra cứu QR:</span>
                      <strong className="text-brand-blue font-mono">{zaloTicket.ma_phieu}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thiết bị:</span>
                      <strong className="text-slate-800">{zaloTicket.ten_thiet_bi}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className="font-bold text-emerald-600">
                        {zaloTicket.trang_thai === 'ĐÃ_SỬA_XONG' || zaloTicket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN'
                          ? '✅ ĐÃ SỬA XONG — SẴN SÀNG TRẢ MÁY'
                          : STATUS_LABELS[zaloTicket.trang_thai] || zaloTicket.trang_thai}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sổ bảo hành:</span>
                      <strong className="text-amber-600">🛡️ e-Warranty 06 tháng</strong>
                    </div>
                    {zaloCustomNote && (
                      <div className="pt-1.5 mt-1 border-t border-slate-200 text-[11px] text-slate-600">
                        <span className="text-slate-500">Ghi chú KTV:</span> <em>{zaloCustomNote}</em>
                      </div>
                    )}
                  </div>

                  {/* Nút giả lập hành động trong Zalo */}
                  <div className="pt-1">
                    <a
                      href={`/track/${zaloTicket.ma_phieu}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full py-2 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] font-bold text-center text-xs rounded-xl transition"
                    >
                      🔗 Bấm để xem Hồ sơ & Sổ bảo hành điện tử (e-Warranty)
                    </a>
                  </div>
                </div>
              </div>

              {/* Ô nhập ghi chú riêng của kỹ thuật viên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ✍️ Thêm lời nhắn / Ghi chú kỹ thuật gửi kèm qua Zalo (Tùy chọn):
                </label>
                <textarea
                  rows="2"
                  value={zaloCustomNote}
                  onChange={(e) => setZaloCustomNote(e.target.value)}
                  placeholder="VD: Đã thay keo tản nhiệt MX-4, cài Windows 11 và tối ưu phần mềm miễn phí. Mời anh/chị ghé quầy kỹ thuật nhận máy..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-brand-blue outline-none bg-white"
                />
              </div>
            </div>

            {/* Footer Modal: 2 nút gửi */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <a
                href={`https://zalo.me/${(zaloTicket.so_dien_thoai || '').replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  const trackUrl = `${window.location.origin}/track/${zaloTicket.ma_phieu}`;
                  const textToCopy = `[CSKH CÔNG TY CỔ PHẦN LỤC GIÁC]\nKính gửi ${zaloTicket.ho_ten_khach}, thông báo tiến độ hồ sơ QR: ${zaloTicket.ma_phieu}\n- Thiết bị: ${zaloTicket.ten_thiet_bi}\n- Trạng thái: ${STATUS_LABELS[zaloTicket.trang_thai] || zaloTicket.trang_thai}${zaloCustomNote ? `\n- Ghi chú KTV: ${zaloCustomNote}` : ''}\n👉 Xem chi tiết & Sổ bảo hành điện tử tại: ${trackUrl}`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(textToCopy).catch(() => {});
                  }
                  showToast(`📋 Đã tự động copy nội dung tin nhắn! Hãy bấm Ctrl+V (Dán) vào cửa sổ Zalo của ${zaloTicket.so_dien_thoai}.`);
                }}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Tự động copy nội dung tin nhắn và mở Zalo trực tiếp với số điện thoại này"
              >
                <span>💬 Mở Zalo Thật &amp; Dán Tin Nhắn ({zaloTicket.so_dien_thoai})</span>
                <span>↗</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowZaloModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={zaloSending}
                  onClick={handleSendZalo}
                  className={`px-5 py-2 bg-[#0068ff] hover:bg-[#0055d4] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition ${
                    zaloSending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:brightness-95'
                  }`}
                >
                  <span>⚡</span>
                  <span>{zaloSending ? 'Đang gửi Zalo Cloud...' : 'Gửi Zalo ZNS Tự Động (Giả Lập)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

