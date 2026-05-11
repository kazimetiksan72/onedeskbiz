import type { LeaveRequest } from '../../leaveRequests/types/leaveRequest.types';
import type { RequestStatus } from '../../requests/types/request.types';
import type { TaskStatus } from '../../tasks/types/task.types';
import type { Vehicle } from '../../vehicles/types/vehicle.types';

type VehicleStatus = Vehicle['status'];

export interface DashboardSummary {
  metrics: {
    employeeCount: number;
    activeCustomerCount: number;
    pendingLeaveCount: number;
    overdueTaskCount: number;
    pendingRequestCount: number;
    openedThisMonthCount: number;
    closedThisMonthCount: number;
  };
  filters: {
    department: string;
    departments: string[];
  };
  charts: {
    tasksByStatus: Array<{
      status: TaskStatus;
      count: number;
    }>;
    requestsByStatus: Array<{
      status: RequestStatus;
      count: number;
    }>;
    vehiclesByStatus: Array<{
      status: VehicleStatus;
      count: number;
    }>;
    tasksByDepartment: Array<{
      department: string;
      count: number;
    }>;
    pendingRequestsByDepartment: Array<{
      department: string;
      count: number;
    }>;
    vehicleRequestDensity: Array<{
      status: RequestStatus;
      count: number;
    }>;
  };
  recentLeaveRequests: LeaveRequest[];
}
