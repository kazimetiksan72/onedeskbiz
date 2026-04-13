import { api } from '../../../api/client';
import type { AuthResponse } from '../types/auth.types';

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function register(payload: {
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  employeeId?: string;
}) {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<{ user: AuthResponse['user'] }>('/auth/me');
  return data.user;
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken });
}
