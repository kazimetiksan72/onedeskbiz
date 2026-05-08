export type Role = 'ADMIN' | 'EMPLOYEE';

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CurrentUser {
  _id: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword?: boolean;
  department?: string;
  departmentRoleId?: {
    _id: string;
    department: string;
    name: string;
    permissions: string[];
  } | null;
}
