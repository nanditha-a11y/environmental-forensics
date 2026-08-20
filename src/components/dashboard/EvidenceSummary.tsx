import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useSearch } from '../../context/SearchContext';
import { evidenceItems } from '../../data/mock';
import type { EvidenceItem } from '../../types';
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
      className="glass group overflow-hidden rounded-2xl text-left transition-[border-color,box-shadow] hover:border-emerald-400/25 hover:shadow-[0_16px_44px_-14px_rgba(2,8,18,0.8)]"
    >
      <div className="relative overflow-hidden border-b border-white/[0.05]">
        <Visual kind={item.kind} className="h-24 w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-night-900/40 to-transparent" />
      </div>
      <div className="p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-[13.5px] font-semibold text-white">{item.title}</h4>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-emerald-300" />
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          {item.meta}: <span className="font-medium text-slate-300">{item.metaValue}</span>
        </p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {item.status}
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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? evidenceItems.filter((e) => `${e.title} ${e.metaValue} ${e.status}`.toLowerCase().includes(q))
    : evidenceItems;

  const openItem = (item: EvidenceItem) => {
    setSelected(item);
    setOpen(true);
  };

  return (
    <section id="evidence-summary" className="scroll-mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="section-title">Evidence Summary</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Chain-of-custody records attached to EFIF-0017</p>
        </div>
        {q && <span className="chip">Filtered: {filtered.length} shown</span>}
      </div>

      {filtered.length === 0 ? (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center">
          <SearchX className="h-6 w-6 text-slate-500" />
          <p className="text-[13px] text-slate-300">No evidence matches “{query}”.</p>
          <p className="text-[11.5px] text-slate-500">Try a title like “Water” or “eDNA”.</p>
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

      <EvidenceModal open={open} onClose={() => setOpen(false)} initialItem={selected} title={selected?.title} subtitle={`${selected?.meta} ${selected?.metaValue}`} />
    </section>
  );
}
