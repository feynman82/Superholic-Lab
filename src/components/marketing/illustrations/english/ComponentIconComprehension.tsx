'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Magnifying glass scans across lines of text. */
export default function ComponentIconComprehension() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="6" y1="14" x2="40" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="22" x2="36" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="30" x2="38" y2="30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="6" y1="38" x2="32" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

      <motion.g
        animate={reduce ? {} : { x: [0, 28, 28, 0, 0], y: [0, 0, 16, 16, 0] }}
        transition={loop}
      >
        <circle cx="14" cy="14" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="19" y1="19" x2="24" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
}
