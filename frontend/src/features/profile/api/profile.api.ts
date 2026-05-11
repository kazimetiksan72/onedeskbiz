import { api } from '../../../api/client';
import type { CurrentUser } from '../../../types/common';

export async function uploadProfilePhoto(file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  const { data } = await api.post<{ avatarUrl: string; user: CurrentUser }>('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data;
}
