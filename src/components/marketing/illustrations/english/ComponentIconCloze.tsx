'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Blank underline pulses. Word slides in from right and snaps. */
export default function ComponentIconCloze() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <text x="6" y="28" fontSize="11" fontWeight="600" fill="currentColor"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')">fox</text>
      <motion.line
        x1="22" y1="30" x2="38" y2="30"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        animate={reduce ? {} : { opacity: [1, 0.3, 1, 0.3, 1] }}
        transition={loop}
      />
      <motion.text
        x="24" y="28" fontSize="11" fontWeight="700" fill="currentColor"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        animate={reduce ? {} : { opacity: [0, 0, 1, 1, 0], x: [20, 20, 0, 0, 0] }}
        transition={{ ...loop, times: [0, 0.4, 0.5, 0.85, 1] }}
      >
        runs
      </motion.text>
    </svg>
  );
}
