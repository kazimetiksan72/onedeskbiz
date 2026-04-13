import { api } from '../../../api/client';
import type { CompanySettings } from '../types/companySettings.types';

export type CompanySettingsPayload = Partial<Omit<CompanySettings, '_id' | 'billingInfo'>> & {
  billingInfo?: Partial<CompanySettings['billingInfo']>;
};

export async function getCompanySettings() {
  const { data } = await api.get<CompanySettings | null>('/company-settings');
  return data;
}

export async function upsertCompanySettings(payload: CompanySettingsPayload) {
  const { data } = await api.put<CompanySettings>('/company-settings', payload);
  return data;
}
