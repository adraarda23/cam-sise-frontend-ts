import apiClient from './axiosConfig';
import { NotificationItem, NotificationListResponse } from '../types/api.types';

export const notificationApi = {
  list: async (params?: { unreadOnly?: boolean; page?: number; size?: number }): Promise<NotificationListResponse> => {
    const response = await apiClient.get('/api/notifications', { params });
    return response.data;
  },

  unreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data.count;
  },

  markRead: async (id: number): Promise<NotificationItem> => {
    const response = await apiClient.post(`/api/notifications/${id}/mark-read`);
    return response.data;
  },

  markAllRead: async (): Promise<number> => {
    const response = await apiClient.post('/api/notifications/mark-all-read');
    return response.data.updated;
  },
};
