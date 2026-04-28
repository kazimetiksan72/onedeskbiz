import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { logout } from '../features/auth/api/auth.api';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Panel' },
  { to: '/admin/employees', label: 'Personeller' },
  { to: '/admin/customers', label: 'Müşteriler' },
  { to: '/admin/contacts', label: 'Kişiler' },
  { to: '/admin/contact-actions', label: 'Kişi Aksiyonları' },
  { to: '/admin/vehicles', label: 'Araçlarım' },
  { to: '/admin/department-roles', label: 'Roller ve Yetkiler' },
  { to: '/admin/company-settings', label: 'Şirket Ayarları' }
];

const employeeNavItems = [
  { to: '/leave-requests', label: 'İzin Talepleri' },
  { to: '/vehicle-requests', label: 'Araç Talepleri' },
  { to: '/material-requests', label: 'Malzeme Talepleri' },
  { to: '/expense-requests', label: 'Masraf Talepleri' },
  { to: '/contact-actions', label: 'Kişi Aksiyonları' }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const navItems = user?.role === 'ADMIN' ? adminNavItems : employeeNavItems;

  const onLogout = async () => {
    try {
      if (refreshToken) {
        await logout(refreshToken);
      }
    } finally {
      clearAuth();
      navigate(user?.role === 'ADMIN' ? '/admin' : '/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/leave-requests'}
            className="text-lg font-semibold text-brand-700"
          >
            SmallBiz Platform
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{user?.email}</span>
            <button onClick={onLogout} className="btn-secondary">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="page-card h-fit p-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
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
