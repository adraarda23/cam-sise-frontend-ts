import apiClient from './axiosConfig';
import {
  OptimizeRouteRequest,
  MultiVehicleOptimizeRequest,
  CollectionPlan,
  MultiVehicleOptimizeResponse,
  PageResponse,
} from '../types/api.types';

export const routeApi = {
  optimizeSingleVehicle: async (data: OptimizeRouteRequest): Promise<CollectionPlan> => {
    const response = await apiClient.post('/api/logistics/optimize', data);
    return response.data;
  },

  optimizeMultiVehicle: async (data: MultiVehicleOptimizeRequest): Promise<MultiVehicleOptimizeResponse> => {
    const response = await apiClient.post('/api/logistics/optimize/multi-vehicle', data);
    return response.data;
  },

  getCollectionPlans: async (params?: { status?: string; startDate?: string; endDate?: string; page?: number; size?: number }): Promise<PageResponse<CollectionPlan>> => {
    const response = await apiClient.get('/api/logistics/collection-plans', { params });
    return response.data;
  },

  getCollectionPlanById: async (id: number): Promise<CollectionPlan> => {
    const response = await apiClient.get(`/api/logistics/collection-plans/${id}`);
    return response.data;
  },

  assignVehicle: async (planId: number, vehicleId: number): Promise<CollectionPlan> => {
    const response = await apiClient.post(`/api/logistics/collection-plans/${planId}/assign-vehicle`, {
      vehicleId
    });
    return response.data;
  },

  startCollection: async (planId: number): Promise<CollectionPlan> => {
    const response = await apiClient.post(`/api/logistics/collection-plans/${planId}/start`);
    return response.data;
  },

  completeCollection: async (
    planId: number,
    actualPallets: number,
    actualSeparators: number
  ): Promise<CollectionPlan> => {
    const response = await apiClient.post(`/api/logistics/collection-plans/${planId}/complete`, {
      actualPalletsCollected: actualPallets,
      actualSeparatorsCollected: actualSeparators
    });
    return response.data;
  },

  cancelPlan: async (planId: number): Promise<CollectionPlan> => {
    const response = await apiClient.post(`/api/logistics/collection-plans/${planId}/cancel`);
    return response.data;
  },

  refreshGeometry: async (planId: number): Promise<CollectionPlan> => {
    const response = await apiClient.post(`/api/logistics/collection-plans/${planId}/refresh-geometry`);
    return response.data;
  },
};
