import type { Employee } from '../../employees/types/employee.types';

export interface AttendanceLog {
  _id: string;
  employeeId: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail' | 'department'>;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string;
  source: 'WEB' | 'MANUAL';
  note?: string;
}
