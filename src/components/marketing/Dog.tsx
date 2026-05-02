'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  variant?: 'hero' | 'bookend' | 'wander';
  className?: string;
}

/** Architect-scholar dog: white SVG, single sage outline, tiny rose collar tag.
 *  - 'hero' / 'wander': internal idle wiggle. Parent .hero-dog-wanderer drives x/y.
 *  - 'bookend': fade-and-slide-in once when scrolled into view (FinalCTA).
 */
export default function Dog({ variant = 'hero', className }: Props) {
  const reduce = useReducedMotion();

  const motionProps = reduce
    ? {}
    : variant === 'bookend'
      ? {
          initial: { x: -40, opacity: 0 },
          whileInView: { x: 0, opacity: 1 },
          viewport: { once: true, margin: '-100px' },
          transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
        }
      : {
          // Idle wiggle for hero / wander variants — parent wrapper drives wandering.
          animate: { y: [0, -2, 0, -2, 0] },
          transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
        };

  return (
    <motion.svg
      className={className}
      width="80"
      height="64"
      viewBox="0 0 80 64"
      fill="none"
      role="img"
      aria-label="Superholic Lab dog mascot"
      {...motionProps}
    >
      {/* Body */}
      <path
        d="M14 38 Q14 26 26 24 L52 24 Q62 24 64 32 L64 42 Q64 48 58 48 L20 48 Q14 48 14 42 Z"
        fill="var(--surface-container-lowest)"
        stroke="var(--brand-sage)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Head */}
      <path
        d="M52 24 Q52 14 62 14 Q72 14 72 24 Q72 32 64 32"
        fill="var(--surface-container-lowest)"
        stroke="var(--brand-sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ear */}
      <path
        d="M58 14 Q56 8 60 6 Q64 8 62 14"
        fill="var(--surface-container-lowest)"
        stroke="var(--brand-sage)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Eye */}
      <circle cx="64" cy="22" r="1.2" fill="var(--brand-sage)" />
      {/* Nose */}
      <circle cx="71" cy="24" r="1.5" fill="var(--brand-sage)" />
      {/* Legs */}
      <line x1="22" y1="48" x2="22" y2="58" stroke="var(--brand-sage)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="32" y1="48" x2="32" y2="58" stroke="var(--brand-sage)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="48" x2="46" y2="58" stroke="var(--brand-sage)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="56" y1="48" x2="56" y2="58" stroke="var(--brand-sage)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Tail */}
      <path d="M14 32 Q6 28 8 22" fill="none" stroke="var(--brand-sage)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Collar tag (rose accent) */}
      <circle cx="52" cy="32" r="2" fill="var(--brand-rose)" />
    </motion.svg>
  );
}
