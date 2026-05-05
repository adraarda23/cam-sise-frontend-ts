import apiClient from './axiosConfig';
import { VehicleType } from '../types/api.types';

export const vehicleTypeApi = {
  getAll: async (poolOperatorId?: number, active?: boolean): Promise<VehicleType[]> => {
    const params = new URLSearchParams();
    if (poolOperatorId) params.append('poolOperatorId', poolOperatorId.toString());
    if (active !== undefined) params.append('active', active.toString());

    const response = await apiClient.get(`/api/logistics/vehicle-types?${params.toString()}`);
    return response.data;
  },

  getById: async (id: number): Promise<VehicleType> => {
    const response = await apiClient.get(`/api/logistics/vehicle-types/${id}`);
    return response.data;
  },
};
