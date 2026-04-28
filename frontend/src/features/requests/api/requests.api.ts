import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { RequestItem } from '../types/request.types';

export async function getMyRequests() {
  const { data } = await api.get<ApiListResponse<RequestItem>>('/requests/mine', {
    params: { page: 1, limit: 100 }
  });
  return data.items;
}

export async function createVehicleRequest(payload: { vehicleId: string; startAt: string; endAt: string }) {
  const { data } = await api.post<RequestItem>('/requests', {
    type: 'VEHICLE',
    ...payload
  });
  return data;
}

export async function createMaterialRequest(payload: { materialText: string }) {
  const { data } = await api.post<RequestItem>('/requests', {
    type: 'MATERIAL',
    ...payload
  });
  return data;
}

export async function createExpenseRequest(payload: { expenseAmount: number; expenseCurrency: string; expenseDescription: string }) {
  const { data } = await api.post<RequestItem>('/requests', {
    type: 'EXPENSE',
    ...payload
  });
  return data;
}
