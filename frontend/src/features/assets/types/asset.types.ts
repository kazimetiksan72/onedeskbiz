import type { Employee } from '../../employees/types/employee.types';

export type AssetStatus = 'ACTIVE' | 'INACTIVE';
export type AssetAssignmentType = 'PERMANENT' | 'TEMPORARY';
export type AssetAssignmentStatus = 'ACTIVE' | 'RETURNED';

export interface Asset {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  inventoryCode?: string;
  department?: string;
  status: AssetStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetAssignment {
  _id: string;
  assetId: Asset;
  assignedUserId: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail' | 'department'>;
  assignedByUserId?: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail'>;
  type: AssetAssignmentType;
  startAt?: string | null;
  endAt?: string | null;
  status: AssetAssignmentStatus;
  returnedAt?: string | null;
  notes?: string;
  createdAt?: string;
}
