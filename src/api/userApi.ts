import apiClient from './axiosConfig';
import { PageResponse } from '../types/api.types';

export interface UserResponse {
  id: number;
  poolOperatorId: number;
  username: string;
  fullName: string;
  role: string;
  fillerId: number | null;
  active: boolean;
  createdAt: string;
}

export interface CreateStaffRequest {
  username: string;
  password: string;
  fullName: string;
}

export interface CreateCustomerRequest {
  username: string;
  password: string;
  fullName: string;
  fillerId?: number | null;
}

export const userApi = {
  createStaff: async (data: CreateStaffRequest): Promise<UserResponse> => {
    const response = await apiClient.post('/api/users/staff', data);
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<UserResponse> => {
    const response = await apiClient.post('/api/users/customer', data);
    return response.data;
  },

  getAll: async (params?: { page?: number; size?: number; search?: string }): Promise<PageResponse<UserResponse>> => {
    const response = await apiClient.get('/api/users', { params });
    return response.data;
  },

  deactivate: async (userId: number): Promise<UserResponse> => {
    const response = await apiClient.post(`/api/users/${userId}/deactivate`);
    return response.data;
  },

  update: async (userId: number, data: { fullName: string; password?: string }): Promise<UserResponse> => {
    const response = await apiClient.put(`/api/users/${userId}`, data);
    return response.data;
  },
};
