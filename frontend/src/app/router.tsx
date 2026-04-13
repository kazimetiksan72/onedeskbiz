import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { EmployeesPage } from '../features/employees/pages/EmployeesPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { CompanySettingsPage } from '../features/companySettings/pages/CompanySettingsPage';
import { AttendancePage } from '../features/attendance/pages/AttendancePage';
import { LeaveRequestsPage } from '../features/leaveRequests/pages/LeaveRequestsPage';
import { BusinessCardPage } from '../features/digitalCards/pages/BusinessCardPage';
import { PublicBusinessCardPage } from '../features/digitalCards/pages/PublicBusinessCardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/card/:slug', element: <PublicBusinessCardPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/customers', element: <CustomersPage /> },
          { path: '/business-card', element: <BusinessCardPage /> },
          { path: '/attendance', element: <AttendancePage /> },
          { path: '/leave-requests', element: <LeaveRequestsPage /> },
          { path: '/company-settings', element: <CompanySettingsPage /> }
        ]
      }
    ]
  }
]);
