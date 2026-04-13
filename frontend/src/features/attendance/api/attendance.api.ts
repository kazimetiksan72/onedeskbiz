import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { AttendanceLog } from '../types/attendance.types';

export async function getAttendanceLogs() {
  const { data } = await api.get<ApiListResponse<AttendanceLog>>('/attendance', {
    params: { page: 1, limit: 100 }
  });
  return data.items;
}

export async function createAttendanceLog(payload: {
  employeeId?: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp?: string;
  source?: 'WEB' | 'MANUAL';
  note?: string;
}) {
  const { data } = await api.post<AttendanceLog>('/attendance', payload);
  return data;
}
