import type { Employee } from '../../employees/types/employee.types';

export interface Customer {
  _id: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  ownerUserId?: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail' | 'department'>;
  status: 'ACTIVE' | 'INACTIVE';
}
