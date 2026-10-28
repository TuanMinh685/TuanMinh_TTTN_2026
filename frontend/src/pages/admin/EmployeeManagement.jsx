import { useCallback, useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import api from '../../services/api';

const ROLE_PERMISSIONS_DETAIL = {
  GIAM_DOC: {
    title: 'Quản Trị Hệ Thống CSKH',
    level: 100,
    badge: '🛡️ Quản Trị Hệ Thống CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Quyền hạn tối cao toàn hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng: Quản trị và phân quyền mọi cấp bậc nhân sự CSKH.',
    canCreate: ['ADMIN', 'QUAN_LY', 'KY_THUAT_VIEN', 'LE_TAN']
  },
  ADMIN: {
    title: 'Quản Trị Hệ Thống CSKH (System Admin)',
    level: 100,
    badge: '🛡️ Quản Trị Hệ Thống CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Toàn quyền quản trị hệ thống Web Quét Mã QR Chăm Sóc Khách Hàng và phân quyền tài khoản nhân sự.',
    canCreate: ['QUAN_LY', 'KY_THUAT_VIEN', 'LE_TAN']
  },
  QUAN_LY: {
    title: 'Trưởng Bộ Phận CSKH (CSKH Manager)',
    level: 80,
    badge: '🏬 Trưởng Bộ Phận CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Điều hành toàn bộ hoạt động bộ phận CSKH: Theo dõi tiến độ xử lý hồ sơ QR, duyệt lịch hẹn và quản lý nhân sự CSKH (< Level 80).',
    canCreate: ['KY_THUAT_VIEN', 'LE_TAN']
  },
  KE_TOAN: {
    title: 'Chuyên Viên Thống Kê CSKH',
    level: 60,
    badge: '📊 Thống Kê CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Theo dõi báo cáo thống kê hồ sơ CSKH và xuất báo cáo Excel.',
    canCreate: []
  },
  THU_KHO: {
    title: 'Quản Lý Bảo Hành Điện Tử (e-Warranty)',
    level: 50,
    badge: '🛡️ Quản Lý Bảo Hành',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Quản lý danh mục hạng mục bảo hành điện tử (e-Warranty) và mã Serial định danh.',
    canCreate: []
  },
  KY_THUAT_VIEN: {
    title: 'Chuyên Viên Hỗ Trợ & Xử Lý CSKH',
    level: 40,
    badge: '🎧 Chuyên Viên Hỗ Trợ CSKH',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Tiếp nhận phân loại yêu cầu, tải ảnh minh chứng hiện trạng, cập nhật tiến độ xử lý hồ sơ QR và kích hoạt bảo hành điện tử.',
    canCreate: []
  },
  LE_TAN: {
    title: 'Lễ Tân & Tiếp Nhận QR',
    level: 30,
    badge: '👩‍💼 Lễ Tân & Tiếp Nhận QR',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Tạo mã QR quầy tiếp nhận, hướng dẫn khách hàng quét mã tự phục vụ, duyệt/hủy lịch hẹn CSKH online.',
    canCreate: []
  }
};

export default function EmployeeManagement() {
  const currentRole = localStorage.getItem('role') || 'LE_TAN';
  const currentUsername = localStorage.getItem('username') || '';
  const currentAccountId = Number(localStorage.getItem('accountId') || 0);
  const currentRoleInfo = ROLE_PERMISSIONS_DETAIL[currentRole] || ROLE_PERMISSIONS_DETAIL.LE_TAN;
  const isExecutive = currentRole === 'GIAM_DOC' || currentRole === 'ADMIN';

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    ho_ten: '',
    ten_dang_nhap: '',
    mat_khau: '',
    vai_tro: 'KY_THUAT_VIEN',
    trang_thai: 'HOAT_DONG'
  });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/employees');
      if (res.data.success) {
        setEmployees(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.get('/admin/employees')
      .then(res => {
        if (!ignore && res.data.success) {
          setEmployees(res.data.data || []);
        }
      })
      .catch(err => {
        if (!ignore) {
          setError(err.response?.data?.message || 'Không thể tải danh sách nhân sự.');
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

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormError('');
    setFormData({
      ho_ten: '',
      ten_dang_nhap: '',
      mat_khau: '',
      vai_tro: isExecutive ? 'QUAN_LY' : 'KY_THUAT_VIEN',
      trang_thai: 'HOAT_DONG'
    });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setFormError('');
    setFormData({
      ho_ten: emp.ho_ten || '',
      ten_dang_nhap: emp.ten_dang_nhap || '',
      mat_khau: '',
      vai_tro: emp.vai_tro || 'KY_THUAT_VIEN',
      trang_thai: emp.trang_thai || 'HOAT_DONG'
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingEmployee) {
        await api.patch(`/admin/employees/${editingEmployee.id}`, {
          ho_ten: formData.ho_ten.trim(),
          vai_tro: formData.vai_tro,
          trang_thai: formData.trang_thai,
          mat_khau: formData.mat_khau.trim() || undefined
        });
      } else {
        await api.post('/admin/employees', {
          ho_ten: formData.ho_ten.trim(),
          ten_dang_nhap: formData.ten_dang_nhap.trim(),
          mat_khau: formData.mat_khau.trim(),
          vai_tro: formData.vai_tro
        });
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể lưu thông tin nhân sự.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLock = async (emp) => {
    const nextStatus = emp.trang_thai === 'HOAT_DONG' ? 'TAM_KHOA' : 'HOAT_DONG';
    const actionName = nextStatus === 'TAM_KHOA' ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản "${emp.ho_ten}" (@${emp.ten_dang_nhap})?`)) {
      return;
    }
    try {
      await api.patch(`/admin/employees/${emp.id}`, { trang_thai: nextStatus });
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái tài khoản.');
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`XÁC NHẬN: Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản "${emp.ho_ten}" (@${emp.ten_dang_nhap})?`)) {
      return;
    }
    try {
      await api.delete(`/admin/employees/${emp.id}`);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa tài khoản nhân sự.');
    }
  };

  // Filtered list
  const filteredEmployees = employees.filter(emp => {
    if (filterRole !== 'ALL' && emp.vai_tro !== filterRole) return false;
    if (filterStatus !== 'ALL' && emp.trang_thai !== filterStatus) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = emp.ho_ten?.toLowerCase().includes(q);
      const matchUser = emp.ten_dang_nhap?.toLowerCase().includes(q);
      if (!matchName && !matchUser) return false;
    }
    return true;
  });

  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.trang_thai === 'HOAT_DONG').length;
  const lockedCount = employees.filter(e => e.trang_thai === 'TAM_KHOA').length;

  return (
    <div className="bg-[#f0f5fa] p-4 md:p-6 rounded-2xl">
      <AdminNav activeKey="NHAN_SU" />

      {/* Main Content */}
      <div className="space-y-6">
        {/* Banner RBAC Introduction */}
        <section className="rounded-2xl border border-slate-200 bg-brand-blue p-6 text-white shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👥</span>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Quản Trị Nhân Sự & Cấp Bậc Phân Quyền (RBAC)
                </h2>
              </div>
              <p className="mt-2 text-sm text-blue-100 max-w-2xl leading-relaxed">
                Hệ thống kiểm soát truy cập dựa trên vai trò phân tầng từ cấp Giám Đốc (Level 100), Quản Lý Cửa Hàng (Level 80) xuống các bộ phận Kế toán, Kho, Kỹ thuật và Lễ tân.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-semibold">
                  Vai trò của bạn: <strong>{currentRoleInfo.title}</strong>
                </span>
                <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 font-semibold">
                  {isExecutive ? 'Quyền hạn: Toàn quyền tạo & phân cấp mọi vị trí' : 'Quyền hạn: Tạo & quản lý nhân sự cấp dưới (< Level 80)'}
                </span>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-blue shadow-md transition hover:bg-slate-100 active:scale-95"
            >
              <span>➕</span> Tạo Tài Khoản Mới
            </button>
          </div>
        </section>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Số Nhân Sự</p>
            <p className="mt-2 text-3xl font-semibold text-brand-blue">{totalCount}</p>
            <p className="mt-1 text-xs text-slate-500">Đã đăng ký trong hệ thống</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Đang Hoạt Động</p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">{activeCount}</p>
            <p className="mt-1 text-xs text-emerald-600">Sẵn sàng tác nghiệp</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Tạm Khóa Quyền</p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">{lockedCount}</p>
            <p className="mt-1 text-xs text-amber-600">Vô hiệu hóa đăng nhập</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800">Cấp Bậc Quản Trị</p>
            <p className="mt-2 text-3xl font-semibold text-slate-800">6 Cấp Bậc</p>
            <p className="mt-1 text-xs text-purple-600">Phân tầng bảo mật nghiêm ngặt</p>
          </div>
        </div>

        {/* Hierarchical Role Matrix Visual Cards */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>🛡️</span> Ma Trận Cấp Bậc & Quyền Hạn Trong Cửa Hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_PERMISSIONS_DETAIL).map(([key, roleItem]) => {
              const countInRole = employees.filter(e => e.vai_tro === key).length;
              return (
                <div key={key} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60 hover:bg-white hover:shadow-xs transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleItem.badgeClass}`}>
                      {roleItem.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {countInRole} nhân sự
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{roleItem.title}</h4>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{roleItem.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Employee Table & Filter Controls */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">
              Danh Sách Tài Khoản Nhân Sự ({filteredEmployees.length} / {totalCount})
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <input
                type="text"
                placeholder="🔍 Tìm họ tên, username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium outline-none focus:border-brand-blue"
              />

              {/* Role filter */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-blue"
              >
                <option value="ALL">Tất cả chức vụ</option>
                <option value="GIAM_DOC">👑 Giám Đốc</option>
                <option value="ADMIN">🛡️ Admin</option>
                <option value="QUAN_LY">🏬 Quản Lý</option>
                <option value="KE_TOAN">📊 Kế Toán</option>
                <option value="THU_KHO">📦 Thủ Kho</option>
                <option value="KY_THUAT_VIEN">🔧 Kỹ Thuật Viên</option>
                <option value="LE_TAN">📋 Lễ Tân</option>
              </select>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-brand-blue"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="HOAT_DONG">Đang hoạt động</option>
                <option value="TAM_KHOA">Tạm khóa</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-500">
              Đang tải danh sách nhân sự...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
                    <th className="py-3 px-4">Nhân sự</th>
                    <th className="py-3 px-4">Tên đăng nhập</th>
                    <th className="py-3 px-4">Chức vụ & Cấp bậc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4">Ngày cấp</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map(emp => {
                    const empMeta = ROLE_PERMISSIONS_DETAIL[emp.vai_tro] || ROLE_PERMISSIONS_DETAIL.LE_TAN;
                    const empLevel = empMeta.level || 30;
                    const isSelf = (currentAccountId && Number(emp.id) === currentAccountId) || (currentUsername && emp.ten_dang_nhap === currentUsername);
                    const canModify = !isSelf && (isExecutive || empLevel < currentRoleInfo.level);

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.ho_ten?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {emp.ho_ten}
                                {isSelf && (
                                  <span className="ml-2 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                    (Bạn)
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400">ID: #{emp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          @{emp.ten_dang_nhap}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold border ${empMeta.badgeClass}`}>
                            {empMeta.badge}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {emp.trang_thai === 'HOAT_DONG' ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-800 font-bold">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-600 font-bold">
                              <span className="h-2 w-2 rounded-full bg-red-500"></span>
                              Tạm khóa
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {emp.ngay_tao ? new Date(emp.ngay_tao).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canModify ? (
                              <>
                                <button
                                  onClick={() => openEditModal(emp)}
                                  className="rounded bg-brand-blue px-2.5 py-1 font-semibold text-white hover:bg-brand-blue-hover text-xs shadow-2xs transition"
                                  title="Chỉnh sửa hồ sơ hoặc phân quyền"
                                >
                                  ✏️ Sửa
                                </button>
                                <button
                                  onClick={() => handleToggleLock(emp)}
                                  className="rounded bg-white border border-slate-200 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-50 text-xs transition"
                                  title={emp.trang_thai === 'HOAT_DONG' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                >
                                  {emp.trang_thai === 'HOAT_DONG' ? '🔒 Khóa' : '🔓 Mở'}
                                </button>
                                <button
                                  onClick={() => handleDelete(emp)}
                                  className="rounded bg-white border border-slate-200 px-2 py-1 font-medium text-slate-500 hover:text-red-600 hover:border-red-200 text-xs transition"
                                  title="Xóa tài khoản"
                                >
                                  🗑️
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {isSelf ? 'Tài khoản của bạn' : 'Cấp ngang / cao hơn'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                        Không tìm thấy tài khoản nhân sự phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal Cấp Mới / Chỉnh Sửa Nhân Sự */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingEmployee ? `✏️ Phân Quyền: ${editingEmployee.ho_ten}` : '➕ Tạo Tài Khoản Nhân Sự Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingEmployee ? 'Cập nhật chức vụ, mật khẩu hoặc trạng thái' : 'Cấp tài khoản mới theo phân tầng RBAC'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên nhân sự *</label>
                <input
                  type="text"
                  required
                  value={formData.ho_ten}
                  onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên đăng nhập (Username) * {editingEmployee && <span className="text-slate-400 font-normal">(Cố định không đổi)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingEmployee)}
                  value={formData.ten_dang_nhap}
                  onChange={(e) => setFormData({ ...formData, ten_dang_nhap: e.target.value })}
                  placeholder="3-30 ký tự: vanan, ktv_tuan..."
                  className={`w-full rounded-xl border px-3.5 py-2.5 font-mono font-medium outline-none ${
                    editingEmployee ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'border-slate-200 focus:border-brand-blue'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingEmployee ? 'Mật khẩu mới (Bỏ trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo *'}
                </label>
                <input
                  type="password"
                  required={!editingEmployee}
                  value={formData.mat_khau}
                  onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                  placeholder={editingEmployee ? 'Nhập nếu muốn đổi mật khẩu...' : 'Tối thiểu 6 ký tự'}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-medium outline-none focus:border-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phân quyền chức vụ (Role) *</label>
                <select
                  value={formData.vai_tro}
                  onChange={(e) => setFormData({ ...formData, vai_tro: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold text-slate-800 outline-none focus:border-brand-blue"
                >
                  {isExecutive && <option value="GIAM_DOC">👑 Giám Đốc Điều Hành</option>}
                  {isExecutive && <option value="ADMIN">🛡️ Quản Trị Hệ Thống</option>}
                  {isExecutive && <option value="QUAN_LY">🏬 Quản Lý Cửa Hàng</option>}
                  <option value="KE_TOAN">📊 Kế Toán Doanh Thu</option>
                  <option value="THU_KHO">📦 Thủ Kho Linh Kiện</option>
                  <option value="KY_THUAT_VIEN">🔧 Kỹ Thuật Viên Sửa Chữa</option>
                  <option value="LE_TAN">📋 Lễ Tân Tiếp Nhận</option>
                </select>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {ROLE_PERMISSIONS_DETAIL[formData.vai_tro]?.description}
                </p>
              </div>

              {editingEmployee && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={formData.trang_thai}
                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold text-slate-800 outline-none focus:border-brand-blue"
                  >
                    <option value="HOAT_DONG">✅ Đang hoạt động (HOAT_DONG)</option>
                    <option value="TAM_KHOA">🔒 Tạm khóa đăng nhập (TAM_KHOA)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-brand-blue px-5 py-2 font-semibold text-white shadow-xs hover:bg-blue-900 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingEmployee ? 'Cập Nhật Quyền' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

