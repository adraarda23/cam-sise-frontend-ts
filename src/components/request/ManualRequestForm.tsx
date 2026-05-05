import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collectionApi } from '../../api/collectionApi';
import { stockApi } from '../../api/stockApi';
import { settingsApi } from '../../api/settingsApi';
import { Card } from '../common/Card';
import { handleApiError } from '../../utils/errorHandler';
import { FillerStock, CompanySettings } from '../../types/api.types';

interface ManualRequestFormProps {
  onSuccess?: () => void;
}

interface StockRowProps {
  label: string;
  icon: React.ReactNode;
  qty: number;
  setQty: (v: number) => void;
  stock: FillerStock | null;
  loadingStock: boolean;
  minQty: number;
}

const StockRow: React.FC<StockRowProps> = ({ label, icon, qty, setQty, stock, loadingStock, minQty }) => {
  const overLimit = !!stock && qty > stock.currentQuantity;
  const belowMin = qty > 0 && qty < minQty;
  const hasError = overLimit || belowMin;
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-medium text-gray-800">{label}</span>
        {loadingStock ? (
          <span className="ml-auto text-xs text-gray-400">yükleniyor...</span>
        ) : stock ? (
          <span className="ml-auto text-xs text-indigo-600 font-medium">
            Kullanılabilir: {stock.currentQuantity}
          </span>
        ) : (
          <span className="ml-auto text-xs text-red-400">Stok bulunamadı</span>
        )}
      </div>
      <input
        type="number"
        min={minQty}
        max={stock?.currentQuantity ?? undefined}
        value={qty || ''}
        onChange={e => setQty(e.target.value === '' ? 0 : Number(e.target.value))}
        placeholder="0"
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
          hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'
        }`}
      />
      <p className="text-xs text-gray-400">Minimum: {minQty} adet</p>
      {belowMin && (
        <p className="text-xs text-red-500">Minimum talep miktarı {minQty} adettir</p>
      )}
      {overLimit && (
        <p className="text-xs text-red-500">Kullanılabilir stoktan fazla olamaz</p>
      )}
    </div>
  );
};

export const ManualRequestForm: React.FC<ManualRequestFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [palletQty, setPalletQty] = useState<number>(0);
  const [separatorQty, setSeparatorQty] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [palletStock, setPalletStock] = useState<FillerStock | null>(null);
  const [separatorStock, setSeparatorStock] = useState<FillerStock | null>(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({ minPalletRequestQty: 1, minSeparatorRequestQty: 1 });

  useEffect(() => {
    settingsApi.get().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.fillerId) return;
    const load = async () => {
      try {
        setLoadingStock(true);
        const [stocks, requests] = await Promise.all([
          stockApi.getByFiller(user.fillerId!),
          collectionApi.getByFiller(user.fillerId!),
        ]);
        const activeReqs = requests.filter(r => r.status === 'PENDING' || r.status === 'APPROVED');

        for (const stock of stocks) {
          const reserved = activeReqs
            .filter(r => r.assetType === stock.assetType)
            .reduce((s, r) => s + r.estimatedQuantity, 0);
          const available = { ...stock, currentQuantity: stock.currentQuantity - reserved };
          if (stock.assetType === 'PALLET') setPalletStock(available);
          else setSeparatorStock(available);
        }
      } catch {
        // silent
      } finally {
        setLoadingStock(false);
      }
    };
    load();
  }, [user?.fillerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.fillerId) { setError('Dolumcu bilgisi bulunamadı'); return; }
    if (palletQty <= 0 && separatorQty <= 0) {
      setError('En az bir ürün için miktar giriniz.');
      return;
    }
    if (palletQty > 0 && palletQty < settings.minPalletRequestQty) {
      setError(`Minimum palet talebi ${settings.minPalletRequestQty} adettir.`);
      return;
    }
    if (separatorQty > 0 && separatorQty < settings.minSeparatorRequestQty) {
      setError(`Minimum ayırıcı talebi ${settings.minSeparatorRequestQty} adettir.`);
      return;
    }
    if (palletStock && palletQty > palletStock.currentQuantity) {
      setError(`Palet talebi (${palletQty}), kullanılabilir stoktan (${palletStock.currentQuantity}) fazla olamaz.`);
      return;
    }
    if (separatorStock && separatorQty > separatorStock.currentQuantity) {
      setError(`Ayırıcı talebi (${separatorQty}), kullanılabilir stoktan (${separatorStock.currentQuantity}) fazla olamaz.`);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const calls = [];
      if (palletQty > 0)
        calls.push(collectionApi.createManualRequest({ fillerId: user.fillerId, assetType: 'PALLET', estimatedQuantity: palletQty }));
      if (separatorQty > 0)
        calls.push(collectionApi.createManualRequest({ fillerId: user.fillerId, assetType: 'SEPARATOR', estimatedQuantity: separatorQty }));

      await Promise.all(calls);

      setSuccess(true);
      setPalletQty(0);
      setSeparatorQty(0);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-green-500 p-3 rounded-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Toplama Talebi</h2>
          <p className="text-sm text-gray-600">İstediğiniz ürünler için miktar girin</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <StockRow
          label="Palet"
          qty={palletQty}
          setQty={setPalletQty}
          stock={palletStock}
          loadingStock={loadingStock}
          minQty={settings.minPalletRequestQty}
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StockRow
          label="Ayırıcı"
          qty={separatorQty}
          setQty={setSeparatorQty}
          stock={separatorStock}
          loadingStock={loadingStock}
          minQty={settings.minSeparatorRequestQty}
          icon={
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
        />

        <button
          type="submit"
          disabled={isLoading || (palletQty <= 0 && separatorQty <= 0)}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition duration-150 font-medium flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Gönderiliyor...
            </>
          ) : 'Talep Oluştur'}
        </button>
      </form>

      {success && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded flex items-start gap-3">
          <svg className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-700 font-medium">Talep başarıyla oluşturuldu! Onay bekliyor.</p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded flex items-start gap-3">
          <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </Card>
  );
};
