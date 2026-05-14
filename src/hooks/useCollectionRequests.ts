import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionApi } from '../api/collectionApi';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

export const requestKeys = {
  all: ['collection-requests'] as const,
  list: (status?: string, assetType?: string, page?: number, size?: number) =>
    ['collection-requests', 'list', { status, assetType, page, size }] as const,
  byFiller: (fillerId: number) => ['collection-requests', 'filler', fillerId] as const,
};

export function useCollectionRequests(params: {
  status?: string;
  assetType?: string;
  page?: number;
  size?: number;
} = {}) {
  return useQuery({
    queryKey: requestKeys.list(params.status, params.assetType, params.page, params.size),
    queryFn: () => collectionApi.getAll(params),
  });
}

export function useRequestsByFiller(fillerId: number | undefined) {
  return useQuery({
    queryKey: fillerId != null ? requestKeys.byFiller(fillerId) : ['collection-requests', 'filler', 'undefined'],
    queryFn: () => collectionApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });
}

export function useCreateManualRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: collectionApi.createManualRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
      toast.success('Talep oluşturuldu');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { requestId: number; approvingUserId: number }) =>
      collectionApi.approveRequest(vars.requestId, vars.approvingUserId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
      toast.success('Talep onaylandı');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { requestId: number; reason: string }) =>
      collectionApi.rejectRequest(vars.requestId, vars.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
      toast.success('Talep reddedildi');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => collectionApi.cancelRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: requestKeys.all });
      toast.success('Talep iptal edildi');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
