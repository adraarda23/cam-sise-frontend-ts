import apiClient from './axiosConfig';
import { FleetComposition, SuggestFleetRequest } from '../types/api.types';

export const fleetApi = {
  suggest: async (request: SuggestFleetRequest): Promise<FleetComposition[]> => {
    const response = await apiClient.post('/api/logistics/optimize/suggest-fleet', request);
    return response.data;
  },
};
