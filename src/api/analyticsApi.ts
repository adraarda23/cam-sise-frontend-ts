import apiClient from './axiosConfig';
import { AnalyticsSummary } from '../types/api.types';

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> =>
    (await apiClient.get('/api/analytics')).data,
};
