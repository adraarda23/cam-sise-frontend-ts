import React, { useEffect, useState } from 'react';
import { stockApi } from '../../api/stockApi';
import { fillerApi } from '../../api/fillerApi';
import { FillerStock, Filler } from '../../types/api.types';
import { Card } from '../common/Card';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';

const PAGE_SIZE = 10; // 2 records per filler (PALLET + SEPARATOR) → 5 filler cards per page

type FillerStockGroup = { fillerId: number; pallet?: FillerStock; separator?: FillerStock };

export const StockOverview: React.FC = () => {
  const [stocks, setStocks] = useState<FillerStock[]>([]);
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showInflowModal, setShowInflowModal] = useState(false);
  const [inflowData, setInflowData] = useState({
    fillerId: 0,
    assetType: 'PALLET' as 'PALLET' | 'SEPARATOR',
    quantity: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setDebouncedSearch(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadStocks(page);
  }, [page, debouncedSearch]);

  const loadStocks = async (p: number) => {
    try {
      setIsLoading(true);
      const [stocksData, fillersData] = await Promise.all([
        stockApi.getAll({ page: p, size: PAGE_SIZE, search: debouncedSearch || undefined }),
        fillerApi.getAll({ page: 0, size: 1000 }),
      ]);
      setStocks(stocksData.content ?? []);
      setTotalPages(stocksData.totalPages ?? 0);
      setTotalElements(stocksData.totalElements ?? 0);
      setFillers(fillersData.content);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getFillerName = (fillerId: number): string => {
    const filler = fillers.find(f => f.id === fillerId);
    return filler ? filler.name : `Dolumcu #${fillerId}`;
  };

  // Group stocks by fillerId so each filler gets one card
  const groupedStocks: FillerStockGroup[] = Object.values(
    stocks.reduce<Record<number, FillerStockGroup>>((acc, stock) => {
      if (!acc[stock.fillerId]) acc[stock.fillerId] = { fillerId: stock.fillerId };
      if (stock.assetType === 'PALLET') acc[stock.fillerId].pallet = stock;
      else acc[stock.fillerId].separator = stock;
      return acc;
    }, {})
  );

  const handleRecordInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await stockApi.recordInflow(inflowData);
      setShowInflowModal(false);
      setInflowData({ fillerId: 0, assetType: 'PALLET', quantity: 0 });
      loadStocks(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleUpdateThreshold = async (stock: FillerStock) => {
    const thresholdStr = prompt('Yeni eşik değerini giriniz:');
    if (!thresholdStr) return;
    const threshold = parseInt(thresholdStr);
    if (isNaN(threshold) || threshold < 0) {
      alert('Geçerli bir sayı giriniz');
      return;
    }
    try {
      await stockApi.updateThreshold(stock.fillerId, stock.assetType, threshold);
      loadStocks(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const getStockStatus = (stock: FillerStock) => {
    const pct = (stock.currentQuantity / stock.thresholdQuantity) * 100;
    if (pct >= 80) return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
    if (pct >= 50) return { bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
    return { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
  };

  const StockRow: React.FC<{ stock: FillerStock; label: string }> = ({ stock, label }) => {
    const st = getStockStatus(stock);
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{stock.currentQuantity}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.badge}`}>
              eşik: {stock.thresholdQuantity}
            </span>
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`${st.bar} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min((stock.currentQuantity / stock.thresholdQuantity) * 100, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Kayıp: {stock.estimatedLossRate.percentage.toFixed(1)}%</span>
          <button
            onClick={() => handleUpdateThreshold(stock)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Eşik Güncelle
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Dolumcu adına göre ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-indigo-600">{Math.floor(totalElements / 2)}</span> dolumcu
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
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="mt-4 text-gray-600">Stok kaydı bulunamadı</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedStocks.map((group) => (
            <Card key={group.fillerId}>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b">
                {getFillerName(group.fillerId)}
              </h3>
              <div className="space-y-4">
                {group.pallet && <StockRow stock={group.pallet} label="Palet" />}
                {group.separator && (
                  <>
                    {group.pallet && <div className="border-t" />}
                    <StockRow stock={group.separator} label="Ayırıcı" />
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
        totalElements={totalElements}
        size={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Inflow Modal */}
      {showInflowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Stok Girişi Kaydet</h3>
            <form onSubmit={handleRecordInflow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dolumcu</label>
                <select
                  value={inflowData.fillerId}
                  onChange={(e) => setInflowData({ ...inflowData, fillerId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value={0}>Dolumcu Seçiniz</option>
                  {fillers
                    .filter(f => f.active)
                    .map((filler) => (
                      <option key={filler.id} value={filler.id}>{filler.name}</option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Tipi</label>
                <select
                  value={inflowData.assetType}
                  onChange={(e) => setInflowData({ ...inflowData, assetType: e.target.value as 'PALLET' | 'SEPARATOR' })}
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
                  value={inflowData.quantity}
                  onChange={(e) => setInflowData({ ...inflowData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min={1}
                  required
                />
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
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
