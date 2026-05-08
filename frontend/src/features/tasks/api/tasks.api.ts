import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { TaskItem, TaskPayload, TaskStatus } from '../types/task.types';

export async function getTasks(params: { status?: TaskStatus; assignedUserId?: string } = {}) {
  const { data } = await api.get<ApiListResponse<TaskItem>>('/tasks', {
    params: { page: 1, limit: 200, ...params }
  });
  return data.items;
}

export async function createTask(payload: Required<Pick<TaskPayload, 'title' | 'assignedUserId'>> & TaskPayload) {
  const { data } = await api.post<TaskItem>('/tasks', payload);
  return data;
}

export async function updateTask(id: string, payload: TaskPayload) {
  const { data } = await api.patch<TaskItem>(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`);
}
