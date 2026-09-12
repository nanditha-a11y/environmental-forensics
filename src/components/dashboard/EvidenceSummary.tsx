import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useSearch } from '../../context/SearchContext';
import { useEvidence } from '../../hooks/useEvidence';
import type { EvidenceItem } from '../../types';
import { QueryState } from '../ui/QueryState';
import { EvidenceModal } from './EvidenceModal';
import { Visual } from './Visuals';

function EvidenceCard({ item, index, onOpen }: { item: EvidenceItem; index: number; onOpen: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      className="glass group overflow-hidden rounded-2xl text-left border border-white/10 transition-[border-color,box-shadow,background-color] hover:border-emerald-400/30 hover:bg-white/[0.06] hover:shadow-[0_16px_44px_-14px_rgba(2,8,18,0.8)]"
    >
      <div className="relative overflow-hidden border-b border-white/10 bg-white/[0.02]">
        <Visual kind={item.kind} className="h-24 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
      </div>
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-[13.5px] font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {item.title}
          </h4>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-300" />
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          {item.meta ?? 'Meta'}: <span className="font-medium text-slate-200">{item.metaValue ?? 'N/A'}</span>
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {item.status ?? 'Verified'}
          </span>
          {item.actionLabel && (
            <span className="text-[11px] font-medium text-sky-300 transition-colors group-hover:text-sky-200">
              {item.actionLabel}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export function EvidenceSummary() {
  const { query } = useSearch();
  const [selected, setSelected] = useState<EvidenceItem | null>(null);
  const [open, setOpen] = useState(false);

  // Live Backend Fetching via TanStack Query
  const { data: apiEvidence = [], isLoading, isError, error } = useEvidence();

  const q = query.trim().toLowerCase();
  const filtered = q
    ? apiEvidence.filter((e) =>
        `${e.title || ''} ${e.metaValue || ''} ${e.status || ''}`.toLowerCase().includes(q)
      )
    : apiEvidence;

  const openItem = (item: EvidenceItem) => {
    setSelected(item);
    setOpen(true);
  };

  return (
    <section id="evidence-summary" className="scroll-mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-title">Evidence Summary</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">Chain-of-custody telemetry records</p>
        </div>
        {q && <span className="chip">Filtered: {filtered.length} shown</span>}
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error}>
        {filtered.length === 0 ? (
          <div className="glass flex flex-col items-center gap-2 rounded-2xl border border-white/10 px-6 py-10 text-center">
            <SearchX className="h-6 w-6 text-slate-400" />
            <p className="text-[13px] text-slate-300">
              {q ? `No evidence matches “${query}”.` : 'No evidence records returned from API.'}
            </p>
            <p className="text-[11.5px] text-slate-400">
              {q ? 'Try another search term.' : 'Attach or create evidence via backend to view items here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <EvidenceCard key={item.id} item={item} index={i} onOpen={() => openItem(item)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </QueryState>

      <EvidenceModal
        open={open}
        onClose={() => setOpen(false)}
        initialItem={selected}
        title={selected?.title}
        subtitle={`${selected?.meta ?? ''} ${selected?.metaValue ?? ''}`}
      />
    </section>
  );
}