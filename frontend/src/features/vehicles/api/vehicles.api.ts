import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Vehicle } from '../types/vehicle.types';

export async function getVehicles(search = '') {
  const { data } = await api.get<ApiListResponse<Vehicle>>('/vehicles', {
    params: { search, page: 1, limit: 50 }
  });
  return data.items;
}

export async function getVehicle(id: string) {
  const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function createVehicle(payload: Partial<Vehicle>) {
  const { data } = await api.post<Vehicle>('/vehicles', payload);
  return data;
}

export async function updateVehicle(id: string, payload: Partial<Vehicle>) {
  const { data } = await api.patch<Vehicle>(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: string) {
  await api.delete(`/vehicles/${id}`);
}
