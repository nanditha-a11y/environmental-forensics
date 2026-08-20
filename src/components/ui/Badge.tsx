import type { ReactNode } from 'react';

type Tone = 'emerald' | 'amber' | 'red' | 'sky' | 'violet' | 'cyan' | 'slate';

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-400/12 text-emerald-300 border-emerald-400/25',
  amber: 'bg-amber-400/12 text-amber-300 border-amber-400/25',
  red: 'bg-red-400/12 text-red-300 border-red-400/30',
  sky: 'bg-sky-400/12 text-sky-300 border-sky-400/25',
  violet: 'bg-violet-400/12 text-violet-300 border-violet-400/25',
  cyan: 'bg-cyan-400/12 text-cyan-300 border-cyan-400/25',
  slate: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
};

interface BadgeProps {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'slate', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-bold tracking-[0.08em] uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
