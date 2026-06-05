import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { RequestItem } from '../types/request.types';

export async function getMyRequests() {
  const { data } = await api.get<ApiListResponse<RequestItem>>('/requests/mine', {
    params: { page: 1, limit: 100 }
  });
  return data.items;
}

export async function getApprovalRequests(status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING') {
  const { data } = await api.get<ApiListResponse<RequestItem>>('/requests/approvals', {
    params: { page: 1, limit: 100, status }
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

export async function createAssetRequest(payload: {
  assetId: string;
  assetAssignmentType: 'PERMANENT' | 'TEMPORARY';
  startAt?: string;
  endAt?: string;
}) {
  const { data } = await api.post<RequestItem>('/requests', {
    type: 'ASSET',
    ...payload
  });
  return data;
}

export async function createLeaveApprovalRequest(payload: {
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
  startAt: string;
  endAt: string;
  reason?: string;
}) {
  const { data } = await api.post<RequestItem>('/requests', {
    type: 'LEAVE',
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

export async function approveRequest(id: string, note?: string) {
  const { data } = await api.patch<RequestItem>(`/requests/${id}/approve`, { note });
  return data;
}

export async function rejectRequest(id: string, note?: string) {
  const { data } = await api.patch<RequestItem>(`/requests/${id}/reject`, { note });
  return data;
}
