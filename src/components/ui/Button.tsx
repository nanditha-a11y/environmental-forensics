import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'emerald' | 'sky' | 'violet' | 'ghost' | 'outline' | 'danger' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  emerald:
    'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/60 hover:from-emerald-400 hover:to-emerald-600 border border-emerald-300/20',
  sky: 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-950/60 hover:from-sky-400 hover:to-sky-600 border border-sky-300/20',
  violet:
    'bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-950/60 hover:from-violet-400 hover:to-violet-600 border border-violet-300/20',
  ghost: 'bg-white/[0.06] text-slate-200 border border-white/10 hover:bg-white/[0.12]',
  outline: 'border border-white/15 text-slate-200 hover:bg-white/[0.07] hover:border-white/25',
  danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white border border-red-300/20 hover:from-red-400 hover:to-red-600',
  dark: 'bg-night-900/70 text-slate-200 border border-white/12 hover:bg-night-900 hover:border-white/25',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-[13px] rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm rounded-xl gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = 'emerald', size = 'md', className = '', children, ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12 }}
      className={`inline-flex items-center justify-center font-semibold tracking-wide transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 disabled:pointer-events-none disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
