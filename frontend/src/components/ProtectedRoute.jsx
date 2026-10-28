import { Navigate, Outlet } from 'react-router-dom';

function isJwtExpired(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Chưa đăng nhập hoặc Token đã hết hạn / sai cấu trúc -> Xóa phiên & đưa về trang đăng nhập
  if (!token || isJwtExpired(token)) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('username');
    localStorage.removeItem('accountId');
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng vai trò không nằm trong danh sách cho phép
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Phân quyền bảo mật (RBAC): Vai trò của bạn ({role}) không có quyền truy cập trang này!
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;

