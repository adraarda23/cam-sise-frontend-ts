import apiClient from './axiosConfig';
import { LoginRequest, LoginResponse } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
  },

  getCurrentUser: (): LoginResponse | null => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('jwt_token');
  },
};
