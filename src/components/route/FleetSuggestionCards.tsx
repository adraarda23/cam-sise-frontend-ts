import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi } from '../../api/fleetApi';
import { FleetComposition } from '../../types/api.types';
import { Card } from '../common/Card';
import { ActualValue } from '../common/ActualValue';
import { EstimatedValue } from '../common/EstimatedValue';
import { handleApiError } from '../../utils/errorHandler';

interface Props {
  depotId?: number;
  estimatedRouteKm?: number;
}

/**
 * "Filo Önerisi" UI bileşeni.
 * Backend'in döndürdüğü 2-3 alternatif filo kompozisyonunu kart olarak gösterir.
 * Kullanıcı kart seçer → optimize akışına devam eder.
 *
 * Maliyet tahmin değerleri estimatedValue olarak işaretlenir (turuncu/italik).
 * Toplam kapasite ve araç sayısı kesin (actualValue, yeşil).
 */
export const FleetSuggestionCards: React.FC<Props> = ({ depotId, estimatedRouteKm }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [compositions, setCompositions] = useState<FleetComposition[] | null>(null);

  const suggestMutation = useMutation({
    mutationFn: () =>
      fleetApi.suggest({
        depotId,
        estimatedRouteKm: estimatedRouteKm ?? 0,
      }),
    onSuccess: (data) => {
      setCompositions(data);
      if (data.length === 0) {
        toast.error('Onaylı talep bulunamadı veya uygun araç tipi yok');
      } else {
        toast.success(`${data.length} filo önerisi alındı`);
      }
    },
    onError: (e) => toast.error(handleApiError(e)),
  });

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Filo Önerisi</h3>
          <p className="text-sm text-info-500">
            Sistem onaylı taleplere göre 2-3 alternatif filo kompozisyonu önerir.
            Tradeoff'lara göre seçim yapın.
          </p>
        </div>
        <button
          onClick={() => suggestMutation.mutate()}
          disabled={suggestMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {suggestMutation.isPending ? 'Hesaplanıyor...' : 'Filo Önerisi Al'}
        </button>
      </div>

      {compositions && compositions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {compositions.map((c, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`text-left p-4 rounded-lg border-2 transition ${
                selected === idx
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <h4 className="font-semibold text-gray-900">{c.label}</h4>
              <p className="text-xs text-info-500 mt-1 line-clamp-2">{c.reason}</p>

              <div className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-info-500">Araç sayısı:</span>
                  <ActualValue value={c.vehicleCount} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-info-500">Kapasite:</span>
                  <ActualValue value={`${c.totalCapacity.pallets} / ${c.totalCapacity.separators}`} size="sm" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-info-500">Atıl kapasite:</span>
                  <span className="text-estimated-700 italic">{c.slackPercent.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-info-500">Tahmini maliyet:</span>
                  <EstimatedValue
                    value={c.estimatedCostTRY}
                    unit="TRY"
                    size="sm"
                    showRange={false}
                    precision={0}
                  />
                </div>
              </div>

              {c.assignments.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-gray-100 space-y-0.5 text-xs text-info-700">
                  {c.assignments.map((a) => (
                    <li key={a.vehicleTypeId}>
                      {a.count}× {a.vehicleTypeName} ({a.capacityPerVehicle.pallets}/{a.capacityPerVehicle.separators})
                    </li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>
      )}

      {compositions && compositions.length === 0 && (
        <p className="text-sm text-info-500 italic">Şu an için öneri yok.</p>
      )}

      {selected != null && compositions && (
        <div className="mt-4 p-3 bg-actual-50 border border-actual-200 rounded text-sm text-actual-700">
          ✓ <strong>{compositions[selected].label}</strong> seçildi. Bu kompozisyon ile devam edebilirsiniz.
        </div>
      )}
    </Card>
  );
};
