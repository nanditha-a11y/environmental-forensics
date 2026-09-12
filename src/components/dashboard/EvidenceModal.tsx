import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEvidence } from '../../hooks/useEvidence';
import type { EvidenceItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Visual } from './Visuals';

const tooltipStyle = {
  background: 'rgba(14, 33, 51, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '10px',
  fontSize: '11.5px',
  color: '#e2e8f0',
};

function EvidenceChart({ item }: { item: EvidenceItem }) {
  if (!item.chart) return null;
  if (item.chartKind === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={item.chart} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7fa5bf', fontSize: 10.5 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#7fa5bf', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1200}>
            {item.chart.map((_, i) => (
              <Cell key={i} fill={i === 1 ? '#f87171' : '#fb923c'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={item.chart} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="ev-history" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#7fa5bf', fontSize: 10.5 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#7fa5bf', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2} fill="url(#ev-history)" isAnimationActive animationDuration={1400} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EvidenceDetail({ item, onBack }: { item: EvidenceItem; onBack?: () => void }) {
  const rawItem = item as any;
  const detailsList = rawItem.details || [
    { label: 'LOCATION', value: rawItem.location || 'Locker B-12 (Central Lab)' },
    { label: 'RECORDED', value: rawItem.timestamp ? new Date(rawItem.timestamp).toLocaleDateString() : '08/09/2026' },
  ];

  return (
    <div className="space-y-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All evidence
        </button>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-[15px] font-semibold text-white">{item.title}</h4>
        <Badge tone="emerald">{item.status || 'VERIFIED'}</Badge>
      </div>

      {/* Glass Preview Panel */}
      <div className="glass relative flex h-40 w-full items-center justify-center rounded-xl p-3">
        <Visual kind={rawItem.kind || 'lab'} className="h-full w-full object-contain" />
      </div>

      <p className="text-[13px] leading-relaxed text-slate-300">{item.description}</p>

      {/* Glass Grid Cards */}
      <div className="grid grid-cols-2 gap-3">
        {detailsList.map((d: any, idx: number) => (
          <div key={d.label || idx} className="glass rounded-xl p-3">
            <p className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">{d.label}</p>
            <p className="mt-1 text-[12.5px] font-semibold text-white">{d.value}</p>
          </div>
        ))}
      </div>

      {item.chart && (
        <div className="pt-2">
          <p className="mb-2 text-[10.5px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            {item.chartKind === 'bar' ? 'Laboratory results' : 'Historical trend (indexed)'}
          </p>
          <EvidenceChart item={item} />
        </div>
      )}

      {/* Glass Verification Banner */}
      <div className="glass flex items-center gap-2.5 rounded-xl border-emerald-500/20 bg-emerald-500/5 p-3">
        <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-[11.5px] text-slate-300">
          Chain of custody verified · <span className="font-semibold text-white">{item.metaValue || rawItem.location || 'Locker B-12 (Central Lab)'}</span>
        </p>
      </div>
    </div>
  );
}

interface EvidenceModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialItem?: EvidenceItem | null;
}

export function EvidenceModal({ open, onClose, title, subtitle, initialItem = null }: EvidenceModalProps) {
  const [selected, setSelected] = useState<EvidenceItem | null>(initialItem);
  const { data: rawEvidenceItems = [] } = useEvidence();
  const evidenceItems = rawEvidenceItems as EvidenceItem[];

  useEffect(() => {
    if (open) setSelected(initialItem);
  }, [open, initialItem]);

  const rawSelected = selected as any;
  const modalTitle = selected ? selected.title : (title ?? 'EV-2026-001');
  const modalSubtitle = selected 
    ? `${rawSelected.meta || 'Chain of Custody'} · ${rawSelected.metaValue || rawSelected.location || 'Locker B-12 (Central Lab)'}`
    : (subtitle ?? 'Chain of Custody · Locker B-12 (Central Lab)');

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} subtitle={modalSubtitle} icon="vault">
      {selected ? (
        <EvidenceDetail item={selected} onBack={initialItem ? undefined : () => setSelected(null)} />
      ) : (
        <div className="space-y-2.5">
          <p className="pb-1 text-[10.5px] font-bold tracking-[0.12em] text-slate-400 uppercase">
            {evidenceItems.length} evidence items on file
          </p>
          {evidenceItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="glass flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:border-emerald-400/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
                <Icon name={(item as any).kind || 'file'} className="h-4 w-4 text-emerald-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-white">{item.title}</span>
                <span className="block text-[11px] text-slate-400">
                  {item.meta || 'Sample'} · {item.metaValue || 'Vault'}
                </span>
              </span>
              <Badge tone="emerald">{item.status}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}