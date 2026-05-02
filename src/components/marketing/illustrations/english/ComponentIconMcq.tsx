'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** 4 dots appear; one fills with check. */
export default function ComponentIconMcq() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {[
        { cx: 14, cy: 14, correct: false, delay: 0.05 },
        { cx: 34, cy: 14, correct: true,  delay: 0.10 },
        { cx: 14, cy: 34, correct: false, delay: 0.15 },
        { cx: 34, cy: 34, correct: false, delay: 0.20 },
      ].map((opt, i) => (
        <motion.circle
          key={i}
          cx={opt.cx} cy={opt.cy} r="6"
          stroke="currentColor" strokeWidth="2"
          fill={opt.correct ? 'currentColor' : 'transparent'}
          initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: opt.delay }}
          style={{ transformOrigin: `${opt.cx}px ${opt.cy}px` }}
        />
      ))}
      <motion.path
        d="M30 14 L33 17 L38 11"
        stroke="var(--surface-container-lowest)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
        initial={reduce ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        animate={reduce ? {} : { pathLength: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.3, 0.45, 0.85, 1] }}
      />
    </svg>
  );
}
