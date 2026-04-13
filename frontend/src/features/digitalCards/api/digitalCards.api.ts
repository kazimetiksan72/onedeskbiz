import { api } from '../../../api/client';

export async function getPublicBusinessCard(userId: string) {
  const { data } = await api.get(`/digital-cards/public/${userId}`);
  return data;
}
