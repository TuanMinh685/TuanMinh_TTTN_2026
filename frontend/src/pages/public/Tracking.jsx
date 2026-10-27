import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';

const PROGRESS_STEPS = [
  { id: 'TIEP_NHAN', label: 'Tiếp nhận yêu cầu', desc: 'Khởi tạo hồ sơ QR & lưu hiện trạng', icon: '📝' },
  { id: 'CHAN_DOAN', label: 'Kiểm tra & Phân loại', desc: 'Chuyên viên tiếp nhận & đánh giá', icon: '🔍' },
  { id: 'DANG_SUA', label: 'Đang xử lý hỗ trợ', desc: 'Thực hiện nghiệp vụ CSKH & hỗ trợ', icon: '🎧' },
  { id: 'HOAN_TAT', label: 'Hoàn tất & Hậu mãi', desc: 'Bàn giao, e-Warranty & Đánh giá sao', icon: '✅' }
];

const STATUS_META = {
  CHỜ_KHÁM: {
    label: 'Đang chờ Chuyên viên CSKH tiếp nhận',
    shortLabel: 'CHỜ TIẾP NHẬN',
    badgeClass: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
    dotClass: 'bg-amber-400',
    lightBadge: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  ĐANG_KIỂM_TRA: {
    label: 'Chuyên viên đang kiểm tra hồ sơ yêu cầu',
    shortLabel: 'ĐANG KIỂM TRA',
    badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
    dotClass: 'bg-sky-400',
    lightBadge: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  ĐANG_CHUẨN_ĐOÁN: {
    label: 'Đang kiểm tra & phân loại yêu cầu CSKH',
    shortLabel: 'ĐANG PHÂN LOẠI',
    badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
    dotClass: 'bg-sky-400',
    lightBadge: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  ĐANG_SỬA: {
    label: 'Chuyên viên đang xử lý yêu cầu hỗ trợ CSKH',
    shortLabel: 'ĐANG XỬ LÝ',
    badgeClass: 'bg-indigo-400/25 text-indigo-100 border-indigo-300/40',
    dotClass: 'bg-indigo-300',
    lightBadge: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  ĐÃ_SỬA_XONG: {
    label: 'Đã xử lý xong • Sẵn sàng bàn giao hồ sơ',
    shortLabel: 'ĐÃ XỬ LÝ XONG',
    badgeClass: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40',
    dotClass: 'bg-emerald-400',
    lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN: {
    label: 'Đã hoàn tất CSKH & Kích hoạt bảo hành điện tử',
    shortLabel: 'HOÀN TẤT CSKH',
    badgeClass: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/40',
    dotClass: 'bg-emerald-400',
    lightBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  YÊU_CẦU_BẢO_HÀNH: {
    label: 'Đang tiếp nhận yêu cầu hỗ trợ bảo hành (e-Warranty)',
    shortLabel: 'YÊU CẦU BẢO HÀNH',
    badgeClass: 'bg-rose-400/25 text-rose-200 border-rose-300/40',
    dotClass: 'bg-rose-400',
    lightBadge: 'bg-rose-50 text-rose-800 border-rose-200'
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
            setStatusNotice(`Hồ sơ của bạn vừa chuyển sang trạng thái: ${STATUS_META[updatedTicket.trang_thai]?.shortLabel || updatedTicket.trang_thai}`);
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
      <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl shadow-lg border border-red-100 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy hồ sơ phiếu CSKH</h2>
        <p className="text-sm text-red-600 font-medium mb-6">{error}</p>
        <Link to="/tra-cuu" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-800 transition">
          ← Quay lại trang Tra cứu QR
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
            <Link to="/tra-cuu" className="hover:text-brand-blue hover:underline font-medium">Tra cứu hồ sơ QR</Link>
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
              className="text-xs font-bold text-brand-blue hover:bg-blue-50 bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🖨️</span> In phiếu QR điện tử
            </button>
          </div>
        </div>

        {/* SECTION 1: HERO BANNER HỒ SƠ PHIẾU ĐIỆN TỬ CSKH */}
        <div className="rounded-3xl bg-gradient-to-r from-[#093666] via-[#0d4d8b] to-[#11634b] text-white p-6 md:p-8 shadow-xl relative overflow-hidden border border-blue-900/30 mb-6">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 -bottom-20 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${statusInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${statusInfo.dotClass}`}></span>
                  {statusInfo.label}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/95 font-semibold text-xs border border-white/15 backdrop-blur-md">
                  🏢 Trung tâm CSKH MYH Group (615 Âu Cơ)
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 mb-5">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                  Hồ sơ CSKH: {deviceTitle}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="bg-white/15 px-3 py-1 rounded-xl text-xs font-mono font-bold text-amber-300 border border-white/20">
                    #{ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketCode}
                    className="bg-white/10 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-xl border border-white/15 transition cursor-pointer"
                  >
                    {copiedCode ? '✓ Đã sao chép' : '📋 Sao chép mã'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">👤 Khách hàng</p>
                  <p className="text-sm font-bold text-white mt-0.5 truncate">{ticket.ho_ten || 'Khách hàng'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">📞 Số điện thoại</p>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">{ticket.so_dien_thoai || 'Bảo mật'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15">
                  <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">🔢 Mã Định Danh / S/N</p>
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

            {ticketQr && (
              <div className="bg-white text-slate-800 p-4 rounded-2xl shadow-xl text-center shrink-0 mx-auto lg:mx-0 border-2 border-white/80">
                <img src={ticketQr} alt={`QR phiếu ${ticketCode}`} className="w-28 h-28 mx-auto rounded-lg" />
                <p className="text-xs font-extrabold text-brand-blue mt-2 tracking-wide uppercase">Mã QR Hồ Sơ</p>
                <p className="text-[10px] text-slate-500 font-medium">Xuất trình tại quầy CSKH 615 Âu Cơ</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: THANH LỘ TRÌNH 4 BƯỚC CHĂM SÓC KHÁCH HÀNG */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧭</span>
              <h2 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-wide">
                Tiến trình xử lý hồ sơ CSKH (Bước {currentStep + 1}/4)
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.lightBadge}`}>
              Trạng thái: {statusInfo.shortLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
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

        {/* SECTION 3: BỐ CỤC 2 CỘT CHÍNH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CỘT TRÁI (7/12): THÔNG TIN YÊU CẦU, NHẬT KÝ XỬ LÝ & ẢNH MINH CHỨNG */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card 1: Nội dung Yêu cầu CSKH */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <span>📋</span> Nội Dung Yêu Cầu Chăm Sóc Khách Hàng
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mô tả yêu cầu hỗ trợ / phản hồi ban đầu của khách hàng
                  </p>
                  <p className="text-sm font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                    {issueText}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Nhật ký Xử lý Thời gian thực */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>🕒</span> Nhật Ký Xử Lý Hồ Sơ Thời Gian Thực
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
                        ? 'Khách hàng vừa khởi tạo hồ sơ yêu cầu CSKH qua hệ thống mã QR.'
                        : 'Cập nhật tiến độ xử lý hồ sơ tại Trung tâm CSKH 615 Âu Cơ.');
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
                  Hồ sơ vừa được khởi tạo, đang chờ Chuyên viên CSKH cập nhật nhật ký đầu tiên.
                </p>
              )}
            </div>

            {/* Card 3: Hình ảnh Minh chứng Hiện trạng Lúc Tiếp Nhận */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span>📸</span> Hình Ảnh Minh Chứng Hiện Trạng Lúc Tiếp Nhận
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lưu trữ hình ảnh sản phẩm, tem bảo hành &amp; biên nhận minh bạch 100%
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
                        alt={img.ghi_chu || 'Ảnh minh chứng'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent p-3 flex items-end justify-between">
                        <span className="text-xs text-white font-semibold line-clamp-1">
                          {img.ghi_chu || `Ảnh minh chứng #${idx + 1}`}
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
                    📷 Chưa có ảnh minh chứng đính kèm lúc tạo phiếu trực tuyến
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Khi tiếp nhận tại quầy <strong>615 Âu Cơ</strong>, nhân viên Lễ tân sẽ chụp ảnh hiện trạng và cập nhật trực tiếp lên hồ sơ QR này.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI (5/12): THÔNG TIN HỖ TRỢ CSKH, BẢO HÀNH E-WARRANTY & ĐÁNH GIÁ 5 SAO */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Thông tin Tiếp nhận & Cam kết Chăm sóc khách hàng */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <span>🎧</span> Thông Tin Hỗ Trợ CSKH
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusInfo.lightBadge}`}>
                  {statusInfo.shortLabel}
                </span>
              </div>

              <div className="rounded-2xl bg-gradient-to-b from-blue-50/80 to-slate-50 border border-blue-200/80 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center text-xl shrink-0 font-bold">
                    📷
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">
                      Hồ sơ Chăm sóc khách hàng định danh bằng Mã QR
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Mọi bước tiếp nhận, phân loại, xử lý hỗ trợ và kích hoạt bảo hành hậu mãi đều được cập nhật minh bạch theo thời gian thực trên mã QR này.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-blue-200/60 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Đơn vị tiếp nhận:</span>
                    <span className="font-bold text-slate-800">TT CSKH MYH Group (615 Âu Cơ)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kênh khởi tạo:</span>
                    <span className="font-bold text-brand-blue">Cổng Quét Mã QR Tự Phục Vụ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Hotline CSKH:</span>
                    <a href="tel:02838604999" className="font-bold text-brand-orange hover:underline">(028) 3860 4999</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Sổ Bảo Hành & Hậu Mãi Điện Tử (e-Warranty) */}
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
                    ? `Hồ sơ đang trong thời hạn bảo hành & chăm sóc hậu mãi tiêu chuẩn tại MYH Group (còn ${ticket.bao_hanh.so_ngay_con_lai} ngày).`
                    : 'Hồ sơ đã kết thúc thời hạn bảo hành tiêu chuẩn.'}
                </p>
                {ticket.bao_hanh.con_han && (
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm uppercase tracking-wider cursor-pointer"
                  >
                    🛡️ Gửi Yêu Cầu Hỗ Trợ Bảo Hành Qua QR →
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="text-base font-extrabold text-slate-800">Chính Sách Bảo Hành Điện Tử (e-Warranty)</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sổ bảo hành điện tử (<strong>e-Warranty 06 tháng</strong>) sẽ tự động kích hoạt trên mã QR này ngay sau khi bộ phận Chăm sóc khách hàng hoàn tất xử lý và bàn giao hồ sơ cho bạn.
                </p>
              </div>
            )}

            {/* Card 3: Đánh giá dịch vụ CSKH (sau khi hoàn tất) */}
            {ticket.da_danh_gia ? (
              <div role="status" className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 text-center font-bold text-emerald-800 text-sm">
                🌟 Cảm ơn bạn! Hồ sơ CSKH này đã được ghi nhận đánh giá chất lượng phục vụ.
              </div>
            ) : (
              (ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' || ticket.trang_thai === 'ĐÃ_SỬA_XONG') && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-extrabold text-brand-blue">⭐ Đánh giá chất lượng phục vụ CSKH</h2>
                  <p className="mt-1 text-xs text-slate-500">Chia sẻ mức độ hài lòng của bạn với bộ phận Chăm sóc khách hàng MYH Group.</p>

                  {reviewMessage ? (
                    <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
                      {reviewMessage}
                    </p>
                  ) : (
                    <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                      <fieldset>
                        <legend className="mb-2 text-xs font-bold text-slate-700 uppercase">Mức độ hài lòng (1 - 5 sao)</legend>
                        <div className="flex gap-2" role="radiogroup" aria-label="Chọn số sao đánh giá">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              role="radio"
                              aria-checked={rating === star}
                              aria-label={`${star} sao`}
                              onClick={() => setRating(star)}
                              className={`text-3xl transition-colors cursor-pointer ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </fieldset>

                      <div>
                        <label htmlFor="review-text" className="mb-1 block text-xs font-bold text-slate-700">
                          Ý kiến đóng góp của bạn (không bắt buộc)
                        </label>
                        <textarea
                          id="review-text"
                          value={reviewText}
                          onChange={event => setReviewText(event.target.value)}
                          maxLength={1000}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-xs"
                          placeholder="Bạn hài lòng với thái độ phục vụ và tốc độ xử lý hồ sơ QR chứ?"
                        />
                      </div>

                      {reviewError && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{reviewError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={reviewLoading}
                        className="w-full rounded-xl bg-brand-blue px-5 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-60 text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {reviewLoading ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá Dịch Vụ CSKH'}
                      </button>
                    </form>
                  )}
                </section>
              )
            )}
          </div>
        </div>

        {/* Modal Yêu cầu hỗ trợ bảo hành lại */}
        {showWarrantyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>🛡️</span> Gửi Yêu Cầu Hỗ Trợ Bảo Hành (e-Warranty)
                </h3>
                <button onClick={() => setShowWarrantyModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Nếu bạn cần hỗ trợ bảo hành hoặc chăm sóc hậu mãi trong thời hạn e-Warranty, vui lòng nhập nội dung bên dưới. Bộ phận CSKH tại <strong>615 Âu Cơ</strong> sẽ liên hệ xử lý ngay.
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
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
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
      </div>
    </div>
  );
}

export default Tracking;
