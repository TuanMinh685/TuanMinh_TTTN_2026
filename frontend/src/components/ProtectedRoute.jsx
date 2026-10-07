import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Chưa đăng nhập -> Đá ra trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng không có quyền -> Báo lỗi hoặc đá ra home
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <div className="p-10 text-center text-red-500 font-bold">Bạn không có quyền truy cập trang này!</div>;
  }

  return <Outlet />;
}

export default ProtectedRoute;
