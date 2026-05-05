import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CollectionPlan } from '../../types/api.types';

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

// Numaralı durak ikonu
const createStopIcon = (sequence: number) =>
  L.divIcon({
    html: `<div style="
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

// Depo ikonu
const depotIcon = L.divIcon({
  html: `<div style="
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

  const routeCoordinates: [number, number][] = [
    depotCoordinates,
    ...stops.map(s => [s.latitude, s.longitude] as [number, number]),
    depotCoordinates,
  ];

  const allPositions: [number, number][] = [
    depotCoordinates,
    ...stops.map(s => [s.latitude, s.longitude] as [number, number]),
  ];

  return (
    <div>
      {/* Sıra açıklaması */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
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

        {/* Rota çizgisi — kesik çizgi, sıralı */}
        <Polyline
          positions={routeCoordinates}
          color="#4F46E5"
          weight={3}
          opacity={0.8}
          dashArray="10, 6"
        />
      </MapContainer>
    </div>
  );
};
