import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Quote } from '../types/quote.types';

// ── Quotes ────────────────────────────────────────────────
export async function getQuotes(params?: { status?: string; customerId?: string; page?: number; limit?: number }) {
  const { data } = await api.get<ApiListResponse<Quote>>('/quotes', { params: { page: 1, limit: 50, ...params } });
  return data;
}

export async function getQuote(id: string) {
  const { data } = await api.get<Quote>(`/quotes/${id}`);
  return data;
}

export async function createQuote(payload: {
  customerId: string;
  items: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
  validUntil?: string | null;
  notes?: string;
  currency?: string;
}) {
  const { data } = await api.post<Quote>('/quotes', payload);
  return data;
}

export async function updateQuote(
  id: string,
  payload: {
    items?: { description: string; quantity: number; unitPrice: number; vatRate: number }[];
    status?: string;
    validUntil?: string | null;
    notes?: string;
    currency?: string;
  }
) {
  const { data } = await api.patch<Quote>(`/quotes/${id}`, payload);
  return data;
}

export async function deleteQuote(id: string) {
  await api.delete(`/quotes/${id}`);
}


export async function downloadQuotePdf(id: string) {
  const { data } = await api.get<Blob>(`/quotes/${id}/download`, { responseType: 'blob' });
  return data;
}
