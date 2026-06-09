import type { Vehicle } from '../../vehicles/types/vehicle.types';
import type { Asset, AssetAssignmentType } from '../../assets/types/asset.types';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RequestType = 'VEHICLE' | 'LEAVE' | 'MATERIAL' | 'EXPENSE' | 'ADVANCE' | 'ASSET';

export interface RequestItem {
  _id: string;
  requesterUserId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    workEmail?: string;
    department?: string;
  };
  requesterDepartment?: string;
  type: RequestType;
  status: RequestStatus;
  startAt?: string | null;
  endAt?: string | null;
  leaveType?: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER' | null;
  reason?: string;
  materialText?: string;
  expenseAmount?: number;
  expenseCurrency?: string;
  expenseDescription?: string;
  advanceAmount?: number;
  advanceCurrency?: string;
  advanceDescription?: string;
  expenseAttachments?: Array<{
    url: string;
    fileName?: string;
    mimeType?: string;
    size?: number;
  }>;
  vehicleId?: Vehicle | null;
  assetId?: Asset | null;
  assetAssignmentType?: AssetAssignmentType | null;
  approvalAction?: {
    actorUserId?: {
      _id: string;
      firstName?: string;
      lastName?: string;
      workEmail?: string;
    };
    action: 'APPROVE' | 'REJECT';
    note?: string;
    actedAt?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}
