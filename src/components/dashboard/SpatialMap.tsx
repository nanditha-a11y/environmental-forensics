import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Layers, Ruler, Locate, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { EvidenceModal } from './EvidenceModal';
import { evidenceItems } from '../../data/mock';

// Fix Leaflet marker icon paths for Vite/React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom glowing dot marker matched to theme configuration
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

const getRiskColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'high':
      return '#f87171'; // High Risk
    case 'medium':
      return '#fbbf24'; // Medium Risk
    case 'low':
      return '#34d399'; // Low Risk
    case 'sample':
      return '#22d3ee'; // Sampling Site
    default:
      return '#60a5fa'; // Drone / General
  }
};

const legendItems = [
  { label: 'High Risk', color: '#f87171' },
  { label: 'Medium Risk', color: '#fbbf24' },
  { label: 'Low Risk', color: '#34d399' },
  { label: 'Sampling Site', color: '#22d3ee' },
  { label: 'Drone Survey', color: '#60a5fa' },
];

interface SpatialMapProps {
  center?: [number, number];
  zoom?: number;
  onSelectIncident?: (incident: any) => void;
}

export const SpatialMap: React.FC<SpatialMapProps> = ({
  center = [12.9716, 77.5946], // Bengaluru
  zoom = 13,
  onSelectIncident,
}) => {
  const [sites, setSites] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const navigate = useNavigate();
  const { push } = useToast();

  useEffect(() => {
    // Fetch Monitoring Sites
    fetch('/api/sites')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) setSites(data.features);
      })
      .catch((err) => console.error('Error fetching sites:', err));

    // Fetch Incidents
    fetch('/api/incidents')
      .then((res) => res.json())
      .then((data) => {
        if (data.features) {
          setIncidents(data.features);
          if (data.features.length > 0) {
            setSelected(data.features[0]);
          }
        }
      })
      .catch((err) => console.error('Error fetching incidents:', err));
  }, []);

  const handleSelect = (incident: any) => {
    setSelected(incident);
    if (onSelectIncident) onSelectIncident(incident);
  };

  const handleZoom = (dir: 1 | -1) => {
    if (mapInstance) {
      if (dir === 1) mapInstance.zoomIn();
      else mapInstance.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstance && selected?.properties?.location?.coordinates) {
      const [lng, lat] = selected.properties.location.coordinates;
      mapInstance.setView([lat, lng], 14);
    } else if (mapInstance) {
      mapInstance.setView(center, zoom);
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
        {/* CARTO Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          opacity={showLabels ? 1 : 0.75}
        />

        {/* Monitoring Sites Layer */}
        {sites.map((site) => {
          if (!site.geometry?.coordinates) return null;
          const [lng, lat] = site.geometry.coordinates;
          return (
            <Marker
              key={`site-${site.properties.id}`}
              position={[lat, lng]}
              icon={createGlowingMarker('#22d3ee', false)}
            >
              <Popup className="dark-popup">
                <div className="text-xs text-slate-200">
                  <strong className="text-cyan-300">{site.properties.site_name}</strong><br />
                  <span className="text-slate-400">{site.properties.site_type}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Incidents Layer */}
        {incidents.map((incident) => {
          const props = incident.properties;
          const pointCoords = props.location?.coordinates;
          const polyCoords = props.affected_area?.coordinates?.[0];
          const color = getRiskColor(props.severity);
          const isHigh = props.severity?.toLowerCase() === 'high' || props.severity?.toLowerCase() === 'critical';

          return (
            <React.Fragment key={`incident-${props.id}`}>
              {pointCoords && (
                <Marker
                  position={[pointCoords[1], pointCoords[0]]}
                  icon={createGlowingMarker(color, isHigh)}
                  eventHandlers={{ click: () => handleSelect(incident) }}
                >
                  <Popup className="dark-popup">
                    <div className="text-xs text-slate-200">
                      <strong className="text-white">{props.title}</strong><br />
                      <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color }}>
                        {props.severity} Risk
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}

              {polyCoords && (
                <Polygon
                  positions={polyCoords.map((coord: [number, number]) => [coord[1], coord[0]])}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 1.5 }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Selected Incident Radius Area */}
        {selected?.properties?.location?.coordinates && (
          <Circle
            center={[
              selected.properties.location.coordinates[1],
              selected.properties.location.coordinates[0],
            ]}
            radius={2000}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, dashArray: '6, 8' }}
          />
        )}
      </MapContainer>

      {/* Map Control Toolbar */}
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
        <button
          onClick={() => setShowLabels((s) => !s)}
          aria-label="Toggle map layers"
          className={`glass flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-white ${
            showLabels ? 'border-emerald-400/45 text-emerald-300' : 'text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setMeasureMode((m) => !m);
            push(measureMode ? 'Measurement mode disabled.' : 'Measurement tools arrive with the full GIS module.', 'info');
          }}
          aria-label="Measure"
          className={`glass flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:text-white ${
            measureMode ? 'border-cyan-400/45 text-cyan-300' : 'text-slate-200'
          }`}
        >
          <Ruler className="h-4 w-4" />
        </button>
        <button
          onClick={handleRecenter}
          aria-label="Recenter on incident"
          className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Tactical Legend Overlay */}
      <div className="glass absolute top-4 right-4 z-[1000] rounded-xl px-3.5 py-3">
        <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Legend</p>
        <ul className="space-y-1.5">
          {legendItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[11px] text-slate-300">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white/60"
                style={{ background: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Selected Incident Tactical Card */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.properties?.id || selected.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong absolute bottom-4 left-4 z-[1000] w-[min(320px,calc(100%-2rem))] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">
                {selected.properties?.incidentId || `EFIF-00${selected.properties?.id || selected.id}`}
              </p>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close incident card"
                className="text-slate-500 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[13.5px] leading-snug font-semibold text-white">
              {selected.properties?.title || selected.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  selected.properties?.severity?.toUpperCase() === 'HIGH' || selected.properties?.severity?.toUpperCase() === 'CRITICAL'
                    ? 'red'
                    : selected.properties?.severity?.toUpperCase() === 'MEDIUM'
                    ? 'amber'
                    : 'emerald'
                }
              >
                {selected.properties?.severity || selected.risk || 'MEDIUM'}
              </Badge>
              <span className="chip !normal-case">{selected.properties?.status || 'Open'}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Icon name="pin" className="h-3.5 w-3.5 text-emerald-300" />
              Detected {selected.properties?.created_at ? new Date(selected.properties.created_at).toLocaleDateString() : 'Today'}
            </p>
            <button
              onClick={() => setEvidenceOpen(true)}
              className="mt-3 w-full rounded-lg border border-emerald-400/30 bg-emerald-400/10 py-2 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20"
            >
              View Evidence
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <EvidenceModal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        initialItem={evidenceOpen ? evidenceItems.find((e) => e.id === 'ev-2') ?? null : null}
        title={selected ? `Evidence · ${selected.properties?.incidentId || `EFIF-00${selected.properties?.id || selected.id}`}` : 'Case Evidence'}
        subtitle={selected ? selected.properties?.title || selected.title : undefined}
      />
    </div>
  );
};

export default SpatialMap;