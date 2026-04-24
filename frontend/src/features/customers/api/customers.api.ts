import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Customer } from '../types/customer.types';

export async function getCustomers(search = '') {
  const { data } = await api.get<ApiListResponse<Customer>>('/customers', {
    params: { search, page: 1, limit: 50 }
  });
  return data.items;
}

export async function getCustomer(id: string) {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: Partial<Customer>) {
  const { data } = await api.post<Customer>('/customers', payload);
  return data;
}

export async function updateCustomer(id: string, payload: Partial<Customer>) {
  const { data } = await api.patch<Customer>(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`);
}
