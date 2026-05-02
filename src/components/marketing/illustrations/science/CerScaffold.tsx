'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function CerScaffold() {
  const reduce = useReducedMotion();

  // Total animation: 14s build + 4s pause. Loops every 18s.
  // 0.0  - 1.0s   Claim panel draws
  // 1.0  - 2.5s   Claim text types in word-by-word
  // 2.5  - 3.0s   Arrow 1 draws (claim → evidence)
  // 3.0  - 4.0s   Evidence panel draws
  // 4.0  - 7.0s   Evidence chart plots over time
  // 7.0  - 7.5s   Arrow 2 draws (evidence → reason)
  // 7.5  - 8.5s   Reason panel draws
  // 8.5  - 12.0s  Reason micro-diagram (sun + leaf) animates
  // 12.0 - 14.0s  Hold complete state
  // 14.0 - 18.0s  Hold (pause) → restart
  const loop = { repeat: Infinity, duration: 18, ease: 'easeInOut' as const };

  if (reduce) {
    return <CerScaffoldStatic />;
  }

  return (
    <svg
      viewBox="0 0 360 480"
      className="hero-illustration"
      role="img"
      aria-label="Claim, Evidence, Reason scaffold — the framework Superholic Lab uses to teach Science"
    >
      {/* Drafting grid backdrop */}
      <g opacity="0.18">
        {[...Array(8)].map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="480" stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="360" y2={i * 48} stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
      </g>

      {/* ─── CLAIM PANEL ─── */}
      <motion.g>
        <motion.rect
          x="40" y="20" width="280" height="100" rx="8"
          fill="var(--surface-container-lowest)"
          stroke="var(--science-colour)" strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 1, 1, 1, 0],
            opacity: [0, 1, 1, 1, 1, 0],
          }}
          transition={{ ...loop, times: [0, 0.056, 0.78, 0.85, 0.95, 1] }}
        />
        <motion.text
          x="56" y="46" fontSize="11" fontWeight="700"
          fill="var(--science-colour)"
          fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          letterSpacing="0.1em"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 1, 0] }}
          transition={{ ...loop, times: [0, 0.083, 0.78, 0.95, 1] }}
        >
          CLAIM
        </motion.text>
        <ClaimWords loop={loop} />
      </motion.g>

      {/* Arrow 1: claim → evidence */}
      <motion.path
        d="M180 130 L180 165"
        stroke="var(--science-colour)" strokeWidth="2" fill="none"
        markerEnd="url(#arrow-mint)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 1, 1, 1, 1, 0],
          opacity:    [0, 0, 1, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.139, 0.167, 0.17, 0.78, 0.95, 1] }}
      />

      {/* ─── EVIDENCE PANEL ─── */}
      <motion.g>
        <motion.rect
          x="40" y="170" width="280" height="140" rx="8"
          fill="var(--surface-container-lowest)"
          stroke="var(--brand-sage)" strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0, 0, 1, 1, 1, 0],
            opacity:    [0, 0, 0, 1, 1, 1, 0],
          }}
          transition={{ ...loop, times: [0, 0.167, 0.17, 0.222, 0.78, 0.95, 1] }}
        />
        <motion.text
          x="56" y="196" fontSize="11" fontWeight="700"
          fill="var(--brand-sage)"
          fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          letterSpacing="0.1em"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1, 1, 1, 0] }}
          transition={{ ...loop, times: [0, 0.2, 0.21, 0.25, 0.78, 0.95, 1] }}
        >
          EVIDENCE
        </motion.text>
        <EvidenceChart loop={loop} />
      </motion.g>

      {/* Arrow 2: evidence → reason */}
      <motion.path
        d="M180 320 L180 355"
        stroke="var(--brand-sage)" strokeWidth="2" fill="none"
        markerEnd="url(#arrow-sage)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.389, 0.417, 0.5, 0.78, 0.95, 1] }}
      />

      {/* ─── REASON PANEL ─── */}
      <motion.g>
        <motion.rect
          x="40" y="360" width="280" height="100" rx="8"
          fill="var(--surface-container-lowest)"
          stroke="var(--brand-rose)" strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            opacity:    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
          }}
          transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.417, 0.472, 0.78, 0.95, 1] }}
        />
        <motion.text
          x="56" y="386" fontSize="11" fontWeight="700"
          fill="var(--brand-rose)"
          fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          letterSpacing="0.1em"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0] }}
          transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.475, 0.5, 0.78, 0.95, 1] }}
        >
          REASON
        </motion.text>
        <ReasonMicroDiagram loop={loop} />
      </motion.g>

      {/* Arrow markers */}
      <defs>
        <marker id="arrow-mint" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--science-colour)" />
        </marker>
        <marker id="arrow-sage" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-sage)" />
        </marker>
      </defs>
    </svg>
  );
}

/* CLAIM TEXT — word by word, using tspans so SVG handles variable word widths */
function ClaimWords({ loop }: { loop: { repeat: number; duration: number; ease: 'easeInOut' } }) {
  const words = ['Plants', 'need', 'sunlight', 'to', 'grow.'];
  return (
    <text
      x="56" y="84"
      fontSize="16"
      fontWeight="600"
      fill="var(--text-main)"
      fontFamily="var(--font-body, 'Plus Jakarta Sans')"
      xmlSpace="preserve"
    >
      {words.map((w, i) => (
        <motion.tspan
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 1, 1, 0] }}
          transition={{
            ...loop,
            times: [0, 0.056 + i * 0.014, 0.083 + i * 0.014, 0.13, 0.78, 0.95, 1],
          }}
        >
          {w}{i < words.length - 1 ? ' ' : ''}
        </motion.tspan>
      ))}
    </text>
  );
}

/* EVIDENCE — mini line chart of plant heights over 5 days */
function EvidenceChart({ loop }: { loop: { repeat: number; duration: number; ease: 'easeInOut' } }) {
  const sunPlantPoints = [
    { x: 80,  y: 285 },
    { x: 130, y: 270 },
    { x: 180, y: 250 },
    { x: 230, y: 232 },
    { x: 280, y: 220 },
  ];
  const darkPlantPoints = [
    { x: 80,  y: 285 },
    { x: 130, y: 280 },
    { x: 180, y: 273 },
    { x: 230, y: 268 },
    { x: 280, y: 263 },
  ];
  const sunPath = `M ${sunPlantPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const darkPath = `M ${darkPlantPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <>
      <line x1="70" y1="215" x2="70" y2="295" stroke="var(--text-muted)" strokeWidth="0.5" opacity="0.5" />
      <line x1="70" y1="295" x2="290" y2="295" stroke="var(--text-muted)" strokeWidth="0.5" opacity="0.5" />

      <motion.path
        d={sunPath} fill="none"
        stroke="var(--science-colour)" strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 1, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.222, 0.389, 0.55, 0.95, 1] }}
      />
      <motion.path
        d={darkPath} fill="none"
        stroke="var(--brand-rose)" strokeWidth="2"
        strokeDasharray="4 3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 1, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 1, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.25, 0.389, 0.55, 0.95, 1] }}
      />

      <motion.text
        x="290" y="220" fontSize="10" fontWeight="600"
        fill="var(--science-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0, 1, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.35, 0.389, 0.78, 0.95, 1] }}
      >
        24cm ☀
      </motion.text>
      <motion.text
        x="290" y="266" fontSize="10" fontWeight="600"
        fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0, 1, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.35, 0.389, 0.78, 0.95, 1] }}
      >
        15cm ◐
      </motion.text>
    </>
  );
}

/* REASON — sun + leaf with light arrows */
function ReasonMicroDiagram({ loop }: { loop: { repeat: number; duration: number; ease: 'easeInOut' } }) {
  return (
    <g>
      <motion.circle
        cx="100" cy="410" r="12"
        fill="var(--brand-amber)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale:   [0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          opacity: [0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.528, 0.78, 1] }}
      />
      {[-30, -15, 0, 15, 30].map((deg, i) => (
        <motion.line
          key={deg}
          x1="100" y1="410" x2="120" y2="410"
          stroke="var(--brand-amber)" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${deg} 100 410)`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            opacity:    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          }}
          transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.583 + i * 0.011, 0.78, 1] }}
        />
      ))}
      {/* Flower (right) — stem + side leaf + 5 rose petals + amber centre */}
      <motion.g
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          scale:   [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1, 1, 1],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.611, 0.78, 1] }}
        style={{ transformOrigin: '240px 420px' }}
      >
        {/* Stem */}
        <line x1="240" y1="445" x2="240" y2="420" stroke="var(--brand-mint)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Side leaf */}
        <path d="M240 432 Q230 428 226 434 Q230 440 240 437" fill="rgba(5, 150, 105, 0.4)" stroke="var(--brand-mint)" strokeWidth="1" />
        {/* Petals (5 around centre 240,414) */}
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="240" cy="406" rx="4.5" ry="7"
            fill="rgba(232, 154, 165, 0.65)"
            stroke="var(--brand-rose)" strokeWidth="1"
            transform={`rotate(${deg} 240 414)`}
          />
        ))}
        {/* Centre */}
        <circle cx="240" cy="414" r="3" fill="var(--brand-amber)" />
      </motion.g>
      {/* Energy arrow from sun to flower */}
      <motion.path
        d="M125 410 Q165 405 215 414"
        stroke="var(--brand-amber)" strokeWidth="1.5" fill="none"
        strokeDasharray="3 2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.78, 1] }}
      />
      <motion.text
        x="180" y="450" fontSize="11" fontStyle="italic"
        fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        textAnchor="middle"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.722, 0.78, 1] }}
      >
        sun → energy → growth
      </motion.text>
    </g>
  );
}

/* Reduced-motion static version */
function CerScaffoldStatic() {
  return (
    <svg viewBox="0 0 360 480" className="hero-illustration" role="img" aria-label="Claim, Evidence, Reason scaffold">
      <rect x="40" y="20" width="280" height="100" rx="8"
        fill="var(--surface-container-lowest)" stroke="var(--science-colour)" strokeWidth="2" />
      <text x="56" y="46" fontSize="11" fontWeight="700" fill="var(--science-colour)" letterSpacing="0.1em">CLAIM</text>
      <text x="56" y="84" fontSize="16" fontWeight="600" fill="var(--text-main)">Plants need sunlight to grow.</text>

      <line x1="180" y1="130" x2="180" y2="165" stroke="var(--science-colour)" strokeWidth="2" />

      <rect x="40" y="170" width="280" height="140" rx="8"
        fill="var(--surface-container-lowest)" stroke="var(--brand-sage)" strokeWidth="2" />
      <text x="56" y="196" fontSize="11" fontWeight="700" fill="var(--brand-sage)" letterSpacing="0.1em">EVIDENCE</text>
      <text x="56" y="240" fontSize="13" fill="var(--text-main)">Plant in sun: 24cm</text>
      <text x="56" y="260" fontSize="13" fill="var(--text-main)">Plant in dark: 15cm</text>

      <line x1="180" y1="320" x2="180" y2="355" stroke="var(--brand-sage)" strokeWidth="2" />

      <rect x="40" y="360" width="280" height="100" rx="8"
        fill="var(--surface-container-lowest)" stroke="var(--brand-rose)" strokeWidth="2" />
      <text x="56" y="386" fontSize="11" fontWeight="700" fill="var(--brand-rose)" letterSpacing="0.1em">REASON</text>
      <text x="56" y="420" fontSize="14" fill="var(--text-main)">Sunlight is the energy source</text>
      <text x="56" y="440" fontSize="14" fill="var(--text-main)">for photosynthesis.</text>
    </svg>
  );
}
