'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Three connected nodes pulsing in sequence. */
export default function ThemeIconSystems() {
  const reduce = useReducedMotion();
  const t = (delay: number) => reduce ? {} : { duration: 2.4, repeat: Infinity, delay, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="12" y1="24" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="12" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

      <motion.circle cx="12" cy="24" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(0)} style={{ transformOrigin: '12px 24px' }} />
      <motion.circle cx="24" cy="12" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(0.8)} style={{ transformOrigin: '24px 12px' }} />
      <motion.circle cx="36" cy="24" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(1.6)} style={{ transformOrigin: '36px 24px' }} />
    </svg>
  );
}
