import apiClient from './axiosConfig';
import { RecordInflowRequest, FillerStock, PageResponse, ForecastResponse } from '../types/api.types';

export const stockApi = {
  recordInflow: async (data: RecordInflowRequest): Promise<FillerStock> => {
    const response = await apiClient.post('/api/inventory/stocks/inflow', data);
    return response.data;
  },

  recordCollection: async (data: {
    fillerId: number;
    assetType: 'PALLET' | 'SEPARATOR';
    quantity: number;
    collectionPlanId?: number;
  }): Promise<FillerStock> => {
    const response = await apiClient.post('/api/inventory/stocks/record-collection', data);
    return response.data;
  },

  getAll: async (params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<FillerStock>> => {
    const response = await apiClient.get('/api/inventory/stocks', { params });
    return response.data;
  },

  getByFiller: async (fillerId: number): Promise<FillerStock[]> => {
    const response = await apiClient.get(`/api/inventory/stocks/filler/${fillerId}`);
    return response.data;
  },

  updateThreshold: async (
    fillerId: number,
    assetType: 'PALLET' | 'SEPARATOR',
    newThreshold: number
  ): Promise<FillerStock> => {
    const response = await apiClient.put(
      `/api/inventory/stocks/${fillerId}/${assetType}/threshold`,
      { newThreshold }
    );
    return response.data;
  },

  forecast: async (
    fillerId: number,
    assetType: 'PALLET' | 'SEPARATOR',
    days: number = 7
  ): Promise<ForecastResponse> => {
    const response = await apiClient.get(
      `/api/inventory/stocks/${fillerId}/${assetType}/forecast`,
      { params: { days } }
    );
    return response.data;
  },
};
