import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { CollectionPlan } from '../../types/api.types';
import { routeApi } from '../../api/routeApi';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Auto-fit haritayı tüm noktalara göre ayarla
const FitBounds: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 10);
    }
  }, [map, positions]);
  return null;
};

// Numaralı durak ikonu — box-sizing: border-box, böylece border iconSize'a dahil olur
// ve iconAnchor (merkez) gerçek render merkezi ile aynı noktaya düşer.
const createStopIcon = (sequence: number) =>
  L.divIcon({
    html: `<div style="
      box-sizing:border-box;
      background:#DC2626;color:white;width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:14px;font-family:sans-serif;
      border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"
    >${sequence}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

// Depo ikonu — aynı düzeltme: border-box ile anchor=merkez tutarlı.
const depotIcon = L.divIcon({
  html: `<div style="
    box-sizing:border-box;
    background:#16A34A;color:white;width:38px;height:38px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:15px;font-family:sans-serif;
    border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"
  >D</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

interface RouteStop {
  sequence: number;
  fillerId: number;
  fillerName?: string;
  latitude: number;
  longitude: number;
  pallets?: number;
  separators?: number;
  estimatedPallets?: number;
  estimatedSeparators?: number;
}

interface RouteMapProps {
  plan: CollectionPlan;
  depotCoordinates: [number, number];
}

export const RouteMap: React.FC<RouteMapProps> = ({ plan, depotCoordinates }) => {
  const rawStops: RouteStop[] = JSON.parse(plan.routeStopsJson);
  const stops = [...rawStops].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));

  // Local copy of geometry so we can refresh it from OSRM on demand.
  const [geometryJson, setGeometryJson] = useState<string | null>(plan.routeGeometryJson ?? null);
  const [refreshing, setRefreshing] = useState(false);

  // If geometry is missing when the modal opens, fetch it lazily from OSRM.
  // Silent fallback to bird's-eye polyline if OSRM is unavailable — no toast
  // spam since the user already sees the polyline either way.
  useEffect(() => {
    if (geometryJson) return;
    let cancelled = false;
    (async () => {
      try {
        setRefreshing(true);
        const refreshed = await routeApi.refreshGeometry(plan.id);
        if (!cancelled && refreshed.routeGeometryJson) {
          setGeometryJson(refreshed.routeGeometryJson);
        }
      } catch {
        // Silent — straight-line polyline is already drawn from routeStops.
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [plan.id, geometryJson]);

  const roadGeometry = parseRouteGeometry(geometryJson);
  const usingRoadGeometry = roadGeometry !== null && roadGeometry.length > 1;

  const routeCoordinates: [number, number][] = usingRoadGeometry
    ? roadGeometry!
    : [
        depotCoordinates,
        ...stops.map(s => [s.latitude, s.longitude] as [number, number]),
        depotCoordinates,
      ];

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      const refreshed = await routeApi.refreshGeometry(plan.id);
      if (refreshed.routeGeometryJson) {
        setGeometryJson(refreshed.routeGeometryJson);
        toast.success('Yol geometrisi güncellendi');
      } else {
        toast('OSRM şu an cevap vermiyor — kuş uçuşu mesafe gösteriliyor.', { icon: 'ℹ️' });
      }
    } catch {
      toast('OSRM çağrısı başarısız oldu, kuş uçuşu mesafe gösteriliyor.', { icon: 'ℹ️' });
    } finally {
      setRefreshing(false);
    }
  };

  const allPositions: [number, number][] = [
    depotCoordinates,
    ...stops.map(s => [s.latitude, s.longitude] as [number, number]),
  ];

  return (
    <div>
      {/* Sıra açıklaması + yol haritası kontrolü */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold">D</span>
            <span className="text-gray-600">Depo (başlangıç / bitiş)</span>
          </span>
          {stops.map(s => (
            <span key={s.fillerId} className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">{s.sequence}</span>
              <span className="text-gray-600">{s.fillerName || `Dolumcu #${s.fillerId}`}</span>
            </span>
          ))}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
          title="OSRM üzerinden yol-takipli polyline'ı yeniden çek"
        >
          <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Hesaplanıyor...' : 'Yol haritasını yenile'}
        </button>
      </div>

      <MapContainer
        center={depotCoordinates}
        zoom={7}
        style={{ height: '480px', width: '100%' }}
        className="rounded-lg shadow-md z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds positions={allPositions} />

        {/* Depo marker */}
        <Marker position={depotCoordinates} icon={depotIcon}>
          <Popup>
            <div className="text-sm font-medium text-green-700">🏭 Depo — Başlangıç / Bitiş</div>
          </Popup>
        </Marker>

        {/* Sıralı durak marker'ları */}
        {stops.map(stop => {
          const pallets = stop.pallets ?? stop.estimatedPallets ?? 0;
          const separators = stop.separators ?? stop.estimatedSeparators ?? 0;
          return (
            <Marker
              key={stop.fillerId}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop.sequence)}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <div className="font-bold text-red-700 text-base">#{stop.sequence}. Durak</div>
                  <div className="font-semibold text-gray-900">
                    {stop.fillerName || `Dolumcu #${stop.fillerId}`}
                  </div>
                  <hr className="my-1" />
                  {pallets > 0 && (
                    <div className="text-yellow-700">📦 Palet: <strong>{pallets}</strong></div>
                  )}
                  {separators > 0 && (
                    <div className="text-purple-700">🔲 Ayırıcı: <strong>{separators}</strong></div>
                  )}
                  <div className="text-xs text-gray-400 pt-1">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/*
          Rota çizgisi.
          - Yol geometrisi varsa: yol takip eden düz (kesintisiz) çizgi
          - Yoksa: kesik çizgi (kuş uçuşu, fallback)
        */}
        <Polyline
          positions={routeCoordinates}
          color="#4F46E5"
          weight={usingRoadGeometry ? 4 : 3}
          opacity={usingRoadGeometry ? 0.9 : 0.7}
          dashArray={usingRoadGeometry ? undefined : '10, 6'}
        />
      </MapContainer>

      {!usingRoadGeometry && (
        <div className="mt-2 text-xs text-estimated-700 italic">
          * Polyline kuş uçuşu mesafe ile çiziliyor (yol geometrisi mevcut değil)
        </div>
      )}
    </div>
  );
};

function parseRouteGeometry(geometryJson: string | null): [number, number][] | null {
  if (!geometryJson) return null;
  try {
    const raw = JSON.parse(geometryJson);
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const coords: [number, number][] = [];
    for (const point of raw) {
      if (Array.isArray(point) && point.length >= 2) {
        coords.push([Number(point[0]), Number(point[1])]);
      }
    }
    return coords.length > 0 ? coords : null;
  } catch {
    return null;
  }
}
