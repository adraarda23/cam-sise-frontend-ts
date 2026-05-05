import React, { useState } from 'react';
import { routeApi } from '../../api/routeApi';
import { MultiVehicleOptimizeResponse } from '../../types/api.types';
import { Card } from '../common/Card';
import { handleApiError } from '../../utils/errorHandler';

export const RouteOptimizationForm: React.FC = () => {
  const [depotId, setDepotId] = useState<number>(1);
  const [plannedDate, setPlannedDate] = useState<string>('');
  const [maxVehicles, setMaxVehicles] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MultiVehicleOptimizeResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await routeApi.optimizeMultiVehicle({
        depotId,
        plannedDate: plannedDate || undefined,
        maxVehicles,
      });
      setResult(response);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-500 p-3 rounded-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rota Optimizasyonu (CVRP)</h2>
            <p className="text-sm text-gray-600">Çoklu araç için optimize edilmiş toplama rotaları oluşturun</p>
          </div>
        </div>

        <form onSubmit={handleOptimize} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depo ID
              </label>
              <input
                type="number"
                value={depotId}
                onChange={(e) => setDepotId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planlanan Tarih (opsiyonel)
              </label>
              <input
                type="date"
                value={plannedDate}
                onChange={(e) => setPlannedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Boş bırakılırsa yarın kullanılır</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Araç Sayısı
              </label>
              <input
                type="number"
                value={maxVehicles}
                onChange={(e) => setMaxVehicles(Number(e.target.value))}
                min={1}
                max={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 font-medium flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimize Ediliyor...
              </>
            ) : (
              'Rotaları Optimize Et'
            )}
          </button>
        </form>
      </Card>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <Card>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimizasyon Sonucu</h3>
            <p className="text-sm text-gray-600">
              {result.vehiclesUsed} araç için optimize edilmiş rotalar oluşturuldu
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Kullanılan Araç</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{result.vehiclesUsed}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Toplam Mesafe</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{result.totalDistanceKm.toFixed(1)}</p>
              <p className="text-xs text-green-600 mt-1">km</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Toplam Palet</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{result.totalPallets}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">Toplam Ayırıcı</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{result.totalSeparators}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-4">Oluşturulan Rotalar</h4>
            <div className="space-y-3">
              {result.plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">Rota #{index + 1}</h5>
                        <p className="text-xs text-gray-500">Plan ID: {plan.id}</p>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                      {plan.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Mesafe</p>
                      <p className="font-semibold text-gray-900">
                        {plan.totalDistance.kilometers.toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Süre</p>
                      <p className="font-semibold text-gray-900">
                        {plan.estimatedDuration.minutes} dk
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Palet</p>
                      <p className="font-semibold text-gray-900">
                        {plan.totalCapacityPallets}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ayırıcı</p>
                      <p className="font-semibold text-gray-900">
                        {plan.totalCapacitySeparators}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
