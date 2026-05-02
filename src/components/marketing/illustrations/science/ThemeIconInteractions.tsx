'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Two arrows pushing toward each other and back. */
export default function ThemeIconInteractions() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.g
        animate={reduce ? {} : { x: [0, 4, 0, -2, 0] }}
        transition={loop}
      >
        <line x1="6" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline points="16,20 20,24 16,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.5" />

      <motion.g
        animate={reduce ? {} : { x: [0, -4, 0, 2, 0] }}
        transition={loop}
      >
        <line x1="42" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline points="32,20 28,24 32,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
}
