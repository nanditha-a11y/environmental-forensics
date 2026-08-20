import { motion } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { placeholderModules } from '../data/mock';

export default function Placeholder({ moduleKey }: { moduleKey: string }) {
  const navigate = useNavigate();
  const mod = placeholderModules.find((m) => m.key === moduleKey) ?? placeholderModules[0];

  return (
    <Shell>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-xl rounded-3xl p-8 text-center sm:p-12"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-400/25 bg-gradient-to-b from-emerald-400/15 to-emerald-400/[0.04] shadow-glow-emerald">
            <Icon name={mod.icon} className="h-9 w-9 text-emerald-300" />
          </div>

          <h1 className="font-display mt-6 text-[26px] font-semibold text-white">{mod.title}</h1>
          <p className="mt-1.5 text-[13.5px] text-slate-400">{mod.subtitle}</p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.14em] text-amber-300 uppercase">
            <Clock className="h-3.5 w-3.5" /> Coming Soon
          </div>

          <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-slate-400">{mod.description}</p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {mod.chips.map((chip) => (
              <span key={chip} className="chip">
                {chip}
              </span>
            ))}
          </div>

          <Button variant="ghost" className="mt-8" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </Shell>
  );
}
