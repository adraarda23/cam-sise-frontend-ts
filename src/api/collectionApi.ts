import apiClient from './axiosConfig';
import { CreateManualRequestRequest, CollectionRequest, PageResponse } from '../types/api.types';

export const collectionApi = {
  createManualRequest: async (data: CreateManualRequestRequest): Promise<CollectionRequest> => {
    const response = await apiClient.post('/api/logistics/collection-requests/manual', data);
    return response.data;
  },

  approveRequest: async (requestId: number, approvingUserId: number): Promise<CollectionRequest> => {
    const response = await apiClient.post(`/api/logistics/collection-requests/${requestId}/approve`, {
      approvingUserId
    });
    return response.data;
  },

  rejectRequest: async (requestId: number, reason: string): Promise<CollectionRequest> => {
    const response = await apiClient.post(`/api/logistics/collection-requests/${requestId}/reject`, {
      reason
    });
    return response.data;
  },

  cancelRequest: async (requestId: number): Promise<CollectionRequest> => {
    const response = await apiClient.post(`/api/logistics/collection-requests/${requestId}/cancel`);
    return response.data;
  },

  getAll: async (params?: { status?: string; assetType?: string; page?: number; size?: number }): Promise<PageResponse<CollectionRequest>> => {
    const response = await apiClient.get('/api/logistics/collection-requests', { params });
    return response.data;
  },

  getById: async (id: number): Promise<CollectionRequest> => {
    const response = await apiClient.get(`/api/logistics/collection-requests/${id}`);
    return response.data;
  },

  getByFiller: async (fillerId: number): Promise<CollectionRequest[]> => {
    const response = await apiClient.get(`/api/logistics/collection-requests/filler/${fillerId}`);
    return response.data;
  },
};
