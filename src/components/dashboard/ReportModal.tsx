import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const GENERATION_STEPS = [
  'Scanning case evidence…',
  'Fusing satellite & drone layers…',
  'Correlating laboratory results…',
  'Validating chain of custody…',
  'Compiling investigation report…',
];

export function ReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<'generating' | 'done'>('generating');
  const [stepIndex, setStepIndex] = useState(0);
  const { push } = useToast();

  useEffect(() => {
    if (!open) return;
    setPhase('generating');
    setStepIndex(0);
    const stepTimer = window.setInterval(() => setStepIndex((i) => Math.min(i + 1, GENERATION_STEPS.length - 1)), 650);
    const doneTimer = window.setTimeout(() => setPhase('done'), 3200);
    return () => {
      window.clearInterval(stepTimer);
      window.clearTimeout(doneTimer);
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" subtitle="Incident EFIF-0017 · environmental investigation report" icon="reports" accent="border-sky-400/25 bg-sky-400/10 text-sky-300">
      <AnimatePresence mode="wait">
        {phase === 'generating' ? (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="py-6"
          >
            <div className="flex items-center justify-center">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400" />
                <FileText className="h-6 w-6 text-sky-300" />
              </div>
            </div>
            <p className="mt-5 text-center text-[13.5px] font-medium text-slate-200">
              Generating environmental investigation report…
            </p>
            <div className="mx-auto mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.1, ease: 'easeInOut' }}
                className="animate-shimmer h-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400"
              />
            </div>
            <div className="mt-4 flex h-5 items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11.5px] text-slate-400"
                >
                  {GENERATION_STEPS[stepIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
              <p className="text-[12.5px] text-emerald-200">
                Report generated successfully — all evidence layers correlated.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-night-900/40 p-4">
              <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-emerald-300">
                EFIF-REPORT · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <h4 className="font-display mt-1.5 text-[15px] font-semibold text-white">
                Environmental Investigation Report — EFIF-0017
              </h4>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                This report consolidates satellite, drone, sensor, eDNA and laboratory evidence for the suspected
                illegal discharge into the Vrishabhavati river corridor. Composite AI risk score: 87/100 (HIGH).
                Evidence chain of custody is complete across all 6 source types.
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: 'Evidence items', v: '6' },
                  { k: 'Sources fused', v: '6' },
                  { k: 'Risk score', v: '87/100' },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-white/[0.04] px-2.5 py-2 text-center">
                    <p className="font-display text-[15px] font-bold text-white">{s.v}</p>
                    <p className="text-[9.5px] tracking-wide text-slate-500 uppercase">{s.k}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2.5">
              <Button
                variant="sky"
                className="flex-1"
                onClick={() => push('Report downloaded (simulated PDF).')}
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
