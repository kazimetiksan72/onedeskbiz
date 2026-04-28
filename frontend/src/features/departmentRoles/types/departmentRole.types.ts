export type RolePermission = 'VEHICLE_APPROVAL' | 'LEAVE_APPROVAL' | 'MATERIAL_APPROVAL' | 'EXPENSE_APPROVAL';

export interface DepartmentRole {
  _id: string;
  department: string;
  name: string;
  permissions: RolePermission[];
  createdAt?: string;
  updatedAt?: string;
}
