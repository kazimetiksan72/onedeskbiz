import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';

export function AdminRoute() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}

export function EmployeeRoute() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== 'EMPLOYEE') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
