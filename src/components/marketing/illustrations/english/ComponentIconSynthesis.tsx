'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Two short bars slide together, plus sign fades, becomes one bar. */
export default function ComponentIconSynthesis() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.rect
        x="6" y="12" rx="3"
        fill="currentColor" opacity="0.7"
        animate={reduce ? { width: 16 } : { width: [16, 16, 16, 36, 36], x: [6, 6, 6, 6, 6] }}
        transition={{ ...loop, times: [0, 0.4, 0.5, 0.6, 1] }}
        height="4"
      />
      <motion.rect
        x="26" y="32" rx="3"
        fill="currentColor" opacity="0.7"
        animate={reduce ? { opacity: 0 } : { x: [26, 26, 6, 6, 6], opacity: [0.7, 0.7, 0.7, 0, 0] }}
        transition={{ ...loop, times: [0, 0.4, 0.55, 0.6, 1] }}
        width="16" height="4"
      />
      <motion.g
        animate={reduce ? { opacity: 0 } : { opacity: [0, 1, 1, 0, 0] }}
        transition={{ ...loop, times: [0, 0.15, 0.45, 0.55, 1] }}
      >
        <line x1="20" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="18" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
      <motion.path
        d="M14 16 L17 19 L23 13"
        stroke="var(--brand-mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        animate={reduce ? {} : { pathLength: [0, 0, 0, 1, 1, 0], opacity: [0, 0, 0, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.4, 0.6, 0.7, 0.85, 1] }}
      />
    </svg>
  );
}
