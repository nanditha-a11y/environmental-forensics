import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import type { RiskContributor } from '../../types';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { ProgressBar } from '../ui/ProgressBar';

interface AiRiskGaugeProps {
  score?: number;
  riskLabel?: string;
}

export function AiRiskGauge({ score = 0, riskLabel = 'NORMAL' }: AiRiskGaugeProps) {
  const fraction = Math.min(Math.max(score / 100, 0), 1);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[150px] w-[150px]">
        <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="55%" stopColor="#f87171" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <circle cx="75" cy="75" r="62" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="11" />
          <motion.circle
            cx="75"
            cy="75"
            r="62"
            fill="none"
            stroke="url(#gauge-grad)"
            strokeWidth="11"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: fraction }}
            transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.35))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5">
            <AnimatedNumber value={score} duration={1.7} className="font-display text-[34px] leading-none font-bold text-white" />
            <span className="text-[12px] font-semibold text-slate-500">/100</span>
          </div>
          <span className="mt-1.5 rounded-full border border-red-400/40 bg-red-400/15 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em] text-red-300">
            {riskLabel}
          </span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500">
        <BrainCircuit className="h-3 w-3" />
        Live Telemetry Score
      </div>
    </div>
  );
}

interface RiskContributorsProps {
  contributors?: RiskContributor[];
}

export function RiskContributors({ contributors = [] }: RiskContributorsProps) {
  if (contributors.length === 0) {
    return (
      <div className="py-4 text-center text-[12px] text-slate-500">
        No risk breakdown provided by API.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {contributors.map((c, i) => (
        <div key={c.label}>
          <div className="mb-1 flex items-center justify-between text-[11.5px]">
            <span className="font-medium text-slate-300">{c.label}</span>
            <span className="font-display font-semibold text-slate-200">{c.value}%</span>
          </div>
          <ProgressBar value={c.value} gradientClass={c.color} delay={0.4 + i * 0.1} />
        </div>
      ))}
    </div>
  );
}