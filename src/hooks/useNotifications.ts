import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unreadOnly?: boolean, page?: number) =>
    ['notifications', 'list', { unreadOnly, page }] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications(params: { unreadOnly?: boolean; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params.unreadOnly, params.page),
    queryFn: () => notificationApi.list(params),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success(`${updated} bildirim okundu işaretlendi`);
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
