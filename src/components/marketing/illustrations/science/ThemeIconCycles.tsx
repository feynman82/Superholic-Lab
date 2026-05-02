'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Circular arrows rotating slowly. */
export default function ThemeIconCycles() {
  const reduce = useReducedMotion();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={reduce ? {} : { duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '24px 24px' }}
      >
        <path d="M24 8 A16 16 0 0 1 40 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <polyline points="36,20 40,24 36,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M24 40 A16 16 0 0 1 8 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        <polyline points="12,28 8,24 12,20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </motion.g>
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
