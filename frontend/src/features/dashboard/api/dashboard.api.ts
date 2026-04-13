import { api } from '../../../api/client';
import type { DashboardSummary } from '../types/dashboard.types';

export async function getDashboardSummary() {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}
