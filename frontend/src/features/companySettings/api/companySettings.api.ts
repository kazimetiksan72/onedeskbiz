import { api } from '../../../api/client';
import type { CompanySettings } from '../types/companySettings.types';

export async function getCompanySettings() {
  const { data } = await api.get<CompanySettings | null>('/company-settings');
  return data;
}

export async function upsertCompanySettings(payload: Omit<CompanySettings, '_id'>) {
  const { data } = await api.put<CompanySettings>('/company-settings', payload);
  return data;
}
