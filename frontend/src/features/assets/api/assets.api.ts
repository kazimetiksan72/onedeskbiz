import { api } from '../../../api/client';
import type { ApiListResponse } from '../../../types/common';
import type { Asset, AssetAssignment, AssetAssignmentType } from '../types/asset.types';

export async function getAssets(search = '') {
  const { data } = await api.get<ApiListResponse<Asset>>('/assets', {
    params: { search, page: 1, limit: 100 }
  });
  return data.items;
}

export async function createAsset(payload: Partial<Asset>) {
  const { data } = await api.post<Asset>('/assets', payload);
  return data;
}

export async function updateAsset(id: string, payload: Partial<Asset>) {
  const { data } = await api.patch<Asset>(`/assets/${id}`, payload);
  return data;
}

export async function deleteAsset(id: string) {
  await api.delete(`/assets/${id}`);
}

export async function getAssetAssignments(mine = false) {
  const { data } = await api.get<ApiListResponse<AssetAssignment>>('/assets/assignments', {
    params: { page: 1, limit: 100, mine }
  });
  return data.items;
}

export async function assignAsset(payload: {
  assetId: string;
  assignedUserId: string;
  type: AssetAssignmentType;
  startAt?: string;
  endAt?: string;
  notes?: string;
}) {
  const { data } = await api.post<AssetAssignment>('/assets/assignments', payload);
  return data;
}

export async function returnAssetAssignment(id: string) {
  const { data } = await api.patch<AssetAssignment>(`/assets/assignments/${id}/return`);
  return data;
}
