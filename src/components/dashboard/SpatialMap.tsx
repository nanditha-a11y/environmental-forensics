import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Layers, Locate, X, Check, Target, Camera, Video, Plane, Ship, Activity } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { EvidenceModal } from './EvidenceModal';
import { useIncidents } from '../../hooks/useIncidents';
import { useEvidence } from '../../hooks/useEvidence';
import { useMonitoringSites, useNearbyEvidence } from '../../hooks/useSpatialData';
import { apiFetch } from '../../utils/api';

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

const createCctvMarker = () => {
  return L.divIcon({
    className: 'custom-cctv-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        background: #0ea5e9;
        color: white;
        border-radius: 8px;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 10px #0ea5e9;
        cursor: pointer;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

const createOsintMarker = (targetType: string) => {
  const isAircraft = targetType === 'AIRCRAFT' || targetType === 'flight' || targetType === 'FLIGHT';
  const color = isAircraft ? '#a855f7' : '#06b6d4';
  const symbol = isAircraft ? '✈' : '🚢';

  return L.divIcon({
    className: 'custom-osint-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: ${color};
        color: white;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 0 10px ${color};
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
      ">
        ${symbol}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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
  { label: 'CCTV Stream', color: '#0ea5e9' },
  { label: 'OSINT Aircraft', color: '#a855f7' },
  { label: 'OSINT Vessel', color: '#06b6d4' },
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

  // Dynamic CCTV Feeds & OSINT Spatial Telemetry State
  const [cctvFeeds, setCctvFeeds] = useState<any[]>([]);
  const [osintLogs, setOsintLogs] = useState<any[]>([]);
  const [activeCctv, setActiveCctv] = useState<any | null>(null);

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
  const [showCCTV, setShowCCTV] = useState(true);
  const [showOSINT, setShowOSINT] = useState(true);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);

  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const { push } = useToast();

  // Load CCTV feeds & OSINT telemetry
  useEffect(() => {
    const fetchSpatialStreams = async () => {
      try {
        // Fetch CCTV Feeds
        const cctvRes = await apiFetch('/cctv').catch(() => null);
        if (cctvRes?.data?.features) {
          setCctvFeeds(cctvRes.data.features);
        } else if (Array.isArray(cctvRes?.features)) {
          setCctvFeeds(cctvRes.features);
        } else if (Array.isArray(cctvRes?.data)) {
          setCctvFeeds(cctvRes.data);
        }

        // Fetch OSINT Spatial Tracking
        const osintRes = await apiFetch(
          `/osint/spatial?lat=${queryCenter[0]}&lng=${queryCenter[1]}&radius_meters=${radiusKm * 1000}`
        ).catch(() => null);
        if (Array.isArray(osintRes?.data)) {
          setOsintLogs(osintRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch spatial streams', err);
      }
    };

    fetchSpatialStreams();
  }, [queryCenter, radiusKm]);

  // Helper to resolve coordinates from backend or fallback dict
  const getMarkerCoords = (m: any): [number, number] => {
    if (Array.isArray(m.coordinates) && m.coordinates.length === 2) {
      return m.coordinates;
    }
    if (m.geometry?.type === 'Point' && Array.isArray(m.geometry.coordinates)) {
      return [m.geometry.coordinates[1], m.geometry.coordinates[0]];
    }
    if (m.location?.coordinates && Array.isArray(m.location.coordinates)) {
      return [m.location.coordinates[1], m.location.coordinates[0]];
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

        {/* PostGIS Incident Affected Area Polygons Layer */}
        {showIncidents &&
          filteredMarkers.map((m: any) => {
            const poly = m.affected_area || m.properties?.affected_area;
            if (poly && (poly.type === 'Polygon' || poly.type === 'MultiPolygon')) {
              const color = getRiskColor(m.risk || m.severity);
              return (
                <GeoJSON
                  key={`poly-${m.id}`}
                  data={poly}
                  style={{
                    color: color,
                    weight: 2,
                    opacity: 0.8,
                    fillColor: color,
                    fillOpacity: 0.2,
                    dashArray: '4, 6',
                  }}
                  eventHandlers={{
                    click: () => handleSelect(m),
                  }}
                />
              );
            }
            return null;
          })}

        {/* Monitoring Sites Layer */}
        {showSites &&
          safeSites.map((site: any) => (
            <Marker
              key={site.id}
              position={[site.lat || site.latitude, site.lng || site.longitude]}
              icon={createGlowingMarker('#22d3ee', false)}
            >
              <Popup className="dark-popup">
                <div className="text-xs text-slate-200 font-sans">
                  <strong className="text-white">{site.site_name || site.name}</strong><br />
                  <span className="font-bold uppercase text-[10px] text-cyan-400">
                    Sampling Site · {site.site_type || site.status || 'Active'}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Incident Point Markers Layer */}
        {showIncidents &&
          filteredMarkers.map((m: any) => {
            const coords = getMarkerCoords(m);
            const color = getRiskColor(m.risk || m.severity);
            const isHigh = m.risk === 'HIGH' || m.risk === 'CRITICAL' || m.severity === 'high' || m.severity === 'critical';

            if (m.type === 'sample' && !showSites) return null;

            return (
              <Marker
                key={m.id}
                position={coords}
                icon={createGlowingMarker(color, isHigh)}
                eventHandlers={{ click: () => handleSelect(m) }}
              >
                <Popup className="dark-popup">
                  <div className="text-xs text-slate-200 font-sans">
                    <strong className="text-white">{m.title}</strong><br />
                    <span className="font-bold uppercase text-[10px]" style={{ color }}>
                      {m.risk || m.severity} Risk · {m.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* CCTV Camera Feeds Layer */}
        {showCCTV &&
          cctvFeeds.map((feed: any, idx: number) => {
            const props = feed.properties || feed;
            const geom = feed.geometry || props.location;
            let coords: [number, number] | null = null;

            if (geom?.coordinates && geom.type === 'Point') {
              coords = [geom.coordinates[1], geom.coordinates[0]];
            } else if (props.latitude && props.longitude) {
              coords = [props.latitude, props.longitude];
            } else {
              coords = [center[0] + (idx % 2 === 0 ? 0.012 : -0.015), center[1] + (idx % 2 === 0 ? -0.014 : 0.018)];
            }

            if (!coords) return null;

            return (
              <Marker
                key={props.id || `cctv-${idx}`}
                position={coords}
                icon={createCctvMarker()}
                eventHandlers={{
                  click: () => setActiveCctv(props),
                }}
              >
                <Popup className="dark-popup">
                  <div className="text-xs text-slate-200 font-sans">
                    <strong className="text-white flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-sky-400 inline" /> {props.camera_name || 'CCTV Feed'}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{props.location_name || 'Monitoring Outfall'}</span>
                    <span className="font-bold uppercase text-[10px] text-sky-400 block mt-1">
                      Status: {props.status || 'LIVE'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* OSINT Flight & Vessel Telemetry Layer */}
        {showOSINT &&
          osintLogs.map((log: any, idx: number) => {
            const lat = log.latitude || log.lat;
            const lng = log.longitude || log.lng;
            if (!lat || !lng) return null;

            return (
              <Marker
                key={log.id || `osint-${idx}`}
                position={[lat, lng]}
                icon={createOsintMarker(log.target_type)}
              >
                <Popup className="dark-popup">
                  <div className="text-xs text-slate-200 font-sans">
                    <strong className="text-purple-300 font-mono">
                      {log.target_type || 'TARGET'}: {log.identifier || log.callsign || log.name}
                    </strong>
                    <br />
                    <span className="text-[10px] text-slate-400 font-mono">
                      Lat: {lat?.toFixed(4)}, Lng: {lng?.toFixed(4)}
                    </span>
                    <br />
                    <span className="text-[10px] text-emerald-400">
                      {log.altitude_m ? `Alt: ${log.altitude_m}m | ` : ''}Speed: {log.velocity_mps ? `${log.velocity_mps} m/s` : 'N/A'}
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
                className="glass-strong absolute top-0 left-11 z-[1010] w-52 rounded-xl p-3 shadow-xl"
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
                    <span>Incidents & Areas</span>
                    {showIncidents && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setShowSites((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span>Sampling Sites</span>
                    {showSites && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setShowCCTV((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-sky-400" /> CCTV Streams</span>
                    {showCCTV && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setShowOSINT((v) => !v)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1 hover:bg-white/5"
                  >
                    <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400" /> OSINT Telemetry</span>
                    {showOSINT && <Check className="h-3.5 w-3.5 text-emerald-400" />}
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
              <span className="h-2.5 w-2.5 rounded-full border border-white/60 shrink-0" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* CCTV Stream Video Overlay Modal */}
      <AnimatePresence>
        {activeCctv && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-[1100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <div className="glass-strong w-full max-w-2xl overflow-hidden rounded-2xl border border-sky-500/40 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 bg-night-900/90 p-3.5">
                <div className="flex items-center gap-2.5">
                  <Video className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{activeCctv.camera_name || 'CCTV Surveillance Camera'}</h3>
                    <p className="text-[11px] text-slate-400">{activeCctv.location_name || 'Environmental Monitoring Zone'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="emerald">{activeCctv.status || 'LIVE'}</Badge>
                  <button
                    onClick={() => setActiveCctv(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative aspect-video bg-black flex flex-col items-center justify-center overflow-hidden">
                {activeCctv.stream_url ? (
                  <video
                    src={activeCctv.stream_url}
                    controls
                    autoPlay
                    className="h-full w-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-night-950/60 pointer-events-none">
                  <Camera className="w-10 h-10 text-sky-400 animate-pulse mb-2" />
                  <p className="text-xs font-mono text-slate-200 font-semibold">Live Video Feed Stream Active</p>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono truncate max-w-md">
                    {activeCctv.stream_url || 'rtsp://stream.efif.internal/cctv-001'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <Badge tone={selected.risk === 'HIGH' || selected.severity === 'high' ? 'red' : selected.risk === 'MEDIUM' ? 'amber' : 'emerald'}>
                {selected.risk || selected.severity}
              </Badge>
              <span className="chip !normal-case">{selected.status}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Icon name="pin" className="h-3.5 w-3.5 text-emerald-300" />
              {selected.detected || 'Central Basin Region'}
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