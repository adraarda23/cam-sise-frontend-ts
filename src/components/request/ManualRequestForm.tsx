import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { collectionApi } from '../../api/collectionApi';
import { stockApi } from '../../api/stockApi';
import { settingsApi } from '../../api/settingsApi';
import { Card } from '../common/Card';
import { ActualValue } from '../common/ActualValue';
import { useCreateManualRequest } from '../../hooks/useCollectionRequests';
import { FillerStock } from '../../types/api.types';

interface ManualRequestFormProps {
  onSuccess?: () => void;
}

interface FormValues {
  palletQty: number;
  separatorQty: number;
}

export const ManualRequestForm: React.FC<ManualRequestFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const fillerId = user?.fillerId;
  const createRequest = useCreateManualRequest();

  const settingsQuery = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => settingsApi.get(),
  });

  const stocksQuery = useQuery({
    queryKey: ['stocks', 'filler', fillerId],
    queryFn: () => stockApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });

  const activeRequestsQuery = useQuery({
    queryKey: ['collection-requests', 'filler', fillerId],
    queryFn: () => collectionApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });

  const minPallet = settingsQuery.data?.minPalletRequestQty ?? 1;
  const minSeparator = settingsQuery.data?.minSeparatorRequestQty ?? 1;

  const availability = useMemo(() => computeAvailability(
    stocksQuery.data ?? [],
    activeRequestsQuery.data ?? []
  ), [stocksQuery.data, activeRequestsQuery.data]);

  // Does the customer already have a PENDING request? If yes, the minQty floor
  // does not apply to top-ups — the original request already cleared it.
  const hasPendingPallet = useMemo(
    () => (activeRequestsQuery.data ?? []).some(
      (r) => r.assetType === 'PALLET' && r.status === 'PENDING'
    ),
    [activeRequestsQuery.data]
  );
  const hasPendingSeparator = useMemo(
    () => (activeRequestsQuery.data ?? []).some(
      (r) => r.assetType === 'SEPARATOR' && r.status === 'PENDING'
    ),
    [activeRequestsQuery.data]
  );

  // Build the schema reactively so the available-stock max stays in sync.
  const schema = useMemo(() => z.object({
    palletQty: z.coerce.number().int().min(0),
    separatorQty: z.coerce.number().int().min(0),
  }).superRefine((values, ctx) => {
    if (values.palletQty <= 0 && values.separatorQty <= 0) {
      ctx.addIssue({ code: 'custom', path: ['palletQty'], message: 'En az bir ürün için miktar giriniz' });
    }
    if (!hasPendingPallet && values.palletQty > 0 && values.palletQty < minPallet) {
      ctx.addIssue({ code: 'custom', path: ['palletQty'], message: `Minimum palet talebi ${minPallet} adet (ilk talep için)` });
    }
    if (!hasPendingSeparator && values.separatorQty > 0 && values.separatorQty < minSeparator) {
      ctx.addIssue({ code: 'custom', path: ['separatorQty'], message: `Minimum ayırıcı talebi ${minSeparator} adet (ilk talep için)` });
    }
    if (availability.palletAvailable != null && values.palletQty > availability.palletAvailable) {
      ctx.addIssue({
        code: 'custom',
        path: ['palletQty'],
        message: `Palet talebi (${values.palletQty}), kullanılabilir stoktan (${availability.palletAvailable}) fazla olamaz`,
      });
    }
    if (availability.separatorAvailable != null && values.separatorQty > availability.separatorAvailable) {
      ctx.addIssue({
        code: 'custom',
        path: ['separatorQty'],
        message: `Ayırıcı talebi (${values.separatorQty}), kullanılabilir stoktan (${availability.separatorAvailable}) fazla olamaz`,
      });
    }
  }), [minPallet, minSeparator, availability, hasPendingPallet, hasPendingSeparator]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { palletQty: 0, separatorQty: 0 },
  });

  useEffect(() => {
    // Re-run resolver when availability changes
    form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability.palletAvailable, availability.separatorAvailable]);

  const onSubmit = async (values: FormValues) => {
    if (!fillerId) return;
    const calls: Promise<unknown>[] = [];
    if (values.palletQty > 0) {
      calls.push(createRequest.mutateAsync({
        fillerId, assetType: 'PALLET', estimatedQuantity: values.palletQty,
      }));
    }
    if (values.separatorQty > 0) {
      calls.push(createRequest.mutateAsync({
        fillerId, assetType: 'SEPARATOR', estimatedQuantity: values.separatorQty,
      }));
    }
    await Promise.all(calls);
    form.reset({ palletQty: 0, separatorQty: 0 });
    onSuccess?.();
  };

  return (
    <Card>
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-actual-500 p-3 rounded-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Toplama Talebi</h2>
          <p className="text-sm text-gray-600">İstediğiniz ürünler için miktar girin</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormRow
          label="Palet"
          available={availability.palletAvailable}
          loadingStock={stocksQuery.isLoading}
          minQty={minPallet}
          isTopUp={hasPendingPallet}
          error={form.formState.errors.palletQty?.message}
          inputProps={form.register('palletQty')}
        />
        <FormRow
          label="Ayırıcı"
          available={availability.separatorAvailable}
          loadingStock={stocksQuery.isLoading}
          minQty={minSeparator}
          isTopUp={hasPendingSeparator}
          error={form.formState.errors.separatorQty?.message}
          inputProps={form.register('separatorQty')}
        />

        <button
          type="submit"
          disabled={createRequest.isPending}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-150 font-medium"
        >
          {createRequest.isPending ? 'Gönderiliyor...' : 'Talep Oluştur'}
        </button>
      </form>
    </Card>
  );
};

const FormRow: React.FC<{
  label: string;
  available: number | null;
  loadingStock: boolean;
  minQty: number;
  isTopUp: boolean;
  error?: string;
  inputProps: ReturnType<ReturnType<typeof useForm<FormValues>>['register']>;
}> = ({ label, available, loadingStock, minQty, isTopUp, error, inputProps }) => {
  return (
    <div className={`border rounded-lg p-4 space-y-2 ${error ? 'border-anomaly-400' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-800">{label}</span>
        {isTopUp && (
          <span
            className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700"
            title="Bekleyen bir talebiniz var — bu miktar mevcut talebin üstüne eklenecek."
          >
            Ekleme
          </span>
        )}
        {loadingStock ? (
          <span className="ml-auto text-xs text-gray-400">yükleniyor...</span>
        ) : available != null ? (
          <span className="ml-auto text-xs flex items-center gap-1">
            <span className="text-info-500">Kullanılabilir:</span>
            <ActualValue value={available} size="sm" />
          </span>
        ) : (
          <span className="ml-auto text-xs text-anomaly-500">Stok bulunamadı</span>
        )}
      </div>
      <input
        type="number"
        min={0}
        {...inputProps}
        placeholder="0"
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
          error ? 'border-anomaly-400 focus:ring-anomaly-400' : 'border-gray-300 focus:ring-indigo-500'
        }`}
      />
      <p className="text-xs text-info-500">
        {isTopUp
          ? 'Mevcut bekleyen talebinize ekleme yapılıyor — minimum kuralı geçerli değil.'
          : `Minimum: ${minQty} adet (ilk talep için)`}
      </p>
      {error && <p className="text-xs text-anomaly-600">{error}</p>}
    </div>
  );
};

function computeAvailability(
  stocks: FillerStock[],
  requests: { assetType: 'PALLET' | 'SEPARATOR'; estimatedQuantity: number; status: string }[]
): { palletAvailable: number | null; separatorAvailable: number | null } {
  const reservedPallet = requests
    .filter((r) => r.assetType === 'PALLET' && (r.status === 'PENDING' || r.status === 'APPROVED'))
    .reduce((s, r) => s + r.estimatedQuantity, 0);
  const reservedSeparator = requests
    .filter((r) => r.assetType === 'SEPARATOR' && (r.status === 'PENDING' || r.status === 'APPROVED'))
    .reduce((s, r) => s + r.estimatedQuantity, 0);
  const pallet = stocks.find((s) => s.assetType === 'PALLET');
  const separator = stocks.find((s) => s.assetType === 'SEPARATOR');
  return {
    palletAvailable: pallet ? Math.max(0, pallet.currentQuantity - reservedPallet) : null,
    separatorAvailable: separator ? Math.max(0, separator.currentQuantity - reservedSeparator) : null,
  };
}
