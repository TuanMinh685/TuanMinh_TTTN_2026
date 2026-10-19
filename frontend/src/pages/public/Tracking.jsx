import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import api from '../../services/api';

const PROGRESS_STEPS = [
  { id: 'TIEP_NHAN', label: 'Tiếp nhận', icon: '📝' },
  { id: 'CHAN_DOAN', label: 'Chẩn đoán', icon: '🔍' },
  { id: 'BAO_GIA', label: 'Báo giá', icon: '💬' },
  { id: 'DANG_SUA', label: 'Đang sửa', icon: '🔧' },
  { id: 'HOAN_TAT', label: 'Hoàn tất', icon: '✅' }
];

function getStepIndex(status) {
  if (status === 'ĐÃ_SỬA_XONG' || status === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN') return 4;
  if (status === 'ĐANG_SỬA') return 3;
  if (status === 'CHỜ_KHÁCH_CHỐT_GIÁ') return 2;
  if (status === 'ĐANG_CHUẨN_ĐOÁN' || status === 'ĐANG_KIỂM_TRA') return 1;
  return 0;
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
      width: 140,
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
            setStatusNotice(`Phiếu của bạn vừa chuyển sang trạng thái: ${updatedTicket.trang_thai}`);
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
        setStatusNotice(isApproved ? '✅ Cảm ơn bạn đã đồng ý báo giá! Kỹ thuật viên đang tiến hành sửa chữa.' : 'ℹ️ Bạn đã từ chối báo giá. Hệ thống đã hoàn trả linh kiện và hủy sửa chữa.');
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

  if (loading && !ticket) return <div className="text-center mt-20">Đang tải thông tin...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 font-bold">{error}</div>;
  if (!ticket) return null;

  const deviceTitle = ticket.ten_thiet_bi || ticket.ten_may || 'Thiết bị công nghệ';
  const currentStep = getStepIndex(ticket.trang_thai);

  // Render theo phong cách Điện Thoại Vui x Lục Giác
  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      {statusNotice && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-green-50 p-4 font-semibold text-green-800">
          <span>{statusNotice}</span>
          <button type="button" onClick={() => setStatusNotice('')} aria-label="Đóng thông báo" className="text-lg">×</button>
        </div>
      )}
      {warrantyNotice && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-4 font-semibold text-emerald-800 border border-emerald-200">
          <span>🛡️ {warrantyNotice}</span>
          <button type="button" onClick={() => setWarrantyNotice('')} aria-label="Đóng" className="text-lg">×</button>
        </div>
      )}
      {/* Breadcrumb tương tác */}
      <div className="text-sm text-slate-500 mb-6 flex gap-2 items-center">
        <Link to="/" className="hover:text-brand-blue hover:underline">Trang chủ</Link>
        <span className="text-xs">▶</span> 
        <Link to="/tra-cuu" className="hover:text-brand-blue hover:underline">Tra cứu phiếu</Link>
        <span className="text-xs">▶</span> 
        <span className="text-brand-blue font-bold font-mono">{ticketCode}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cột trái: Thẻ Hồ Sơ Thiết Bị Điện Tử & Ảnh ngoại quan lúc tiếp nhận */}
        <div>
          {/* Thẻ Hồ Sơ Thiết Bị Điện Tử (Digital Service Pass) */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0b4b88] via-[#0d579d] to-[#136f47] text-white p-5 shadow-xl relative overflow-hidden border border-blue-800/40">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

            {/* Header Thẻ */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/15 text-xs">
              <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-blue-100">
                <span>🛡️</span>
                <span>HUNGHAU IT SUPPORT • 615 ÂU CƠ</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white font-semibold text-[11px] backdrop-blur-sm">
                {ticket.loai_dich_vu === 'ONLINE' ? '💻 Cứu hộ Online' : '🏢 Tiếp nhận tại quầy'}
              </span>
            </div>

            {/* Nội dung chính: Thông tin thiết bị + Mã QR Phiếu */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 space-y-2 text-left w-full">
                <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                  <span>💻 Hồ sơ thiết bị</span>
                </div>
                <h3 className="text-xl font-extrabold text-white leading-snug">
                  {deviceTitle}
                </h3>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="bg-white/15 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white border border-white/20">
                    Mã: {ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTicketCode}
                    className="bg-white/10 hover:bg-white/25 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg transition"
                  >
                    {copiedCode ? '✓ Đã sao chép' : '📋 Sao chép mã'}
                  </button>
                </div>

                <div className="pt-2 space-y-1 text-xs text-blue-100">
                  {ticket.so_imei_serial && (
                    <p>🔢 <strong>S/N / IMEI:</strong> <span className="font-mono text-white">{ticket.so_imei_serial}</span></p>
                  )}
                  {ticket.ho_ten && (
                    <p>👤 <strong>Khách hàng:</strong> <span className="text-white">{ticket.ho_ten}</span> ({ticket.so_dien_thoai})</p>
                  )}
                  {ticket.ngay_tao && (
                    <p>📅 <strong>Tiếp nhận:</strong> <span className="text-white">{new Date(ticket.ngay_tao).toLocaleString('vi-VN')}</span></p>
                  )}
                </div>
              </div>

              {/* Mã QR Nhận Máy */}
              {ticketQr && (
                <div className="bg-white p-2.5 rounded-xl shadow-lg text-center shrink-0">
                  <img src={ticketQr} alt={`QR phiếu ${ticketCode}`} className="w-24 h-24 mx-auto" />
                  <p className="text-[10px] font-bold text-slate-700 mt-1">QR Nhận Máy</p>
                </div>
              )}
            </div>

            {/* Thanh Lộ Trình 5 Bước Trực Quan (5-Step Live Stepper) */}
            <div className="mt-5 pt-4 border-t border-white/15">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-100 mb-2">
                <span>Lộ trình xử lý tiêu chuẩn</span>
                <span className="text-amber-300">Bước {currentStep + 1}/5</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {PROGRESS_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-300/40 scale-110'
                            : isDone
                            ? 'bg-emerald-400 text-slate-900'
                            : 'bg-white/15 text-white/60'
                        }`}
                      >
                        {isDone && !isCurrent ? '✓' : step.icon}
                      </div>
                      <span className={`text-[10px] leading-tight ${isCurrent ? 'font-extrabold text-amber-300' : isDone ? 'font-semibold text-white' : 'text-white/50'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 📸 Mục 4: Biên bản ảnh chụp ngoại quan lúc tiếp nhận (Chống khiếu nại) */}
          <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span>📸</span> Biên Bản Ảnh Ngoại Quan Lúc Nhận
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {ticket.hinh_anh_ngoai_quan?.length || 0} ảnh
              </span>
            </div>
            {ticket.hinh_anh_ngoai_quan && ticket.hinh_anh_ngoai_quan.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {ticket.hinh_anh_ngoai_quan.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedPreviewImage(img.duong_dan_anh)}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img src={img.duong_dan_anh} alt={img.ghi_chu || 'Ảnh ngoại quan'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                      <span className="text-[11px] text-white font-medium">{img.ghi_chu || 'Xem phóng to'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">
                Chưa có ảnh chụp ngoại quan đính kèm cho phiếu này.
              </p>
            )}
          </div>

          {/* Lịch sử xử lý */}
          {ticket.nhat_ky && ticket.nhat_ky.length > 0 && (
            <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-3">🕒 Tiến độ thực tế</h3>
              <div className="space-y-3">
                {ticket.nhat_ky.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-brand-blue mt-1 shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-700">{log.trang_thai_moi.replace(/_/g, ' ')}</p>
                      {log.ghi_chu && <p className="text-slate-500 mt-0.5">{log.ghi_chu}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.ngay_tao).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cột phải: Báo giá, Ưu đãi sinh viên, e-Warranty, Serial linh kiện */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            Sửa chữa {ticket.ten_thiet_bi || ticket.ten_may}
          </h1>
          {(ticket.ho_ten || ticket.so_dien_thoai) && (
            <p className="text-xs text-slate-500 mb-3">
              Khách hàng: <strong className="text-slate-700">{ticket.ho_ten}</strong> ({ticket.so_dien_thoai})
            </p>
          )}

          {/* 🎓 Mục 2: Khối thông tin Ưu đãi Sinh viên toàn quốc (-15%) */}
          {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
            <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-wider">
                  🎓 Ưu đãi Học sinh - Sinh viên (-15%)
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Đã áp dụng chiết khấu
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-2">{ticket.uu_dai_sinh_vien.truong_hoc}</p>
              <p className="text-xs text-slate-500">Mã sinh viên (MSSV): <strong>{ticket.uu_dai_sinh_vien.ma_sinh_vien || 'Đã xác thực'}</strong></p>
            </div>
          )}

          {/* Khối Báo giá & Chi phí */}
          <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 mb-6 relative">
            <div className="absolute top-0 right-0 bg-brand-orange text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              TRẠNG THÁI: {ticket.trang_thai.replace(/_/g, ' ')}
            </div>
            
            <p className="text-slate-600 text-sm mb-1">Mô tả ban đầu: <span className="font-semibold text-slate-800">{ticket.mo_ta_loi || ticket.tinh_trang_may}</span></p>
            {ticket.goi_phan_mem?.length > 0 && (
              <p className="mt-1 text-slate-600 text-sm">
                Gói phần mềm: <span className="font-semibold text-slate-800">{ticket.goi_phan_mem.join(', ')}</span>
              </p>
            )}
            
            {Number(ticket.tong_tien || 0) > 0 && (
              <div className="mt-4 pt-3 border-t border-orange-200/70">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Chi phí ban đầu:</span>
                  <span className={ticket.uu_dai_sinh_vien?.la_sinh_vien ? 'line-through text-slate-400' : 'font-semibold text-slate-700'}>
                    {Number(ticket.tong_tien).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {ticket.uu_dai_sinh_vien?.la_sinh_vien && (
                  <div className="flex justify-between text-sm font-semibold text-emerald-700 mb-1">
                    <span>🎓 Trợ giá Sinh viên (-15%):</span>
                    <span>-{Number(ticket.uu_dai_sinh_vien.so_tien_giam).toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline mt-2">
                  <span className="font-bold text-slate-800 text-base">Tổng thanh toán:</span>
                  <span className="text-3xl font-extrabold text-brand-orange">
                    {Number(ticket.uu_dai_sinh_vien?.tien_sau_giam || ticket.tong_tien).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <p className="text-emerald-700 text-xs font-semibold mt-1 flex items-center gap-1">
                  ✓ Tích lũy +{Math.floor(Number(ticket.uu_dai_sinh_vien?.tien_sau_giam || ticket.tong_tien) / 10000)} điểm thành viên
                </p>

                <div className="mt-4 pt-3 border-t border-orange-200/70">
                  <button
                    type="button"
                    onClick={() => setShowVietQr(prev => !prev)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-blue-50 text-brand-blue border border-blue-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <span>💳</span>
                    {showVietQr ? 'Ẩn mã QR chuyển khoản ngân hàng (VietQR)' : 'Hiển thị QR Chuyển khoản Ngân hàng tự động (VietQR)'}
                  </button>

                  {showVietQr && (
                    <div className="mt-3 p-4 bg-white rounded-xl border border-blue-200 text-center shadow-sm">
                      <p className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-1">
                        Quét mã VietQR bằng mọi App Ngân hàng / MoMo
                      </p>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Tự động điền sẵn số tiền <strong>{Number(ticket.uu_dai_sinh_vien?.tien_sau_giam || ticket.tong_tien).toLocaleString('vi-VN')} ₫</strong> &amp; nội dung chuyển khoản
                      </p>
                      <img
                        src={`https://img.vietqr.io/image/MB-02838604999-compact2.png?amount=${Number(ticket.uu_dai_sinh_vien?.tien_sau_giam || ticket.tong_tien)}&addInfo=${encodeURIComponent(`TT ${ticketCode}`)}&accountName=${encodeURIComponent('HUNGHAU IT SUPPORT')}`}
                        alt="Mã thanh toán VietQR"
                        className="mx-auto w-52 h-auto rounded-lg border border-slate-200 p-1"
                      />
                      <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 text-left space-y-0.5">
                        <div><strong>Ngân hàng:</strong> MB Bank (Quân Đội)</div>
                        <div><strong>Chủ TK:</strong> HUNGHAU IT SUPPORT</div>
                        <div><strong>Nội dung CK:</strong> <code className="font-bold text-brand-blue">TT {ticketCode}</code></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🔧 Mục 6: Quản lý linh kiện theo Số Serial / IMEI (Serial Tracking) */}
          {ticket.linh_kien && ticket.linh_kien.length > 0 && (
            <div className="mb-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <span>🔧</span> Linh Kiện Thay Thế Chính Hãng (Serial Tracking)
              </h3>
              <div className="divide-y divide-slate-100 text-sm">
                {ticket.linh_kien.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-800">{item.ten_linh_kien} (x{item.so_luong})</div>
                      {item.so_serial && (
                        <div className="text-xs text-blue-700 font-mono mt-1 flex items-center gap-1">
                          <span className="text-slate-400">S/N:</span>
                          <span className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded font-bold border border-blue-200">
                            {item.so_serial}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-slate-700">
                      {(Number(item.don_gia) * Number(item.so_luong)).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🛡️ Mục 1: Sổ bảo hành điện tử (e-Warranty) */}
          {ticket.bao_hanh && (
            <div className="mb-6 p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-white border border-emerald-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">Sổ Bảo Hành Điện Tử (e-Warranty)</h3>
                    <p className="text-xs text-slate-500">Hạn bảo hành đến: {new Date(ticket.bao_hanh.han_bao_hanh).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket.bao_hanh.con_han ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                  {ticket.bao_hanh.trang_thai_text}
                </span>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${ticket.bao_hanh.ti_le_con_lai}%` }}></div>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                {ticket.bao_hanh.con_han 
                  ? `Thiết bị đang trong thời gian bảo hành kỹ thuật tiêu chuẩn tại 615 Âu Cơ (còn ${ticket.bao_hanh.so_ngay_con_lai} ngày).` 
                  : 'Thiết bị đã kết thúc thời hạn bảo hành tiêu chuẩn.'}
              </p>
              {ticket.bao_hanh.con_han && (
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(true)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Yêu Cầu Bảo Hành Lại (Nếu Tái Phát Lỗi) →
                </button>
              )}
            </div>
          )}

          {/* Nút Phê duyệt Báo giá */}
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
            <div className="w-full py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl text-center text-sm">
              Trạng thái hiện tại: <strong>{ticket.trang_thai.replace(/_/g, ' ')}</strong>
            </div>
          )}

          {/* Đánh giá dịch vụ */}
          {ticket.da_danh_gia ? (
            <p role="status" className="mt-6 rounded-xl bg-green-50 p-4 text-center font-semibold text-green-700">
              Cảm ơn bạn! Phiếu này đã được đánh giá.
            </p>
          ) : ticket.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN' && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-brand-blue">Đánh giá dịch vụ</h2>
              <p className="mt-1 text-sm text-slate-500">Chia sẻ trải nghiệm của bạn về lần sửa chữa này.</p>

              {reviewMessage ? (
                <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm font-semibold text-green-700">
                  {reviewMessage}
                </p>
              ) : (
                <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-slate-700">Mức hài lòng</legend>
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
                    <label htmlFor="review-text" className="mb-1 block text-sm font-semibold text-slate-700">
                      Nhận xét (không bắt buộc)
                    </label>
                    <textarea
                      id="review-text"
                      value={reviewText}
                      onChange={event => setReviewText(event.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-blue/50 text-sm"
                      placeholder="Bạn hài lòng với dịch vụ ở điểm nào?"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">{reviewText.length}/1000</p>
                  </div>

                  {reviewError && (
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{reviewError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full rounded-xl bg-brand-blue px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 text-sm uppercase"
                  >
                    {reviewLoading ? 'Đang gửi đánh giá...' : 'GỬI ĐÁNH GIÁ'}
                  </button>
                </form>
              )}
            </section>
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
              Nếu thiết bị của bạn bị tái phát lỗi trong thời gian bảo hành, hãy mô tả tình trạng. Lễ tân & KTV tại <strong>615 Âu Cơ</strong> sẽ liên hệ xử lý ngay.
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
  );
}

export default Tracking;
