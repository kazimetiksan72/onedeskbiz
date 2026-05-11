import { api } from '../../../api/client';
import type { DashboardSummary } from '../types/dashboard.types';

export async function getDashboardSummary(params: { department?: string } = {}) {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary', { params });
  return data;
}
