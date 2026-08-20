import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Locate, Minus, Plus, Ruler, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { evidenceItems, mapMarkers } from '../../data/mock';
import type { MapMarker, MarkerType } from '../../types';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { EvidenceModal } from './EvidenceModal';

const markerConfig: Record<MarkerType, { color: string; label: string; glow?: boolean }> = {
  high: { color: '#f87171', label: 'High Risk', glow: true },
  medium: { color: '#fbbf24', label: 'Medium Risk' },
  low: { color: '#34d399', label: 'Low Risk' },
  sample: { color: '#22d3ee', label: 'Sampling Site' },
  drone: { color: '#60a5fa', label: 'Drone Survey' },
};

function MapBase({ showLabels }: { showLabels: boolean }) {
  return (
    <svg viewBox="0 0 900 520" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b1c2c" />
          <stop offset="0.5" stopColor="#0e2430" />
          <stop offset="1" stopColor="#0a1a28" />
        </linearGradient>
        <radialGradient id="map-glow" cx="0.5" cy="0.42" r="0.65">
          <stop offset="0" stopColor="#10b981" stopOpacity="0.07" />
          <stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="900" height="520" fill="url(#map-bg)" />
      <rect width="900" height="520" fill="url(#map-glow)" />

      {/* fine grid */}
      <g stroke="rgba(148, 200, 255, 0.045)" strokeWidth="1">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="520" />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 58} x2="900" y2={i * 58} />
        ))}
      </g>

      {/* topographic contours */}
      <g fill="none" stroke="rgba(52, 211, 153, 0.07)" strokeWidth="1">
        <path d="M -20 300 C 120 260, 220 320, 360 290 S 640 240, 920 300" />
        <path d="M -20 330 C 120 290, 220 350, 360 320 S 640 270, 920 330" />
        <path d="M -20 360 C 120 320, 220 380, 360 350 S 640 300, 920 360" />
        <path d="M -20 150 C 160 110, 320 170, 480 140 S 760 90, 920 150" />
        <path d="M -20 180 C 160 140, 320 200, 480 170 S 760 120, 920 180" />
      </g>

      {/* park / vegetation blocks */}
      <g fill="#0f3d2c" opacity="0.5">
        <path d="M 60 40 Q 150 10 220 50 Q 260 90 200 130 Q 110 150 60 120 Z" />
        <path d="M 700 60 Q 780 30 840 80 Q 860 130 800 160 Q 720 170 690 120 Z" />
        <path d="M 120 380 Q 220 350 300 400 Q 330 460 250 490 Q 140 500 110 440 Z" />
      </g>

      {/* water bodies */}
      <ellipse cx="150" cy="210" rx="34" ry="20" fill="#155e75" opacity="0.5" />

      {/* roads */}
      <path d="M 820 -20 C 780 140, 830 300, 780 540" stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M 820 -20 C 780 140, 830 300, 780 540" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="8 10" fill="none" />
      <path d="M -20 300 C 180 280, 360 320, 560 290 S 800 260, 920 280" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M 380 -20 C 400 120, 360 260, 420 400 S 460 500, 480 540" stroke="rgba(255,255,255,0.045)" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* protected area boundary */}
      <path
        d="M 660 40 Q 780 30 830 90 Q 860 170 790 210 Q 700 220 660 160 Q 620 90 660 40 Z"
        fill="none"
        stroke="rgba(52, 211, 153, 0.5)"
        strokeWidth="1.5"
        strokeDasharray="7 6"
      />

      {/* river network */}
      <path
        d="M 600 -20 C 560 60, 470 120, 440 170 C 420 205, 500 240, 540 285 C 580 330, 640 340, 620 390 C 600 440, 520 460, 460 490 C 400 520, 300 520, 240 545"
        stroke="#13495e"
        strokeWidth="26"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M 600 -20 C 560 60, 470 120, 440 170 C 420 205, 500 240, 540 285 C 580 330, 640 340, 620 390 C 600 440, 520 460, 460 490 C 400 520, 300 520, 240 545"
        stroke="#0e7490"
        strokeWidth="17"
        fill="none"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M 600 -20 C 560 60, 470 120, 440 170 C 420 205, 500 240, 540 285 C 580 330, 640 340, 620 390 C 600 440, 520 460, 460 490 C 400 520, 300 520, 240 545"
        stroke="#67e8f9"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        opacity="0.28"
      />
      {/* tributary */}
      <path
        d="M 440 170 C 400 230, 330 260, 290 310 C 260 350, 250 400, 210 440"
        stroke="#13495e"
        strokeWidth="15"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M 440 170 C 400 230, 330 260, 290 310 C 260 350, 250 400, 210 440"
        stroke="#22d3ee"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* labels (toggleable layer) */}
      <g style={{ opacity: showLabels ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <text x="330" y="112" fill="rgba(103,232,249,0.5)" fontSize="12" fontStyle="italic">
          Vrishabhavati River
        </text>
        <text x="668" y="52" fill="rgba(110,231,183,0.55)" fontSize="11" letterSpacing="1.5">
          Protected Area
        </text>
        <text x="700" y="420" fill="rgba(255,255,255,0.28)" fontSize="12" letterSpacing="2">
          Hosur Main Road
        </text>
        <text x="60" y="470" fill="rgba(255,255,255,0.22)" fontSize="11" letterSpacing="2">
          BENGALURU URBAN
        </text>
        <text x="42" y="72" fill="rgba(255,255,255,0.3)" fontSize="12" letterSpacing="3">
          EFIF · SECTOR 04
        </text>
      </g>

    </svg>
  );
}

function Marker({ marker, selected, onSelect }: { marker: MapMarker; selected: boolean; onSelect: (m: MapMarker) => void }) {
  const cfg = markerConfig[marker.type];
  return (
    <button
      onClick={() => onSelect(marker)}
      className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      aria-label={marker.title}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        {cfg.glow && <span className="animate-ping-slow absolute inset-0 rounded-full" style={{ background: cfg.color }} />}
        <span
          className={`relative block h-3.5 w-3.5 rounded-full border-2 border-white/90 transition-transform duration-150 ${
            selected ? 'scale-150' : 'group-hover:scale-125'
          }`}
          style={{ background: cfg.color, boxShadow: `0 0 12px ${cfg.color}88` }}
        />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-white/10 bg-night-900/95 px-2.5 py-1.5 text-[11px] whitespace-nowrap text-slate-200 opacity-0 shadow-xl backdrop-blur transition-opacity duration-150 group-hover:opacity-100">
        {marker.title}
        <span className="ml-1.5 text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">{marker.risk}</span>
      </span>
    </button>
  );
}

export function IncidentMap() {
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [measureMode, setMeasureMode] = useState(false);
  const [selected, setSelected] = useState<MapMarker | null>(mapMarkers[0]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const navigate = useNavigate();
  const { push } = useToast();

  const zoomBy = (dir: 1 | -1) => {
    setZoom((z) => Math.min(2.1, Math.max(1, +(z + dir * 0.35).toFixed(2))));
  };

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <h2 className="section-title">Incident Map</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Live operational view · 24 incidents · 7 active</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live feed
          </span>
        </div>
      </div>

      {/* Map area */}
      <div className="relative min-h-[420px] flex-1 overflow-hidden lg:min-h-[520px]">
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <MapBase showLabels={showLabels} />
          {mapMarkers.map((m) => (
            <Marker key={m.id} marker={m} selected={selected?.id === m.id} onSelect={setSelected} />
          ))}
        </div>

        {/* Map controls */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <button
            onClick={() => zoomBy(1)}
            aria-label="Zoom in"
            className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => zoomBy(-1)}
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
            onClick={() => setSelected(mapMarkers[0])}
            aria-label="Recenter on incident"
            className="glass flex h-9 w-9 items-center justify-center rounded-xl text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-white"
          >
            <Locate className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="glass absolute top-4 right-4 rounded-xl px-3.5 py-3">
          <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Legend</p>
          <ul className="space-y-1.5">
            {(Object.keys(markerConfig) as MarkerType[]).map((type) => (
              <li key={type} className="flex items-center gap-2 text-[11px] text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-white/60"
                  style={{ background: markerConfig[type].color }}
                />
                {markerConfig[type].label}
              </li>
            ))}
          </ul>
        </div>

        {/* Selected incident card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="glass-strong absolute bottom-4 left-4 w-[min(320px,calc(100%-2rem))] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  {selected.incidentId}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close incident card"
                  className="text-slate-500 transition-colors hover:text-white"
                >
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
                Detected {selected.detected}
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
      </div>

      {/* Footer */}
      <button
        onClick={() => navigate('/map')}
        className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-white/[0.03] hover:text-emerald-200"
      >
        View Full Map <span aria-hidden>→</span>
      </button>

      <EvidenceModal
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        initialItem={evidenceOpen ? evidenceItems.find((e) => e.id === 'ev-2') ?? null : null}
        title={selected ? `Evidence · ${selected.incidentId}` : 'Case Evidence'}
        subtitle={selected ? selected.title : undefined}
      />
    </GlassCard>
  );
}
