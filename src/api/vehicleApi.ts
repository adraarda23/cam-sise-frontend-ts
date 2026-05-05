import apiClient from './axiosConfig';
import { Vehicle, RegisterVehicleRequest, AssignToRouteRequest, PageResponse } from '../types/api.types';

export const vehicleApi = {
  getAll: async (params?: { status?: string; page?: number; size?: number; search?: string }): Promise<PageResponse<Vehicle>> => {
    const response = await apiClient.get('/api/logistics/vehicles', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Vehicle> => {
    const response = await apiClient.get(`/api/logistics/vehicles/${id}`);
    return response.data;
  },

  getByPlate: async (plateNumber: string): Promise<Vehicle> => {
    const response = await apiClient.get(`/api/logistics/vehicles/plate/${plateNumber}`);
    return response.data;
  },

  register: async (request: RegisterVehicleRequest): Promise<Vehicle> => {
    const response = await apiClient.post('/api/logistics/vehicles', request);
    return response.data;
  },

  assignToRoute: async (vehicleId: number, request: AssignToRouteRequest): Promise<Vehicle> => {
    const response = await apiClient.post(`/api/logistics/vehicles/${vehicleId}/assign`, request);
    return response.data;
  },

  changeStatus: async (vehicleId: number, newStatus: string): Promise<Vehicle> => {
    const response = await apiClient.put(`/api/logistics/vehicles/${vehicleId}/status`, { newStatus });
    return response.data;
  },

  depart: async (vehicleId: number): Promise<Vehicle> => {
    const response = await apiClient.post(`/api/logistics/vehicles/${vehicleId}/depart`);
    return response.data;
  },

  returnToDepot: async (vehicleId: number): Promise<Vehicle> => {
    const response = await apiClient.post(`/api/logistics/vehicles/${vehicleId}/return`);
    return response.data;
  },
};
