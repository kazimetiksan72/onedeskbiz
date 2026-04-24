import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Contact } from '../types/contact.types';

export interface ContactPayload {
  customerId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

export async function getContacts(search = '') {
  const { data } = await api.get<ApiListResponse<Contact>>('/contacts', {
    params: { search, page: 1, limit: 50 }
  });
  return data.items;
}

export async function getContact(id: string) {
  const { data } = await api.get<Contact>(`/contacts/${id}`);
  return data;
}

export async function createContact(payload: ContactPayload) {
  const { data } = await api.post<Contact>('/contacts', payload);
  return data;
}

export async function updateContact(id: string, payload: ContactPayload) {
  const { data } = await api.patch<Contact>(`/contacts/${id}`, payload);
  return data;
}

export async function deleteContact(id: string) {
  await api.delete(`/contacts/${id}`);
}
