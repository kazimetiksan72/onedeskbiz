import type { LeaveRequest } from '../../leaveRequests/types/leaveRequest.types';

export interface DashboardSummary {
  metrics: {
    employeeCount: number;
    activeCustomerCount: number;
    pendingLeaveCount: number;
  };
  recentLeaveRequests: LeaveRequest[];
}
