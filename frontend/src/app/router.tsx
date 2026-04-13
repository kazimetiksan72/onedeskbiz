import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute, EmployeeRoute } from './RoleRoute';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { EmployeesPage } from '../features/employees/pages/EmployeesPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { CompanySettingsPage } from '../features/companySettings/pages/CompanySettingsPage';
import { LeaveRequestsPage } from '../features/leaveRequests/pages/LeaveRequestsPage';
import { PublicBusinessCardPage } from '../features/digitalCards/pages/PublicBusinessCardPage';

export const router = createBrowserRouter([
  { path: '/', element: <LoginPage mode="employee" /> },
  { path: '/admin', element: <LoginPage mode="admin" /> },
  { path: '/login', element: <Navigate to="/" replace /> },
  { path: '/card/:userId', element: <PublicBusinessCardPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/change-password', element: <ChangePasswordPage /> },
      {
        element: <AppLayout />,
        children: [
          {
            element: <EmployeeRoute />,
            children: [{ path: '/leave-requests', element: <LeaveRequestsPage /> }]
          },
          {
            element: <AdminRoute />,
            children: [
              { path: '/admin/dashboard', element: <DashboardPage /> },
              { path: '/admin/employees', element: <EmployeesPage /> },
              { path: '/admin/customers', element: <CustomersPage /> },
              { path: '/admin/company-settings', element: <CompanySettingsPage /> },
              { path: '/dashboard', element: <Navigate to="/admin/dashboard" replace /> },
              { path: '/employees', element: <Navigate to="/admin/employees" replace /> },
              { path: '/customers', element: <Navigate to="/admin/customers" replace /> },
              { path: '/business-card', element: <Navigate to="/admin/employees" replace /> },
              {
                path: '/company-settings',
                element: <Navigate to="/admin/company-settings" replace />
              }
            ]
          }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> }
]);
