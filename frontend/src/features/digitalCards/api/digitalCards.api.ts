import { api } from '../../../api/client';
import type { Employee } from '../../employees/types/employee.types';

export async function updateBusinessCard(employeeId: string, formData: FormData) {
  const { data } = await api.patch<Employee>(`/digital-cards/${employeeId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getPublicBusinessCard(slug: string) {
  const { data } = await api.get(`/digital-cards/public/${slug}`);
  return data;
}
