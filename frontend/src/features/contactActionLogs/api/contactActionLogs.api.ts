import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { ContactActionLog } from '../types/contactActionLog.types';

export async function getContactActionLogs() {
  const { data } = await api.get<ApiListResponse<ContactActionLog>>('/contact-action-logs', {
    params: { page: 1, limit: 200 }
  });
  return data.items;
}
