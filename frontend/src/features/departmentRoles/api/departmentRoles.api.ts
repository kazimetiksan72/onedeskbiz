import { api } from '../../../api/client';
import type { DepartmentRole, RolePermission } from '../types/departmentRole.types';
import type { Employee } from '../../employees/types/employee.types';

export async function getDepartmentRoles() {
  const { data } = await api.get<DepartmentRole[]>('/department-roles');
  return data;
}

export async function createDepartmentRole(payload: { department: string; name: string; permissions: RolePermission[] }) {
  const { data } = await api.post<DepartmentRole>('/department-roles', payload);
  return data;
}

export async function updateDepartmentRole(id: string, payload: Partial<{ department: string; name: string; permissions: RolePermission[] }>) {
  const { data } = await api.patch<DepartmentRole>(`/department-roles/${id}`, payload);
  return data;
}

export async function deleteDepartmentRole(id: string) {
  await api.delete(`/department-roles/${id}`);
}

export async function assignDepartmentRole(userId: string, departmentRoleId: string | null) {
  const { data } = await api.patch<Employee>(`/department-roles/users/${userId}`, { departmentRoleId });
  return data;
}
