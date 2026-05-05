import apiClient from './axiosConfig';
import { Depot } from '../types/api.types';

export const depotApi = {
  getAll: async (poolOperatorId?: number, active?: boolean): Promise<Depot[]> => {
    const params = new URLSearchParams();
    if (poolOperatorId) params.append('poolOperatorId', poolOperatorId.toString());
    if (active !== undefined) params.append('active', active.toString());

    const response = await apiClient.get(`/api/logistics/depots?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<Depot> => {
    const response = await apiClient.get(`/api/logistics/depots/${id}`);
    return response.data;
  },
};
