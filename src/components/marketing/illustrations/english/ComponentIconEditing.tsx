'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Strikethrough draws across wrong word; correction appears below. */
export default function ComponentIconEditing() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <text x="10" y="20" fontSize="12" fontWeight="600" fill="currentColor" opacity="0.6"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')">goed</text>
      <motion.line
        x1="8" y1="17" x2="40" y2="17"
        stroke="var(--brand-rose)" strokeWidth="2" strokeLinecap="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={reduce ? {} : { pathLength: [0, 1, 1, 0, 0] }}
        transition={{ ...loop, times: [0, 0.25, 0.6, 0.75, 1] }}
      />
      <motion.text
        x="10" y="40" fontSize="13" fontWeight="700" fill="currentColor"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
        animate={reduce ? {} : { opacity: [0, 0, 1, 1, 0], y: [-4, -4, 0, 0, 0] }}
        transition={{ ...loop, times: [0, 0.3, 0.45, 0.85, 1] }}
      >
        went ✓
      </motion.text>
    </svg>
  );
}
