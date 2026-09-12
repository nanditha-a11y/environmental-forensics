import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Layers, Locate, X, Check, Target } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { EvidenceModal } from './EvidenceModal';
import { useIncidents } from '../../hooks/useIncidents';
import { useEvidence } from '../../hooks/useEvidence';
import { useMonitoringSites, useNearbyEvidence } from '../../hooks/useSpatialData';

// Haversine distance formula (in km)
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Default fallback map marker coordinates for Bengaluru region when backend payload omits coordinates
const fallbackCoordinates: Record<string, [number, number]> = {
  m1: [12.9716, 77.5946],
  m2: [12.985, 77.605],
  m3: [12.955, 77.58],
  m4: [12.968, 77.588],
  m5: [12.99, 77.62],
  m6: [12.94, 77.56],
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createGlowingMarker = (color: string, glow: boolean = false) => {
  return L.divIcon({
    className: 'custom-glowing-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 16px; height: 16px;">
        ${
          glow
            ? `<div style="position: absolute; inset: 0; border-radius: 50%; background-color: ${color}; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
        }
        <div style="
          position: relative;
          width: 12px;
          height: 12px;
          background-color: ${color};
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          box-shadow: 0 0 12px ${color}88;
          cursor: pointer;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const getRiskColor = (risk: string) => {
  switch (risk?.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return '#f87171';
    case 'MEDIUM':
      return '#fbbf24';
    case 'LOW':
      return '#34d399';
    default:
      return '#60a5fa';
  }
};

const legendItems = [
  { label: 'High Risk', color: '#f87171' },
  { label: 'Medium Risk', color: '#fbbf24' },
  { label: 'Low Risk', color: '#34d399' },
  { label: 'Sampling Site', color: '#22d3ee' },
  { label: 'Drone Survey', color: '#60a5fa' },
];

const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface SpatialMapProps {
  center?: [number, number];
  zoom?: number;
  onSelectIncident?: (incident: any) => void;
}

export const SpatialMap: React.FC<SpatialMapProps> = ({
  center = [12.9716, 77.5946],
  zoom = 13,
  onSelectIncident,
}) => {
  // TanStack Query integrations
  const { data: apiIncidents } = useIncidents();
  const { data: apiEvidence } = useEvidence();
  const { data: apiMonitoringSites } = useMonitoringSites();

  const [queryCenter, setQueryCenter] = useState<[number, number]>(center);
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Spatial Radius Query Hook
  const { data: apiNearbyEvidence } = useNearbyEvidence({
    lat: queryCenter[0],
    lng: queryCenter[1],
    radiusKm,
  });

  // Safe array references strictly relying on backend response data
  const safeIncidents = Array.isArray(apiIncidents) ? apiIncidents : [];
  const safeEvidence = Array.isArray(apiEvidence) ? apiEvidence : [];
  const safeSites = Array.isArray(apiMonitoringSites) ? apiMonitoringSites : [];
  const safeNearbyEvidence = Array.isArray(apiNearbyEvidence) ? apiNearbyEvidence : [];

  const [selected, setSelected] = useState<any | null>(safeIncidents[0] || null);

  // Layer Controls State
  const [showLabels, setShowLabels] = useState(true);
  const [showSites, setShowSites] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const { push } = useToast();

  // Helper to resolve coordinates from backend or fallback dict
  const getMarkerCoords = (m: any): [number, number] => {
    if (Array.isArray(m.coordinates) && m.coordinates.length === 2) {
      return m.coordinates;
    }
    if (m.lat && m.lng) {
      return [m.lat, m.lng];
    }
    return fallbackCoordinates[m.id] || center;
  };

  // Filter markers within radius using backend coordinates
  const filteredMarkers = safeIncidents.filter((m: any) => {
    const coords = getMarkerCoords(m);
    const dist = calculateDistanceKm(queryCenter[0], queryCenter[1], coords[0], coords[1]);
    return dist <= radiusKm;
  });

  // Filter evidence within radius
  const nearbyEvidence =
    safeNearbyEvidence.length > 0
      ? safeNearbyEvidence
      : safeEvidence.filter(() => {
          if (!selected) return true;
          const selectedCoords = getMarkerCoords(selected);
          const dist = calculateDistanceKm(queryCenter[0], queryCenter[1], selectedCoords[0], selectedCoords[1]);
          return dist <= radiusKm;
        });

  const handleSelect = (marker: any) => {
    setSelected(marker);
    const coords = getMarkerCoords(marker);
    setQueryCenter(coords);
    if (onSelectIncident) onSelectIncident(marker);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setQueryCenter([lat, lng]);
    push(`Query center updated: ${lat.toFixed(4)}, ${lng.toFixed(4)} (${radiusKm} km radius)`, 'info');
  };

  const handleZoom = (dir: 1 | -1) => {
    if (mapInstance) {
      dir === 1 ? mapInstance.zoomIn() : mapInstance.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView(queryCenter, zoom);
    }
  };

  return (
    <div className="relative h-full min-h-[420px] w-full flex-1 overflow-hidden lg:min-h-[520px]">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        ref={setMapInstance}
        className="absolute inset-0 h-full w-full bg-[#0b1c2c]"
      >
        <MapClickHandler onMapClick={handleMapClick} />

        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        {showLabels && (
          <TileLayer
            attribution="Labels &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            pane="shadowPane"
          />
        )}

        <Circle
          center={queryCenter}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.08, weight: 1.5, dashArray: '4, 6' }}
        />

        {/* Monitoring Sites Layer */}
        {showSites &&
          safeSites.map((site: any) => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={createGlowingMarker('#22d3ee', false)}
            >
              <Popup className="dark-popup">
                <div className="text-xs text-slate-200">
                  <strong className="text-white">{site.name}</strong><br />
                  <span className="font-bold uppercase text-[10px] text-cyan-400">
                    Sampling Site · {site.status}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Incident Markers Layer */}
        {filteredMarkers.map((m: any) => {
          const coords = getMarkerCoords(m);
          const color = getRiskColor(m.risk);
          const isHigh = m.risk === 'HIGH' || m.risk === 'CRITICAL';

          if (m.type === 'sample' && !showSites) return null;
          if (m.type !== 'sample' && !showIncidents) return null;

          return (
            <Marker
              key={m.id}
              position={coords}
              icon={createGlowingMarker(color, isHigh)}
              eventHandlers={{ click: () => handleSelect(m) }}
            >
              <Popup className="dark-popup">
                <div className="text-xs text-slate-200">
                  <strong className="text-white">{m.title}</strong><br />
                  <span className="font-bold uppercase text-[10px]" style={{ color }}>
                    {m.risk} Risk · {m.status}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={() => handleZoom(1)}
          aria-label="Zoom in"
          className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleZoom(-1)}
          aria-label="Zoom out"
          className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setLayerMenuOpen((prev) => !prev)}
            aria-label="Toggle map layers"
            className={`glass flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-white ${
              layerMenuOpen ? 'border-emerald-400/45 text-emerald-300' : 'text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {layerMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-strong absolute top-0 left-11 z-[1010] w-48 rounded-xl p-3 shadow-xl"
              >
                <div className="mb-2 flex items-center justify-between border-b border-white/[0.08] pb-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Map Layers</span>
                  <button onClick={() => setLayerMenuOpen(false)} className="text-slate-500 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-slate-200">
                  <button
                    onClick={() => setShowLabels((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span>Labels & Roads</span>
                    {showLabels && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setShowIncidents((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span>Incidents</span>
                    {showIncidents && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setShowSites((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span>Sampling Sites</span>
                    {showSites && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleRecenter}
          aria-label="Recenter on query location"
          className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Spatial Radius Control Bar */}
      <div className="glass absolute top-4 left-16 z-[1000] flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-200">
        <Target className="h-4 w-4 text-cyan-400" />
        <span>Radius:</span>
        {[2, 5, 10].map((r) => (
          <button
            key={r}
            onClick={() => setRadiusKm(r)}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
              radiusKm === r ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            {r} km
          </button>
        ))}
      </div>

      {/* Legend Overlay */}
      <div className="glass absolute top-4 right-4 z-[1000] rounded-xl px-3.5 py-3">
        <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Legend</p>
        <ul className="space-y-1.5">
          {legendItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full border border-white/60" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Selected Incident Card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id || selected.incidentId}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass-strong absolute bottom-4 left-4 z-[1000] w-[min(320px,calc(100%-2rem))] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">
                {selected.incidentId || selected.id}
              </p>
              <button onClick={() => setSelected(null)} aria-label="Close incident card" className="text-slate-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[13.5px] leading-snug font-semibold text-white">{selected.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone={selected.risk === 'HIGH' ? 'red' : selected.risk === 'MEDIUM' ? 'amber' : 'emerald'}>
                {selected.risk}
              </Badge>
              <span className="chip !normal-case">{selected.status}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Icon name="pin" className="h-3.5 w-3.5 text-emerald-300" />
              {selected.detected}
            </p>
            <button
              onClick={() => setEvidenceOpen(true)}
              className="mt-3 w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 py-2 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20 flex items-center justify-center gap-2"
            >
              <span>View Evidence ({nearbyEvidence.length} items within {radiusKm}km)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <EvidenceModal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        initialItem={nearbyEvidence[0] ?? null}
        title={selected ? `Evidence · ${selected.incidentId || selected.id}` : 'Case Evidence'}
        subtitle={selected ? selected.title : undefined}
      />
    </div>
  );
};

export default SpatialMap;