'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  className?: string;
}

/** Architect-scholar grey cat: soft grey fill, sage outline, tiny rose collar tag.
 *  Used as the Science page wanderer (themes section). Counterpart to Dog.tsx. */
export default function Cat({ className }: Props) {
  const reduce = useReducedMotion();

  // Idle: subtle tail flick + slow head tilt — cat-appropriate vs the dog's bounce.
  const idle = reduce
    ? {}
    : {
        animate: { y: [0, -1, 0, -1, 0] },
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
      };

  return (
    <motion.svg
      className={className}
      width="80"
      height="64"
      viewBox="0 0 80 64"
      fill="none"
      role="img"
      aria-label="Superholic Lab cat mascot"
      {...idle}
    >
      {/* Body */}
      <path
        d="M16 42 Q16 30 28 28 L48 28 Q58 28 60 36 L60 46 Q60 50 56 50 L20 50 Q16 50 16 46 Z"
        fill="var(--surface-container-highest)"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Head — rounder, smaller than dog */}
      <circle
        cx="60" cy="22" r="9"
        fill="var(--surface-container-highest)"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
      />
      {/* Triangular ears (left + right) */}
      <path
        d="M52 14 L54 6 L58 14 Z"
        fill="var(--surface-container-highest)"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M62 14 L66 6 L68 14 Z"
        fill="var(--surface-container-highest)"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner-ear pink */}
      <path d="M53.5 12.5 L55 8 L57 12.5 Z" fill="var(--brand-rose)" opacity="0.5" />
      <path d="M63.5 12.5 L66 8 L67 12.5 Z" fill="var(--brand-rose)" opacity="0.5" />
      {/* Eyes */}
      <ellipse cx="56" cy="22" rx="1" ry="1.4" fill="var(--text-muted)" />
      <ellipse cx="64" cy="22" rx="1" ry="1.4" fill="var(--text-muted)" />
      {/* Nose */}
      <path d="M59.5 26 L60.5 26 L60 27 Z" fill="var(--brand-rose)" />
      {/* Whiskers */}
      <line x1="51" y1="25" x2="46" y2="24" stroke="var(--text-muted)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="51" y1="27" x2="46" y2="27" stroke="var(--text-muted)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="69" y1="25" x2="74" y2="24" stroke="var(--text-muted)" strokeWidth="0.6" strokeLinecap="round" />
      <line x1="69" y1="27" x2="74" y2="27" stroke="var(--text-muted)" strokeWidth="0.6" strokeLinecap="round" />
      {/* Legs (4 thin lines, slightly tucked) */}
      <line x1="22" y1="50" x2="22" y2="58" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="50" x2="30" y2="58" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="46" y1="50" x2="46" y2="58" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="54" y1="50" x2="54" y2="58" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Tail — long curving up, with subtle flick */}
      <motion.path
        d="M16 36 Q6 30 8 18 Q10 10 14 12"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={reduce ? {} : { rotate: [0, -4, 0, 3, 0] }}
        transition={reduce ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '16px 36px' }}
      />
      {/* Collar tag (rose accent) */}
      <circle cx="56" cy="32" r="1.8" fill="var(--brand-rose)" />
    </motion.svg>
  );
}
