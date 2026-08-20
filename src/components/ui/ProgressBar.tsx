import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  gradientClass: string;
  delay?: number;
  className?: string;
}

export function ProgressBar({ value, gradientClass, delay = 0, className = '' }: ProgressBarProps) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
      />
    </div>
  );
}
