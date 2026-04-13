import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { logout } from '../features/auth/api/auth.api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/employees', label: 'Employees' },
  { to: '/customers', label: 'Customers' },
  { to: '/business-card', label: 'Business Card' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/leave-requests', label: 'Leave Requests' },
  { to: '/company-settings', label: 'Company Settings', adminOnly: true }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clearAuth } = useAuthStore();

  const onLogout = async () => {
    try {
      if (refreshToken) {
        await logout(refreshToken);
      }
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="text-lg font-semibold text-brand-700">
            SmallBiz Platform
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user?.email}</span>
            <button onClick={onLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="page-card h-fit p-3">
          <nav className="space-y-1">
            {navItems
              .filter((item) => !item.adminOnly || user?.role === 'ADMIN')
              .map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-sm ${
                      isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
