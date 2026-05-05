import React, { useEffect, useState } from 'react';
import { vehicleApi } from '../../api/vehicleApi';
import { depotApi } from '../../api/depotApi';
import { vehicleTypeApi } from '../../api/vehicleTypeApi';
import { Vehicle, Depot, VehicleType, RegisterVehicleRequest } from '../../types/api.types';
import { Card } from '../common/Card';
import { Pagination } from '../common/Pagination';
import { handleApiError } from '../../utils/errorHandler';

const PAGE_SIZE = 5;

export const VehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Add/Edit modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    depotId: '',
    vehicleTypeId: '',
    plateNumber: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => { setPage(0); setDebouncedSearch(search); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadData(page);
  }, [page, filter, debouncedSearch]);

  const loadData = async (p: number) => {
    try {
      setIsLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const [vehiclesData, depotsData, vehicleTypesData] = await Promise.all([
        vehicleApi.getAll({ status, page: p, size: PAGE_SIZE, search: debouncedSearch || undefined }),
        depotApi.getAll(),
        vehicleTypeApi.getAll(undefined, true),
      ]);
      setVehicles(vehiclesData.content);
      setTotalPages(vehiclesData.totalPages);
      setTotalElements(vehiclesData.totalElements);
      setDepots(depotsData);
      setVehicleTypes(vehicleTypesData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getDepotName = (depotId: number): string => {
    const depot = depots.find(d => d.id === depotId);
    return depot ? depot.name : `Depo #${depotId}`;
  };

  const getVehicleTypeName = (vehicleTypeId: number): string => {
    const vehicleType = vehicleTypes.find(vt => vt.id === vehicleTypeId);
    return vehicleType ? vehicleType.name : `Tip #${vehicleTypeId}`;
  };

  const handleAddVehicle = async () => {
    try {
      const request: RegisterVehicleRequest = {
        depotId: Number(formData.depotId),
        vehicleTypeId: Number(formData.vehicleTypeId),
        plateNumber: formData.plateNumber,
      };
      await vehicleApi.register(request);
      setShowAddModal(false);
      setFormData({ depotId: '', vehicleTypeId: '', plateNumber: '' });
      loadData(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      depotId: vehicle.depotId.toString(),
      vehicleTypeId: vehicle.vehicleTypeId.toString(),
      plateNumber: vehicle.plateNumber,
    });
  };

  const handleStatusChange = async (vehicleId: number, newStatus: string) => {
    try {
      await vehicleApi.changeStatus(vehicleId, newStatus);
      loadData(page);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      ALL: 'Tümü',
      AVAILABLE: 'Müsait',
      ON_ROUTE: 'Yolda',
      MAINTENANCE: 'Bakımda',
      INACTIVE: 'Hizmet Dışı',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800',
      ON_ROUTE: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <div className="flex items-center justify-end">
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
          onClick={() => setShowAddModal(true)}
        >
          Yeni Araç Ekle
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {['ALL', 'AVAILABLE', 'ON_ROUTE', 'MAINTENANCE', 'INACTIVE'].map((status) => (
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
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Plakaya göre ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>
        </div>
        <div className="text-sm text-gray-600 whitespace-nowrap">
          <span className="font-semibold text-indigo-600">{totalElements}</span> araç
        </div>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="mt-4 text-gray-600">Araç bulunamadı</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles
            .sort((a, b) => b.id - a.id)
            .map((vehicle) => (
            <Card key={vehicle.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {vehicle.id}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{vehicle.plateNumber}</h3>
                    <p className="text-sm text-gray-500">Araç #{vehicle.id}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                  {getStatusLabel(vehicle.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Depo:</span>
                  <span className="font-medium text-gray-900">{getDepotName(vehicle.depotId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Araç Tipi:</span>
                  <span className="font-medium text-gray-900">{getVehicleTypeName(vehicle.vehicleTypeId)}</span>
                </div>
                {vehicle.currentDriver && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs text-gray-500 mb-1">Sürücü Bilgileri:</p>
                      <div className="flex justify-between">
                        <span className="text-gray-600">İsim:</span>
                        <span className="font-medium text-gray-900">{vehicle.currentDriver.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefon:</span>
                        <span className="font-medium text-gray-900">{vehicle.currentDriver.phone}</span>
                      </div>
                    </div>
                  </>
                )}
                {vehicle.currentCollectionPlanId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan ID:</span>
                    <span className="font-medium text-indigo-600">#{vehicle.currentCollectionPlanId}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition duration-150"
                  onClick={() => handleEditClick(vehicle)}
                >
                  Durum Değiştir
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Araç Ekle</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depo</label>
                  <select
                    value={formData.depotId}
                    onChange={(e) => setFormData({ ...formData, depotId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Depo Seçin</option>
                    {depots.map(depot => (
                      <option key={depot.id} value={depot.id}>{depot.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Araç Tipi</label>
                  <select
                    value={formData.vehicleTypeId}
                    onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Araç Tipi Seçin</option>
                    {vehicleTypes.map(vt => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plaka</label>
                  <input
                    type="text"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    placeholder="34 ABC 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ depotId: '', vehicleTypeId: '', plateNumber: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddVehicle}
                  disabled={!formData.depotId || !formData.vehicleTypeId || !formData.plateNumber}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Araç Durumu Değiştir #{editingVehicle.id}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plaka</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{formData.plateNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depo</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{getDepotName(editingVehicle.depotId)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Araç Tipi</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{getVehicleTypeName(editingVehicle.vehicleTypeId)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Durum</label>
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(editingVehicle.status)}`}>
                      {getStatusLabel(editingVehicle.status)}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Durum</label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleStatusChange(editingVehicle.id, e.target.value);
                        setEditingVehicle(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Durum Seçin</option>
                    {/* AVAILABLE -> MAINTENANCE, INACTIVE */}
                    {editingVehicle.status === 'AVAILABLE' && (
                      <>
                        <option value="MAINTENANCE">Bakımda</option>
                        <option value="INACTIVE">Hizmet Dışı</option>
                      </>
                    )}
                    {/* ON_ROUTE -> MAINTENANCE only (not AVAILABLE or INACTIVE) */}
                    {editingVehicle.status === 'ON_ROUTE' && (
                      <option value="MAINTENANCE">Bakımda</option>
                    )}
                    {/* MAINTENANCE -> AVAILABLE, INACTIVE */}
                    {editingVehicle.status === 'MAINTENANCE' && (
                      <>
                        <option value="AVAILABLE">Müsait</option>
                        <option value="INACTIVE">Hizmet Dışı</option>
                      </>
                    )}
                    {/* INACTIVE -> AVAILABLE, MAINTENANCE */}
                    {editingVehicle.status === 'INACTIVE' && (
                      <>
                        <option value="AVAILABLE">Müsait</option>
                        <option value="MAINTENANCE">Bakımda</option>
                      </>
                    )}
                  </select>
                  {editingVehicle.status === 'ON_ROUTE' && (
                    <div className="mt-2 bg-red-50 border-l-4 border-red-400 p-3">
                      <p className="text-xs text-red-700 font-semibold">
                        ⚠️ DİKKAT: Bu araç aktif bir rotada!
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Durum değiştirilirse ilişkili toplama planı otomatik olarak iptal edilecektir.
                      </p>
                    </div>
                  )}
                  {editingVehicle.status !== 'ON_ROUTE' && (
                    <div className="mt-2 bg-blue-50 border-l-4 border-blue-400 p-3">
                      <p className="text-xs text-blue-700">
                        {editingVehicle.status === 'AVAILABLE' && '• Müsait araçlar bakıma veya hizmet dışına alınabilir'}
                        {editingVehicle.status === 'MAINTENANCE' && '• Bakımdaki araçlar müsait veya hizmet dışına alınabilir'}
                        {editingVehicle.status === 'INACTIVE' && '• Hizmet dışı araçlar müsait veya bakıma alınabilir'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setEditingVehicle(null)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Kapat
                </button>
              </div>
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
