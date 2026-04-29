import { api } from '../../../api/client';
import type { FeedPost } from '../types/feed.types';

export async function getFeedPosts() {
  const { data } = await api.get<FeedPost[]>('/feed', { params: { limit: 20 } });
  return data;
}

export async function getAdminFeedPosts() {
  const { data } = await api.get<FeedPost[]>('/feed/admin');
  return data;
}

export async function createFeedPost(payload: { title: string; content: string; image: File; status: 'PUBLISHED' | 'DRAFT' }) {
  const formData = new FormData();
  formData.append('title', payload.title);
  formData.append('content', payload.content);
  formData.append('status', payload.status);
  formData.append('image', payload.image);
  const { data } = await api.post<FeedPost>('/feed', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function deleteFeedPost(id: string) {
  await api.delete(`/feed/${id}`);
}
