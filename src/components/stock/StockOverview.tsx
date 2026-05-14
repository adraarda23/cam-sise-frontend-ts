import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { fillerApi } from '../../api/fillerApi';
import { FillerStock } from '../../types/api.types';
import { Card } from '../common/Card';
import { Pagination } from '../common/Pagination';
import { ActualValue } from '../common/ActualValue';
import { EstimatedValue } from '../common/EstimatedValue';
import { handleApiError } from '../../utils/errorHandler';
import { useStocks, useRecordInflow, useUpdateThreshold } from '../../hooks/useStocks';

// Backend artık DOLUMCU bazında paginate ediyor — her sayfa N dolumcu × 2 stok satırı
// döndürür. size = sayfa başına dolumcu sayısı. totalElements = toplam dolumcu sayısı.
const FILLERS_PER_PAGE = 12;

const inflowSchema = z.object({
  fillerId: z.coerce.number().int().positive('Dolumcu seçiniz'),
  assetType: z.enum(['PALLET', 'SEPARATOR']),
  quantity: z.coerce.number().int().positive('Miktar 1 veya daha büyük olmalı'),
});
type InflowFormValues = z.infer<typeof inflowSchema>;

type FillerStockGroup = { fillerId: number; pallet?: FillerStock; separator?: FillerStock };

export const StockOverview: React.FC = () => {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInflowModal, setShowInflowModal] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Backend artık dolumcu-bazlı paginate ediyor → size = dolumcu/sayfa.
  const stocksQuery = useStocks({ page, size: FILLERS_PER_PAGE, search: debouncedSearch || undefined });
  const fillersQuery = useQuery({
    queryKey: ['fillers-light'],
    queryFn: () => fillerApi.getAll({ page: 0, size: 1000 }),
    staleTime: 5 * 60_000,
  });

  const recordInflow = useRecordInflow();
  const updateThreshold = useUpdateThreshold();

  const inflowForm = useForm<InflowFormValues>({
    resolver: zodResolver(inflowSchema),
    defaultValues: { fillerId: 0, assetType: 'PALLET', quantity: 0 },
  });

  const fillers = fillersQuery.data?.content ?? [];
  const stocks = stocksQuery.data?.content ?? [];
  // Backend filler-bazlı paginate ediyor: totalElements = dolumcu sayısı.
  const totalFillers = stocksQuery.data?.totalElements ?? 0;
  const totalPages = stocksQuery.data?.totalPages ?? 0;

  const getFillerName = (fillerId: number): string => {
    const filler = fillers.find((f) => f.id === fillerId);
    return filler ? filler.name : `Dolumcu #${fillerId}`;
  };

  const groupedStocks: FillerStockGroup[] = Object.values(
    stocks.reduce<Record<number, FillerStockGroup>>((acc, stock) => {
      if (!acc[stock.fillerId]) acc[stock.fillerId] = { fillerId: stock.fillerId };
      if (stock.assetType === 'PALLET') acc[stock.fillerId].pallet = stock;
      else acc[stock.fillerId].separator = stock;
      return acc;
    }, {})
  );

  // Bu sayfadaki dolumcuları alfabetik sırala (sadece görsel sıralama)
  groupedStocks.sort((a, b) => getFillerName(a.fillerId).localeCompare(getFillerName(b.fillerId), 'tr'));

  const handleInflowSubmit = inflowForm.handleSubmit(async (values) => {
    await recordInflow.mutateAsync(values);
    setShowInflowModal(false);
    inflowForm.reset({ fillerId: 0, assetType: 'PALLET', quantity: 0 });
  });

  const handleUpdateThreshold = async (stock: FillerStock) => {
    const thresholdStr = prompt('Yeni eşik değerini giriniz:', String(stock.thresholdQuantity));
    if (!thresholdStr) return;
    const threshold = parseInt(thresholdStr);
    if (isNaN(threshold) || threshold < 0) {
      toast.error('Geçerli bir sayı giriniz');
      return;
    }
    updateThreshold.mutate({
      fillerId: stock.fillerId,
      assetType: stock.assetType,
      newThreshold: threshold,
    });
  };

  if (stocksQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (stocksQuery.error) {
    return (
      <div className="bg-anomaly-50 border-l-4 border-anomaly-500 p-4 rounded">
        <p className="text-anomaly-700">{handleApiError(stocksQuery.error)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Dolumcu adına göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{totalFillers}</span> dolumcu
          </div>
          <button
            onClick={() => setShowInflowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 flex items-center space-x-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Stok Girişi Kaydet</span>
          </button>
        </div>
      </div>

      {groupedStocks.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-gray-600">Stok kaydı bulunamadı</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedStocks.map((group) => (
            <Card key={group.fillerId}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h3 className="text-base font-semibold text-gray-900">{getFillerName(group.fillerId)}</h3>
                <Link
                  to={`/fillers/${group.fillerId}`}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Detay →
                </Link>
              </div>
              <div className="space-y-4">
                {group.pallet && (
                  <StockRow stock={group.pallet} label="Palet" onUpdateThreshold={handleUpdateThreshold} />
                )}
                {group.separator && (
                  <>
                    {group.pallet && <div className="border-t" />}
                    <StockRow stock={group.separator} label="Ayırıcı" onUpdateThreshold={handleUpdateThreshold} />
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalFillers}
        size={FILLERS_PER_PAGE}
        onPageChange={setPage}
      />

      {showInflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Stok Girişi Kaydet</h3>
            <form onSubmit={handleInflowSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dolumcu</label>
                <select
                  {...inflowForm.register('fillerId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Dolumcu Seçiniz</option>
                  {fillers
                    .filter((f) => f.active)
                    .map((filler) => (
                      <option key={filler.id} value={filler.id}>
                        {filler.name}
                      </option>
                    ))}
                </select>
                {inflowForm.formState.errors.fillerId && (
                  <p className="text-xs text-anomaly-600 mt-1">{inflowForm.formState.errors.fillerId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Tipi</label>
                <select
                  {...inflowForm.register('assetType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PALLET">Palet</option>
                  <option value="SEPARATOR">Ayırıcı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
                <input
                  type="number"
                  {...inflowForm.register('quantity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={1}
                />
                {inflowForm.formState.errors.quantity && (
                  <p className="text-xs text-anomaly-600 mt-1">{inflowForm.formState.errors.quantity.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInflowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-150"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={recordInflow.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150 disabled:opacity-50"
                >
                  {recordInflow.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StockRow: React.FC<{
  stock: FillerStock;
  label: string;
  onUpdateThreshold: (stock: FillerStock) => void;
}> = ({ stock, label, onUpdateThreshold }) => {
  const pct = (stock.currentQuantity / Math.max(1, stock.thresholdQuantity)) * 100;
  const barColor = pct >= 80 ? 'bg-anomaly-500' : pct >= 50 ? 'bg-estimated-500' : 'bg-actual-500';

  // Tahmini kullanılabilir = currentQuantity × (1 - lossRate%)
  const lossPct = stock.estimatedLossRate.percentage;
  const stdDev = stock.estimatedLossRate.stdDev ?? 0;
  const estAvailable = stock.currentQuantity * (1 - lossPct / 100);
  // Loss rate'in standart sapması quantity üzerine yansır: stdDev_qty ≈ qty × stdDev_lossPct / 100
  const estAvailableStdDev = stock.currentQuantity * (stdDev / 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <ActualValue value={stock.currentQuantity} size="lg" />
          <span className="text-xs text-info-500">/ eşik {stock.thresholdQuantity}</span>
        </div>
      </div>
      <div className="bg-gray-200 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-info-500">Tahmini kullanılabilir:</span>
          <EstimatedValue
            value={estAvailable}
            stdDev={estAvailableStdDev}
            sampleSize={stock.estimatedLossRate.sampleSize}
            size="sm"
            precision={0}
          />
        </div>
        <button
          onClick={() => onUpdateThreshold(stock)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Eşik Güncelle
        </button>
      </div>
      <div className="text-[10px] text-info-500">
        Kayıp oranı: <span className="text-estimated-700 italic">~{lossPct.toFixed(1)}%</span>
        {stdDev > 0 && (
          <span className="text-estimated-600"> ± {(1.96 * stdDev / Math.sqrt(Math.max(1, stock.estimatedLossRate.sampleSize ?? 1))).toFixed(1)}%</span>
        )}
      </div>
    </div>
  );
};
