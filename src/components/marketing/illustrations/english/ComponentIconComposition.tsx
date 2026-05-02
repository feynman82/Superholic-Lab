'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Pencil draws a wavy underline (Wena coaching mark). */
export default function ComponentIconComposition() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="6" y1="14" x2="42" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="6" y1="22" x2="36" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="6" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

      <motion.path
        d="M8 38 Q12 34 16 38 Q20 42 24 38 Q28 34 32 38 Q36 42 40 38"
        stroke="var(--brand-rose)" strokeWidth="2" strokeLinecap="round" fill="none"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={reduce ? {} : { pathLength: [0, 1, 1, 0, 0] }}
        transition={{ ...loop, times: [0, 0.5, 0.85, 0.95, 1] }}
      />
      <motion.g
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: 0, y: 0 }}
        animate={reduce ? {} : { opacity: [0, 1, 1, 0, 0], x: [0, 32, 32, 0, 0], y: [0, 0, 0, 0, 0] }}
        transition={{ ...loop, times: [0, 0.05, 0.5, 0.6, 1] }}
      >
        <path d="M8 38 L11 35 L13 37 L10 40 Z" fill="var(--brand-rose)" />
      </motion.g>
    </svg>
  );
}
