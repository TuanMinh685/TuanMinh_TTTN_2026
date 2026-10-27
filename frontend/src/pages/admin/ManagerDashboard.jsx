import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../../components/AdminNav';
import api from '../../services/api';

const STATUS_LABELS = {
  'CHỜ_KHÁM': 'Chờ tiếp nhận',
  'ĐANG_CHUẨN_ĐOÁN': 'Đang kiểm tra & phân loại',
  'ĐANG_SỬA': 'Đang xử lý hỗ trợ',
  'ĐÃ_SỬA_XONG': 'Đã xử lý xong',
  'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN': 'Hoàn tất CSKH & Bảo hành',
  'YÊU_CẦU_BẢO_HÀNH': 'Yêu cầu bảo hành'
};

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [subordinateCount, setSubordinateCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get('/tickets'),
      api.get('/tickets/booking'),
      api.get('/admin/employees')
    ])
      .then(([ticketsRes, bookingsRes, employeesRes]) => {
        if (!ignore) {
          if (ticketsRes.data.success) setTickets(ticketsRes.data.data || []);
          if (bookingsRes.data.success) setBookings(bookingsRes.data.data || []);
          if (employeesRes.data.success) setSubordinateCount(employeesRes.data.data?.length || 0);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err.response?.data?.message || 'Không thể tải dữ liệu điều hành bộ phận CSKH.');
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

  // CSKH Operational metrics
  const pendingIntake = tickets.filter(t => t.trang_thai === 'CHỜ_KHÁM' || t.trang_thai === 'ĐANG_CHUẨN_ĐOÁN').length;
  const inProcessing = tickets.filter(t => t.trang_thai === 'ĐANG_SỬA' || t.trang_thai === 'YÊU_CẦU_BẢO_HÀNH').length;
  const completedCount = tickets.filter(t => t.trang_thai === 'ĐÃ_SỬA_XONG' || t.trang_thai === 'ĐÃ_GIAO_KHÁCH_VÀ_THU_TIỀN').length;
  const pendingBookings = bookings.filter(b => b.trang_thai === 'CHO_XAC_NHAN' || b.trang_thai === 'CHỜ_XÁC_NHẬN').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <AdminNav activeKey="QUAN_LY" />

      <div className="space-y-6">
        {/* CSKH Manager Banner */}
        <section className="rounded-2xl border border-slate-200 bg-brand-blue p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">🏬</span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Tổng Quan Điều Hành — Bộ Phận Chăm Sóc Khách Hàng (QR)
                </h2>
              </div>
              <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
                Giám sát toàn bộ quy trình tiếp nhận hồ sơ QR, phân loại yêu cầu hỗ trợ, kích hoạt bảo hành điện tử (e-Warranty), duyệt lịch hẹn và quản lý nhân sự bộ phận CSKH.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Trụ sở: Tập đoàn MYH Group • 615 Âu Cơ, Q. Tân Phú
                </span>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Nhân sự bộ phận CSKH: {subordinateCount} nhân viên
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                to="/admin/nhan-su"
                className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-blue-900 shadow-sm transition hover:bg-blue-50"
              >
                👥 Nhân Sự &amp; Phân Quyền CSKH
              </Link>
              <Link
                to="/admin"
                className="rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/20"
              >
                📋 Bàn Điều Hành Hồ Sơ QR
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Mới Tiếp Nhận &amp; Phân Loại</span>
              <span className="text-xl">🔍</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-800">{pendingIntake}</p>
            <p className="mt-1 text-xs text-slate-500">Hồ sơ QR chờ chuyên viên kiểm tra</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Đang Xử Lý Hỗ Trợ CSKH</span>
              <span className="text-xl">🎧</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-800">{inProcessing}</p>
            <p className="mt-1 text-xs text-slate-500">Chuyên viên đang hỗ trợ khách hàng</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã Hoàn Tất &amp; Cấp e-Warranty</span>
              <span className="text-xl">🛡️</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{completedCount}</p>
            <p className="mt-1 text-xs text-slate-500">Đã hoàn tất CSKH &amp; bảo hành điện tử</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Lịch Hẹn CSKH Chờ Duyệt</span>
              <span className="text-xl">📅</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-blue-900">{pendingBookings}</p>
            <p className="mt-1 text-xs text-slate-500">Khách đặt lịch hẹn tư vấn qua Web</p>
          </div>
        </div>

        {/* Live Operational Feeds: Tickets & Bookings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed 1: Tiến Độ Hồ Sơ QR CSKH */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Tiến Độ Các Hồ Sơ Yêu Cầu CSKH (QR) Mới Nhất
                </h3>
                <p className="text-xs text-slate-500">Giám sát trạng thái tiếp nhận và xử lý hỗ trợ giữa Lễ tân và Chuyên viên CSKH</p>
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
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Mã phiếu QR</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Sản phẩm / Dịch vụ</th>
                      <th className="py-2.5 px-3">Trạng thái CSKH</th>
                      <th className="py-2.5 px-3 text-right">Bảo hành (e-Warranty)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.slice(0, 6).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-brand-blue">
                          {t.ma_tra_cuu || t.ma_phieu}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {t.ho_ten_khach || t.ho_ten}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {t.ten_thiet_bi || t.ten_may || 'Hồ sơ CSKH'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {STATUS_LABELS[t.trang_thai] || t.trang_thai?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                          {t.han_bao_hanh ? `Đến ${new Date(t.han_bao_hanh).toLocaleDateString('vi-VN')}` : 'Chờ kích hoạt'}
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">Chưa có hồ sơ QR CSKH nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Feed 2: Lịch hẹn CSKH sắp tới */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Lịch Hẹn CSKH Mới Nhất
                </h3>
                <p className="text-xs text-slate-500">Khách đặt lịch tư vấn &amp; bảo hành qua Web</p>
              </div>
              <span className="text-xl">📅</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-80">
              {bookings.slice(0, 5).map(b => (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-xs">{b.ho_ten_khach} ({b.so_dien_thoai})</p>
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-brand-blue">
                      {b.gio_hen} • {b.ngay_hen ? new Date(b.ngay_hen).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{b.mo_ta_loi}</p>
                </div>
              ))}

              {bookings.length === 0 && (
                <div className="py-12 text-center text-xs font-semibold text-slate-500 bg-slate-50 rounded-xl">
                  Chưa có lịch hẹn CSKH mới.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to="/admin"
                className="block text-center rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Mở Bàn Điều Hành Hồ Sơ QR →
              </Link>
            </div>
          </section>
        </div>

        {/* Manager Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/nhan-su"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-blue hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Nhân Sự Bộ Phận CSKH</p>
              <h4 className="text-base font-semibold text-slate-800 mt-1">Quản Lý Nhân Sự &amp; Phân Quyền</h4>
              <p className="text-xs text-slate-500 mt-1">Cấp tài khoản Lễ tân, Chuyên viên hỗ trợ &amp; điều phối ca trực</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">👥 →</span>
          </Link>

          <Link
            to="/admin"
            className="group rounded-2xl border border-blue-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Tác Nghiệp CSKH Thực Tế</p>
              <h4 className="text-base font-semibold text-slate-800 mt-1">Bàn Điều Hành Hồ Sơ QR</h4>
              <p className="text-xs text-slate-500 mt-1">Tiếp nhận phiếu QR, cập nhật tiến độ xử lý &amp; in phiếu nhiệt 80mm</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">📋 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
