import apiClient from './axiosConfig';
import { CompanySettings } from '../types/api.types';

export const settingsApi = {
  get: async (): Promise<CompanySettings> => (await apiClient.get('/api/settings')).data,
  update: async (data: CompanySettings): Promise<CompanySettings> =>
    (await apiClient.put('/api/settings', data)).data,
};
