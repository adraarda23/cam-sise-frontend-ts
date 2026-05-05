import apiClient from './axiosConfig';
import { RegisterFillerRequest, Filler, PageResponse } from '../types/api.types';

export const fillerApi = {
  register: async (data: RegisterFillerRequest): Promise<Filler> => {
    const response = await apiClient.post('/api/fillers', data);
    return response.data;
  },

  getAll: async (params?: { active?: boolean; page?: number; size?: number; search?: string }): Promise<PageResponse<Filler>> => {
    const response = await apiClient.get('/api/fillers', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Filler> => {
    const response = await apiClient.get(`/api/fillers/${id}`);
    return response.data;
  },

  activate: async (id: number): Promise<Filler> => {
    const response = await apiClient.post(`/api/fillers/${id}/activate`);
    return response.data;
  },

  deactivate: async (id: number): Promise<Filler> => {
    const response = await apiClient.post(`/api/fillers/${id}/deactivate`);
    return response.data;
  },

  updateContact: async (id: number, data: {
    phone: string;
    email: string;
    contactPersonName: string;
  }): Promise<Filler> => {
    const response = await apiClient.put(`/api/fillers/${id}/contact`, data);
    return response.data;
  },

  updateLocation: async (id: number, latitude: number, longitude: number): Promise<Filler> => {
    const response = await apiClient.put(`/api/fillers/${id}/location`, {
      latitude,
      longitude
    });
    return response.data;
  },

  update: async (id: number, data: {
    name: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
    contactEmail: string;
    contactPersonName: string;
  }): Promise<Filler> => {
    const response = await apiClient.put(`/api/fillers/${id}`, data);
    return response.data;
  },
};
