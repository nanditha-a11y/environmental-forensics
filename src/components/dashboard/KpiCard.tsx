import { ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { Kpi } from '../../types';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';

const accents = {
  emerald: { text: 'text-emerald-300', tile: 'border-emerald-400/25 bg-emerald-400/12', stroke: '#34d399' },
  amber: { text: 'text-amber-300', tile: 'border-amber-400/25 bg-amber-400/12', stroke: '#fbbf24' },
  sky: { text: 'text-sky-300', tile: 'border-sky-400/25 bg-sky-400/12', stroke: '#38bdf8' },
  violet: { text: 'text-violet-300', tile: 'border-violet-400/25 bg-violet-400/12', stroke: '#a78bfa' },
  cyan: { text: 'text-cyan-300', tile: 'border-cyan-400/25 bg-cyan-400/12', stroke: '#22d3ee' },
} as const;

export function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const accent = accents[kpi.accent];
  const sparkData = kpi.spark.map((v, i) => ({ i, v }));

  return (
    <GlassCard
      hover
      className="relative overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accent.tile}`}>
            <Icon name={kpi.icon} className={`h-5 w-5 ${accent.text}`} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-medium tracking-wide text-slate-400">{kpi.label}</p>
            <p className="font-display mt-0.5 text-[27px] leading-none font-bold text-white">
              <AnimatedNumber value={kpi.value} duration={1.1 + index * 0.12} />
            </p>
          </div>
        </div>
        <div className="h-9 w-16 shrink-0 opacity-70">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${kpi.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent.stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent.stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent.stroke}
                strokeWidth={1.5}
                fill={`url(#spark-${kpi.id})`}
                isAnimationActive
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" />
        <span>↑ {kpi.delta}</span>
      </div>
    </GlassCard>
  );
}
