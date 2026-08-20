import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { timelineEvents } from '../../data/mock';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';

const eventAccent: Record<string, string> = {
  satellite: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  drone: 'border-sky-400/25 bg-sky-400/10 text-sky-300',
  droplets: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-300',
  flask: 'border-violet-400/25 bg-violet-400/10 text-violet-300',
  brain: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300',
  bell: 'border-red-400/25 bg-red-400/10 text-red-300',
};

export function InvestigationTimeline() {
  const navigate = useNavigate();

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <h2 className="section-title">Investigation Timeline</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">EFIF-0017 · 17 Aug 2026</p>
        </div>
        <Icon name="clock" className="h-4 w-4 text-emerald-300/80" />
      </div>

      <div className="relative flex-1 p-4 pl-6">
        {/* vertical rail */}
        <span className="absolute top-6 bottom-6 left-[27px] w-px bg-gradient-to-b from-emerald-400/40 via-white/10 to-red-400/40" />

        <ol className="space-y-4">
          {timelineEvents.map((event, i) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.42, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-start gap-3"
            >
              <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${eventAccent[event.icon] ?? eventAccent.satellite}`}>
                <Icon name={event.icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] font-bold tracking-wide text-emerald-300">{event.time}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-snug font-semibold text-slate-100">{event.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{event.detail}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <button
        onClick={() => navigate('/incidents')}
        className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-white/[0.03] hover:text-emerald-200"
      >
        View Full Timeline <span aria-hidden>→</span>
      </button>
    </GlassCard>
  );
}
