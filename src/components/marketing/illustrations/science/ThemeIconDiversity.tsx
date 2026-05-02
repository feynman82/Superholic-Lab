'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Four shapes morphing between forms. */
export default function ThemeIconDiversity() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.circle
        cx="14" cy="14" r="6" fill="currentColor" opacity="0.7"
        animate={reduce ? {} : { r: [6, 5, 6, 7, 6], opacity: [0.7, 0.5, 0.7, 0.9, 0.7] }}
        transition={loop}
      />
      <motion.path
        d="M28 8 L40 14 L34 22 Z" fill="currentColor"
        animate={reduce ? {} : { rotate: [0, 8, 0, -8, 0] }}
        transition={loop}
        style={{ transformOrigin: '34px 14px' }}
      />
      <motion.rect
        x="6" y="28" width="12" height="12" rx="2" fill="currentColor" opacity="0.5"
        animate={reduce ? {} : { rotate: [0, 12, 0, -12, 0] }}
        transition={{ ...loop, duration: 7 }}
        style={{ transformOrigin: '12px 34px' }}
      />
      <motion.path
        d="M28 30 Q34 26 40 30 Q40 38 34 40 Q28 38 28 30 Z" fill="currentColor" opacity="0.8"
        animate={reduce ? {} : { scale: [1, 1.08, 1, 0.96, 1] }}
        transition={loop}
        style={{ transformOrigin: '34px 33px' }}
      />
    </svg>
  );
}
