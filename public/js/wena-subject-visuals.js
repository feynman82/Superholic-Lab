// ─────────────────────────────────────────────────────────────────────────
// /js/wena-subject-visuals.js — picker orb + glyph SVG generators (Sprint 8c)
// ─────────────────────────────────────────────────────────────────────────
// Mirrors subjects.js orbSvg() + topicGlyph() so the tutor picker can
// render the same trio-card visual identity as subjects.html. Keep the
// SVG markup synced with subjects.js if either side changes.
// ─────────────────────────────────────────────────────────────────────────

// Glass-sphere orb with subject-specific micro-world.
// `subjectSlug` is one of 'mathematics' | 'science' | 'english'.
export function orbSvg(subjectSlug) {
  const base = `
    <defs>
      <radialGradient id="grad-${subjectSlug}" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#F4FBF9" stop-opacity="0.85"/>
        <stop offset="55%" stop-color="#A8C4BB" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#51615E" stop-opacity="0.05"/>
      </radialGradient>
      <radialGradient id="spec-${subjectSlug}" cx="35%" cy="28%" r="22%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="92" fill="url(#grad-${subjectSlug})"/>
    <ellipse cx="78" cy="68" rx="34" ry="22" fill="url(#spec-${subjectSlug})"/>
    <circle cx="100" cy="100" r="92" fill="none" stroke="#51615E" stroke-opacity="0.18" stroke-width="1"/>`;

  if (subjectSlug === 'mathematics') {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      ${base}
      <g class="orb-rot-slow" stroke="#51615E" stroke-width="1.25" fill="none" stroke-linejoin="round">
        <g class="orb-drift">
          <polygon points="55,75 75,68 75,88 55,95"/>
          <polygon points="75,68 95,75 95,95 75,88"/>
          <polygon points="55,75 75,68 95,75 75,82"/>
          <line x1="75" y1="82" x2="75" y2="88"/>
        </g>
      </g>
      <g class="orb-rot-med" stroke="#B76E79" stroke-width="1.25" fill="none" stroke-linejoin="round">
        <g class="orb-drift-2">
          <polygon points="135,90 150,75 165,90 150,115 135,90"/>
          <line x1="135" y1="90" x2="165" y2="90"/>
          <line x1="150" y1="75" x2="150" y2="115"/>
        </g>
      </g>
      <g class="orb-rot-fast" stroke="#3A4E4A" stroke-width="1" fill="none">
        <g class="orb-drift-3">
          <circle cx="95" cy="140" r="18"/>
          <ellipse cx="95" cy="140" rx="18" ry="6"/>
          <ellipse cx="95" cy="140" rx="6" ry="18"/>
        </g>
      </g>
    </svg>`;
  }

  if (subjectSlug === 'science') {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      ${base}
      <g class="orb-rot-med">
        <line x1="100" y1="100" x2="60" y2="75" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
        <line x1="100" y1="100" x2="140" y2="120" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
        <line x1="100" y1="100" x2="115" y2="150" stroke="#51615E" stroke-width="1.25" stroke-opacity="0.6"/>
        <circle cx="100" cy="100" r="11" fill="#51615E" fill-opacity="0.85"/>
        <circle cx="60"  cy="75"  r="7"  fill="#B76E79" fill-opacity="0.8"/>
        <circle cx="140" cy="120" r="7"  fill="#B76E79" fill-opacity="0.8"/>
        <circle cx="115" cy="150" r="6"  fill="#D4A24A" fill-opacity="0.75"/>
      </g>
      <ellipse cx="100" cy="100" rx="58" ry="20" fill="none" stroke="#51615E" stroke-width="0.75" stroke-opacity="0.25" transform="rotate(-25 100 100)"/>
    </svg>`;
  }

  if (subjectSlug === 'english') {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      ${base}
      <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
        <text x="68" y="92" class="orb-glyph-fade" font-size="38" font-style="italic" fill="#51615E">Aa</text>
        <text x="138" y="100" class="orb-glyph-fade-2" font-size="44" fill="#B76E79">&amp;</text>
        <text x="100" y="148" class="orb-glyph-fade-3" font-size="36" fill="#3A4E4A">&#8220;&#8221;</text>
      </g>
    </svg>`;
  }

  return `<svg viewBox="0 0 200 200">${base}</svg>`;
}

// Small SVG signatures per canonical topic — falls back to a generic chip.
export function topicGlyph(topicCanonical) {
  const map = {
    // Mathematics
    'Whole Numbers': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><text x="32" y="40" text-anchor="middle" font-family="Bebas Neue, sans-serif" font-size="28" fill="currentColor" stroke="none">123</text></svg>`,
    'Multiplication Tables': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="22" x2="42" y2="42"/><line x1="42" y1="22" x2="22" y2="42"/></svg>`,
    'Addition and Subtraction': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="20" y1="22" x2="32" y2="22"/><line x1="26" y1="16" x2="26" y2="28"/><line x1="34" y1="42" x2="46" y2="42"/></svg>`,
    'Multiplication and Division': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><line x1="20" y1="20" x2="36" y2="36"/><line x1="36" y1="20" x2="20" y2="36"/><circle cx="44" cy="44" r="2.5" fill="currentColor"/><line x1="38" y1="50" x2="50" y2="50"/><circle cx="44" cy="56" r="2.5" fill="currentColor"/></svg>`,
    'Fractions': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="22"/><line x1="32" y1="10" x2="32" y2="54"/><line x1="10" y1="32" x2="54" y2="32"/><path d="M32 10 A22 22 0 0 1 54 32 L32 32 Z" fill="currentColor" fill-opacity="0.3" stroke="none"/></svg>`,
    'Decimals': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><text x="32" y="42" text-anchor="middle" font-family="Bebas Neue, sans-serif" font-size="24" fill="currentColor" stroke="none">0.5</text></svg>`,
    'Percentage': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="22" cy="22" r="4"/><circle cx="42" cy="42" r="4"/><line x1="42" y1="20" x2="22" y2="44"/></svg>`,
    'Ratio': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="24" width="14" height="16" fill="currentColor" fill-opacity="0.3"/><rect x="26" y="24" width="14" height="16"/><rect x="42" y="24" width="14" height="16"/></svg>`,
    'Rate': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="20"/><line x1="32" y1="32" x2="32" y2="18"/><line x1="32" y1="32" x2="44" y2="40"/></svg>`,
    'Average': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><line x1="14" y1="48" x2="50" y2="48"/><rect x="16" y="36" width="6" height="12" fill="currentColor" fill-opacity="0.3"/><rect x="26" y="28" width="6" height="20" fill="currentColor" fill-opacity="0.3"/><rect x="36" y="32" width="6" height="16" fill="currentColor" fill-opacity="0.3"/><line x1="14" y1="22" x2="50" y2="22" stroke-dasharray="3 3"/></svg>`,
    'Algebra': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><text x="32" y="42" text-anchor="middle" font-family="Georgia, serif" font-size="28" font-style="italic" fill="currentColor" stroke="none">x</text></svg>`,
    'Angles': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="14" y1="50" x2="50" y2="50"/><line x1="14" y1="50" x2="44" y2="22"/><path d="M28 50 A14 14 0 0 0 25 41" fill="none"/></svg>`,
    'Geometry': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="32,12 52,46 12,46"/></svg>`,
    'Area and Perimeter': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="18" width="36" height="28" fill="currentColor" fill-opacity="0.18"/></svg>`,
    'Area of Triangle': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="14,46 50,46 32,18" fill="currentColor" fill-opacity="0.18"/><line x1="32" y1="18" x2="32" y2="46" stroke-dasharray="3 3"/></svg>`,
    'Circles': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="20"/><line x1="32" y1="32" x2="52" y2="32" stroke-dasharray="3 3"/><circle cx="32" cy="32" r="2.5" fill="currentColor"/></svg>`,
    'Volume': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="16,46 16,26 32,18 48,26 48,46 32,54"/><line x1="16" y1="26" x2="32" y2="34"/><line x1="48" y1="26" x2="32" y2="34"/><line x1="32" y1="34" x2="32" y2="54"/></svg>`,
    'Symmetry': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="32,12 22,32 32,52" fill="currentColor" fill-opacity="0.2"/><polygon points="32,12 42,32 32,52"/><line x1="32" y1="8" x2="32" y2="56" stroke-dasharray="3 3"/></svg>`,
    'Shapes and Patterns': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="20" cy="20" r="6"/><rect x="36" y="14" width="14" height="14"/><polygon points="20,42 14,52 26,52"/><circle cx="46" cy="48" r="5"/></svg>`,
    'Factors and Multiples': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="20" cy="32" r="8"/><circle cx="44" cy="22" r="6"/><circle cx="44" cy="42" r="6"/><line x1="28" y1="32" x2="38" y2="22"/><line x1="28" y1="32" x2="38" y2="42"/></svg>`,
    'Pie Charts': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="20"/><path d="M32 32 L32 12 A20 20 0 0 1 52 32 Z" fill="currentColor" fill-opacity="0.3" stroke="none"/><line x1="32" y1="32" x2="32" y2="12"/><line x1="32" y1="32" x2="52" y2="32"/></svg>`,
    'Data Analysis': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><line x1="14" y1="50" x2="50" y2="50"/><line x1="14" y1="50" x2="14" y2="14"/><polyline points="18,40 28,32 38,36 48,20"/></svg>`,
    'Money': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="32" cy="32" r="18"/><path d="M32 22v20M28 26h6a3 3 0 010 6h-4a3 3 0 000 6h6" stroke-linejoin="round"/></svg>`,
    'Length and Mass': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="10" y="26" width="44" height="12" rx="1"/><line x1="18" y1="26" x2="18" y2="32"/><line x1="26" y1="26" x2="26" y2="34"/><line x1="34" y1="26" x2="34" y2="30"/><line x1="42" y1="26" x2="42" y2="34"/><line x1="50" y1="26" x2="50" y2="32"/></svg>`,
    'Volume of Liquid': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14h24v8l-4 32H24l-4-32z"/><path d="M22 36h20" stroke-dasharray="2 2"/><path d="M22 36q5 4 10 0t10 0" fill="currentColor" fill-opacity="0.3" stroke="none"/></svg>`,
    'Time': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="32" cy="34" r="18"/><path d="M32 22v12l8 6"/><line x1="32" y1="14" x2="32" y2="18"/><line x1="48" y1="34" x2="52" y2="34"/></svg>`,

    // Science
    'Diversity': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="20" cy="20" r="6"/><polygon points="44,14 52,28 36,28"/><rect x="14" y="36" width="14" height="14"/><circle cx="44" cy="44" r="7"/></svg>`,
    'Matter': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="32" width="14" height="14"/><circle cx="40" cy="22" r="3" fill="currentColor"/><circle cx="48" cy="30" r="3" fill="currentColor"/><circle cx="42" cy="38" r="3" fill="currentColor"/><circle cx="50" cy="44" r="3" fill="currentColor"/></svg>`,
    'Systems': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="22" width="36" height="20" rx="6"/><line x1="14" y1="32" x2="6" y2="32"/><line x1="50" y1="32" x2="58" y2="32"/></svg>`,
    'Cycles': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M48 32 A16 16 0 1 1 32 16"/><polyline points="32,12 32,18 38,18"/></svg>`,
    'Interactions': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="22" cy="32" r="10"/><circle cx="42" cy="32" r="10"/></svg>`,
    'Energy': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="34,10 22,36 32,36 28,54 44,28 32,28" fill="currentColor" fill-opacity="0.3"/></svg>`,

    // English
    'Grammar': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="22" x2="40" y2="22"/><line x1="12" y1="32" x2="52" y2="32"/><line x1="12" y1="42" x2="32" y2="42"/><circle cx="44" cy="42" r="3" fill="currentColor"/></svg>`,
    'Vocabulary': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="14" y="14" width="36" height="36" rx="3"/><line x1="22" y1="26" x2="42" y2="26"/><line x1="22" y1="34" x2="42" y2="34"/><line x1="22" y1="42" x2="34" y2="42"/></svg>`,
    'Cloze': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="22" x2="20" y2="22"/><rect x="24" y="16" width="14" height="12" fill="currentColor" fill-opacity="0.3"/><line x1="42" y1="22" x2="52" y2="22"/><line x1="12" y1="38" x2="32" y2="38"/><rect x="36" y="32" width="14" height="12" fill="currentColor" fill-opacity="0.3"/></svg>`,
    'Editing': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 44 L40 18 L48 26 L22 52 L14 52 Z"/><line x1="36" y1="22" x2="44" y2="30"/></svg>`,
    'Comprehension': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M14 16 Q32 12 50 16 L50 46 Q32 42 14 46 Z"/><line x1="32" y1="14" x2="32" y2="44"/></svg>`,
    'Synthesis': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="22" x2="24" y2="22"/><line x1="12" y1="42" x2="24" y2="42"/><path d="M24 22 Q34 22 34 32 Q34 42 24 42"/><line x1="34" y1="32" x2="52" y2="32"/></svg>`,
  };
  const fallback = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="14"/></svg>`;
  return `<div class="trio-glyph">${map[topicCanonical] || fallback}</div>`;
}
