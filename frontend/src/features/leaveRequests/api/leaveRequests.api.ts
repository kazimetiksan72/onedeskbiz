import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { LeaveRequest } from '../types/leaveRequest.types';

export async function getLeaveRequests(status = '') {
  const { data } = await api.get<ApiListResponse<LeaveRequest>>('/leave-requests', {
    params: { status: status || undefined, page: 1, limit: 100 }
  });
  return data.items;
}

export async function createLeaveRequest(payload: {
  employeeId?: string;
  leaveType: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  reason?: string;
}) {
  const { data } = await api.post<LeaveRequest>('/leave-requests', payload);
  return data;
}

export async function reviewLeaveRequest(
  id: string,
  payload: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }
) {
  const { data } = await api.patch<LeaveRequest>(`/leave-requests/${id}/review`, payload);
  return data;
}
