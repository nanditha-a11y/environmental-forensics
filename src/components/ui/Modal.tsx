import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  wide?: boolean;
  accent?: string;
}

export function Modal({ open, onClose, title, subtitle, icon, children, wide = false, accent = 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-night-950/70 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className={`glass-strong relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl overflow-hidden`}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
              {icon && (
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${accent}`}>
                  <Icon name={icon} className="h-4.5 w-4.5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-display truncate text-[15px] font-semibold text-white">{title}</h3>
                {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
