import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../api/stockApi';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

export const stockKeys = {
  all: ['stocks'] as const,
  list: (search?: string, page?: number, size?: number) =>
    ['stocks', 'list', { search, page, size }] as const,
  byFiller: (fillerId: number) => ['stocks', 'filler', fillerId] as const,
  forecast: (fillerId: number, assetType: 'PALLET' | 'SEPARATOR', days: number) =>
    ['stocks', 'forecast', fillerId, assetType, days] as const,
};

export function useStocks(params: { search?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: stockKeys.list(params.search, params.page, params.size),
    queryFn: () => stockApi.getAll(params),
  });
}

export function useStocksByFiller(fillerId: number | undefined) {
  return useQuery({
    queryKey: fillerId != null ? stockKeys.byFiller(fillerId) : ['stocks', 'filler', 'undefined'],
    queryFn: () => stockApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });
}

export function useStockForecast(
  fillerId: number | undefined,
  assetType: 'PALLET' | 'SEPARATOR',
  days: number = 7
) {
  return useQuery({
    queryKey: fillerId != null
      ? stockKeys.forecast(fillerId, assetType, days)
      : ['stocks', 'forecast', 'undefined'],
    queryFn: () => stockApi.forecast(fillerId as number, assetType, days),
    enabled: fillerId != null,
  });
}

export function useRecordInflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: stockApi.recordInflow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockKeys.all });
      toast.success('Stok girişi kaydedildi');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}

export function useUpdateThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { fillerId: number; assetType: 'PALLET' | 'SEPARATOR'; newThreshold: number }) =>
      stockApi.updateThreshold(vars.fillerId, vars.assetType, vars.newThreshold),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: stockKeys.all });
      toast.success('Eşik güncellendi');
    },
    onError: (e) => toast.error(handleApiError(e)),
  });
}
