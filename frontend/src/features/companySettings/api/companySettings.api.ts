import { api } from '../../../api/client';
import type { CompanySettings } from '../types/companySettings.types';

export type CompanySettingsPayload = Partial<Omit<CompanySettings, '_id' | 'billingInfo'>> & {
  billingInfo?: Partial<CompanySettings['billingInfo']>;
};

export async function getCompanySettings() {
  const { data } = await api.get<CompanySettings | null>('/company-settings');
  return data;
}

export async function getPublicCompanyBillingInfo() {
  const { data } = await api.get<Pick<CompanySettings, 'companyName' | 'website' | 'billingInfo'> | null>(
    '/company-settings/public-billing'
  );
  return data;
}

export async function upsertCompanySettings(payload: CompanySettingsPayload) {
  const { data } = await api.put<CompanySettings>('/company-settings', payload);
  return data;
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData();
  formData.append('logo', file);
  const { data } = await api.post<CompanySettings>('/company-settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}
