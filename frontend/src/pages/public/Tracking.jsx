import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';

const PROGRESS_STEPS = [
  { id: 'TIEP_NHAN', label: 'Tiếp nhận máy', desc: 'Tạo hồ sơ & kiểm ngoại quan', icon: '📝' },
  { id: 'CHAN_DOAN', label: 'Chẩn đoán lỗi', desc: 'KTV kiểm tra chuyên sâu', icon: '🔍' },
  { id: 'BAO_GIA', label: 'Báo giá & Duyệt', desc: 'Minh bạch chi phí trước sửa', icon: '💬' },
  { id: 'DANG_SUA', label: 'Tiến hành sửa', desc: 'Thay thế & xử lý kỹ thuật', icon: '🔧' },
  { id: 'HOAN_TAT', label: 'Hoàn tất & Bảo hành', desc: 'Bàn giao & kích hoạt e-Warranty', icon: '✅' }
];

const STATUS_META = {
  CHỜ_KHÁM: {
    label: 'Đang chờ Kỹ thuật viên kiểm tra',
    shortLabel: 'CHỜ KHÁM',
    badgeClass: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
    dotClass: 'bg-amber-400',
    lightBadge: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  ĐANG_KIỂM_TRA: {
    label: 'Kỹ thuật viên đang kiểm tra máy',
    shortLabel: 'ĐANG KIỂM TRA',
    badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
    dotClass: 'bg-sky-400',
    lightBadge: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  ĐANG_CHUẨN_ĐOÁN: {
    label: 'Đang chẩn đoán kỹ thuật chuyên sâu',
    shortLabel: 'ĐANG CHẨN ĐOÁN',
    badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
    dotClass: 'bg-sky-400',
    lightBadge: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  CHỜ_KHÁCH_CHỐT_GIÁ: {
    label: 'Chờ bạn xác nhận báo giá sửa chữa',
    shortLabel: 'CHỜ CHỐT GIÁ',
    badgeClass: 'bg-orange-400/25 text-orange-200 border-orange-300/50',
    dotClass: 'bg-orange-400',
    lightBadge: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  ĐANG_SỬA: {
    label: 'Kỹ thuật viên đang tiến hành sửa chữa',
    shortLabel: 'ĐANG SỬA CHỮA',
    badgeClass: 'bg-indigo-400/25 text-indigo-100 border-indigo-300/40',
    dotClass: 'bg-indigo-300',
    lightBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  ĐÃ_SỬA_XONG: {
    label: 'Đã sửa xong • Sẵn sàng bàn giao máy',
    shortLabel: 'ĐÃ SỬA XONG',
    badgeClass: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40',
    dotClass: 'bg-emerald-400',
    lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN: {
    label: 'Đã hoàn tất bàn giao & Kích hoạt bảo hành',
    shortLabel: 'ĐÃ BÀN GIAO',
    badgeClass: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40',
    dotClass: 'bg-emerald-400',
    lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  KHÁCH_TỪ_CHỐI_SỬA: {
    label: 'Đã hủy sửa chữa theo yêu cầu khách hàng',
    shortLabel: 'ĐÃ HỦY SỬA',
    badgeClass: 'bg-rose-400/25 text-rose-200 border-rose-300/40',
    dotClass: 'bg-rose-400',
    lightBadge: 'bg-rose-50 text-rose-800 border-rose-200'
  }
};

function getStepIndex(status) {
  if (status === 'ĐÃ_SỬA_XONG' || status === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN') return 4;
  if (status === 'ĐANG_SỬA') return 3;
  if (status === 'CHỜ_KHÁCH_CHỐT_GIÁ') return 2;
  if (status === 'ĐANG_CHUẨN_ĐOÁN' || status === 'ĐANG_KIỂM_TRA') return 1;
  return 0;
}

function cleanIssueDescription(rawText) {
  if (typeof rawText !== 'string') return 'Chưa có mô tả chi tiết';
  const cleaned = rawText
    .replace(/^Gói phần mềm yêu cầu:\s*.+$/gm, '')
    .replace(/^\[ƯU ĐÃI SINH VIÊN -15%\]:.*$/gm, '')
    .trim();
  return cleaned || 'Kiểm tra tổng quát và cài đặt theo yêu cầu';
}

function formatLogStatusTitle(rawStatus) {
  if (!rawStatus) return 'Cập nhật hồ sơ';
  if (rawStatus === 'CẬP_NHẬT') return 'Tiếp nhận hồ sơ thiết bị';
  return STATUS_META[rawStatus]?.label || rawStatus.replace(/_/g, ' ');
}

function Tracking() {
  const { ticketCode } = useParams();
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
  const [showVietQr, setShowVietQr] = useState(false);
  const [ticketQr, setTicketQr] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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
        if (active) setError(err.response?.data?.message || 'Không tìm thấy thông tin phiếu.');
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
            setStatusNotice(`Phiếu của bạn vừa chuyển sang trạng thái: ${updatedTicket.trang_thai.replace(/_/g, ' ')}`);
          }
          return updatedTicket;
        });
      } catch (refreshError) {
        if (active) console.error('Không thể kiểm tra cập nhật phiếu:', refreshError);
      }
    };

    const intervalId = window.setInterval(refreshTicketStatus, 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [fetchTicket]);

  const handleApproveQuote = async (isApproved) => {
    try {
      setLoading(true);
      const response = await api.post(`/public/track/${ticketCode}/approve-quote`, { isApproved });
      if (response.data.success) {
        setStatusNotice(
          isApproved
            ? '✅ Cảm ơn bạn đã đồng ý báo giá! Kỹ thuật viên đang tiến hành sửa chữa.'
            : 'ℹ️ Bạn đã từ chối báo giá. Hệ thống đã hoàn trả linh kiện và hủy sửa chữa.'
        );
        try {
          const ticketResponse = await fetchTicket();
          if (ticketResponse.data.success) setTicket(ticketResponse.data.data);
        } catch (refreshError) {
          console.error('Không tải lại được thông tin phiếu sau khi xác nhận báo giá:', refreshError);
        }
      }
    } catch (err) {
      setStatusNotice(`❌ ${err.response?.data?.message || 'Có lỗi xảy ra.'}`);
    } finally {
      setLoading(false);
    }
  };

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
      setReviewMessage(response.data.message || 'Cảm ơn bạn đã đánh giá!');
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
      setWarrantyNotice(res.data.message || 'Đã gửi yêu cầu bảo hành lại thành công!');
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
        <p className="text-slate-600 font-semibold">Đang tải hồ sơ sửa chữa điện tử...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg border border-red-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hồ sơ phiếu</h2>
        <p className="text-sm text-red-600 font-medium mb-6">{error}</p>
        <Link to="/tra-cuu" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-800 transition">
          ← Quay lại trang Tra cứu
        </Link>
      </div>
    );
  }

  if (!ticket) return null;

  const deviceTitle = ticket.ten_thiet_bi || ticket.ten_may || 'Thiết bị công nghệ';
  const currentStep = getStepIndex(ticket.trang_thai);
  const statusInfo = STATUS_META[ticket.trang_thai] || {
    label: ticket.trang_thai.replace(/_/g, ' '),
    shortLabel: ticket.trang_thai.replace(/_/g, ' '),
    badgeClass: 'bg-white/20 text-white border-white/30',
    dotClass: 'bg-amber-400',
    lightBadge: 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const hasQuoteAmount = Number(ticket.tong_tien || 0) > 0;
  const finalAmount = Number(ticket.uu_dai_sinh_vien?.tien_sau_giam || ticket.tong_tien || 0);
  const cleanedIssue = cleanIssueDescription(ticket.mo_ta_loi || ticket.tinh_trang_may);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-6">
      <div className="max-w-5xl mx-auto px-4">
        {/* Thông báo trạng thái Realtime */}
        {statusNotice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 font-semibold text-emerald-800 shadow-sm">
            <span>{statusNotice}</span>
            <button type="button" onClick={() => setStatusNotice('')} aria-label="Đóng thông báo" className="text-xl leading-none px-2 hover:bg-emerald-100 rounded-lg">×</button>
          </div>
        )}
        {warrantyNotice && (
          <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 font-semibold text-emerald-800 shadow-sm">
            <span>🛡️ {warrantyNotice}</span>
            <button type="button" onClick={() => setWarrantyNotice('')} aria-label="Đóng" className="text-xl leading-none px-2 hover:bg-emerald-100 rounded-lg">×</button>
          </div>
        )}

        {/* Thanh điều hướng & Thao tác nhanh */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <nav className="text-sm text-slate-500 flex items-center gap-2">
            <Link to="/" className="hover:text-brand-blue hover:underline font-medium">Trang chủ</Link>
            <span className="text-slate-300">/</span>
            <Link to="/tra-cuu" className="hover:text-brand-blue hover:underline font-medium">Tra cứu tiến độ</Link>
            <span className="text-slate-300">/</span>
            <span className="text-brand-blue font-bold font-mono bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {ticketCode}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/tra-cuu"
              className="text-xs font-bold text-slate-600 hover:text-brand-blue bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
            >
              <span>🔍</span> Tra cứu mã khác
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs font-bold text-brand-blue hover:bg-blue-50 bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-xs transition flex items-center gap-1.5"
            >
              <span>🖨️</span> In phiếu điện tử
            </button>
          </div>
        </div>

        {/* SECTION 1: HERO BANNER HỒ SƠ PHIẾU ĐIỆN TỬ (FULL-WIDTH DIGITAL SERVICE PASS) */}
        <div className="rounded-3xl bg-gradient-to-r from-[#093666] via-[#0d4d8b] to-[#11634b] text-white p-6 md:p-8 shadow-xl relative overflow-hidden border border-blue-900/30 mb-6">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-20 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Khối thông tin chính bên trái */}
            <div className="flex-1 w-full">
              {/* Dòng Huy hiệu trạng thái & loại dịch vụ */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${statusInfo.dotClass}`}></span>
                  {statusInfo.label}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/95 font-semibold text-xs border border-white/15 backdrop-blur-md">
                  {ticket.loai_dich_vu === 'ONLINE' ? '💻 Cứu hộ Online từ xa' : '🏢 Tiếp nhận tại quầy 615 Âu Cơ'}
                </span>

                {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-100 font-bold text-xs border border-indigo-300/40">
                    🎓 Ưu đãi Sinh viên -15%
                  </span>
                )}
              </div>

              {/* Tên thiết bị & Mã phiếu */}
              <div className="flex flex-wrap items-baseline gap-3 mb-5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Thiết bị: {deviceTitle}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="bg-white/15 px-3 py-1 rounded-xl text-xs font-mono font-bold text-amber-300 border border-white/20">
                    #{ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketCode}
                    className="bg-white/10 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-xl border border-white/15 transition"
                  >
                    {copiedCode ? '✓ Đã sao chép' : '📋 Sao chép mã'}
                  </button>
                </div>
              </div>

              {/* Lưới 4 ô thông tin định danh (Không lặp lại ở cột dưới) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">👤 Khách hàng</p>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{ticket.ho_ten || 'Khách vãng lai'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">📞 Số điện thoại</p>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">{ticket.so_dien_thoai || 'Bảo mật'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">🔢 S/N • IMEI Máy</p>
                  <p className="text-sm font-bold font-mono text-white mt-0.5 truncate">
                    {ticket.so_imei_serial || 'Cập nhật tại quầy'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">📅 Ngày tiếp nhận</p>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {ticket.ngay_tao ? new Date(ticket.ngay_tao).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Hôm nay'}
                  </p>
                </div>
              </div>
            </div>

            {/* Khối Mã QR Nhận Máy bên phải */}
            {ticketQr && (
              <div className="bg-white text-slate-800 p-4 rounded-2xl shadow-xl text-center shrink-0 mx-auto lg:mx-0 border-2 border-white/80">
                <img src={ticketQr} alt={`QR phiếu ${ticketCode}`} className="w-28 h-28 mx-auto rounded-lg" />
                <p className="text-xs font-extrabold text-brand-blue mt-2 tracking-wide uppercase">QR Nhận Máy</p>
                <p className="text-[10px] text-slate-500 font-medium">Đưa mã này tại quầy 615 Âu Cơ</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: THANH LỘ TRÌNH 5 BƯỚC CHUẨN DOANH NGHIỆP (FULL-WIDTH STEPPER) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧭</span>
              <h2 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-wide">
                Tiến trình xử lý tiêu chuẩn (Bước {currentStep + 1}/5)
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.lightBadge}`}>
              Trạng thái: {statusInfo.shortLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
            {PROGRESS_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={step.id}
                  className={`rounded-2xl p-3.5 border transition-all flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 ${
                    isCurrent
                      ? 'bg-amber-50/90 border-amber-300 shadow-xs ring-2 ring-amber-200/60'
                      : isDone
                      ? 'bg-emerald-50/50 border-emerald-200/80'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-65'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-900 shadow-sm'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? '✓' : step.icon}
                  </div>
                  <div className="text-left sm:text-center">
                    <p className={`text-xs font-extrabold ${isCurrent ? 'text-amber-900' : isDone ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {idx + 1}. {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: BỐ CỤC 2 CỘT CHÍNH (7 CỘT TRÁI - 5 CỘT PHẢI) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI (7/12): THÔNG TIN YÊU CẦU, NHẬT KÝ XỬ LÝ & ẢNH NGOẠI QUAN */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Chi tiết Tình trạng & Yêu cầu dịch vụ */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <span>📋</span> Thông Tin Tình Trạng &amp; Yêu Cầu Dịch Vụ
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mô tả tình trạng ban đầu của khách hàng
                  </p>
                  <p className="text-sm font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                    {cleanedIssue}
                  </p>
                </div>

                {ticket.goi_phan_mem?.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/70">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Gói dịch vụ phần mềm đính kèm
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.goi_phan_mem.map((pkg, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-brand-blue border border-blue-200 text-xs font-bold"
                        >
                          <span>💿</span> {pkg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Thẻ Xác Thực Ưu đãi Học sinh - Sinh viên (-15%) */}
              {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
                <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50/90 via-blue-50/90 to-emerald-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider">
                        🎓 Ưu đãi Sinh viên Toàn quốc (-15%)
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 pt-0.5">
                      {ticket.uu_dai_sinh_vien.truong_hoc || 'Đã xác thực thẻ Sinh viên'}
                    </p>
                    <p className="text-xs text-slate-600">
                      Mã số sinh viên (MSSV): <strong className="font-mono text-indigo-900">{ticket.uu_dai_sinh_vien.ma_sinh_vien || 'Đã đối chiếu'}</strong>
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                      ✓ Tự động giảm 15% tổng hóa đơn
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Nhật ký Xử lý Thời gian thực (Live Timeline) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>🕒</span> Nhật Ký Xử Lý Thời Gian Thực
                </h3>
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Cập nhật tự động
                </span>
              </div>

              {ticket.nhat_ky && ticket.nhat_ky.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-blue-200 space-y-5 ml-2">
                  {ticket.nhat_ky.map((log, idx) => {
                    const isLatest = idx === 0;
                    const logNote =
                      log.ghi_chu ||
                      (log.trang_thai_moi === 'CHỜ_KHÁM' || log.trang_thai_moi === 'CẬP_NHẬT'
                        ? 'Khách hàng vừa tạo yêu cầu tiếp nhận thiết bị qua hệ thống QR.'
                        : 'Cập nhật tiến độ xử lý kỹ thuật tại trung tâm 615 Âu Cơ.');
                    return (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                            isLatest ? 'bg-brand-orange ring-4 ring-orange-100' : 'bg-brand-blue'
                          }`}
                        ></div>
                        <div className={`rounded-2xl p-3.5 border ${isLatest ? 'bg-blue-50/50 border-blue-200' : 'bg-slate-50/70 border-slate-200/70'}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                              {formatLogStatusTitle(log.trang_thai_moi)}
                            </p>
                            <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/80">
                              {new Date(log.ngay_tao).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{logNote}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl text-center">
                  Phiếu vừa được khởi tạo, đang chờ Kỹ thuật viên cập nhật nhật ký đầu tiên.
                </p>
              )}
            </div>

            {/* Card 3: Biên bản Ảnh Ngoại quan Lúc Nhận Máy */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>📸</span> Biên Bản Ảnh Ngoại Quan Lúc Nhận Máy
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lưu trữ tình trạng vỏ máy, màn hình &amp; tem niêm phong minh bạch 100%
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold border border-slate-200">
                  {ticket.hinh_anh_ngoai_quan?.length || 0} ảnh
                </span>
              </div>

              {ticket.hinh_anh_ngoai_quan && ticket.hinh_anh_ngoai_quan.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {ticket.hinh_anh_ngoai_quan.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPreviewImage(img.duong_dan_anh)}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={img.duong_dan_anh}
                        alt={img.ghi_chu || 'Ảnh ngoại quan'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent p-3 flex items-end justify-between">
                        <span className="text-xs text-white font-semibold line-clamp-1">
                          {img.ghi_chu || `Ảnh ngoại quan #${idx + 1}`}
                        </span>
                        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-xs shrink-0">
                          🔍 Phóng to
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-dashed border-slate-300 p-5 text-center">
                  <p className="text-xs font-semibold text-slate-600">
                    📷 Chưa có ảnh ngoại quan đính kèm lúc tạo phiếu trực tuyến
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Khi bạn bàn giao thiết bị tại quầy <strong>615 Âu Cơ</strong>, Lễ tân sẽ chụp ảnh 4 góc máy và cập nhật trực tiếp lên hồ sơ này.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (5/12): BẢNG KÊ CHI PHÍ, DUYỆT GIÁ, LINH KIỆN SERIAL & BẢO HÀNH E-WARRANTY */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Bảng kê Chi phí & Xác nhận Báo giá */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>💳</span> Bảng Kê Chi Phí &amp; Báo Giá
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.lightBadge}`}>
                  {statusInfo.shortLabel}
                </span>
              </div>

              {hasQuoteAmount ? (
                <div className="space-y-3">
                  <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Chi phí dịch vụ &amp; linh kiện:</span>
                      <span className={ticket.uu_dai_sinh_vien?.la_sinh_vien ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-800'}>
                        {Number(ticket.tong_tien).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
                      <div className="flex justify-between text-sm font-bold text-emerald-700">
                        <span>🎓 Trợ giá Sinh viên (-15%):</span>
                        <span>-{Number(ticket.uu_dai_sinh_vien.so_tien_giam).toLocaleString('vi-VN')} ₫</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-orange-200/80 flex justify-between items-baseline">
                      <span className="font-extrabold text-slate-800 text-sm uppercase">Tổng thanh toán:</span>
                      <span className="text-2xl md:text-3xl font-black text-brand-orange">
                        {finalAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    <p className="text-emerald-700 text-xs font-bold flex items-center gap-1 pt-1">
                      ✓ Tích lũy +{Math.floor(finalAmount / 10000)} điểm thành viên HungHau IT
                    </p>
                  </div>

                  {/* Nút Phê duyệt Báo giá khi đang ở trạng thái CHỜ_KHÁCH_CHỐT_GIÁ */}
                  {ticket.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ' && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                      <p className="text-xs font-bold text-amber-900">
                        ⚡ Kỹ thuật viên đã gửi báo giá chi tiết. Vui lòng xác nhận để trung tâm tiến hành sửa chữa:
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleApproveQuote(true)}
                          disabled={loading}
                          className="flex-1 py-3.5 bg-brand-orange hover:bg-orange-500 text-white font-extrabold rounded-xl transition-all shadow-md shadow-orange-500/20 text-sm uppercase"
                        >
                          ✓ Đồng Ý Sửa Ngay
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveQuote(false)}
                          disabled={loading}
                          className="px-4 py-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl transition-all text-xs uppercase"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nút bật/tắt mã VietQR chuyển khoản ngân hàng */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowVietQr(prev => !prev)}
                      className="w-full py-3 px-4 bg-blue-50/80 hover:bg-blue-100/80 text-brand-blue border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      <span>🏦</span>
                      {showVietQr ? 'Ẩn mã QR chuyển khoản ngân hàng (VietQR)' : 'Thanh toán chuyển khoản nhanh qua mã VietQR'}
                    </button>

                    {showVietQr && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-blue-200 text-center">
                        <p className="text-xs font-extrabold text-brand-blue uppercase tracking-wider mb-1">
                          Quét mã VietQR bằng mọi App Ngân hàng
                        </p>
                        <p className="text-[11px] text-slate-500 mb-3">
                          Tự động điền sẵn số tiền <strong>{finalAmount.toLocaleString('vi-VN')} ₫</strong> &amp; nội dung <code className="font-bold">TT {ticketCode}</code>
                        </p>
                        <img
                          src={`https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(`TT ${ticketCode}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`}
                          alt="Mã thanh toán VietQR"
                          className="mx-auto w-48 h-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs"
                        />
                        <div className="mt-3 text-[11px] text-slate-600 bg-white rounded-xl p-2.5 text-left space-y-1 border border-slate-200/80">
                          <div><strong>Ngân hàng:</strong> MB Bank (Quân Đội)</div>
                          <div><strong>Chủ tài khoản:</strong> HUNGHAU IT SUPPORT</div>
                          <div><strong>Nội dung CK:</strong> <code className="font-bold text-brand-blue">TT {ticketCode}</code></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <Link
                        to={`/thanh-toan/${ticketCode}`}
                        className="w-full py-3 px-4 bg-brand-blue hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-900/10 text-center"
                      >
                        <span>💳</span>
                        <span>Mở Cổng Thanh Toán &amp; Hóa Đơn Trực Tuyến</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Trạng thái khi chưa có báo giá (tong_tien === 0) - Thiết kế chuyên nghiệp, không để trống */
                <div className="rounded-2xl bg-gradient-to-b from-amber-50/80 to-slate-50 border border-amber-200/80 p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold">
                      ⏳
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">
                        Đang chờ Kỹ thuật viên kiểm tra &amp; lập báo giá
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Chi phí sửa chữa sẽ hiển thị chi tiết tại đây ngay sau khi Kỹ thuật viên chẩn đoán chính xác nguyên nhân lỗi.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-amber-200/60 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Miễn phí 100% công kiểm tra &amp; chẩn đoán lỗi ban đầu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Chỉ tiến hành sửa chữa khi bạn bấm <strong>Đồng Ý Báo Giá</strong></span>
                    </div>
                    {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
                      <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                        <span>🎓</span>
                        <span>Đã kích hoạt sẵn quyền lợi giảm 15% cho Sinh viên</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Linh kiện Thay thế Chính hãng (Serial Tracking) */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
                <span>🔧</span> Linh Kiện Thay Thế (Serial Tracking)
              </h3>

              {ticket.linh_kien && ticket.linh_kien.length > 0 ? (
                <div className="divide-y divide-slate-100 text-sm">
                  {ticket.linh_kien.map((item, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3">
                        {item.hinh_anh && (
                          <img
                            src={item.hinh_anh}
                            alt={item.ten_linh_kien}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-800">
                            {item.ten_linh_kien} <span className="text-xs text-slate-500 font-semibold">(x{item.so_luong})</span>
                          </div>
                          {item.so_serial && (
                            <div className="text-xs font-mono mt-1 flex items-center gap-1.5">
                              <span className="text-slate-400">Serial:</span>
                              <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded-md font-bold border border-blue-200">
                                {item.so_serial}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-800 shrink-0">
                        {(Number(item.don_gia) * Number(item.so_luong)).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-xs text-slate-500">
                  Hiện chưa có linh kiện phần cứng nào được xuất kho cho phiếu này. Mọi linh kiện thay thế (nếu có) sẽ được gắn mã <strong>Serial/S/N chính hãng</strong> tại đây để bảo hành điện tử.
                </div>
              )}
            </div>

            {/* Card 3: Sổ Bảo Hành Điện Tử (e-Warranty) */}
            {ticket.bao_hanh ? (
              <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white border border-emerald-200 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">Sổ Bảo Hành Điện Tử (e-Warranty)</h3>
                      <p className="text-xs text-slate-500">
                        Hạn bảo hành đến: <strong>{new Date(ticket.bao_hanh.han_bao_hanh).toLocaleDateString('vi-VN')}</strong>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.bao_hanh.con_han ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {ticket.bao_hanh.trang_thai_text}
                  </span>
                </div>
                <div className="w-full bg-emerald-100 rounded-full h-2.5 mb-2.5 overflow-hidden">
                  <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${ticket.bao_hanh.ti_le_con_lai}%` }}></div>
                </div>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  {ticket.bao_hanh.con_han
                    ? `Thiết bị đang trong thời hạn bảo hành kỹ thuật tiêu chuẩn tại 615 Âu Cơ (còn ${ticket.bao_hanh.so_ngay_con_lai} ngày).`
                    : 'Thiết bị đã kết thúc thời hạn bảo hành tiêu chuẩn.'}
                </p>
                {ticket.bao_hanh.con_han && (
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm uppercase tracking-wider"
                  >
                    🛡️ Yêu Cầu Bảo Hành Lại (Nếu Tái Phát Lỗi) →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="text-base font-extrabold text-slate-800">Chính Sách Bảo Hành Điện Tử</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sổ bảo hành điện tử (<strong>e-Warranty 3 - 6 tháng</strong>) sẽ tự động kích hoạt theo số Serial/SĐT ngay sau khi thiết bị hoàn tất sửa chữa và bàn giao cho bạn.
                </p>
              </div>
            )}

            {/* Card 4: Đánh giá dịch vụ (sau khi hoàn tất) */}
            {ticket.da_danh_gia ? (
              <div role="status" className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 text-center font-bold text-emerald-800 text-sm">
                🌟 Cảm ơn bạn! Hồ sơ sửa chữa này đã được ghi nhận đánh giá chất lượng.
              </div>
            ) : (
              ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-extrabold text-brand-blue">⭐ Đánh giá chất lượng dịch vụ</h2>
                  <p className="mt-1 text-xs text-slate-500">Chia sẻ trải nghiệm của bạn tại trung tâm 615 Âu Cơ.</p>

                  {reviewMessage ? (
                    <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                      {reviewMessage}
                    </p>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                      <fieldset>
                        <legend className="mb-2 text-xs font-bold text-slate-700 uppercase">Mức độ hài lòng</legend>
                        <div className="flex gap-2" role="radiogroup" aria-label="Chọn số sao đánh giá">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              role="radio"
                              aria-checked={rating === star}
                              aria-label={`${star} sao`}
                              onClick={() => setRating(star)}
                              className={`text-3xl transition-colors ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div>
                        <label htmlFor="review-text" className="mb-1 block text-xs font-bold text-slate-700">
                          Nhận xét của bạn (không bắt buộc)
                        </label>
                        <textarea
                          id="review-text"
                          value={reviewText}
                          onChange={event => setReviewText(event.target.value)}
                          maxLength={1000}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-xs"
                          placeholder="Bạn hài lòng với kỹ thuật viên và tốc độ xử lý chứ?"
                        />
                      </div>

                      {reviewError && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{reviewError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={reviewLoading}
                        className="w-full rounded-xl bg-brand-blue px-5 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-60 text-xs uppercase tracking-wider"
                      >
                        {reviewLoading ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá Dịch Vụ'}
                      </button>
                    </form>
                  )}
                </section>
              )
            )}
          </div>
        </div>

        {/* Modal Yêu cầu bảo hành lại */}
        {showWarrantyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🛡️</span> Yêu Cầu Bảo Hành Lại
                </h3>
                <button onClick={() => setShowWarrantyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Nếu thiết bị của bạn bị tái phát lỗi trong thời gian bảo hành, hãy mô tả tình trạng. Lễ tân &amp; KTV tại <strong>615 Âu Cơ</strong> sẽ liên hệ xử lý ngay.
              </p>
              <form onSubmit={handleClaimWarranty} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả lỗi tái phát *</label>
                  <textarea
                    required
                    rows="4"
                    value={warrantyReason}
                    onChange={e => setWarrantyReason(e.target.value)}
                    placeholder="Ví dụ: Máy bị giật màn hình lại sau 3 ngày sử dụng..."
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
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {warrantyLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Phóng to ảnh ngoại quan */}
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
      </div>
    </div>
  );
}

export default Tracking;
