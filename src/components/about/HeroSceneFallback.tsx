'use client';

/** Static SVG fallback used under prefers-reduced-motion or while R3F loads. */
export default function HeroSceneFallback() {
  return (
    <svg
      viewBox="0 0 480 360"
      className="hero-fallback-svg"
      role="img"
      aria-label="Architect's drafting table with a paper showing a bar model and a notebook with the words 'why is the answer B?'"
    >
      {/* Backdrop blueprint grid */}
      <g opacity="0.18">
        {[...Array(11)].map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="360" stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
        {[...Array(8)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="480" y2={i * 48} stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
      </g>

      {/* Drafting table (perspective-faked) */}
      <path
        d="M 80 200 L 400 200 L 440 320 L 40 320 Z"
        fill="var(--cream)"
        stroke="var(--brand-sage)"
        strokeWidth="2"
      />
      <line x1="60" y1="320" x2="55" y2="350" stroke="var(--sage-dark)" strokeWidth="3" />
      <line x1="425" y1="320" x2="430" y2="350" stroke="var(--sage-dark)" strokeWidth="3" />

      {/* Paper with bar model */}
      <g transform="translate(160 215) rotate(-3)">
        <rect x="0" y="0" width="160" height="100" fill="#FBF8F1" stroke="var(--border-light)" />
        <rect x="14" y="20" width="132" height="22" fill="rgba(59,130,246,0.10)" stroke="var(--maths-colour)" strokeWidth="1.5" />
        <rect x="14" y="50" width="52" height="20" fill="rgba(183,110,121,0.12)" stroke="var(--brand-rose)" strokeWidth="1.5" />
        <rect x="72" y="50" width="74" height="20" fill="rgba(5,150,105,0.10)" stroke="var(--brand-mint)" strokeWidth="1.5" />
        <text x="14" y="92" fontSize="9" fill="var(--brand-rose)" fontStyle="italic">why is the answer B?</text>
      </g>

      {/* Notebook */}
      <g transform="translate(330 230) rotate(8)">
        <rect x="0" y="0" width="64" height="84" fill="var(--sage-dark)" />
        <rect x="2" y="2" width="60" height="80" fill="var(--cream)" />
        <line x1="14" y1="2" x2="14" y2="82" stroke="var(--brand-rose)" strokeWidth="0.5" />
        <text x="18" y="22" fontSize="8" fill="var(--text-main)" fontStyle="italic">she got</text>
        <text x="18" y="34" fontSize="8" fill="var(--text-main)" fontStyle="italic">41 wrong</text>
        <text x="18" y="58" fontSize="9" fill="var(--brand-rose)" fontStyle="italic">but why?</text>
      </g>
    </svg>
  );
}
