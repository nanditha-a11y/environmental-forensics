import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { integrations } from '../../data/mock';
import type { Integration } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';

function IntegrationTile({ item, index }: { item: Integration; index: number }) {
  const active = item.status === 'Active';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-night-900/30 px-3 py-2.5 transition-colors hover:border-emerald-400/20"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10">
        <Icon name={item.icon} className="h-4 w-4 text-emerald-300" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-slate-200">{item.name}</span>
      <span className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[0.08em] uppercase ${active ? 'text-cyan-300' : 'text-emerald-300'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'animate-pulse bg-cyan-400' : 'bg-emerald-400'}`} />
        {item.status}
      </span>
    </motion.div>
  );
}

export function PlatformIntegration() {
  const navigate = useNavigate();

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <div>
          <h2 className="section-title">Platform Integration</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Multiple technologies → one intelligence platform</p>
        </div>
        <Icon name="globe" className="h-4 w-4 text-emerald-300/80" />
      </div>

      <div className="flex-1 grid grid-cols-2 gap-2 p-3">
        {integrations.map((item, i) => (
          <IntegrationTile key={item.id} item={item} index={i} />
        ))}
      </div>

      <button
        onClick={() => navigate('/sources')}
        className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-white/[0.03] hover:text-emerald-200"
      >
        Manage Integrations <span aria-hidden>→</span>
      </button>
    </GlassCard>
  );
}
