import type { Vehicle } from '../../vehicles/types/vehicle.types';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RequestType = 'VEHICLE' | 'LEAVE' | 'MATERIAL' | 'EXPENSE';

export interface RequestItem {
  _id: string;
  type: RequestType;
  status: RequestStatus;
  startAt?: string | null;
  endAt?: string | null;
  materialText?: string;
  expenseAmount?: number;
  expenseCurrency?: string;
  expenseDescription?: string;
  vehicleId?: Vehicle | null;
  createdAt: string;
  updatedAt?: string;
}
