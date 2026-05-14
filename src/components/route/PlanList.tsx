import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { routeApi } from '../../api/routeApi';
import { fillerApi } from '../../api/fillerApi';
import { vehicleApi } from '../../api/vehicleApi';
import { depotApi } from '../../api/depotApi';
import { CollectionPlan, RouteStop, Filler, Vehicle, Depot } from '../../types/api.types';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';
import { RouteMap } from '../map/RouteMap';
import { useConfirm } from '../common/ConfirmDialog';
import { useInputDialog } from '../common/InputDialog';

const PAGE_SIZE = 5;

export const PlanList: React.FC = () => {
  const confirm = useConfirm();
  const askInput = useInputDialog();
  const [plans, setPlans] = useState<CollectionPlan[]>([]);
  const [fillers, setFillers] = useState<Filler[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<CollectionPlan | null>(null);
  const [assignVehicleModal, setAssignVehicleModal] = useState<{planId: number} | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  useEffect(() => {
    loadData(page);
  }, [page, filter]);

  const loadData = async (p: number) => {
    try {
      setIsLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [plansData, fillersData, vehiclesData, depotsData] = await Promise.all([
        routeApi.getCollectionPlans({ status, page: p, size: PAGE_SIZE }),
        fillerApi.getAll({ page: 0, size: 200 }),
        vehicleApi.getAll({ page: 0, size: 200 }),
        depotApi.getAll(),
      ]);
      setPlans(plansData.content ?? []);
      setTotalPages(plansData.totalPages ?? 0);
      setTotalElements(plansData.totalElements ?? 0);
      setFillers(fillersData.content ?? []);
      setVehicles(vehiclesData.content ?? []);
      setDepots(depotsData ?? []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await routeApi.getCollectionPlans({ status, page, size: PAGE_SIZE });
      setPlans(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const getFillerName = (fillerId: number): string => {
    const filler = fillers.find(f => f.id === fillerId);
    return filler ? filler.name : `Dolumcu #${fillerId}`;
  };

  const openAssignVehicleModal = (planId: number) => {
    setAssignVehicleModal({ planId });
    setSelectedVehicleId(null);
  };

  const handleAssignVehicle = async () => {
    if (!assignVehicleModal || !selectedVehicleId) return;

    try {
      await routeApi.assignVehicle(assignVehicleModal.planId, selectedVehicleId);
      setAssignVehicleModal(null);
      setSelectedVehicleId(null);
      toast.success('Araç atandı');
      loadPlans();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleStartCollection = async (planId: number) => {
    const ok = await confirm({
      title: 'Toplama planını başlat',
      description: `Plan #${planId} başlatılacak. Araç depodan ayrılmış olarak işaretlenir ve rota IN_PROGRESS durumuna geçer.`,
      confirmLabel: 'Başlat',
      cancelLabel: 'Vazgeç',
      variant: 'primary',
    });
    if (!ok) return;

    try {
      await routeApi.startCollection(planId);
      toast.success('Toplama başlatıldı');
      loadPlans();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleCompleteCollection = async (planId: number, plan: CollectionPlan) => {
    const values = await askInput({
      title: `Plan #${planId} — Toplamayı tamamla`,
      description: `Fiili toplanan miktarları girin. Planlanan: ${plan.totalCapacityPallets} palet / ${plan.totalCapacitySeparators} ayırıcı.`,
      confirmLabel: 'Tamamla',
      cancelLabel: 'Vazgeç',
      fields: [
        {
          name: 'pallets',
          label: 'Toplanan palet sayısı',
          type: 'number',
          defaultValue: plan.totalCapacityPallets,
          min: 0,
          helperText: `Planlanan: ${plan.totalCapacityPallets}`,
        },
        {
          name: 'separators',
          label: 'Toplanan ayırıcı sayısı',
          type: 'number',
          defaultValue: plan.totalCapacitySeparators,
          min: 0,
          helperText: `Planlanan: ${plan.totalCapacitySeparators}`,
        },
      ],
    });
    if (!values) return;

    const pallets = parseInt(values.pallets);
    const separators = parseInt(values.separators);
    if (isNaN(pallets) || isNaN(separators) || pallets < 0 || separators < 0) {
      toast.error('Geçerli sayılar giriniz');
      return;
    }

    try {
      await routeApi.completeCollection(planId, pallets, separators);
      toast.success(`Toplama tamamlandı: ${pallets} palet / ${separators} ayırıcı`);
      loadPlans();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const handleCancelPlan = async (planId: number) => {
    const ok = await confirm({
      title: 'Planı iptal et',
      description: `Plan #${planId} iptal edilecek. Bağlı tüm taleplerin durumu eski haline döner. Bu işlem geri alınamaz.`,
      confirmLabel: 'İptal Et',
      cancelLabel: 'Vazgeç',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await routeApi.cancelPlan(planId);
      toast.success('Plan iptal edildi');
      loadPlans();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      ALL: 'Tümü',
      GENERATED: 'Oluşturuldu',
      ASSIGNED: 'Araç Atandı',
      IN_PROGRESS: 'Devam Ediyor',
      COMPLETED: 'Tamamlandı',
      CANCELLED: 'İptal Edildi',
    };
    return labels[status] || status;
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
      <div className="flex items-center justify-between">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {['ALL', 'GENERATED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition duration-150 ${
                filter === status
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-600 whitespace-nowrap">
          <span className="font-semibold text-indigo-600">{totalElements}</span> plan
        </div>
      </div>

      {plans.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-4 text-gray-600">Plan bulunamadı</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans
            .sort((a, b) => b.id - a.id)
            .map((plan) => {
            const routeStops: RouteStop[] = JSON.parse(plan.routeStopsJson);

            return (
              <Card key={plan.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                      {plan.id}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Toplama Planı #{plan.id}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(plan.plannedDate).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Depo #{plan.depotId}
                        </div>
                        {plan.vehicleId && (
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Araç #{plan.vehicleId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Mesafe</p>
                    <p className="text-xl font-bold text-blue-900">
                      {plan.totalDistance.kilometers.toFixed(1)} km
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Süre</p>
                    <p className="text-xl font-bold text-green-900">{plan.estimatedDuration.minutes} dk</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-yellow-600 font-medium">Palet</p>
                    <p className="text-xl font-bold text-yellow-900">{plan.totalCapacityPallets}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Ayırıcı</p>
                    <p className="text-xl font-bold text-purple-900">{plan.totalCapacitySeparators}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Duraklar ({routeStops.length})
                  </h4>
                  <div className="space-y-2">
                    {routeStops.map((stop: any, idx: number) => (
                      <div key={`${stop.fillerId}-${idx}`} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {stop.sequence || idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{getFillerName(stop.fillerId)}</p>
                              <p className="text-xs text-gray-500">ID: {stop.fillerId}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs">
                            {(stop.pallets || stop.estimatedPallets) > 0 && (
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                                Palet: {stop.pallets || stop.estimatedPallets}
                              </span>
                            )}
                            {(stop.separators || stop.estimatedSeparators) > 0 && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                                Ayırıcı: {stop.separators || stop.estimatedSeparators}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.status === 'GENERATED' && (
                    <>
                      <button
                        onClick={() => openAssignVehicleModal(plan.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-150"
                      >
                        Araç Ata
                      </button>
                      <button
                        onClick={() => handleCancelPlan(plan.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-150"
                      >
                        İptal Et
                      </button>
                    </>
                  )}

                  {plan.status === 'ASSIGNED' && (
                    <>
                      <button
                        onClick={() => handleStartCollection(plan.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition duration-150"
                      >
                        Başlat
                      </button>
                      <button
                        onClick={() => handleCancelPlan(plan.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition duration-150"
                      >
                        İptal Et
                      </button>
                    </>
                  )}

                  {plan.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteCollection(plan.id, plan)}
                      className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition duration-150"
                    >
                      Tamamla
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition duration-150"
                  >
                    Haritada Göster
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Vehicle Modal */}
      {assignVehicleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Araç Seç - Plan #{assignVehicleModal.planId}
                </h3>
                <button
                  onClick={() => {
                    setAssignVehicleModal(null);
                    setSelectedVehicleId(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Araç Seçiniz
                </label>
                <select
                  value={selectedVehicleId || ''}
                  onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Araç Seçin --</option>
                  {vehicles
                    .filter(v => v.status === 'AVAILABLE')
                    .map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.status === 'AVAILABLE' ? 'Müsait' : 'Meşgul'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setAssignVehicleModal(null);
                    setSelectedVehicleId(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-150"
                >
                  İptal
                </button>
                <button
                  onClick={handleAssignVehicle}
                  disabled={!selectedVehicleId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Araç Ata
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Plan #{selectedPlan.id} - Rota Haritası
                </h3>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {(() => {
                // Plan'ın gerçek depot'unu lookup et; bulunamazsa Bursa merkez fallback.
                const planDepot = depots.find(d => d.id === selectedPlan.depotId);
                const depotCoords: [number, number] = planDepot
                  ? [planDepot.location.latitude, planDepot.location.longitude]
                  : [40.1885, 29.061];
                return <RouteMap plan={selectedPlan} depotCoordinates={depotCoords} />;
              })()}
            </div>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        size={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
};
