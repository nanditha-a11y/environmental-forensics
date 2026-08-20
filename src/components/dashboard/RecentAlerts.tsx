import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../context/SearchContext';
import { alerts } from '../../data/mock';
import type { AlertItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';

function AlertDetail({ alert, onClose }: { alert: AlertItem; onClose: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <Modal open onClose={onClose} title={`Alert ${alert.id}`} subtitle={alert.source} icon="alert" accent={alert.severity === 'high' ? 'border-red-400/25 bg-red-400/10 text-red-300' : 'border-amber-400/25 bg-amber-400/10 text-amber-300'}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-[15px] leading-snug font-semibold text-white">{alert.title}</h4>
          <Badge tone={alert.severity === 'high' ? 'red' : 'amber'}>{alert.severity}</Badge>
        </div>
        <p className="text-[12px] text-slate-500">{alert.time}</p>
        <div className="rounded-xl border border-white/[0.07] bg-night-900/40 p-3.5">
          <p className="text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">Detection detail</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">{alert.detail}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-night-900/40 p-3.5">
          <p className="text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">Recommended action</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">{alert.action}</p>
        </div>
        {acknowledged ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-3 text-[12.5px] text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Acknowledged — triage logged to the case file.
          </div>
        ) : (
          <Button variant={alert.severity === 'high' ? 'danger' : 'emerald'} className="w-full" onClick={() => setAcknowledged(true)}>
            <CheckCircle2 className="h-4 w-4" /> Acknowledge Alert
          </Button>
        )}
      </div>
    </Modal>
  );
}

export function RecentAlerts() {
  const { query } = useSearch();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AlertItem | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? alerts.filter((a) => `${a.title} ${a.source}`.toLowerCase().includes(q)) : alerts;

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <div id="recent-alerts" className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5 scroll-mt-6">
        <div>
          <h2 className="section-title">Recent Alerts</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Live detection stream · 3 new</p>
        </div>
        <Icon name="bell" className="h-4 w-4 text-amber-300/80" />
      </div>

      <div className="flex-1 space-y-1 p-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <SearchX className="h-5 w-5 text-slate-500" />
            <p className="text-[12.5px] text-slate-400">No alerts match “{query}”.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((alert, i) => (
              <motion.button
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, delay: i * 0.08 }}
                onClick={() => setSelected(alert)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.05]"
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    alert.severity === 'high'
                      ? 'border-red-400/25 bg-red-400/10 text-red-300'
                      : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] leading-snug font-medium text-slate-200">{alert.title}</span>
                  <span className="mt-0.5 block text-[10.5px] text-slate-500">{alert.time}</span>
                </span>
                <span
                  className={`shrink-0 text-[10px] font-bold tracking-[0.1em] uppercase ${
                    alert.severity === 'high' ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  {alert.severity}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      <button
        onClick={() => navigate('/alerts')}
        className="flex items-center justify-center gap-1.5 border-t border-white/[0.06] py-3 text-[12px] font-semibold text-emerald-300 transition-colors hover:bg-white/[0.03] hover:text-emerald-200"
      >
        View All Alerts <span aria-hidden>→</span>
      </button>

      <AnimatePresence>
        {selected && <AlertDetail alert={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </GlassCard>
  );
}
