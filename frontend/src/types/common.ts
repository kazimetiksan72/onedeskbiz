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
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  workEmail?: string;
  department?: string;
  departmentRoleId?: {
    _id: string;
    department: string;
    name: string;
    permissions: string[];
  } | null;
  businessCard?: {
    displayName?: string;
    title?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    bio?: string;
    avatarUrl?: string;
    avatarPublicUrl?: string;
  };
}
