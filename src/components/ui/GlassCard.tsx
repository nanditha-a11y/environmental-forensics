import { motion } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  className?: string;
}

export function GlassCard({ children, hover = false, className = '', ...rest }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl ${hover ? 'transition-[border-color,box-shadow] hover:border-white/15 hover:shadow-[0_16px_44px_-14px_rgba(2,8,18,0.8)]' : ''} ${className}`}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}
