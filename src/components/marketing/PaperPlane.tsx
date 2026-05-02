'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  className?: string;
}

/** Architect-scholar paper plane mascot — used as the English page wanderer
 *  in the Diagnose section (§2). Cream fill, sage outline, rose nose. */
export default function PaperPlane({ className }: Props) {
  const reduce = useReducedMotion();

  // Subtle pitch wobble — simulates flight bobbing.
  const idle = reduce
    ? {}
    : {
        animate: { rotate: [-3, 3, -3, 3, -3] },
        transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
      };

  return (
    <motion.svg
      className={className}
      width="80"
      height="60"
      viewBox="0 0 80 60"
      fill="none"
      role="img"
      aria-label="Superholic Lab paper plane"
      style={{ transformOrigin: '40px 30px' }}
      {...idle}
    >
      {/* Drop shadow under the plane */}
      <ellipse cx="40" cy="52" rx="22" ry="3" fill="var(--brand-sage)" opacity="0.08" />
      {/* Top wing (lighter face — catches light) */}
      <path
        d="M5 30 L72 8 L40 30 Z"
        fill="var(--surface-container-lowest)"
        stroke="var(--brand-sage)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Bottom wing (darker face — in shadow) */}
      <path
        d="M5 30 L40 30 L72 8 L40 38 Z"
        fill="var(--surface-container-high)"
        stroke="var(--brand-sage)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Underside fold (creates 3D illusion) */}
      <path
        d="M5 30 L40 38 L40 30 Z"
        fill="var(--surface-container)"
        stroke="var(--brand-sage)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Centre crease — subtle highlight */}
      <line
        x1="40" y1="30" x2="72" y2="8"
        stroke="var(--text-muted)"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Rose tip — the iconic Superholic Lab accent */}
      <circle cx="72" cy="8" r="1.6" fill="var(--brand-rose)" />
    </motion.svg>
  );
}
