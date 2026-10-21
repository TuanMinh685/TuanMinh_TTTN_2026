import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/AdminNav';
import api from '../../services/api';

export default function ManagerDashboard() {
  const currentRole = localStorage.getItem('role') || 'LE_TAN';
  const isExecutive = currentRole === 'GIAM_DOC' || currentRole === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [lowStockParts, setLowStockParts] = useState([]);
  const [subordinateCount, setSubordinateCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get('/tickets'),
      api.get('/tickets/booking'),
      api.get('/tickets/parts'),
      api.get('/admin/employees')
    ])
      .then(([ticketsRes, bookingsRes, partsRes, employeesRes]) => {
        if (!ignore) {
          if (ticketsRes.data.success) setTickets(ticketsRes.data.data || []);
          if (bookingsRes.data.success) setBookings(bookingsRes.data.data || []);
          if (partsRes.data.success) {
            const parts = partsRes.data.data || [];
            setLowStockParts(parts.filter(p => Number(p.so_luong_ton || 0) <= 5));
          }
          if (employeesRes.data.success) setSubordinateCount(employeesRes.data.data?.length || 0);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err.response?.data?.message || 'Không thể tải dữ liệu điều hành cửa hàng.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Operational metrics
  const pendingIntake = tickets.filter(t => t.trang_thai === 'TIẾP_NHẬN' || t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN').length;
  const waitingApproval = tickets.filter(t => t.trang_thai === 'CHỜ_KHÁCH_CHỐT_GIÁ').length;
  const inRepair = tickets.filter(t => t.trang_thai === 'ĐANG_SỬA' || t.trang_thai === 'KHÁCH_ĐÃ_ĐỒNG_Ý').length;
  const pendingBookings = bookings.filter(b => b.trang_thai === 'CHỜ_XÁC_NHẬN' || b.trang_thai === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <AdminNav activeKey="QUAN_LY" />

      <div className="space-y-6">
        {/* Store Manager Banner */}
        <section className="rounded-2xl border border-slate-200 bg-brand-blue p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🏬</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  Cổng Điều Hành Vận Hành — Quản Lý Cửa Hàng
                </h2>
              </div>
              <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
                Trực tiếp điều phối ca làm việc, kiểm soát tiến độ sửa chữa quầy & kỹ thuật, xử lý lịch hẹn khách và quản lý phân quyền nhân sự cấp dưới (Level &lt; 80).
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Trụ sở: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú
                </span>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Tổng nhân lực cửa hàng: {subordinateCount} nhân sự
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                to="/admin/nhan-su"
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-blue-900 shadow-sm transition hover:bg-blue-50"
              >
                👥 Quản Lý Nhân Sự
              </Link>
              <Link
                to="/admin"
                className="rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-white/20"
              >
                📋 Mở Bàn Vận Hành
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {/* Operational Priority Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Đang Chuẩn Đoán & Tiếp Nhận</span>
              <span className="text-xl">🔍</span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-800">{pendingIntake}</p>
            <p className="mt-1 text-xs text-slate-500">Cần KTV hoàn tất chẩn đoán</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Chờ Khách Chốt Báo Giá</span>
              <span className="text-xl">⏳</span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-800">{waitingApproval}</p>
            <p className="mt-1 text-xs text-slate-500">Đã gửi báo giá qua cổng QR</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Đang Trong Quá Trình Sửa</span>
              <span className="text-xl">🔧</span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-800">{inRepair}</p>
            <p className="mt-1 text-xs text-slate-500">Khách đã duyệt tiến hành</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Lịch Hẹn Cần Duyệt Gấp</span>
              <span className="text-xl">📅</span>
            </div>
            <p className="mt-3 text-3xl font-black text-blue-900">{pendingBookings}</p>
            <p className="mt-1 text-xs text-slate-500">Khách đặt online chờ xếp ca</p>
          </div>
        </div>

        {/* Live Operational Feeds: Tickets & Stock Warnings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed 1: Ca Sửa Cần Điều Phối */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Tiến Độ Các Phiếu Sửa Chữa Mới Nhất
                </h3>
                <p className="text-xs text-slate-500">Giám sát trạng thái điều phối giữa Lễ tân và Kỹ thuật viên</p>
              </div>
              <Link to="/admin" className="text-xs font-bold text-brand-blue hover:underline">
                Xem tất cả ({tickets.length}) →
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">Đang tải dữ liệu...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Mã phiếu</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Thiết bị</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Chi phí</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.slice(0, 6).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-brand-blue">
                          {t.ma_tra_cuu}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {t.ho_ten}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {t.ten_may || 'Laptop / PC'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {t.trang_thai?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {Number(t.tong_tien || 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">Chưa có phiếu sửa chữa nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Feed 2: Cảnh Báo Tồn Kho Linh Kiện (Dành cho Quản lý đôn đốc thủ kho) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  Cảnh Báo Linh Kiện (Sắp Hết)
                </h3>
                <p className="text-xs text-slate-500">Mức tồn kho &le; 5 cần nhập gấp</p>
              </div>
              <span className="text-xl">⚠️</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-80">
              {lowStockParts.slice(0, 6).map(part => (
                <div key={part.id} className="rounded-xl border border-slate-200 bg-amber-50/50 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{part.ten_linh_kien}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mã: {part.ma_linh_kien} • Đơn giá: {Number(part.don_gia || 0).toLocaleString('vi-VN')} đ</p>
                  </div>
                  <span className="rounded-lg bg-red-100 border border-red-300 px-2.5 py-1 text-xs font-black text-red-700 shrink-0">
                    Còn {part.so_luong_ton} cái
                  </span>
                </div>
              ))}

              {lowStockParts.length === 0 && (
                <div className="py-12 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-xl">
                  ✅ Toàn bộ linh kiện đều đủ số lượng tồn kho an toàn!
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to="/admin"
                className="block text-center rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Quản lý kho linh kiện toàn diện →
              </Link>
            </div>
          </section>
        </div>

        {/* Manager Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/nhan-su"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-blue hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Đội Ngũ Cửa Hàng</p>
              <h4 className="text-base font-extrabold text-slate-800 mt-1">Phân Quyền Nhân Sự</h4>
              <p className="text-xs text-slate-500 mt-1">Cấp tài khoản & điều phối ca trực</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">👥 →</span>
          </Link>

          {isExecutive && (
            <Link
              to="/admin/giam-doc"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-blue hover:shadow-md transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Chiến Lược C-Level</p>
                <h4 className="text-base font-extrabold text-slate-800 mt-1">Trang Giám Đốc</h4>
                <p className="text-xs text-slate-500 mt-1">Báo cáo tài chính & chỉ số cấp cao</p>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">👑 →</span>
            </Link>
          )}

          <Link
            to="/admin"
            className="group rounded-2xl border border-blue-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Tác Nghiệp Thực Tế</p>
              <h4 className="text-base font-extrabold text-slate-800 mt-1">Bàn Vận Hành Kỹ Thuật</h4>
              <p className="text-xs text-slate-500 mt-1">Duyệt phiếu, tạo QR và xuất hóa đơn</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">📋 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
