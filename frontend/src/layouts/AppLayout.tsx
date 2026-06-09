import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { logout } from '../features/auth/api/auth.api';
import { getPublicCompanyBillingInfo } from '../features/companySettings/api/companySettings.api';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Panel' },
  { to: '/admin/employees', label: 'Personeller' },
  { to: '/admin/customers', label: 'Müşteriler' },
  { to: '/admin/contacts', label: 'Kişiler' },
  { to: '/admin/contact-actions', label: 'Kişi Aksiyonları' },
  { to: '/admin/requests', label: 'Talepler' },
  { to: '/admin/tasks', label: 'Görevler' },
  { to: '/admin/vehicles', label: 'Araçlarım' },
  { to: '/admin/assets', label: 'Demirbaşlarım' },
  { to: '/admin/announcements', label: 'Duyuru Yönetimi' },
  { to: '/admin/department-roles', label: 'Roller ve Yetkiler' },
  { to: '/admin/company-settings', label: 'Şirket Ayarları' }
];

const employeeNavItems = [
  { to: '/home', label: 'Ana Sayfa' },
  { to: '/announcements', label: 'Duyurular' },
  { to: '/employee-documents', label: 'Özlük Belgelerim' },
  { to: '/leave-requests', label: 'İzin Talepleri' },
  { to: '/vehicle-requests', label: 'Araç Talepleri' },
  { to: '/asset-requests', label: 'Demirbaş Talepleri' },
  { to: '/material-requests', label: 'Malzeme Talepleri' },
  { to: '/expense-requests', label: 'Masraf Talepleri' },
  { to: '/advance-requests', label: 'Avans Talepleri' },
  { to: '/tasks', label: 'Görevlerim' },
  { to: '/contact-actions', label: 'Kişi Aksiyonları' }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, refreshToken, clearAuth } = useAuthStore();
  const [companyName, setCompanyName] = useState('');
  const canAssignTasks = user?.role === 'ADMIN' || user?.departmentRoleId?.permissions?.includes('TASK_ASSIGNMENT');
  const canManageAssets = user?.role === 'ADMIN' || user?.departmentRoleId?.permissions?.includes('ASSET_APPROVAL');
  const userDisplayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toLocaleUpperCase('tr-TR') || 'U';
  const userAvatarUrl = user?.businessCard?.avatarPublicUrl || user?.businessCard?.avatarUrl || '';
  const navItems = user?.role === 'ADMIN'
    ? adminNavItems
    : [
      ...employeeNavItems.map((item) => item.to === '/tasks' && canAssignTasks ? { ...item, label: 'Görevler' } : item),
      ...(canManageAssets ? [{ to: '/assets', label: 'Demirbaşlarım' }] : [])
    ];

  useEffect(() => {
    getPublicCompanyBillingInfo()
      .then((settings) => setCompanyName(settings?.companyName?.trim() || ''))
      .catch(() => setCompanyName(''));
  }, []);

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
            to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/home'}
            className="leading-tight text-brand-700"
          >
            {companyName ? (
              <span className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">OneDesk</span>
                <span className="block text-xl font-semibold text-brand-700">{companyName}</span>
              </span>
            ) : (
              <span className="text-xl font-semibold text-brand-700">OneDesk</span>
            )}
          </Link>
          {user?.role === 'EMPLOYEE' ? (
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt={userDisplayName} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {userInitials}
                  </span>
                )}
                <span className="hidden leading-tight sm:block">
                  <span className="block font-semibold text-slate-900">{userDisplayName}</span>
                  <span className="block text-xs text-slate-500">{user?.department || user?.email}</span>
                </span>
                <span className="text-slate-400">⌄</span>
              </button>

              <div className="invisible absolute right-0 z-20 w-56 pt-2 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <Link to="/profile" className="block px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Profilim
                  </Link>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Çıkış
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span>{user?.email}</span>
              <button onClick={onLogout} className="btn-secondary">
                Çıkış
              </button>
            </div>
          )}
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
