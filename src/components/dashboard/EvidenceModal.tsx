import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { evidenceItems } from '../../data/mock';
import type { EvidenceItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { Visual } from './Visuals';

const tooltipStyle = {
  background: '#0b1622',
  border: '1px solid rgba(163,200,255,0.14)',
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
  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300 transition-colors hover:text-emerald-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All evidence
        </button>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-display text-[15px] font-semibold text-white">{item.title}</h4>
        <Badge tone="emerald">{item.status}</Badge>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-white/8">
        <Visual kind={item.kind} className="h-36 w-full" />
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-slate-300">{item.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {item.details.map((d) => (
          <div key={d.label} className="rounded-lg border border-white/[0.07] bg-night-900/40 px-3 py-2">
            <p className="text-[10px] font-bold tracking-[0.1em] text-slate-500 uppercase">{d.label}</p>
            <p className="mt-0.5 text-[12px] font-medium text-slate-200">{d.value}</p>
          </div>
        ))}
      </div>

      {item.chart && (
        <div className="mt-4">
          <p className="mb-1 text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">
            {item.chartKind === 'bar' ? 'Laboratory results' : 'Historical trend (indexed)'}
          </p>
          <EvidenceChart item={item} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-night-900/40 px-3 py-2.5">
        <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-300" />
        <p className="text-[11.5px] text-slate-400">
          Chain of custody verified · <span className="text-slate-200">{item.metaValue}</span>
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

  useEffect(() => {
    if (open) setSelected(initialItem);
  }, [open, initialItem]);

  return (
    <Modal open={open} onClose={onClose} title={title ?? 'Evidence Vault'} subtitle={subtitle ?? 'Case EFIF-0017 · chain-of-custody records'} icon="vault">
      {selected ? (
        <EvidenceDetail item={selected} onBack={initialItem ? undefined : () => setSelected(null)} />
      ) : (
        <div className="space-y-1.5">
          <p className="pb-1 text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">
            {evidenceItems.length} evidence items on file
          </p>
          {evidenceItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-night-900/30 px-3 py-2.5 text-left transition-colors hover:border-emerald-400/25 hover:bg-night-900/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
                <Icon name={item.kind} className="h-4 w-4 text-emerald-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-slate-100">{item.title}</span>
                <span className="block text-[11px] text-slate-500">
                  {item.meta} · {item.metaValue}
                </span>
              </span>
              <Badge tone="emerald">{item.status}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
