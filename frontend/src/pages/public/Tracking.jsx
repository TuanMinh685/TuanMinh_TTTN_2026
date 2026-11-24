import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';
import PaymentMethodSelector from '../../components/PaymentMethodSelector';
import ResponsiveText from '../../components/ResponsiveText';
import SvgIcon from '../../components/SvgIcon';
import {
  showPushNotification,
  playNotificationChime,
  triggerDeviceVibration
} from '../../utils/webNotification';

const PROGRESS_STEPS = [
  { id: 'TIEP_NHAN', label: 'Tiếp nhận máy & Yêu cầu', desc: 'Tạo hồ sơ QR & lưu ảnh ngoại quan', icon: 'laptop' },
  { id: 'CHAN_DOAN', label: 'Kiểm tra & Chẩn đoán lỗi', desc: 'KTV kiểm tra phần cứng / phần mềm', icon: 'search' },
  { id: 'DANG_SUA', label: 'Đang sửa chữa & Cài đặt', desc: 'Khắc phục sự cố máy tính & phần mềm', icon: 'wrench' },
  { id: 'HOAN_TAT', label: 'Hoàn tất & Bảo hành QR', desc: 'Bàn giao máy, bảo hành & đánh giá', icon: 'check-circle' }
];

const STATUS_META = {
  CHỜ_KHÁM: {
    label: 'Đang chờ tiếp nhận kiểm tra máy tính / phần mềm',
    shortLabel: 'CHỜ TIẾP NHẬN',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-slate-400',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  ĐANG_KIỂM_TRA: {
    label: 'Đang kiểm tra phần cứng & phần mềm thiết bị',
    shortLabel: 'ĐANG KIỂM TRA',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-brand-blue',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  ĐANG_CHUẨN_ĐOÁN: {
    label: 'Đang kiểm tra & chẩn đoán lỗi máy tính / phần mềm',
    shortLabel: 'ĐANG CHẨN ĐOÁN',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-brand-blue',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  ĐANG_SỬA: {
    label: 'Đang sửa chữa máy tính & khắc phục sự cố phần mềm',
    shortLabel: 'ĐANG SỬA CHỮA & CÀI ĐẶT',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-brand-blue',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  ĐÃ_SỬA_XONG: {
    label: 'Đã khắc phục xong • Sẵn sàng bàn giao thiết bị',
    shortLabel: 'ĐÃ XỬ LÝ XONG',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-emerald-500',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN: {
    label: 'Đã bàn giao máy & Kích hoạt bảo hành điện tử',
    shortLabel: 'HOÀN TẤT & BẢO HÀNH',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-emerald-500',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  },
  YÊU_CẦU_BẢO_HÀNH: {
    label: 'Đang tiếp nhận yêu cầu hỗ trợ bảo hành',
    shortLabel: 'YÊU CẦU BẢO HÀNH',
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-amber-500',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200'
  }
};

function getStepIndex(status) {
  if (status === 'ĐÃ_SỬA_XONG' || status === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN') return 3;
  if (status === 'ĐANG_SỬA') return 2;
  if (status === 'ĐANG_CHUẨN_ĐOÁN' || status === 'ĐANG_KIỂM_TRA') return 1;
  return 0;
}

function formatLogStatusTitle(rawStatus) {
  if (!rawStatus) return 'Cập nhật hồ sơ CSKH';
  if (rawStatus === 'CẬP_NHẬT') return 'Tiếp nhận hồ sơ yêu cầu CSKH';
  return STATUS_META[rawStatus]?.label || rawStatus.replace(/_/g, ' ');
}

function Tracking() {
  const { ticketCode } = useParams();
  const location = useLocation();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [warrantyReason, setWarrantyReason] = useState('');
  const [warrantyLoading, setWarrantyLoading] = useState(false);
  const [warrantyNotice, setWarrantyNotice] = useState('');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [ticketQr, setTicketQr] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'payment' | 'warranty'

  useEffect(() => {
    if (location.state?.isNew) {
      playNotificationChime();
      triggerDeviceVibration([200, 100, 300]);
    }
  }, [location.state]);

  const fetchTicket = useCallback(
    () => api.get(`/public/track/${ticketCode}`),
    [ticketCode]
  );

  useEffect(() => {
    if (!ticketCode) return;
    QRCode.toDataURL(`${window.location.origin}/track/${ticketCode}`, {
      width: 160,
      margin: 1
    })
      .then(url => setTicketQr(url))
      .catch(() => {});
  }, [ticketCode]);

  useEffect(() => {
    let active = true;

    fetchTicket()
      .then(response => {
        if (active && response.data.success) setTicket(response.data.data);
      })
      .catch(err => {
        if (active) setError(err.response?.data?.message || 'Không tìm thấy thông tin hồ sơ CSKH.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [fetchTicket]);

  useEffect(() => {
    let active = true;
    const refreshTicketStatus = async () => {
      try {
        const response = await fetchTicket();
        const updatedTicket = response.data.data;
        if (!active || !response.data.success || !updatedTicket) return;
        setTicket(currentTicket => {
          if (currentTicket && currentTicket.trang_thai !== updatedTicket.trang_thai) {
            const shortTitle = STATUS_META[updatedTicket.trang_thai]?.shortLabel || updatedTicket.trang_thai;
            setStatusNotice(`Hồ sơ của bạn vừa chuyển sang trạng thái: ${shortTitle}`);

            // Kích hoạt Web Push Notification kèm Rung & Chuông báo
            const isFinished = updatedTicket.trang_thai === 'ĐÃ_SỬA_XONG' || updatedTicket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN';
            showPushNotification({
              title: isFinished ? 'Thiết bị của bạn đã được sửa xong' : 'Cập nhật tiến độ CSKH',
              body: isFinished
                ? `Kỹ thuật viên tại 615 Âu Cơ đã sửa xong ${updatedTicket.ten_may || updatedTicket.ten_thiet_bi || 'thiết bị'}. Mời bạn đến nhận máy kèm Sổ bảo hành điện tử.`
                : `Hồ sơ ${ticketCode} vừa chuyển sang: ${STATUS_META[updatedTicket.trang_thai]?.label || updatedTicket.trang_thai}`,
              ticketCode,
              isCompleted: isFinished
            });
          } else if (
            currentTicket &&
            Array.isArray(updatedTicket.nhat_ky) &&
            updatedTicket.nhat_ky.length > (currentTicket.nhat_ky?.length || 0)
          ) {
            const newestLog = updatedTicket.nhat_ky[0];
            if (newestLog?.ghi_chu) {
              setStatusNotice(`Thông báo mới từ CSKH: ${newestLog.ghi_chu}`);
              showPushNotification({
                title: `Thông báo tiến độ — Hồ sơ ${ticketCode}`,
                body: newestLog.ghi_chu,
                ticketCode,
                isCompleted: true
              });
            }
          }
          return updatedTicket;
        });
      } catch (refreshError) {
        if (active) console.error('Không thể kiểm tra cập nhật phiếu:', refreshError);
      }
    };

    const intervalId = window.setInterval(refreshTicketStatus, 8000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchTicket, ticketCode]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewLoading(true);
    setReviewError('');
    setReviewMessage('');

    try {
      const response = await api.post(`/public/track/${ticketCode}/review`, {
        so_sao: rating,
        nhan_xet: reviewText.trim()
      });
      setReviewMessage(response.data.message || 'Cảm ơn bạn đã đánh giá chất lượng phục vụ!');
      setReviewText('');
      setTicket(currentTicket => ({ ...currentTicket, da_danh_gia: true }));
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Không gửi được đánh giá. Vui lòng thử lại.');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleClaimWarranty = async (e) => {
    e.preventDefault();
    if (!warrantyReason.trim()) return;
    setWarrantyLoading(true);
    setWarrantyNotice('');
    try {
      const res = await api.post(`/public/track/${ticketCode}/warranty-claim`, {
        issueDescription: warrantyReason.trim()
      });
      setWarrantyNotice(res.data.message || 'Đã gửi yêu cầu hỗ trợ bảo hành thành công!');
      setShowWarrantyModal(false);
      setWarrantyReason('');
      const updated = await fetchTicket();
      if (updated.data?.success) setTicket(updated.data.data);
    } catch (err) {
      setWarrantyNotice(err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu bảo hành.');
    } finally {
      setWarrantyLoading(false);
    }
  };

  const handleCopyTicketCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ticketCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mb-4"></div>
        <p className="text-slate-600 font-semibold">Đang tải hồ sơ Chăm sóc khách hàng điện tử...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-red-200 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
          <SvgIcon name="alert" className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hồ sơ phiếu CSKH</h2>
        <p className="text-sm text-red-600 font-medium mb-6">{error}</p>
        <Link to="/tra-cuu" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue-hover transition">
          <SvgIcon name="arrow-left" className="w-4 h-4" />
          <span>Quay lại trang Tra cứu QR</span>
        </Link>
      </div>
    );
  }

  if (!ticket) return null;

  const deviceTitle = ticket.ten_thiet_bi || ticket.ten_may || 'Sản phẩm / Dịch vụ CSKH';
  const currentStep = getStepIndex(ticket.trang_thai);
  const statusInfo = STATUS_META[ticket.trang_thai] || {
    label: ticket.trang_thai.replace(/_/g, ' '),
    shortLabel: ticket.trang_thai.replace(/_/g, ' '),
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-amber-400',
    lightBadge: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const issueText = String(ticket.mo_ta_loi || ticket.tinh_trang_may || 'Kiểm tra và hỗ trợ chăm sóc khách hàng theo yêu cầu').trim();

  return (
    <div className="bg-[#f0f5fa] pb-16 pt-2">
      <div className="max-w-5xl mx-auto px-4">
        {/* Thông báo cập nhật trạng thái */}
        {statusNotice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 font-semibold text-emerald-800 shadow-sm">
            <span>{statusNotice}</span>
            <button type="button" onClick={() => setStatusNotice('')} aria-label="Đóng thông báo" className="text-xl leading-none px-2 hover:bg-emerald-100 rounded-lg">×</button>
          </div>
        )}
        {warrantyNotice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 font-semibold text-emerald-800 shadow-xs text-sm">
            <span className="flex items-center gap-2">
              <SvgIcon name="shield" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{warrantyNotice}</span>
            </span>
            <button type="button" onClick={() => setWarrantyNotice('')} aria-label="Đóng" className="p-1 hover:bg-emerald-100 rounded-lg cursor-pointer">
              <SvgIcon name="x" className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Điều hướng & thao tác */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <nav className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/" className="hover:text-brand-blue hover:underline font-medium">Trang chủ</Link>
            <span className="text-slate-300">/</span>
            <Link to="/tra-cuu" className="hover:text-brand-blue hover:underline font-medium">Tra cứu hồ sơ QR</Link>
            <span className="text-slate-300">/</span>
            <span className="text-brand-blue font-bold font-mono bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {ticketCode}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/tra-cuu"
              className="text-xs font-semibold text-white bg-brand-blue hover:bg-brand-blue-hover px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <SvgIcon name="search" className="w-3.5 h-3.5" />
              <ResponsiveText mobile="Tra mã khác" desktop="Tra cứu mã khác" />
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <SvgIcon name="printer" className="w-3.5 h-3.5 text-slate-600" />
              <ResponsiveText mobile="In phiếu" desktop="In phiếu QR điện tử" />
            </button>
          </div>
        </div>

        {/* Thẻ thông tin phiếu */}
        <div className="rounded-xl bg-brand-blue text-white p-5 md:p-7 shadow-sm border border-blue-800/30 mb-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`}></span>
                  {statusInfo.label}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white/90 text-xs border border-white/15">
                  <SvgIcon name="building" className="w-3.5 h-3.5" />
                  <span>TT CSKH 615 Âu Cơ</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-2.5 mb-4">
                <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
                  {deviceTitle}
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white/15 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold text-amber-300 border border-white/20">
                    #{ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketCode}
                    className="bg-white/10 hover:bg-white/25 text-white text-xs font-semibold px-2.5 py-0.5 rounded-lg border border-white/15 transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <SvgIcon name={copiedCode ? 'check' : 'copy'} className="w-3 h-3" />
                    <span>{copiedCode ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Thông tin khách hàng và thiết bị */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Khách hàng</p>
                  <p className="text-xs font-bold text-white truncate mt-0.5">{ticket.ho_ten || 'Khách hàng'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Số điện thoại</p>
                  <p className="text-xs font-bold font-mono text-white mt-0.5">{ticket.so_dien_thoai || 'Bảo mật'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Mã Serial / S/N</p>
                  <p className="text-xs font-bold font-mono text-white truncate mt-0.5">
                    {ticket.so_imei_serial || 'Tại quầy'}
                  </p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 border border-white/15">
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Ngày tiếp nhận</p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {ticket.ngay_tao ? new Date(ticket.ngay_tao).toLocaleDateString('vi-VN') : 'Hôm nay'}
                  </p>
                </div>
              </div>
            </div>

            {ticketQr && (
              <div className="bg-white text-slate-800 p-3 rounded-xl shadow-sm text-center shrink-0 border border-slate-200 w-36">
                <img src={ticketQr} alt={`QR phiếu ${ticketCode}`} className="w-24 h-24 mx-auto rounded-lg" />
                <p className="text-[11px] font-extrabold text-brand-blue mt-1 uppercase">Mã QR Hồ Sơ</p>
                <p className="text-[9px] text-slate-400">Xuất trình tại quầy 615 Âu Cơ</p>
              </div>
            )}
          </div>
        </div>

        {/* Các tab chi tiết */}
        <div className="flex bg-white rounded-xl p-1 sm:p-1.5 border border-slate-200 shadow-xs mb-4 sm:mb-5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-lg font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SvgIcon name="compass" className="w-4 h-4" />
            <ResponsiveText mobile="Tiến độ" desktop="Tiến Độ & Nhật Ký" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-lg font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SvgIcon name="credit-card" className="w-4 h-4" />
            <span>Thanh Toán</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('warranty')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-lg font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'warranty'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SvgIcon name="shield" className="w-4 h-4" />
            <ResponsiveText mobile="Bảo hành" desktop="Ảnh & Bảo Hành" />
          </button>
        </div>

        {/* NỘI DUNG THEO TABS */}
        {activeTab === 'status' && (
          <div className="space-y-5">
            {/* Thanh tiến trình 4 bước */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SvgIcon name="compass" className="w-4 h-4 text-brand-blue" />
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Tiến trình xử lý hồ sơ CSKH (Bước {currentStep + 1}/4)
                  </h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.lightBadge}`}>
                  {statusInfo.shortLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PROGRESS_STEPS.map((step, idx) => {
                  const isDone = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div
                      key={step.id}
                      className={`rounded-xl p-3 border transition-all text-center flex flex-col items-center justify-center ${
                        isCurrent
                          ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-200/60'
                          : isDone
                          ? 'bg-emerald-50/50 border-emerald-200/80'
                          : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-900'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <SvgIcon name={isDone ? 'check' : step.icon} className="w-4 h-4" />
                      </div>
                      <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-amber-900' : isDone ? 'text-emerald-900' : 'text-slate-600'}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nội dung yêu cầu */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                  <SvgIcon name="clipboard" className="w-4 h-4 text-brand-blue" />
                  <span>Yêu Cầu Hỗ Trợ Ban Đầu</span>
                </h3>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70">
                  <p className="text-xs font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                    {issueText}
                  </p>
                </div>
              </div>

              {/* Cam kết dịch vụ & Quyền lợi CSKH */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-800 mb-2.5 sm:mb-3 flex items-center gap-2">
                  <SvgIcon name="shield" className="w-4 h-4 text-emerald-600" />
                  <ResponsiveText mobile="Cam Kết Dịch Vụ" desktop="Cam Kết Dịch Vụ & Quyền Lợi CSKH" />
                </h3>
                <div className="bg-emerald-50/60 rounded-xl p-3 sm:p-3.5 border border-emerald-200/70 space-y-2 sm:space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-start gap-2">
                    <SvgIcon name="check" className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      <ResponsiveText
                        mobile={<><strong>Minh bạch chi phí:</strong> Báo giá trước khi sửa, miễn phí kiểm tra.</>}
                        desktop={<><strong>Minh bạch chi phí:</strong> Báo giá rõ ràng trước khi sửa, miễn phí 100% công kiểm tra và tư vấn ban đầu.</>}
                      />
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <SvgIcon name="check" className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      <ResponsiveText
                        mobile={<><strong>Bảo mật dữ liệu:</strong> Giữ an toàn dữ liệu cá nhân.</>}
                        desktop={<><strong>Bảo mật dữ liệu:</strong> Giữ an toàn dữ liệu cá nhân trên thiết bị của khách hàng.</>}
                      />
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <SvgIcon name="check" className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      <ResponsiveText
                        mobile={<><strong>Bảo hành điện tử:</strong> Bảo hành QR 03 - 06 tháng.</>}
                        desktop={<><strong>Bảo hành điện tử:</strong> Cấp mã QR bảo hành từ 03 - 06 tháng để tra cứu khi cần.</>}
                      />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhật ký xử lý */}
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <SvgIcon name="clock" className="w-4 h-4 text-brand-blue" />
                  <span>Nhật Ký Xử Lý Hồ Sơ</span>
                </h3>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  Cập nhật tự động
                </span>
              </div>

              {ticket.nhat_ky && ticket.nhat_ky.length > 0 ? (
                <div className="relative pl-5 border-l-2 border-blue-200 space-y-4 ml-1">
                  {ticket.nhat_ky.map((log, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                            isLatest ? 'bg-brand-orange ring-2 ring-orange-100' : 'bg-brand-blue'
                          }`}
                        ></div>
                        <div className={`rounded-xl p-3 border ${isLatest ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/70 border-slate-200/70'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 uppercase">
                              {formatLogStatusTitle(log.trang_thai_moi)}
                            </p>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(log.ngay_tao).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{log.ghi_chu || 'Tiếp nhận hồ sơ yêu cầu CSKH qua mã QR.'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center">
                  Hồ sơ vừa được khởi tạo, đang chờ Chuyên viên CSKH cập nhật nhật ký.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: THANH TOÁN VIETQR */}
        {activeTab === 'payment' && (
          <div>
            <PaymentMethodSelector
              ticketCode={ticketCode}
              customerName={ticket.ho_ten || 'Khách hàng'}
              defaultAmount={ticket.tien_sau_giam || ticket.tong_tien || ''}
              paymentStatus={ticket.trang_thai_thanh_toan}
              ticket={ticket}
            />
          </div>
        )}

        {/* TAB 3: ẢNH & BẢO HÀNH */}
        {activeTab === 'warranty' && (
          <div className="space-y-5">
            {/* Hình ảnh minh chứng */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-800 mb-2.5 sm:mb-3 flex items-center gap-2">
                <SvgIcon name="camera" className="w-4 h-4 text-brand-blue" />
                <ResponsiveText
                  mobile={`Ảnh Tiếp Nhận (${ticket.hinh_anh_ngoai_quan?.length || 0})`}
                  desktop={`Hình Ảnh Minh Chứng Lúc Tiếp Nhận (${ticket.hinh_anh_ngoai_quan?.length || 0} ảnh)`}
                />
              </h3>
              {ticket.hinh_anh_ngoai_quan && ticket.hinh_anh_ngoai_quan.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.hinh_anh_ngoai_quan.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPreviewImage(img.duong_dan_anh)}
                      className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition"
                    >
                      <img src={img.duong_dan_anh} alt={img.ghi_chu || 'Ảnh'} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-dashed border-slate-300 p-3.5 sm:p-4 text-center text-xs text-slate-500">
                  <ResponsiveText
                    mobile="Chưa có ảnh hiện trạng đính kèm."
                    desktop="Chưa có ảnh ngoại quan đính kèm. Lễ tân sẽ cập nhật ảnh khi tiếp nhận tại quầy 615 Âu Cơ."
                  />
                </div>
              )}
            </div>

            {/* Sổ bảo hành điện tử */}
            <div className="p-4 sm:p-5 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <SvgIcon name="shield" className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    <ResponsiveText mobile="Bảo Hành Điện Tử" desktop="Sổ Bảo Hành Điện Tử" />
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ticket.bao_hanh?.con_han ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {ticket.bao_hanh?.trang_thai_text || 'Chờ kích hoạt'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ticket.bao_hanh?.con_han ? (
                  <ResponsiveText
                    mobile={`Còn hạn bảo hành (${ticket.bao_hanh.so_ngay_con_lai} ngày).`}
                    desktop={`Hồ sơ đang trong thời hạn bảo hành tiêu chuẩn (còn ${ticket.bao_hanh.so_ngay_con_lai} ngày).`}
                  />
                ) : (
                  <ResponsiveText
                    mobile="Tự động kích hoạt bảo hành 06 tháng sau khi bàn giao máy."
                    desktop="Sổ bảo hành điện tử 06 tháng sẽ tự động kích hoạt ngay sau khi hoàn tất sửa chữa và bàn giao máy."
                  />
                )}
              </p>
              {ticket.bao_hanh?.con_han && (
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(true)}
                  className="mt-3 w-full py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold rounded-xl text-xs transition cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <SvgIcon name="shield" className="w-4 h-4" />
                  <span>Gửi Yêu Cầu Hỗ Trợ Bảo Hành →</span>
                </button>
              )}
            </div>

            {/* Đánh giá dịch vụ nếu đã hoàn tất */}
            {(ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || ticket.trang_thai === 'ĐÃ_SỬA_XONG') && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h4 className="text-sm font-extrabold text-brand-blue mb-1 flex items-center gap-1.5">
                  <SvgIcon name="star" className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Đánh giá chất lượng phục vụ CSKH</span>
                </h4>
                {ticket.da_danh_gia ? (
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                    <SvgIcon name="check" className="w-3.5 h-3.5" />
                    <span>{reviewMessage || 'Đã ghi nhận đánh giá của bạn. Cảm ơn quý khách.'}</span>
                  </p>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3 mt-3">
                    {reviewError && (
                      <p className="text-xs text-red-600 font-semibold bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-1.5">
                        <SvgIcon name="alert" className="w-3.5 h-3.5 shrink-0" />
                        <span>{reviewError}</span>
                      </p>
                    )}
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-1 cursor-pointer transition ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                          aria-label={`${star} sao`}
                        >
                          <SvgIcon name="star" className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value)}
                      placeholder="Ý kiến đóng góp của bạn..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-brand-blue"
                    />
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {reviewLoading ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Yêu cầu hỗ trợ bảo hành lại */}
        {showWarrantyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <SvgIcon name="shield" className="w-5 h-5 text-brand-blue" />
                  <span>Gửi Yêu Cầu Hỗ Trợ Bảo Hành</span>
                </h3>
                <button onClick={() => setShowWarrantyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                  <SvgIcon name="x" className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Nếu bạn cần hỗ trợ bảo hành trong thời hạn quy định, vui lòng nhập nội dung bên dưới. Bộ phận CSKH tại <strong>615 Âu Cơ</strong> sẽ liên hệ hỗ trợ.
              </p>
              <form onSubmit={handleClaimWarranty} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung cần hỗ trợ bảo hành *</label>
                  <textarea
                    required
                    rows="4"
                    value={warrantyReason}
                    onChange={e => setWarrantyReason(e.target.value)}
                    placeholder="Mô tả chi tiết yêu cầu cần bộ phận bảo hành & CSKH hỗ trợ..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-emerald-600 outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={warrantyLoading}
                    className="flex-1 py-2.5 bg-brand-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60"
                  >
                    {warrantyLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Phóng to ảnh minh chứng */}
        {selectedPreviewImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPreviewImage(null)}>
            <div className="relative max-w-3xl max-h-[90vh]">
              <img src={selectedPreviewImage} alt="Ảnh phóng to" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl" />
              <button
                onClick={() => setSelectedPreviewImage(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-black"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* Khung in phiếu tiếp nhận */}
        <div id="printable-ticket" className="hidden print:block text-black bg-white p-6 font-sans">
          {/* Tiêu đề công ty */}
          <div className="text-center pb-3 border-b-2 border-black">
            <h2 className="text-base font-extrabold uppercase tracking-wide">CÔNG TY CỔ PHẦN LỤC GIÁC</h2>
            <p className="text-xs font-semibold">TRUNG TÂM DỊCH VỤ VÀ CHĂM SÓC KHÁCH HÀNG (CSKH)</p>
            <p className="text-[11px] text-gray-600">Đ/C: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú, TP.HCM • Hotline: (028) 3860 4999</p>
          </div>

          <div className="text-center my-3">
            <h1 className="text-base font-black uppercase">PHIẾU TIẾP NHẬN &amp; THEO DÕI CSKH QUA MÃ QR</h1>
            <p className="text-sm font-mono font-bold mt-0.5">Mã tra cứu: #{ticketCode}</p>
          </div>

          {/* Bảng thông tin */}
          <div className="border border-black rounded-lg p-3 my-2 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Khách hàng: <strong>{ticket.ho_ten || 'Khách hàng'}</strong></span>
              <span>SĐT: <strong className="font-mono">{ticket.so_dien_thoai || 'N/A'}</strong></span>
            </div>
            <div className="flex justify-between">
              <span>Thiết bị: <strong>{deviceTitle}</strong></span>
              <span>Số Serial / S/N: <strong className="font-mono">{ticket.so_imei_serial || 'N/A'}</strong></span>
            </div>
            <div>
              <span>Nội dung yêu cầu / Lỗi: <strong>{issueText}</strong></span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dashed border-gray-400">
              <span>Trạng thái: <strong>{statusInfo.label}</strong></span>
              <span>Ngày tiếp nhận: <strong>{ticket.ngay_tao ? new Date(ticket.ngay_tao).toLocaleString('vi-VN') : 'Hôm nay'}</strong></span>
            </div>
          </div>

          {/* Mã QR tra cứu */}
          {ticketQr && (
            <div className="text-center my-3">
              <img src={ticketQr} alt="QR Tra cứu" className="w-28 h-28 mx-auto" />
              <p className="text-[10px] text-gray-600 mt-1">Quét mã QR bằng điện thoại để tra cứu tiến độ và sổ bảo hành</p>
            </div>
          )}

          {/* Cam kết & Chữ ký */}
          <div className="grid grid-cols-2 text-center text-xs mt-4 pt-3 border-t border-black">
            <div>
              <p className="font-bold uppercase">Khách hàng</p>
              <p className="text-[10px] italic text-gray-500">(Ký và ghi rõ họ tên)</p>
              <div className="h-12"></div>
              <p className="font-semibold">{ticket.ho_ten || ''}</p>
            </div>
            <div>
              <p className="font-bold uppercase">Đại diện CSKH Lục Giác</p>
              <p className="text-[10px] italic text-gray-500">(Ký và xác nhận)</p>
              <div className="h-12"></div>
              <p className="font-semibold">Trung Tâm CSKH 615 Âu Cơ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tracking;

