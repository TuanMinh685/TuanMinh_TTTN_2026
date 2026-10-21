import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import AdminNav from '../../components/AdminNav';
import api from '../../services/api';
import { exportEnterpriseExcel } from '../../utils/excelExport';

const PIE_COLORS = ['#0d457b', '#f37021', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444'];

export default function DirectorDashboard() {
  const [period, setPeriod] = useState('week'); // 'week' | 'month'
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentTickets, setRecentTickets] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.get(`/admin/dashboard-stats?period=${period}`),
      api.get('/tickets'),
      api.get('/admin/employees')
    ])
      .then(([statsRes, ticketsRes, employeesRes]) => {
        if (!ignore) {
          if (statsRes.data.success) setStatsData(statsRes.data.data);
          if (ticketsRes.data.success) setRecentTickets(ticketsRes.data.data?.slice(0, 5) || []);
          if (employeesRes.data.success) setEmployeeCount(employeesRes.data.data?.length || 0);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err.response?.data?.message || 'Không thể tải dữ liệu báo cáo Giám đốc.');
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
  }, [period]);

  
  const handleExportDirectorExcel = () => {
    if (!statsData) return;
    const revRows = (statsData.revenueData || []).map((row, idx) => [
      idx + 1,
      row.date,
      Number(row.total_revenue || 0),
      statsData.totalRevenue || 0,
      statsData.totalPartsRevenue || 0,
      statsData.completedTickets || 0
    ]);
    const summaryRow = ['', 'TỔNG CỘNG DOANH THU', '', statsData.totalRevenue || 0, statsData.totalPartsRevenue || 0, statsData.completedTickets || 0];
    exportEnterpriseExcel({
      filename: `Bao_Cao_Giam_Doc_Dieu_Hanh_${period}.xlsx`,
      sheetName: 'Báo Cáo Giám Đốc',
      title: `BÁO CÁO ĐIỀU HÀNH CHIẾN LƯỢC TÀI CHÍNH & HIỆU SUẤT (${period === 'month' ? 'THÁNG HIỆN TẠI' : '7 NGÀY GẦN NHẤT'})`,
      headers: ['STT', 'Ngày Ghi Nhận', 'Doanh Thu Trong Ngày (VNĐ)', 'Tổng Doanh Thu Lũy Kế (VNĐ)', 'Doanh Thu Linh Kiện (VNĐ)', 'Số Ca Đã Giao Thu Tiền'],
      rows: revRows,
      summaryRow,
      signRole: 'KẾ TOÁN TRƯỞNG & THỦ KHO'
    });
  };

  const totalRevenue = statsData?.totalRevenue || 0;
  const partsRevenue = statsData?.totalPartsRevenue || 0;
  const serviceRevenue = Math.max(totalRevenue - partsRevenue, 0);
  const completedTickets = statsData?.completedTickets || 0;

  // Chart data
  const revenueChartData = (statsData?.revenueData || []).map(item => ({
    date: item.date?.slice(5) || item.date,
    revenue: Number(item.total_revenue || 0)
  }));

  const statusPieData = (statsData?.statusData || []).map(item => ({
    name: item.name?.replace(/_/g, ' ') || 'Khác',
    value: Number(item.value || 0)
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <AdminNav activeKey="GIAM_DOC" />

      {/* Main Director Dashboard */}
      <div className="space-y-6">
        {/* Executive Banner */}
        <section className="rounded-2xl border border-slate-200 bg-brand-blue p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">👑</span>
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Cổng Điều Hành Chiến Lược — Ban Giám Đốc
                </h2>
              </div>
              <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
                Giám sát toàn diện doanh thu thực thu, dòng tiền linh kiện, hiệu suất hoàn tất phiếu sửa chữa và điều phối nguồn lực 6 cấp bậc của HungHau IT Support.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Khu vực: 615 Âu Cơ, P. Phú Trung, Q. Tân Phú
                </span>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-bold">
                  Quy mô nhân sự: {employeeCount} nhân viên
                </span>
              </div>
            </div>

            {/* Time Filter Buttons */}
            <div className="flex shrink-0 flex-wrap items-center gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-xs border border-white/10">
              <button
                onClick={() => setPeriod('week')}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  period === 'week' ? 'bg-white text-brand-blue shadow-md' : 'text-blue-100 hover:text-white'
                }`}
              >
                📅 7 Ngày Gần Nhất
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  period === 'month' ? 'bg-white text-brand-blue shadow-md' : 'text-blue-100 hover:text-white'
                }`}
              >
                📆 Tháng Này
              </button>
              <button
                onClick={handleExportDirectorExcel}
                className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-brand-blue shadow-md transition hover:bg-slate-100"
              >
                📊 Xuất Báo Cáo Excel (.xlsx)
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {/* C-Level Financial Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Tổng Doanh Thu */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Tổng Doanh Thu Thực Thu</span>
              <span className="text-xl">💰</span>
            </div>
            <p className="mt-3 text-2xl lg:text-3xl font-bold text-brand-blue">
              {totalRevenue.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-500">đ</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Thời gian: {period === 'week' ? '7 ngày qua' : 'Tháng hiện tại'}
            </p>
          </div>

          {/* Card 2: Doanh Thu Linh Kiện */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Doanh Thu Linh Kiện</span>
              <span className="text-xl">📦</span>
            </div>
            <p className="mt-3 text-2xl lg:text-3xl font-bold text-slate-800">
              {partsRevenue.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-500">đ</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Chiếm {totalRevenue > 0 ? Math.round((partsRevenue / totalRevenue) * 100) : 0}% tổng doanh thu
            </p>
          </div>

          {/* Card 3: Doanh Thu Công Dịch Vụ */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">Doanh Thu Công Kỹ Thuật</span>
              <span className="text-xl">🔧</span>
            </div>
            <p className="mt-3 text-2xl lg:text-3xl font-bold text-slate-800">
              {serviceRevenue.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-500">đ</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Chiếm {totalRevenue > 0 ? Math.round((serviceRevenue / totalRevenue) * 100) : 0}% tổng doanh thu
            </p>
          </div>

          {/* Card 4: Số Ca Sửa Hoàn Tất */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Phiếu Hoàn Tất Thu Tiền</span>
              <span className="text-xl">✅</span>
            </div>
            <p className="mt-3 text-2xl lg:text-3xl font-bold text-slate-900">
              {completedTickets} <span className="text-sm font-bold text-slate-500">ca</span>
            </p>
            <p className="mt-1 text-xs text-emerald-600 font-bold">
              Đã giao máy cho khách
            </p>
          </div>
        </div>

        {/* Charts Section: Doanh Thu & Trạng Thái */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Biểu đồ Doanh Thu Area Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Biểu Đồ Xu Hướng Doanh Thu ({period === 'week' ? '7 Ngày Gần Nhất' : 'Tháng Hiện Tại'})
                </h3>
                <p className="text-xs text-slate-500">Dữ liệu thực tế ghi nhận từ hệ thống máy chủ</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-slate-200">
                Doanh thu VND
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs font-bold text-slate-400">
                Đang vẽ biểu đồ...
              </div>
            ) : revenueChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="directorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7e22ce" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7e22ce" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip
                      formatter={(val) => [`${Number(val).toLocaleString('vi-VN')} VNĐ`, 'Doanh thu']}
                      labelFormatter={(label) => `Ngày: ${label}`}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#7e22ce" strokeWidth={3} fillOpacity={1} fill="url(#directorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Chưa có dữ liệu giao dịch trong khoảng thời gian này.
              </div>
            )}
          </div>

          {/* Biểu đồ Phân Bố Trạng Thái Phiếu */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col">
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              Cơ Cấu Trạng Thái Sửa Chữa
            </h3>
            <p className="text-xs text-slate-500 mb-4">Tỷ lệ các ca xử lý trong toàn chuỗi</p>

            <div className="h-56 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val} phiếu`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              {statusPieData.slice(0, 6).map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                  <span className="text-slate-600 truncate">{item.name}: <strong>{item.value}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent High-Priority Tickets Feed for Director */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">
                Phiếu Sửa Chữa Đang Tác Nghiệp (Live Operations)
              </h3>
              <p className="text-xs text-slate-500">Giám sát các ca xử lý mới nhất trong toàn hệ thống</p>
            </div>
            <Link to="/admin" className="text-xs font-bold text-brand-blue hover:underline">
              Mở bàn vận hành đầy đủ →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                  <th className="py-2.5 px-3">Mã phiếu</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Thiết bị</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand-blue">{t.ma_tra_cuu}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{t.ho_ten}</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.ten_may || 'Laptop / PC'}</td>
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
                {recentTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">Chưa có phiếu sửa chữa nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Strategic Access Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/nhan-su"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-blue hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Bộ Phận Nhân Sự</p>
              <h4 className="text-base font-semibold text-slate-800 mt-1">Phân Quyền & Cấp Bậc</h4>
              <p className="text-xs text-slate-500 mt-1">Quản lý {employeeCount} tài khoản 6 cấp bậc</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">👥 →</span>
          </Link>

          <Link
            to="/admin/quan-ly"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Cửa Hàng Chi Nhánh</p>
              <h4 className="text-base font-semibold text-slate-800 mt-1">Điều Hành Quản Lý</h4>
              <p className="text-xs text-slate-500 mt-1">Giám sát tiếp nhận quầy & kỹ thuật viên</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">🏬 →</span>
          </Link>

          <Link
            to="/admin"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-brand-blue hover:shadow-md transition flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-wider">Bàn Vận Hành Kỹ Thuật</p>
              <h4 className="text-base font-semibold text-slate-800 mt-1">Kho & Phiếu Sửa Chữa</h4>
              <p className="text-xs text-slate-500 mt-1">Tác nghiệp trực tiếp mọi luồng hệ thống</p>
            </div>
            <span className="text-2xl group-hover:translate-x-1 transition-transform">📋 →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
