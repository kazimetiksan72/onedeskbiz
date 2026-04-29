import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';

export function ProtectedRoute() {
  const { accessToken, user } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!user?.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/home'} replace />;
  }

  return <Outlet />;
}
