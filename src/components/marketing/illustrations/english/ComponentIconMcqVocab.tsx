'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Vertical stacked options — vocab MCQ feel (one selected). */
export default function ComponentIconMcqVocab() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const };

  // 4 stacked option pills, one filled at a time (cycles)
  const pills = [
    { y: 6,  selectedAt: 0.10 },
    { y: 16, selectedAt: 0.35 },
    { y: 26, selectedAt: 0.60 },
    { y: 36, selectedAt: 0.85 },
  ];

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {pills.map((p, i) => (
        <motion.rect
          key={i}
          x="8" y={p.y} width="32" height="7" rx="3.5"
          fill="currentColor"
          animate={reduce ? { opacity: 0.4 } : {
            opacity: [0.3, 0.3, 1, 1, 0.3, 0.3],
          }}
          transition={
            reduce
              ? {}
              : {
                  ...loop,
                  times: [0, p.selectedAt - 0.05, p.selectedAt, p.selectedAt + 0.1, p.selectedAt + 0.15, 1],
                }
          }
        />
      ))}
      {/* Highlighted check on the currently-selected option */}
      <motion.path
        d="M28 19 L31 22 L36 16"
        stroke="var(--surface-container-lowest)" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
        animate={reduce ? {} : { opacity: [0, 0, 1, 1, 0, 0] }}
        transition={reduce ? {} : { ...loop, times: [0, 0.3, 0.4, 0.5, 0.55, 1] }}
      />
    </svg>
  );
}
