import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { stockApi } from '../../api/stockApi';
import { collectionApi } from '../../api/collectionApi';
import { routeApi } from '../../api/routeApi';
import { vehicleApi } from '../../api/vehicleApi';
import { CollectionPlan, Vehicle, FillerStock } from '../../types/api.types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { ActualValue } from '../common/ActualValue';
import { useInputDialog } from '../common/InputDialog';
import { handleApiError } from '../../utils/errorHandler';

const ACTIVE_PLAN_STATUSES = ['GENERATED', 'ASSIGNED', 'IN_PROGRESS'];

interface StopInfo {
  fillerId: number;
  sequence?: number;
  pallets?: number;
  separators?: number;
  estimatedPallets?: number;
  estimatedSeparators?: number;
}

function parseStops(plan: CollectionPlan): StopInfo[] {
  if (!plan.routeStopsJson) return [];
  try {
    const raw = JSON.parse(plan.routeStopsJson);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const fillerId = user?.fillerId;
  const askInput = useInputDialog();
  const queryClient = useQueryClient();

  const handleUpdateThreshold = async (stock: FillerStock) => {
    const values = await askInput({
      title: `${stock.assetType === 'PALLET' ? 'Palet' : 'Ayırıcı'} eşiğini güncelle`,
      description:
        `Stok bu değerin altına düştüğünde sistem otomatik toplama talebi oluşturur. ` +
        `Şu anki eşik: ${stock.thresholdQuantity}`,
      confirmLabel: 'Güncelle',
      cancelLabel: 'Vazgeç',
      fields: [
        {
          name: 'threshold',
          label: 'Yeni eşik (adet)',
          type: 'number',
          placeholder: String(stock.thresholdQuantity),
        },
      ],
    });
    if (!values) return;
    const newThreshold = parseInt(values.threshold ?? '', 10);
    if (isNaN(newThreshold) || newThreshold < 0) {
      toast.error('Geçerli bir sayı giriniz');
      return;
    }
    try {
      await stockApi.updateThreshold(stock.fillerId, stock.assetType, newThreshold);
      toast.success('Eşik güncellendi');
      queryClient.invalidateQueries({ queryKey: ['stocks', 'filler', fillerId] });
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const stocksQuery = useQuery({
    queryKey: ['stocks', 'filler', fillerId],
    queryFn: () => stockApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });

  const requestsQuery = useQuery({
    queryKey: ['collection-requests', 'filler', fillerId],
    queryFn: () => collectionApi.getByFiller(fillerId as number),
    enabled: fillerId != null,
  });

  // Aktif planları çek — backend henüz filler bazlı filtre sunmuyor, biz
  // route stops içinde fillerId arıyoruz. Plan sayısı küçük (~ onlarca) olduğu
  // için bu pragmatik bir çözüm.
  const plansQuery = useQuery({
    queryKey: ['collection-plans', 'active'],
    queryFn: () => routeApi.getCollectionPlans({ page: 0, size: 100 }),
  });

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'all-light'],
    queryFn: () => vehicleApi.getAll({ page: 0, size: 200 }),
    staleTime: 60_000,
  });

  const stocks = stocksQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const allPlans = plansQuery.data?.content ?? [];
  const allVehicles: Vehicle[] = vehiclesQuery.data?.content ?? [];

  // My active plans = stops içinde my fillerId olan ve durumu aktif olan planlar
  const myActivePlans: CollectionPlan[] = allPlans
    .filter((p) => ACTIVE_PLAN_STATUSES.includes(p.status))
    .filter((p) => parseStops(p).some((s) => s.fillerId === fillerId));

  const isLoading = stocksQuery.isLoading || requestsQuery.isLoading || plansQuery.isLoading;

  const getStockLevel = (currentQuantity: number, thresholdQuantity: number) => {
    const percentage = (currentQuantity / Math.max(1, thresholdQuantity)) * 100;
    if (percentage >= 80) return { color: 'text-anomaly-600', label: 'Kritik' };
    if (percentage >= 50) return { color: 'text-estimated-700', label: 'Orta' };
    return { color: 'text-actual-700', label: 'Normal' };
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
        <p className="text-purple-100">Stok takibi, talepler ve gelen toplamalar</p>
      </div>

      {/* Yaklaşan toplamalar — en üstte, dikkat çeken */}
      <UpcomingPickupsCard plans={myActivePlans} vehicles={allVehicles} fillerId={fillerId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Stok Durumu" className="h-full">
          {stocks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Stok bilgisi bulunamadı</p>
          ) : (
            <div className="space-y-4">
              {stocks.map((stock) => {
                const level = getStockLevel(stock.currentQuantity, stock.thresholdQuantity);
                return (
                  <div key={stock.id} className="border-l-4 border-indigo-500 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {stock.assetType === 'PALLET' ? 'Palet' : 'Ayırıcı'}
                        </h4>
                        <p className={`text-sm font-medium ${level.color}`}>{level.label}</p>
                      </div>
                      <ActualValue value={stock.currentQuantity} size="xl" />
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((stock.currentQuantity / Math.max(1, stock.thresholdQuantity)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Eşik: {stock.thresholdQuantity} • Kayıp Oranı: {stock.estimatedLossRate.percentage.toFixed(1)}%
                      </p>
                      <button
                        onClick={() => handleUpdateThreshold(stock)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Eşik Güncelle
                      </button>
                    </div>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-sm text-blue-600 font-medium">Toplam Talep</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{requests.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-yellow-700 font-medium">Bekleyen</p>
          <p className="text-3xl font-bold text-yellow-900 mt-1">
            {requests.filter((r) => r.status === 'PENDING').length}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-sm text-green-700 font-medium">Onaylı / Planlı</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {requests.filter((r) => r.status === 'APPROVED' || r.status === 'SCHEDULED').length}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-sm text-purple-700 font-medium">Aktif Toplama Planı</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{myActivePlans.length}</p>
        </Card>
      </div>
    </div>
  );
};

const UpcomingPickupsCard: React.FC<{
  plans: CollectionPlan[];
  vehicles: Vehicle[];
  fillerId?: number;
}> = ({ plans, vehicles, fillerId }) => {
  if (plans.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-info-100 mb-3">
            <svg className="w-6 h-6 text-info-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium">Yaklaşan toplama yok</p>
          <p className="text-sm text-info-500 mt-1">
            Onaylanan taleplerinizden plan oluşturulduğunda burada görünür.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="🚚 Size Yaklaşan Toplamalar">
      <div className="space-y-3">
        {plans.map((plan) => {
          const vehicle = vehicles.find((v) => v.id === plan.vehicleId);
          const stops = parseStops(plan);
          const myStop = stops.find((s) => s.fillerId === fillerId);
          const palletQty = myStop?.pallets ?? myStop?.estimatedPallets ?? 0;
          const separatorQty = myStop?.separators ?? myStop?.estimatedSeparators ?? 0;

          return (
            <div
              key={plan.id}
              className="border border-indigo-200 bg-indigo-50/50 rounded-lg p-4 hover:bg-indigo-50 transition"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">Plan #{plan.id}</span>
                    <StatusBadge status={plan.status} />
                  </div>
                  <p className="text-sm text-gray-700">
                    📅 Planlı tarih:{' '}
                    <strong>
                      {new Date(plan.plannedDate).toLocaleDateString('tr-TR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </p>
                  {myStop?.sequence != null && (
                    <p className="text-sm text-info-700 mt-1">
                      📍 Rotada {myStop.sequence}. durak (toplam {stops.length} durak)
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {palletQty > 0 && (
                      <span className="text-yellow-700">📦 {palletQty} palet alınacak</span>
                    )}
                    {separatorQty > 0 && (
                      <span className="text-purple-700">🔲 {separatorQty} ayırıcı alınacak</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {vehicle ? (
                    <div className="bg-white border border-gray-200 rounded p-2 min-w-[160px]">
                      <p className="text-xs text-info-500 mb-1">Gelecek araç</p>
                      <p className="font-bold text-gray-900">{vehicle.plateNumber}</p>
                      {vehicle.currentDriver && (
                        <p className="text-xs text-info-700 mt-1">
                          Sürücü: {vehicle.currentDriver.name}
                          {vehicle.currentDriver.phone && (
                            <>
                              <br />
                              📞 {vehicle.currentDriver.phone}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-info-500 italic">Araç henüz atanmadı</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
