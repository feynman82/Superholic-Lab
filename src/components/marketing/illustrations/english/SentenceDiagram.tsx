'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function SentenceDiagram() {
  const reduce = useReducedMotion();

  if (reduce) return <SentenceDiagramStatic />;

  // 12s loop. See spec §4 timeline.
  const loop = { duration: 12, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg
      viewBox="0 0 480 400"
      className="hero-illustration"
      role="img"
      aria-label="Sentence diagram showing how Superholic Lab teaches English systematically — choosing the correct word for a blank, then verifying subject-verb agreement"
    >
      {/* Drafting grid */}
      <g opacity="0.18">
        {[...Array(11)].map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="400" stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
        {[...Array(9)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="480" y2={i * 48} stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
      </g>

      {/* Underline beneath the slot — narrower (60px), tighter to "The cat" */}
      <motion.line
        x1="160" y1="125" x2="220" y2="125"
        stroke="var(--english-colour)" strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 1, 1, 1, 1, 0],
          opacity:    [0, 1, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.083, 0.92, 0.96, 0.99, 1] }}
      />

      {/* "The cat" */}
      <motion.text
        x="60" y="120" fontSize="28" fontWeight="600"
        fill="var(--text-main)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 1, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.083, 0.125, 0.5, 0.85, 0.92, 0.96, 1] }}
      >
        The cat
      </motion.text>

      {/* Empty slot pulse — centred over slot at x=190 */}
      <motion.text
        x="190" y="120" fontSize="28" fontWeight="600"
        fill="var(--english-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        textAnchor="middle"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
        }}
        transition={{ ...loop, times: [0, 0.125, 0.167, 0.21, 0.375, 0.4, 0.5, 0.85, 0.96, 1] }}
      >
        ____
      </motion.text>

      {/* Correct word snaps in */}
      <motion.text
        x="190" y="120" fontSize="28" fontWeight="700"
        fill="var(--english-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        textAnchor="middle"
        initial={{ opacity: 0, y: -8 }}
        animate={{
          opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
          y:       [-8, -8, -8, -8, -8, -8, -8, -8, 0, 0, 0, 0],
        }}
        transition={{ ...loop, times: [0, 0.125, 0.21, 0.375, 0.4, 0.42, 0.45, 0.46, 0.5, 0.85, 0.96, 1] }}
      >
        sits
      </motion.text>

      {/* "on the mat." — moves left to follow the new slot position */}
      <motion.text
        x="230" y="120" fontSize="28" fontWeight="600"
        fill="var(--text-main)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.083, 0.125, 0.167, 0.21, 0.5, 0.85, 0.92, 0.96, 0.99, 1] }}
      >
        on the mat.
      </motion.text>

      {/* Option chips */}
      <Chip x={60}  y={210} label="sit"     loop={loop} appearAt={0.21} disappearAt={0.42} isCorrect={false} />
      <Chip x={150} y={210} label="sits"    loop={loop} appearAt={0.23} disappearAt={0.42} isCorrect={true}  />
      <Chip x={240} y={210} label="sat"     loop={loop} appearAt={0.25} disappearAt={0.42} isCorrect={false} />
      <Chip x={330} y={210} label="sitting" loop={loop} appearAt={0.27} disappearAt={0.42} isCorrect={false} />

      {/* Subject-Verb arc — connects "cat" centre (~100) to slot centre (~190) */}
      <motion.path
        d="M 100 88 Q 145 50 190 88"
        stroke="var(--brand-rose)" strokeWidth="2" fill="none"
        markerEnd="url(#arc-rose)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.21, 0.375, 0.42, 0.5, 0.625, 0.85, 0.96, 1] }}
      />

      <motion.text
        x="160" y="40" fontSize="11" fontWeight="700" letterSpacing="0.1em"
        fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.21, 0.375, 0.42, 0.5, 0.625, 0.667, 0.85, 0.96, 1] }}
      >
        SUBJECT–VERB AGREEMENT
      </motion.text>

      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.96, 1] }}
      >
        <rect x="120" y="320" width="240" height="36" rx="18"
          fill="rgba(139, 92, 246, 0.10)" stroke="var(--english-colour)" strokeWidth="1" />
        <text x="240" y="343" textAnchor="middle" fontSize="11" fontWeight="700"
          fill="var(--english-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          letterSpacing="0.08em">
          AO2 · GRAMMAR APPLICATION
        </text>
      </motion.g>

      <defs>
        <marker id="arc-rose" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-rose)" />
        </marker>
      </defs>
    </svg>
  );
}

interface ChipProps {
  x: number; y: number; label: string;
  loop: { duration: number; repeat: number; ease: 'easeInOut' };
  appearAt: number;
  disappearAt: number;
  isCorrect: boolean;
}

function Chip({ x, y, label, loop, appearAt, disappearAt, isCorrect }: ChipProps) {
  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: [0, 0, 1, 1, 0, 0, 0, 0, 0],
        y:       [8, 8, 0, 0, isCorrect ? -8 : 0, 0, 0, 0, 0],
      }}
      transition={{
        ...loop,
        times: [0, appearAt - 0.01, appearAt, disappearAt - 0.01, disappearAt, 0.5, 0.85, 0.96, 1],
      }}
    >
      <rect
        x={x} y={y} width="80" height="36" rx="18"
        fill={isCorrect ? 'rgba(139, 92, 246, 0.10)' : 'var(--surface-container-lowest)'}
        stroke={isCorrect ? 'var(--english-colour)' : 'var(--border-light)'}
        strokeWidth={isCorrect ? '2' : '1'}
      />
      <text
        x={x + 40} y={y + 23} textAnchor="middle"
        fontSize="14" fontWeight="600"
        fill={isCorrect ? 'var(--english-colour)' : 'var(--text-main)'}
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
      >
        {label}
      </text>
    </motion.g>
  );
}

function SentenceDiagramStatic() {
  return (
    <svg viewBox="0 0 480 400" className="hero-illustration" role="img" aria-label="Sentence diagram">
      <text x="60"  y="120" fontSize="28" fontWeight="600" fill="var(--text-main)">The cat</text>
      <text x="190" y="120" fontSize="28" fontWeight="700" fill="var(--english-colour)" textAnchor="middle">sits</text>
      <text x="230" y="120" fontSize="28" fontWeight="600" fill="var(--text-main)">on the mat.</text>
      <line x1="160" y1="125" x2="220" y2="125" stroke="var(--english-colour)" strokeWidth="2" />
      <path d="M 100 88 Q 145 50 190 88" stroke="var(--brand-rose)" strokeWidth="2" fill="none" />
      <text x="160" y="40" fontSize="11" fontWeight="700" letterSpacing="0.1em" fill="var(--brand-rose)">
        SUBJECT–VERB AGREEMENT
      </text>
      <rect x="120" y="320" width="240" height="36" rx="18" fill="rgba(139, 92, 246, 0.10)" stroke="var(--english-colour)" />
      <text x="240" y="343" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--english-colour)" letterSpacing="0.08em">
        AO2 · GRAMMAR APPLICATION
      </text>
    </svg>
  );
}
