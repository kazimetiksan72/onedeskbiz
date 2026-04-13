import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Employee } from '../types/employee.types';

export async function getEmployees(search = '') {
  const { data } = await api.get<ApiListResponse<Employee>>('/employees', {
    params: { search, page: 1, limit: 50 }
  });
  return data.items;
}

export async function createEmployee(payload: Partial<Employee>) {
  const { data } = await api.post<Employee>('/employees', payload);
  return data;
}

export async function updateEmployee(id: string, payload: Partial<Employee>) {
  const { data } = await api.patch<Employee>(`/employees/${id}`, payload);
  return data;
}

export async function deleteEmployee(id: string) {
  await api.delete(`/employees/${id}`);
}
