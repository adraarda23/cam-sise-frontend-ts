import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { stockApi } from '../../api/stockApi';
import { collectionApi } from '../../api/collectionApi';
import { FillerStock, CollectionRequest } from '../../types/api.types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { handleApiError } from '../../utils/errorHandler';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<FillerStock[]>([]);
  const [requests, setRequests] = useState<CollectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.fillerId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    if (!user?.fillerId) return;

    try {
      setIsLoading(true);
      const [stocksData, requestsData] = await Promise.all([
        stockApi.getByFiller(user.fillerId),
        collectionApi.getByFiller(user.fillerId),
      ]);
      setStocks(stocksData);
      setRequests(requestsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStockLevel = (stock: FillerStock) => {
    const percentage = (stock.currentQuantity / stock.thresholdQuantity) * 100;
    if (percentage >= 80) return { color: 'text-red-600', label: 'Kritik' };
    if (percentage >= 50) return { color: 'text-yellow-600', label: 'Orta' };
    return { color: 'text-green-600', label: 'Normal' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Müşteri Paneli</h1>
        <p className="text-purple-100">Stok takibi ve toplama talepleri</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Stok Durumu" className="h-full">
          {stocks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Stok bilgisi bulunamadı</p>
          ) : (
            <div className="space-y-4">
              {stocks.map((stock) => {
                const level = getStockLevel(stock);
                return (
                  <div key={stock.id} className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {stock.assetType === 'PALLET' ? 'Palet' : 'Ayırıcı'}
                        </h4>
                        <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
                      </div>
                      <span className="text-2xl font-bold text-gray-900">
                        {stock.currentQuantity}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((stock.currentQuantity / stock.thresholdQuantity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Eşik: {stock.thresholdQuantity} • Kayıp Oranı: {stock.estimatedLossRate.percentage.toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            to="/my-requests"
            className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-150"
          >
            Yeni Talep Oluştur
          </Link>
        </Card>

        <Card title="Son Talepler" className="h-full">
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Talep bulunamadı</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div key={request.id} className="border rounded-lg p-3 hover:bg-gray-50 transition duration-150">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.assetType === 'PALLET' ? 'Palet' : 'Ayırıcı'} • {request.estimatedQuantity} adet
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/my-requests"
            className="mt-4 block w-full text-center border border-indigo-600 text-indigo-600 py-2 px-4 rounded-md hover:bg-indigo-50 transition duration-150"
          >
            Tüm Talepleri Görüntüle
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Toplam Talep</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{requests.length}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Bekleyen</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">
                {requests.filter((r) => r.status === 'PENDING').length}
              </p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Onaylı</p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {requests.filter((r) => r.status === 'APPROVED' || r.status === 'SCHEDULED').length}
              </p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
