import type { Employee } from '../../employees/types/employee.types';

export interface LeaveRequest {
  _id: string;
  userId: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail' | 'department'>;
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
}
