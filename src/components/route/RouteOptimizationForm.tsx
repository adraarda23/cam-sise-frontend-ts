import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { routeApi } from '../../api/routeApi';
import { MultiVehicleOptimizeResponse } from '../../types/api.types';
import { Card } from '../common/Card';
import { ActualValue } from '../common/ActualValue';
import { EstimatedValue } from '../common/EstimatedValue';
import { FleetSuggestionCards } from './FleetSuggestionCards';
import { handleApiError } from '../../utils/errorHandler';

const schema = z.object({
  depotId: z.coerce.number().int().positive('Geçerli depo ID giriniz'),
  plannedDate: z.string().optional(),
  maxVehicles: z.coerce.number().int().min(1).max(20),
});
type FormValues = z.infer<typeof schema>;

export const RouteOptimizationForm: React.FC = () => {
  const [result, setResult] = useState<MultiVehicleOptimizeResponse | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { depotId: 1, plannedDate: '', maxVehicles: 10 },
  });

  const optimize = useMutation({
    mutationFn: (values: FormValues) =>
      routeApi.optimizeMultiVehicle({
        depotId: values.depotId,
        plannedDate: values.plannedDate || undefined,
        maxVehicles: values.maxVehicles,
      }),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${data.vehiclesUsed} araç için rotalar oluşturuldu`);
    },
    onError: (e) => toast.error(handleApiError(e)),
  });

  const onSubmit = form.handleSubmit((values) => optimize.mutate(values));
  const depotId = form.watch('depotId');

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

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Depo ID</label>
              <input
                type="number"
                {...form.register('depotId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {form.formState.errors.depotId && (
                <p className="text-xs text-anomaly-600 mt-1">{form.formState.errors.depotId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Planlanan Tarih (opsiyonel)</label>
              <input
                type="date"
                {...form.register('plannedDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-info-500 mt-1">Boş bırakılırsa yarın kullanılır</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Araç Sayısı</label>
              <input
                type="number"
                {...form.register('maxVehicles')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={optimize.isPending}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 font-medium"
          >
            {optimize.isPending ? 'Optimize Ediliyor...' : 'Rotaları Optimize Et'}
          </button>
        </form>
      </Card>

      <FleetSuggestionCards depotId={depotId} />

      {result && (
        <Card>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Optimizasyon Sonucu</h3>
            <p className="text-sm text-gray-600">
              {result.vehiclesUsed} araç için optimize edilmiş rotalar oluşturuldu
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-actual-50 p-4 rounded-lg border border-actual-200">
              <p className="text-sm text-actual-600 font-medium">Kullanılan Araç</p>
              <ActualValue value={result.vehiclesUsed} size="xl" />
            </div>
            <div className="bg-estimated-50 p-4 rounded-lg border border-estimated-200">
              <p className="text-sm text-estimated-700 font-medium">Toplam Mesafe (tahmini)</p>
              <EstimatedValue value={result.totalDistanceKm} unit="km" size="xl" showRange={false} />
            </div>
            <div className="bg-actual-50 p-4 rounded-lg border border-actual-200">
              <p className="text-sm text-actual-600 font-medium">Toplam Palet</p>
              <ActualValue value={result.totalPallets} size="xl" />
            </div>
            <div className="bg-actual-50 p-4 rounded-lg border border-actual-200">
              <p className="text-sm text-actual-600 font-medium">Toplam Ayırıcı</p>
              <ActualValue value={result.totalSeparators} size="xl" />
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
                      <p className="text-info-500">Mesafe</p>
                      <EstimatedValue value={plan.totalDistance.kilometers} unit="km" showRange={false} size="sm" precision={1} />
                    </div>
                    <div>
                      <p className="text-info-500">Süre</p>
                      <EstimatedValue value={plan.estimatedDuration.minutes} unit="dk" showRange={false} size="sm" precision={0} />
                    </div>
                    <div>
                      <p className="text-info-500">Palet</p>
                      <ActualValue value={plan.totalCapacityPallets} size="sm" />
                    </div>
                    <div>
                      <p className="text-info-500">Ayırıcı</p>
                      <ActualValue value={plan.totalCapacitySeparators} size="sm" />
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
