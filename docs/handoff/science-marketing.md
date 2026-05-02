# Science Subject Page — Claude Code Build Spec
**Target:** `D:\Git\Superholic-Lab\src\app\subjects\science\page.tsx`
**Status:** Ready to execute. Do not deviate from this spec.
**Predecessor:** Maths page is live at `/subjects/mathematics`. Science inherits ALL primitives (`SmoothScroll`, `Eyebrow`, `SubjectRule`, `TrustStrip`, `Dog`, `FadeUp`, `CountUp`, `DrawPath`, `ClientOnly`, `PricingTeaser`, motion utils). DO NOT recreate them.

---

## 0 · Pre-flight

```bash
cd D:\Git\Superholic-Lab
npm list framer-motion lenis next
```

All three must be installed. If not, **stop and ask** — Maths page would have failed to install too, suggesting the build is in an unexpected state.

---

## 1 · File tree to create

ALL paths under `src/`. Files to create:

```
app/subjects/science/page.tsx                                 ← NEW
components/subjects/science/
  ├── HeroScience.tsx                                         ← NEW
  ├── ThemesScience.tsx                                       ← NEW (5 themes, 2+3 layout)
  ├── PillarDiagnoseSci.tsx                                   ← NEW
  ├── PillarAnalyseSci.tsx                                    ← NEW (Photosynthesis chain, scroll-build)
  ├── PillarPracticeSci.tsx                                   ← NEW (2 chips: MCQ + Open-Ended; sample MCQ)
  ├── PillarTutorSci.tsx                                      ← NEW (Wena CER dialogue, typewriter + thinking)
  ├── SampleQuestionSci.tsx                                   ← NEW (open-ended textarea + rubric + animated diagram)
  ├── SyllabusMapSci.tsx                                      ← NEW (P3-P6, collapsible sub-topics)
  ├── MisconceptionsSci.tsx                                   ← NEW
  └── data/
      ├── sampleMcq.ts                                        ← NEW
      ├── sampleOpenEnded.ts                                  ← NEW (swappable open-ended q + rubric + diagram config)
      └── syllabusSci.ts                                      ← NEW (P3-P6 topics + sub-topics from canon)
components/marketing/illustrations/science/
  ├── CerScaffold.tsx                                         ← NEW (hero illustration, multi-stage build)
  ├── ThemeIconDiversity.tsx                                  ← NEW (animated)
  ├── ThemeIconCycles.tsx                                     ← NEW (animated)
  ├── ThemeIconSystems.tsx                                    ← NEW (animated)
  ├── ThemeIconEnergy.tsx                                     ← NEW (animated)
  ├── ThemeIconInteractions.tsx                               ← NEW (animated)
  └── PhotosynthesisDiagram.tsx                               ← NEW (best-in-class § 6 diagram)
components/marketing/motion/
  └── Typewriter.tsx                                          ← NEW (char-by-char text reveal)
```

Do not create anything not listed. Do not recreate components from Maths — import them.

---

## 2 · The page (server component)

### `src/app/subjects/science/page.tsx`

```tsx
import type { Metadata } from 'next';
import HeroScience from '@/components/subjects/science/HeroScience';
import TrustStrip from '@/components/marketing/TrustStrip';
import ThemesScience from '@/components/subjects/science/ThemesScience';
import PillarDiagnoseSci from '@/components/subjects/science/PillarDiagnoseSci';
import PillarAnalyseSci from '@/components/subjects/science/PillarAnalyseSci';
import PillarPracticeSci from '@/components/subjects/science/PillarPracticeSci';
import PillarTutorSci from '@/components/subjects/science/PillarTutorSci';
import SampleQuestionSci from '@/components/subjects/science/SampleQuestionSci';
import SyllabusMapSci from '@/components/subjects/science/SyllabusMapSci';
import MisconceptionsSci from '@/components/subjects/science/MisconceptionsSci';
import PricingTeaser from '@/components/marketing/PricingTeaser';

export const metadata: Metadata = {
  title: 'Primary Science — Diagnose, Analyse, Practise, Reinforce | Superholic Lab',
  description:
    'Singapore Primary Science, taught the way examiners mark it: Claim, Evidence, Reason. Live AL diagnosis, root-cause analysis, MOE-aligned practice, and Miss Wena reinforcement.',
  alternates: { canonical: 'https://www.superholiclab.com/subjects/science' },
};

export default function SciencePage() {
  return (
    <main className="page-as page-as--science">
      <HeroScience />
      <TrustStrip />
      <ThemesScience />
      <PillarDiagnoseSci />
      <PillarAnalyseSci />
      <PillarPracticeSci />
      <PillarTutorSci />
      <SampleQuestionSci />
      <SyllabusMapSci />
      <MisconceptionsSci />
      <PricingTeaser subject="science" />
    </main>
  );
}
```

---

## 3 · Final copy (locked, ≤40 words body per section)

### Hero
- Eyebrow: `SCIENCE · P3 → PSLE`
- H1 line 1: `Science is a way of thinking.`
- H1 line 2 (rose `<em>`): `We teach the thinking.`
- Lede (28 words): "Memorising facts won't pass PSLE Science. Examiners reward the *reason* behind the answer — the why, not just the what. Superholic Lab teaches that explicitly."
- Primary CTA: `Start 7-day free trial` → `/pages/signup.html?subject=science&mode=trial` · `data-plausible-event="trial_start_science"` · `data-auth-cta`
- Secondary CTA: `See full syllabus` → `#syllabus`

### Themes (5 cards)
- Eyebrow: `01 — THE FIVE THEMES`
- H2 (centred): `Five themes. Every topic belongs to one.`
- Lede (centred, 22 words): "Understanding the theme behind each topic helps children connect ideas across years. Examiners test connections, not isolated facts."

5 cards (top row 2, bottom row 3):
1. **Diversity** — "Living and non-living things, classification, properties of materials. Builds the ability to observe and compare."
2. **Cycles** — "Life cycles of plants and animals, water cycle, states of matter. Patterns repeat — and reasoning about them does too."
3. **Systems** — "Plant systems, human digestive, respiratory, circulatory, electrical. Each part's function contributes to the whole."
4. **Energy** — "Light, heat, photosynthesis, energy conversion. The theme that shows up in almost every PSLE paper."
5. **Interactions** — "Forces, magnets, food chains, ecosystem balance. Cause and effect at every scale."

### Pillar 01 — Diagnose
- Eyebrow: `02 · DIAGNOSE`
- H2: `Honest signal. No inflated scores.`
- Body (28 words): "Bayesian Knowledge Tracing scores every theme. Live AL band per subject. The dashboard shows exactly where mastery is — and exactly where it isn't."
- Bullets:
  - BKT mastery score per theme and topic
  - Live AL band that updates after every quiz
  - No participation trophies, no inflated percentages

### Pillar 02 — Analyse Weakness
- Eyebrow: `03 · ANALYSE WEAKNESS`
- H2: `Find the upstream gap.`
- Body (32 words): "Photosynthesis weakness usually traces to plant cell parts. Plant cell parts trace to the cell as the basic unit of life. We map the chain and show you the root cause."
- Bullets:
  - Topic dependency graph traces root cause
  - AO1 / AO2 / AO3 cognitive-skill breakdown
  - Misconception-specific wrong-answer explanations

### Pillar 03 — Targeted Practice
- Eyebrow: `04 · TARGETED PRACTICE`
- H2: `Two formats. PSLE-true. No filler.`
- Body (28 words): "MCQ for Booklet A. Open-ended for Booklet B and Paper 2. Adaptive selection from a curated bank. Difficulty calibrated to your child's current AL band."
- Bullets:
  - MCQ · Open-Ended
  - Adaptive difficulty by current AL band
  - Every wrong answer earns a misconception explanation

### Pillar 04 — AI-Tutor Reinforcement
- Eyebrow: `05 · AI-TUTOR REINFORCEMENT`
- H2: `Miss Wena. 24/7. CER-trained.`
- Body (30 words): "When an answer is half-right, Miss Wena pushes for the reason — the same way examiners do. Claim. Evidence. Reason. Until the thinking is whole."
- Bullets:
  - Plan Quests built from real diagnosis
  - Saves conversations as study notes
  - The Honest Compass: pushes for the reason, not just the right answer

### Sample Question (§6)
- Eyebrow: `06 · SAMPLE QUESTION · OPEN-ENDED`
- H2: `Try a Paper 2 open-ended question.`
- Lede (22 words, centred): "Type your answer. See how examiners mark it — claim, evidence, reason — with the model answer beside yours."

### Syllabus
- Eyebrow: `07 · SYLLABUS MAP`
- H2 (centred): `What your child learns, year by year.`
- Lede (centred, 18 words): "Verified against the MOE 2023 Primary Science syllabus. Tap a topic to see all sub-topics covered."

### Misconceptions
- Eyebrow: `08 · MARK LOSS`
- H2 (centred): `Two errors. Thousands of lost marks.`
- Lede (centred, 16 words): "Every wrong-answer explanation in our bank names the exact misconception. The pattern breaks immediately."

Two cards:
1. **"All living things move"**
   - Common error: "A plant is non-living because it doesn't move."
   - What examiners want: "All living things have life processes (growth, reproduction, response). Plants grow and respond to stimuli — they are living."
   - Explain: "Movement is one *response*, not the definition of life. The 7 life processes (MRS GREN: Movement, Reproduction, Sensitivity, Growth, Respiration, Excretion, Nutrition) are the test."

2. **"Heavier objects fall faster"**
   - Common error: "A heavier ball falls faster than a lighter one."
   - What examiners want: "In the absence of air resistance, all objects fall at the same rate due to gravity."
   - Explain: "Mass doesn't affect free-fall acceleration. Air resistance is the only thing that makes lighter objects appear to fall slower in everyday life."

---

## 4 · Hero — CER Scaffold illustration

### `src/components/marketing/illustrations/science/CerScaffold.tsx`

The hero illustration. Multi-stage build with content materialising inside each panel. Loops every 18s with a 4s pause.

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function CerScaffold() {
  const reduce = useReducedMotion();

  // Total animation: 14s build + 4s pause. Loops every 18s.
  // 0.0 - 1.0s    Claim panel draws
  // 1.0 - 2.5s    Claim text types in word-by-word
  // 2.5 - 3.0s    Arrow 1 draws (claim → evidence)
  // 3.0 - 4.0s    Evidence panel draws
  // 4.0 - 7.0s    Evidence chart plots over time
  // 7.0 - 7.5s    Arrow 2 draws (evidence → reason)
  // 7.5 - 8.5s    Reason panel draws
  // 8.5 - 12.0s   Reason micro-diagram (sun rays + leaf) animates
  // 12.0 - 14.0s  Hold complete state
  // 14.0 - 18.0s  Hold (pause)
  // restart

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
        {/* Claim text materialises word-by-word */}
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
        {/* Mini line chart of plant heights */}
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
        {/* Sun + leaf micro-diagram */}
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

/* CLAIM TEXT — word by word */
function ClaimWords({ loop }: { loop: any }) {
  const words = ['Plants', 'need', 'sunlight', 'to', 'grow.'];
  return (
    <>
      {words.map((w, i) => (
        <motion.text
          key={i}
          x={56 + (i * 50)}
          y="84"
          fontSize="16"
          fontWeight="600"
          fill="var(--text-main)"
          fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 1, 1, 0] }}
          transition={{
            ...loop,
            times: [0, 0.056 + i * 0.014, 0.083 + i * 0.014, 0.13, 0.78, 0.95, 1],
          }}
        >
          {w}
        </motion.text>
      ))}
    </>
  );
}

/* EVIDENCE — mini line chart of plant heights over 5 days */
function EvidenceChart({ loop }: { loop: any }) {
  // X axis: days 1..5 mapped to x=80..280
  // Y axis: heights mapped to y=290..220 (lower y = taller)
  const sunPlantPoints = [
    { x: 80,  y: 285 },  // day 1, 4cm
    { x: 130, y: 270 },  // day 2, 8cm
    { x: 180, y: 250 },  // day 3, 14cm
    { x: 230, y: 232 },  // day 4, 19cm
    { x: 280, y: 220 },  // day 5, 24cm
  ];
  const darkPlantPoints = [
    { x: 80,  y: 285 },  // day 1, 4cm
    { x: 130, y: 280 },  // day 2, 5cm
    { x: 180, y: 273 },  // day 3, 8cm
    { x: 230, y: 268 },  // day 4, 11cm
    { x: 280, y: 263 },  // day 5, 15cm
  ];
  const sunPath = `M ${sunPlantPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const darkPath = `M ${darkPlantPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <>
      {/* Y axis */}
      <line x1="70" y1="215" x2="70" y2="295" stroke="var(--text-muted)" strokeWidth="0.5" opacity="0.5" />
      {/* X axis */}
      <line x1="70" y1="295" x2="290" y2="295" stroke="var(--text-muted)" strokeWidth="0.5" opacity="0.5" />

      {/* Sun-plant line */}
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
      {/* Dark-plant line (rose, dashed) */}
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

      {/* End-of-line labels */}
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
function ReasonMicroDiagram({ loop }: { loop: any }) {
  return (
    <g>
      {/* Sun (top-left of panel) */}
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
      {/* Sun rays */}
      {[-30, -15, 0, 15, 30].map((deg, i) => (
        <motion.line
          key={i}
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
      {/* Leaf (right) */}
      <motion.path
        d="M210 420 Q220 395 240 405 Q260 415 250 430 Q235 440 215 432 Q205 428 210 420 Z"
        fill="rgba(5, 150, 105, 0.18)"
        stroke="var(--brand-mint)" strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
        animate={{
          pathLength: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          scale:      [0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 0.8, 1, 1, 1],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.611, 0.78, 1] }}
      />
      {/* Leaf vein */}
      <motion.line
        x1="220" y1="408" x2="248" y2="427"
        stroke="var(--brand-mint)" strokeWidth="1" opacity="0.7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0] }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.667, 0.78, 1] }}
      />
      {/* Energy arrow from sun to leaf */}
      <motion.path
        d="M125 410 Q165 405 200 418"
        stroke="var(--brand-amber)" strokeWidth="1.5" fill="none"
        strokeDasharray="3 2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
          opacity:    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        }}
        transition={{ ...loop, times: [0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.78, 1] }}
      />
      {/* "= growth" label */}
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
```

### `src/components/subjects/science/HeroScience.tsx`

Identical to HeroMaths shape, swap headline/lede/CTA/illustration.

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import SubjectRule from '@/components/marketing/SubjectRule';
import Dog from '@/components/marketing/Dog';
import CerScaffold from '@/components/marketing/illustrations/science/CerScaffold';

export default function HeroScience() {
  const reduce = useReducedMotion();

  return (
    <section className="hero-as grid-texture-lg" data-section="hero">
      <div className="container-as">
        <div className="hero-grid">
          <div className="hero-text">
            <Eyebrow num="00">SCIENCE · P3 → PSLE</Eyebrow>
            <SubjectRule color="var(--science-colour)" />

            <h1 className="h1-as hero-headline">
              <motion.span
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block' }}
              >
                Science is a way of thinking.
              </motion.span>
              <motion.em
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block', color: 'var(--brand-rose)', fontStyle: 'normal' }}
              >
                We teach the thinking.
              </motion.em>
            </h1>

            <motion.p
              className="body-lg hero-lede"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Memorising facts won't pass PSLE Science. Examiners reward the <em>reason</em> behind the answer — the why, not just the what. Superholic Lab teaches that explicitly.
            </motion.p>

            <motion.div
              className="hero-ctas"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <a
                href="/pages/signup.html?subject=science&mode=trial"
                className="btn btn-primary"
                data-auth-cta
                data-plausible-event="trial_start_science"
              >
                Start 7-day free trial
              </a>
              <a href="#syllabus" className="btn btn-outlined">
                See full syllabus
              </a>
            </motion.div>
          </div>

          <div className="hero-visual">
            <CerScaffold />
          </div>

          {/* Wandering dog (page-level, not visual-column) */}
          <motion.div
            className="hero-dog-wanderer"
            initial={reduce ? {} : { x: '5%', y: '70%' }}
            animate={
              reduce
                ? {}
                : {
                    x: ['5%', '85%', '85%', '40%', '5%', '5%'],
                    y: ['70%', '70%', '20%', '40%', '20%', '70%'],
                    scaleX: [1, 1, 1, -1, -1, 1],
                  }
            }
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.25, 0.45, 0.6, 0.8, 1],
            }}
            aria-hidden="true"
          >
            <Dog variant="hero" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

---

## 5 · Themes (§1) — 5 cards, 2+3 layout, animated icons

### Theme icons — 5 small components, each a 2s on-mount + on-hover loop

#### `src/components/marketing/illustrations/science/ThemeIconDiversity.tsx`

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Four shapes morphing between forms. */
export default function ThemeIconDiversity() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.circle
        cx="14" cy="14" r="6" fill="currentColor" opacity="0.7"
        animate={reduce ? {} : { r: [6, 5, 6, 7, 6], opacity: [0.7, 0.5, 0.7, 0.9, 0.7] }}
        transition={loop}
      />
      <motion.path
        d="M28 8 L40 14 L34 22 Z" fill="currentColor"
        animate={reduce ? {} : { rotate: [0, 8, 0, -8, 0] }}
        transition={loop}
        style={{ transformOrigin: '34px 14px' }}
      />
      <motion.rect
        x="6" y="28" width="12" height="12" rx="2" fill="currentColor" opacity="0.5"
        animate={reduce ? {} : { rotate: [0, 12, 0, -12, 0] }}
        transition={{ ...loop, duration: 7 }}
        style={{ transformOrigin: '12px 34px' }}
      />
      <motion.path
        d="M28 30 Q34 26 40 30 Q40 38 34 40 Q28 38 28 30 Z" fill="currentColor" opacity="0.8"
        animate={reduce ? {} : { scale: [1, 1.08, 1, 0.96, 1] }}
        transition={loop}
        style={{ transformOrigin: '34px 33px' }}
      />
    </svg>
  );
}
```

#### `src/components/marketing/illustrations/science/ThemeIconCycles.tsx`

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Circular arrows rotating slowly. */
export default function ThemeIconCycles() {
  const reduce = useReducedMotion();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={reduce ? {} : { duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '24px 24px' }}
      >
        <path d="M24 8 A16 16 0 0 1 40 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <polyline points="36,20 40,24 36,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        <path d="M24 40 A16 16 0 0 1 8 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        <polyline points="12,28 8,24 12,20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </motion.g>
      <circle cx="24" cy="24" r="3" fill="currentColor" />
    </svg>
  );
}
```

#### `src/components/marketing/illustrations/science/ThemeIconSystems.tsx`

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Three connected nodes pulsing in sequence. */
export default function ThemeIconSystems() {
  const reduce = useReducedMotion();
  const t = (delay: number) => reduce ? {} : { duration: 2.4, repeat: Infinity, delay, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="12" y1="24" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="24" y1="12" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />

      <motion.circle cx="12" cy="24" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(0)} style={{ transformOrigin: '12px 24px' }} />
      <motion.circle cx="24" cy="12" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(0.8)} style={{ transformOrigin: '24px 12px' }} />
      <motion.circle cx="36" cy="24" r="5" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
        transition={t(1.6)} style={{ transformOrigin: '36px 24px' }} />
    </svg>
  );
}
```

#### `src/components/marketing/illustrations/science/ThemeIconEnergy.tsx`

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Sun with radiating rays. */
export default function ThemeIconEnergy() {
  const reduce = useReducedMotion();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.circle
        cx="24" cy="24" r="8" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.1, 1] }}
        transition={reduce ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '24px 24px' }}
      />
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={reduce ? {} : { duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '24px 24px' }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <line
            key={deg}
            x1="24" y1="6" x2="24" y2="12"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${deg} 24 24)`}
            opacity={i % 2 === 0 ? 1 : 0.5}
          />
        ))}
      </motion.g>
    </svg>
  );
}
```

#### `src/components/marketing/illustrations/science/ThemeIconInteractions.tsx`

```tsx
'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Two arrows pushing toward each other and back. */
export default function ThemeIconInteractions() {
  const reduce = useReducedMotion();
  const loop = reduce ? {} : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.g
        animate={reduce ? {} : { x: [0, 4, 0, -2, 0] }}
        transition={loop}
      >
        <line x1="6" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline points="16,20 20,24 16,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.5" />

      <motion.g
        animate={reduce ? {} : { x: [0, -4, 0, 2, 0] }}
        transition={loop}
      >
        <line x1="42" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <polyline points="32,20 28,24 32,28" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>
    </svg>
  );
}
```

### `src/components/subjects/science/ThemesScience.tsx`

```tsx
'use client';

import FadeUp from '@/components/marketing/motion/FadeUp';
import Eyebrow from '@/components/marketing/Eyebrow';
import ThemeIconDiversity from '@/components/marketing/illustrations/science/ThemeIconDiversity';
import ThemeIconCycles from '@/components/marketing/illustrations/science/ThemeIconCycles';
import ThemeIconSystems from '@/components/marketing/illustrations/science/ThemeIconSystems';
import ThemeIconEnergy from '@/components/marketing/illustrations/science/ThemeIconEnergy';
import ThemeIconInteractions from '@/components/marketing/illustrations/science/ThemeIconInteractions';
import { ReactNode } from 'react';

interface Theme {
  icon: ReactNode;
  title: string;
  body: string;
  accent: string;
}

const themes: Theme[] = [
  {
    icon: <ThemeIconDiversity />,
    title: 'Diversity',
    body: 'Living and non-living things, classification, properties of materials. Builds the ability to observe and compare.',
    accent: 'var(--science-colour)',
  },
  {
    icon: <ThemeIconCycles />,
    title: 'Cycles',
    body: 'Life cycles of plants and animals, water cycle, states of matter. Patterns repeat — and reasoning about them does too.',
    accent: 'var(--brand-sage)',
  },
  {
    icon: <ThemeIconSystems />,
    title: 'Systems',
    body: 'Plant systems, human digestive, respiratory, circulatory, electrical. Each part\'s function contributes to the whole.',
    accent: 'var(--brand-rose)',
  },
  {
    icon: <ThemeIconEnergy />,
    title: 'Energy',
    body: 'Light, heat, photosynthesis, energy conversion. The theme that shows up in almost every PSLE paper.',
    accent: 'var(--brand-amber)',
  },
  {
    icon: <ThemeIconInteractions />,
    title: 'Interactions',
    body: 'Forces, magnets, food chains, ecosystem balance. Cause and effect at every scale.',
    accent: 'var(--brand-mint)',
  },
];

export default function ThemesScience() {
  return (
    <section className="section-pad" data-section="themes">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="01">THE FIVE THEMES</Eyebrow>
          <h2 className="h2-as">Five themes. Every topic belongs to one.</h2>
          <p className="body-md section-sub">
            Understanding the theme behind each topic helps children connect ideas across years. Examiners test connections, not isolated facts.
          </p>
        </FadeUp>

        {/* Top row: 2 cards */}
        <div className="theme-grid theme-grid--top">
          {themes.slice(0, 2).map((t, i) => (
            <FadeUp key={t.title} delay={i * 0.08}>
              <article className="card-glass theme-card">
                <div className="theme-icon" style={{ color: t.accent }}>{t.icon}</div>
                <h3 className="theme-title">{t.title}</h3>
                <p className="body-md">{t.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
        {/* Bottom row: 3 cards */}
        <div className="theme-grid theme-grid--bottom">
          {themes.slice(2).map((t, i) => (
            <FadeUp key={t.title} delay={(i + 2) * 0.08}>
              <article className="card-glass theme-card">
                <div className="theme-icon" style={{ color: t.accent }}>{t.icon}</div>
                <h3 className="theme-title">{t.title}</h3>
                <p className="body-md">{t.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 6 · Pillars 1 / 2 / 3 / 4

### `src/components/subjects/science/PillarDiagnoseSci.tsx`

Same as PillarDiagnose but with Science theme rows. Energy is weak.

```tsx
'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import CountUp from '@/components/marketing/motion/CountUp';
import FadeUp from '@/components/marketing/motion/FadeUp';

const themesProgress = [
  { name: 'Cycles',       pct: 78, band: 'AL3' },
  { name: 'Systems',      pct: 62, band: 'AL5' },
  { name: 'Energy',       pct: 41, band: 'AL6', weak: true },
  { name: 'Interactions', pct: 55, band: 'AL5' },
];

export default function PillarDiagnoseSci() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();

  return (
    <section className="section-pad pillar-section" data-section="pillar-1">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="02">01 · DIAGNOSE</Eyebrow>
              <h2 className="h2-as">Honest signal. No inflated scores.</h2>
              <p className="body-lg">
                Bayesian Knowledge Tracing scores every theme. Live AL band per subject. The dashboard shows exactly where mastery is — and exactly where it isn't.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>BKT mastery score per theme and topic</li>
                <li>Live AL band that updates after every quiz</li>
                <li>No participation trophies, no inflated percentages</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual" ref={ref} data-pillar-viz="al-band">
            <div className="card-glass al-mock">
              <div className="al-mock-head">
                <span className="label-caps">Theme Mastery — Science P5</span>
                <span className="al-mock-overall">
                  <span className="label-caps">Overall</span>
                  <span className="al-mock-overall-band al-mock-overall-band--science">
                    AL<CountUp to={5} />
                  </span>
                </span>
              </div>
              {themesProgress.map((t, i) => (
                <div className="al-mock-row" key={t.name}>
                  <span className="al-mock-label">{t.name}</span>
                  <div className="al-mock-bar">
                    <motion.span
                      initial={reduce ? { width: `${t.pct}%` } : { width: 0 }}
                      animate={inView ? { width: `${t.pct}%` } : {}}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ background: t.weak ? 'var(--brand-rose)' : 'var(--science-colour)' }}
                    />
                  </div>
                  <span className={`al-mock-band ${t.weak ? 'weak' : ''}`} aria-live="polite">
                    {t.band}
                  </span>
                </div>
              ))}
              <motion.div
                className="al-mock-pointer"
                initial={reduce ? { opacity: 1 } : { opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 1.2 }}
              >
                ▸ Energy needs work — root cause traced next
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### `src/components/subjects/science/PillarAnalyseSci.tsx`

Scroll-triggered build identical to Maths version. Photosynthesis chain.

```tsx
'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

export default function PillarAnalyseSci() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'end 0.4'],
  });

  const topOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const topY = useTransform(scrollYProgress, [0, 0.25], [-12, 0]);
  const edge1 = useTransform(scrollYProgress, [0.20, 0.40], [0, 1]);
  const midOpacity = useTransform(scrollYProgress, [0.35, 0.55], [0, 1]);
  const midY = useTransform(scrollYProgress, [0.35, 0.55], [-12, 0]);
  const edge2 = useTransform(scrollYProgress, [0.50, 0.70], [0, 1]);
  const rootOpacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  const rootY = useTransform(scrollYProgress, [0.65, 0.85], [-12, 0]);

  return (
    <section
      ref={sectionRef}
      className="section-pad pillar-section bg-white-section"
      data-section="pillar-2"
    >
      <div className="container-as">
        <div className="pillar-grid reverse">
          <div className="pillar-visual">
            <div className="card-glass dep-graph-wrap" data-pillar-viz="dependency-graph">
              <span className="label-caps dep-graph-title">Root-cause trace</span>
              <svg
                viewBox="0 0 320 280"
                className="dep-graph-svg"
                role="img"
                aria-label="Dependency graph showing photosynthesis weakness traced to cell as basic unit of life"
              >
                {/* Symptom */}
                <motion.g style={reduce ? {} : { opacity: topOpacity, y: topY }}>
                  <rect x="80" y="20" width="160" height="48" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5" />
                  <text x="160" y="42" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Photosynthesis
                  </text>
                  <text x="160" y="58" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    symptom · 41%
                  </text>
                </motion.g>

                <motion.line
                  x1="160" y1="68" x2="160" y2="108"
                  stroke="var(--border-dark)" strokeWidth="1.5"
                  style={reduce ? {} : { pathLength: edge1 }}
                  pathLength={reduce ? 1 : edge1}
                />

                {/* Linked weakness */}
                <motion.g style={reduce ? {} : { opacity: midOpacity, y: midY }}>
                  <rect x="60" y="108" width="200" height="48" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5" />
                  <text x="160" y="130" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Plant Parts and Functions
                  </text>
                  <text x="160" y="146" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    linked · 56%
                  </text>
                </motion.g>

                <motion.line
                  x1="160" y1="156" x2="160" y2="196"
                  stroke="var(--border-dark)" strokeWidth="1.5"
                  style={reduce ? {} : { pathLength: edge2 }}
                  pathLength={reduce ? 1 : edge2}
                />

                {/* Root cause */}
                <motion.g style={reduce ? {} : { opacity: rootOpacity, y: rootY }}>
                  <motion.rect
                    x="40" y="196" width="240" height="60" rx="8"
                    fill="rgba(217, 119, 6, 0.10)"
                    stroke="var(--brand-amber)" strokeWidth="2"
                    animate={reduce ? {} : { strokeWidth: [2, 3, 2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                  <text x="160" y="222" textAnchor="middle" fontSize="14" fontWeight="700"
                    fill="var(--brand-amber)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Cell as basic unit of life
                  </text>
                  <text x="160" y="240" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="var(--text-main)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    ROOT CAUSE
                  </text>
                </motion.g>
              </svg>
            </div>
          </div>

          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="03">02 · ANALYSE WEAKNESS</Eyebrow>
              <h2 className="h2-as">Find the upstream gap.</h2>
              <p className="body-lg">
                Photosynthesis weakness usually traces to plant cell parts. Plant cell parts trace to the cell as the basic unit of life. We map the chain and show you the root cause.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>Topic dependency graph traces root cause</li>
                <li>AO1 / AO2 / AO3 cognitive-skill breakdown</li>
                <li>Misconception-specific wrong-answer explanations</li>
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### `src/components/subjects/science/data/sampleMcq.ts`

```ts
export interface SampleOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
  correct: boolean;
  misconception?: string;
}

export interface SampleMcq {
  id: string;
  level: string;
  topic: string;
  subTopic: string;
  stem: string;
  options: SampleOption[];
  workedExplanation: string;
}

export const sampleMcq: SampleMcq = {
  id: 'demo-p5-cycles-001',
  level: 'P5',
  topic: 'Cycles',
  subTopic: 'Stages of the Water Cycle',
  stem: "Which process in the water cycle changes water vapour back into liquid water?",
  options: [
    {
      letter: 'A',
      text: 'Evaporation',
      correct: false,
      misconception: 'Evaporation is the opposite — liquid water becomes water vapour. It needs heat to add energy to the water.',
    },
    {
      letter: 'B',
      text: 'Condensation',
      correct: true,
    },
    {
      letter: 'C',
      text: 'Precipitation',
      correct: false,
      misconception: 'Precipitation describes water falling from clouds (rain, snow). It happens after condensation, not as a state change itself.',
    },
    {
      letter: 'D',
      text: 'Melting',
      correct: false,
      misconception: 'Melting changes solid (ice) to liquid water. It does not involve water vapour.',
    },
  ],
  workedExplanation:
    'Condensation is the change of state from gas (water vapour) to liquid (water droplets). It happens when water vapour cools down and loses heat energy.',
};
```

### `src/components/subjects/science/PillarPracticeSci.tsx`

2 chips, sample MCQ.

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { sampleMcq } from './data/sampleMcq';

const formats = [
  { label: 'MCQ', sub: 'Booklet A', accent: 'var(--science-colour)' },
  { label: 'Open-Ended', sub: 'Booklet B · Paper 2', accent: 'var(--brand-rose)' },
];

export default function PillarPracticeSci() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected === sampleMcq.options.find((o) => o.correct)?.letter;
  const selectedOpt = sampleMcq.options.find((o) => o.letter === selected);

  return (
    <section className="section-pad pillar-section" data-section="pillar-3">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="04">03 · TARGETED PRACTICE</Eyebrow>
              <h2 className="h2-as">Two formats. PSLE-true. No filler.</h2>
              <p className="body-lg">
                MCQ for Booklet A. Open-ended for Booklet B and Paper 2. Adaptive selection from a curated bank, calibrated to your child's current AL band.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>MCQ · Open-Ended</li>
                <li>Adaptive difficulty by current AL band</li>
                <li>Every wrong answer earns a misconception explanation</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual">
            {/* 2-column format chips */}
            <div className="format-rail format-rail--two">
              {formats.map((f, i) => (
                <FadeUp key={f.label} delay={i * 0.06}>
                  <div className="format-chip" style={{ borderColor: f.accent }}>
                    <span className="format-label" style={{ color: f.accent }}>{f.label}</span>
                    <span className="format-sub">{f.sub}</span>
                  </div>
                </FadeUp>
              ))}
            </div>

            <FadeUp delay={0.2}>
              <div className="card-glass sample-question" data-pillar-viz="sample-mcq">
                <div className="sample-meta">
                  <span className="label-caps">{sampleMcq.level} · {sampleMcq.topic}</span>
                  <span className="sample-tap-hint">Tap an option ▸</span>
                </div>
                <p className="sample-stem">{sampleMcq.stem}</p>
                <div className="sample-options">
                  {sampleMcq.options.map((opt) => {
                    const isSelected = selected === opt.letter;
                    const state = !selected ? 'idle' : opt.correct ? 'correct' : isSelected ? 'wrong' : 'idle';
                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        className={`sample-opt sample-opt--${state}`}
                        onClick={() => setSelected(opt.letter)}
                        disabled={!!selected}
                        aria-pressed={isSelected}
                      >
                        <span className="opt-letter">{opt.letter}</span>
                        <span className="opt-text">{opt.text}</span>
                        {state === 'correct' && (
                          <motion.svg
                            width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="var(--brand-mint)" strokeWidth="2.5" strokeLinecap="round"
                            initial={reduce ? {} : { pathLength: 0 }}
                            animate={reduce ? {} : { pathLength: 1 }}
                            transition={{ duration: 0.3 }}
                            className="opt-tick"
                            aria-hidden="true"
                          >
                            <motion.path d="M20 6L9 17l-5-5" />
                          </motion.svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selected && (
                    <motion.div
                      className={`sample-explain ${isCorrect ? 'sample-explain--correct' : 'sample-explain--wrong'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isCorrect ? (
                        <>
                          <strong>Correct.</strong> {sampleMcq.workedExplanation}
                        </>
                      ) : (
                        <>
                          <strong>Not quite.</strong> {selectedOpt?.misconception} <br />
                          <em>The right answer is {sampleMcq.options.find((o) => o.correct)?.letter}.</em> {sampleMcq.workedExplanation}
                        </>
                      )}
                      <button
                        type="button"
                        className="sample-reset"
                        onClick={() => setSelected(null)}
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### `src/components/marketing/motion/Typewriter.tsx`

Char-by-char text reveal. Used by Wena bubbles.

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  text: string;
  delay?: number;
  charDuration?: number;
  className?: string;
}

export default function Typewriter({ text, delay = 0, charDuration = 0.025, className }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  return (
    <motion.span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0, delay: delay + i * charDuration }}
          aria-hidden={i > 0 ? 'true' : undefined}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
```

### `src/components/subjects/science/PillarTutorSci.tsx`

Wena CER dialogue with thinking dots + typewriter.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import Typewriter from '@/components/marketing/motion/Typewriter';

interface Msg {
  from: 'tutor' | 'student';
  text: string;
}

const script: Msg[] = [
  { from: 'tutor',   text: "Your answer says plants need sunlight. That's a claim. What evidence from the experiment supports it?" },
  { from: 'student', text: "The plant in the dark cupboard turned yellow." },
  { from: 'tutor',   text: "Good evidence. Now: why does the absence of sunlight cause yellowing? That's the reason mark — and where most students lose 1 point." },
];

export default function PillarTutorSci() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [step, setStep] = useState(-1); // -1 = nothing, 0/1/2 = up to that index visible
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setStep(2);
      return;
    }

    const timers: NodeJS.Timeout[] = [];

    // Sequence: thinking 600ms → tutor msg (auto-shows + types ~3s) → student msg (instant) → thinking 600ms → tutor msg
    // Tutor msg 0
    timers.push(setTimeout(() => setThinking(true), 400));
    timers.push(setTimeout(() => { setThinking(false); setStep(0); }, 1000));

    // Student msg
    const t0Length = script[0].text.length * 25;
    timers.push(setTimeout(() => setStep(1), 1000 + t0Length + 700));

    // Tutor msg 2 (with thinking)
    const t1Reveal = 1000 + t0Length + 700;
    timers.push(setTimeout(() => setThinking(true), t1Reveal + 1000));
    timers.push(setTimeout(() => { setThinking(false); setStep(2); }, t1Reveal + 1600));

    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <section className="section-pad pillar-section bg-charcoal-section" data-section="pillar-4">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text pillar-text--dark">
            <FadeUp>
              <Eyebrow num="05">04 · AI-TUTOR REINFORCEMENT</Eyebrow>
              <h2 className="h2-as">Miss Wena. 24/7. CER-trained.</h2>
              <p className="body-lg">
                When an answer is half-right, Miss Wena pushes for the reason — the same way examiners do. Claim. Evidence. Reason. Until the thinking is whole.
              </p>
              <ul className="rose-list pillar-bullets pillar-bullets--dark">
                <li>Plan Quests built from real diagnosis</li>
                <li>Saves conversations as study notes</li>
                <li>Pushes for the reason, not just the right answer</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual" ref={ref}>
            <div className="card-glass-dark wena-mock" data-pillar-viz="wena-chat">
              <div className="wena-header">
                <motion.div
                  className="wena-avatar"
                  animate={reduce ? {} : { scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.5, 0.55, 1] }}
                  aria-hidden="true"
                >
                  W
                </motion.div>
                <div>
                  <div className="wena-name">Miss Wena</div>
                  <div className="wena-status">● CER mode</div>
                </div>
              </div>

              {script.map((m, i) => {
                if (step < i) return null;
                return (
                  <motion.div
                    key={i}
                    className={m.from === 'tutor' ? 'bubble-tutor' : 'bubble-user'}
                    initial={reduce ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {m.from === 'tutor' ? (
                      <Typewriter text={m.text} charDuration={0.025} />
                    ) : (
                      m.text
                    )}
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {thinking && !reduce && (
                  <motion.div
                    className="bubble-tutor wena-thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Miss Wena is thinking"
                  >
                    <span className="wena-dot" />
                    <span className="wena-dot" />
                    <span className="wena-dot" />
                  </motion.div>
                )}
              </AnimatePresence>

              {step >= 2 && (
                <FadeUp delay={0.3}>
                  <div className="quest-badge">
                    <span className="label-caps">▸ Plan Quest generated · 3 days · Photosynthesis</span>
                  </div>
                </FadeUp>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 7 · §6 Sample Question — Open-ended with rubric + animated diagram

### `src/components/marketing/illustrations/science/PhotosynthesisDiagram.tsx`

The best-in-class diagram. Two plants animating side-by-side, sun rays, growth, leaf colour transition.

```tsx
'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function PhotosynthesisDiagram() {
  const reduce = useReducedMotion();
  // Total animation: 8s loop. 0-2s setup. 2-7s growth. 7-8s pause.

  return (
    <svg viewBox="0 0 600 320" className="photo-diagram" role="img"
      aria-label="Animated diagram showing two plants — one in sunlight grows tall and green, one in darkness yellows and grows little.">
      {/* ─── LEFT SIDE: Plant in sun ─── */}
      <g>
        {/* Sun */}
        <motion.circle
          cx="80" cy="70" r="22"
          fill="var(--brand-amber)"
          initial={reduce ? {} : { scale: 0 }}
          animate={reduce ? {} : { scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ transformOrigin: '80px 70px' }}
        />
        {[0, 30, 60, 90, 120, 150, 180, -30, -60, -90, -120, -150].map((deg, i) => (
          <motion.line
            key={deg}
            x1="80" y1="70" x2="80" y2="40"
            stroke="var(--brand-amber)" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${deg} 80 70)`}
            initial={reduce ? {} : { opacity: 0 }}
            animate={reduce ? {} : { opacity: [0, 1, 0.6, 1, 0.6, 1] }}
            transition={{ duration: 8, repeat: Infinity, delay: 0.5 + i * 0.04, ease: 'easeInOut' }}
          />
        ))}

        {/* Pot */}
        <path d="M40 240 L120 240 L116 280 L44 280 Z"
          fill="var(--brand-rose)" opacity="0.4"
          stroke="var(--brand-rose)" strokeWidth="1.5" />
        {/* Soil */}
        <ellipse cx="80" cy="240" rx="40" ry="6" fill="#8B5A3C" opacity="0.6" />

        {/* Growing stem */}
        <motion.line
          x1="80" y1="240" x2="80" y2="240"
          stroke="var(--brand-mint)" strokeWidth="3" strokeLinecap="round"
          initial={reduce ? { y2: 130 } : { y2: 240 }}
          animate={reduce ? { y2: 130 } : { y2: 130 }}
          transition={{ duration: 4, delay: 1, ease: 'easeOut' }}
        />

        {/* Leaves — appear at growth thresholds */}
        <motion.path
          d="M80 200 Q 60 195 55 205 Q 60 215 80 210"
          fill="rgba(5, 150, 105, 0.45)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 2.4 }}
          style={{ transformOrigin: '80px 205px' }}
        />
        <motion.path
          d="M80 175 Q 100 170 105 180 Q 100 190 80 185"
          fill="rgba(5, 150, 105, 0.45)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 3.4 }}
          style={{ transformOrigin: '80px 180px' }}
        />
        <motion.path
          d="M80 145 Q 60 140 55 150 Q 60 160 80 155"
          fill="rgba(5, 150, 105, 0.55)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 4.4 }}
          style={{ transformOrigin: '80px 150px' }}
        />

        {/* Ruler with measurement */}
        <line x1="140" y1="240" x2="140" y2="130" stroke="var(--text-muted)" strokeWidth="1" />
        {[0, 5, 10, 15, 20, 25].map((cm, i) => (
          <line key={cm} x1="138" y1={240 - cm * 4.4} x2="142" y2={240 - cm * 4.4}
            stroke="var(--text-muted)" strokeWidth="1" />
        ))}
        <motion.text
          x="148" y="135" fontSize="14" fontWeight="700"
          fill="var(--science-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ delay: 5 }}
        >
          24 cm
        </motion.text>

        {/* Label */}
        <text x="80" y="305" textAnchor="middle" fontSize="12" fontWeight="700"
          fill="var(--brand-sage)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
          PLANT A · IN SUNLIGHT
        </text>
      </g>

      {/* ─── DIVIDER ─── */}
      <line x1="300" y1="40" x2="300" y2="290" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3 3" />

      {/* ─── RIGHT SIDE: Plant in dark ─── */}
      <g>
        {/* Cupboard / dark box */}
        <rect x="380" y="40" width="180" height="240" rx="4"
          fill="rgba(60, 60, 70, 0.85)" stroke="var(--text-main)" strokeWidth="1.5" />
        <text x="470" y="60" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="var(--cream)" opacity="0.5" letterSpacing="0.1em">
          CUPBOARD (NO LIGHT)
        </text>

        {/* Pot */}
        <path d="M430 240 L510 240 L506 280 L434 280 Z"
          fill="var(--brand-rose)" opacity="0.4"
          stroke="var(--brand-rose)" strokeWidth="1.5" />
        <ellipse cx="470" cy="240" rx="40" ry="6" fill="#8B5A3C" opacity="0.6" />

        {/* Stunted stem */}
        <motion.line
          x1="470" y1="240" x2="470" y2="240"
          stroke="var(--brand-mint)" strokeWidth="3" strokeLinecap="round"
          initial={reduce ? { y2: 200 } : { y2: 240 }}
          animate={reduce ? { y2: 200 } : { y2: 200 }}
          transition={{ duration: 4, delay: 1, ease: 'easeOut' }}
          style={{ filter: reduce ? 'none' : undefined }}
        />

        {/* Yellowing leaves — appear with colour transition */}
        <motion.path
          d="M470 220 Q 450 215 448 222 Q 452 228 470 225"
          stroke="var(--brand-amber)" strokeWidth="1.5"
          initial={reduce ? { fill: 'rgba(217, 119, 6, 0.35)', opacity: 1 } : { fill: 'rgba(5, 150, 105, 0.35)', opacity: 0 }}
          animate={reduce ? {} : { fill: ['rgba(5, 150, 105, 0.35)', 'rgba(5, 150, 105, 0.35)', 'rgba(217, 119, 6, 0.35)'], opacity: [0, 1, 1] }}
          transition={{ duration: 3, delay: 3, ease: 'easeInOut', times: [0, 0.2, 1] }}
        />
        <motion.path
          d="M470 205 Q 490 200 492 207 Q 488 213 470 210"
          stroke="var(--brand-amber)" strokeWidth="1.5"
          initial={reduce ? { fill: 'rgba(217, 119, 6, 0.35)', opacity: 1 } : { fill: 'rgba(5, 150, 105, 0.35)', opacity: 0 }}
          animate={reduce ? {} : { fill: ['rgba(5, 150, 105, 0.35)', 'rgba(5, 150, 105, 0.35)', 'rgba(217, 119, 6, 0.35)'], opacity: [0, 1, 1] }}
          transition={{ duration: 3, delay: 4, ease: 'easeInOut', times: [0, 0.2, 1] }}
        />

        {/* Ruler */}
        <line x1="530" y1="240" x2="530" y2="200" stroke="var(--cream)" strokeWidth="1" opacity="0.6" />
        {[0, 5, 10].map((cm) => (
          <line key={cm} x1="528" y1={240 - cm * 4} x2="532" y2={240 - cm * 4}
            stroke="var(--cream)" strokeWidth="1" opacity="0.6" />
        ))}
        <motion.text
          x="540" y="205" fontSize="14" fontWeight="700"
          fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ delay: 5 }}
        >
          15 cm
        </motion.text>

        {/* Label */}
        <text x="470" y="305" textAnchor="middle" fontSize="12" fontWeight="700"
          fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
          PLANT B · IN DARKNESS
        </text>
      </g>
    </svg>
  );
}
```

### `src/components/subjects/science/data/sampleOpenEnded.ts`

Swappable open-ended question + rubric + diagram pointer.

```ts
/**
 * Swappable Science open-ended question shown on §6.
 *
 * RUBRIC LOGIC:
 *   - claimKeywords / reasonKeywords matched (case-insensitive, substring)
 *     against learner's typed answer.
 *   - claim mark = at least one claim keyword AND not just a copy of the question
 *   - reason mark = at least one reason keyword
 *   - Both marks awarded → 2/2; only claim → 1/2; neither → 0/2.
 */

export interface SampleOpenEnded {
  id: string;
  level: string;
  topic: string;
  marks: number;
  stem: string;
  setup: string;
  expectedClaim: string;
  expectedReason: string;
  modelAnswer: string;
  claimKeywords: string[];
  reasonKeywords: string[];
  wenaCoachLine: string;
}

export const sampleOpenEnded: SampleOpenEnded = {
  id: 'demo-p5-photosynthesis-001',
  level: 'P5',
  topic: 'Systems · Photosynthesis',
  marks: 2,
  setup:
    'Aisha placed Plant A on a sunny windowsill and Plant B inside a dark cupboard. She watered both equally. After 5 days, Plant A grew to 24 cm with bright green leaves. Plant B grew to only 15 cm and its leaves had yellowed.',
  stem:
    "Why did Plant A grow taller and stay green, while Plant B grew less and turned yellow? Use the ideas of photosynthesis in your answer.",
  expectedClaim: 'Plant A received sunlight, but Plant B did not.',
  expectedReason:
    'Plants need sunlight for photosynthesis to make food (glucose). Without sunlight, Plant B could not photosynthesise, so it could not make enough food to grow tall or to produce chlorophyll, which gave it the yellow leaves.',
  modelAnswer:
    "Plant A grew taller and stayed green because it received sunlight, while Plant B was kept in the dark. Plants need sunlight to carry out photosynthesis, the process by which they make their own food (glucose). Without sunlight, Plant B could not photosynthesise, so it could not make enough food to grow tall. The lack of sunlight also meant Plant B could not produce chlorophyll, so its leaves yellowed.",
  claimKeywords: ['sunlight', 'sun', 'light', 'dark', 'cupboard'],
  reasonKeywords: ['photosynthesis', 'food', 'glucose', 'energy', 'chlorophyll'],
  wenaCoachLine:
    "Strong claim. Now make sure you also explain WHY — examiners want the reason: 'plants need sunlight for photosynthesis to make food'. That's the second mark.",
};
```

### `src/components/subjects/science/SampleQuestionSci.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import PhotosynthesisDiagram from '@/components/marketing/illustrations/science/PhotosynthesisDiagram';
import { sampleOpenEnded } from './data/sampleOpenEnded';

function gradeAnswer(answer: string) {
  const normalised = answer.toLowerCase();
  const hasClaim = sampleOpenEnded.claimKeywords.some((k) => normalised.includes(k.toLowerCase()));
  const hasReason = sampleOpenEnded.reasonKeywords.some((k) => normalised.includes(k.toLowerCase()));
  return {
    claim: hasClaim,
    reason: hasReason,
    score: (hasClaim ? 1 : 0) + (hasReason ? 1 : 0),
  };
}

export default function SampleQuestionSci() {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const grading = submitted ? gradeAnswer(answer) : null;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <section className="section-pad" data-section="sample-question">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="06">SAMPLE QUESTION · OPEN-ENDED</Eyebrow>
          <h2 className="h2-as">Try a Paper 2 open-ended question.</h2>
          <p className="body-md section-sub">
            Type your answer. See how examiners mark it — claim, evidence, reason — with the model answer beside yours.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="card-glass sample-oe" data-pillar-viz="sample-open-ended">
            <div className="sample-meta">
              <span className="label-caps">
                {sampleOpenEnded.level} · {sampleOpenEnded.topic} · {sampleOpenEnded.marks} marks
              </span>
            </div>

            {/* Animated diagram */}
            <div className="sample-oe-diagram">
              <PhotosynthesisDiagram />
            </div>

            {/* Setup + question stem */}
            <div className="sample-oe-text">
              <p className="sample-oe-setup body-md">{sampleOpenEnded.setup}</p>
              <p className="sample-stem"><strong>Q:</strong> {sampleOpenEnded.stem}</p>
            </div>

            {/* Answer textarea */}
            <div className="sample-oe-answer">
              <label htmlFor="oe-answer" className="label-caps sample-wp-label">
                Your answer
              </label>
              <textarea
                id="oe-answer"
                className="sample-oe-textarea"
                rows={4}
                placeholder="Write 2–3 sentences. Mention what each plant received and why this caused the difference."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={submitted}
              />
              <div className="sample-oe-meta">
                <span className="sample-oe-wordcount">{wordCount} words</span>
                {!submitted ? (
                  <button
                    type="button"
                    className="btn btn-primary sample-wp-submit"
                    disabled={!answer.trim() || wordCount < 5}
                    onClick={() => setSubmitted(true)}
                  >
                    Check answer
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sample-reset"
                    onClick={() => {
                      setSubmitted(false);
                      setAnswer('');
                    }}
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>

            {/* Rubric panel */}
            <AnimatePresence>
              {submitted && grading && (
                <motion.div
                  className="sample-oe-rubric"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="rubric-header">
                    <span className="label-caps">Examiner rubric</span>
                    <span className={`rubric-score rubric-score--${grading.score}`}>
                      {grading.score} / {sampleOpenEnded.marks} marks
                    </span>
                  </div>

                  <div className="rubric-rows">
                    <RubricRow
                      label="MARK 1 · CLAIM"
                      criterion="Identifies the difference: sunlight vs darkness"
                      pass={grading.claim}
                    />
                    <RubricRow
                      label="MARK 2 · REASON"
                      criterion="Explains photosynthesis / food production / chlorophyll"
                      pass={grading.reason}
                    />
                  </div>

                  <div className="rubric-model">
                    <span className="label-caps">Model answer</span>
                    <p className="body-md">{sampleOpenEnded.modelAnswer}</p>
                  </div>

                  {grading.score < 2 && (
                    <div className="rubric-coach">
                      <span className="rubric-coach-avatar">W</span>
                      <p className="body-md">
                        <strong>Miss Wena:</strong> {sampleOpenEnded.wenaCoachLine}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

function RubricRow({ label, criterion, pass }: { label: string; criterion: string; pass: boolean }) {
  return (
    <motion.div
      className={`rubric-row ${pass ? 'rubric-row--pass' : 'rubric-row--fail'}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rubric-row-icon">
        {pass ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--brand-mint)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 L9 17 L4 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="var(--brand-rose)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        )}
      </div>
      <div>
        <div className="rubric-row-label label-caps">{label}</div>
        <div className="rubric-row-criterion">{criterion}</div>
      </div>
    </motion.div>
  );
}
```

---

## 8 · §7 Syllabus — P3-P6 with collapsible sub-topics

### `src/components/subjects/science/data/syllabusSci.ts`

Mirrored from canon `LEVEL_TOPICS` + `CANONICAL_SYLLABUS.science` (verified live).

```ts
// MIRROR of /public/js/syllabus.js LEVEL_TOPICS + CANONICAL_SYLLABUS.science v5.0.
// Last-synced: 2026-05-02. Regenerate if canon updates.

export interface SyllabusTopic {
  topic: string;
  subTopics: string[];
}

export interface SyllabusLevelSci {
  level: string;
  badge: string;
  callout: string;
  topics: SyllabusTopic[];
}

const subTopicsByTopic: Record<string, string[]> = {
  Diversity: [
    'General Characteristics Of Living And Non-Living Things',
    'Classification Of Living And Non-Living Things',
    'Diversity Of Materials And Their Properties',
  ],
  Matter: [
    'States Of Matter',
    'Properties Of Solids, Liquids And Gases',
    'Changes In State Of Matter',
  ],
  Cycles: [
    'Life Cycles Of Insects',
    'Life Cycles Of Amphibians',
    'Life Cycles Of Flowering Plants',
    'Reproduction In Plants And Animals',
    'Stages Of The Water Cycle',
  ],
  Systems: [
    'Plant Parts And Functions',
    'Human Digestive System',
    'Plant Respiratory And Circulatory Systems',
    'Human Respiratory And Circulatory Systems',
    'Electrical Systems And Circuits',
  ],
  Energy: [
    'Sources Of Light',
    'Reflection Of Light',
    'Formation Of Shadows',
    'Transparent, Translucent And Opaque Materials',
    'Sources Of Heat',
    'Effects Of Heat Gain And Heat Loss',
    'Temperature And Use Of Thermometers',
    'Good And Poor Conductors Of Heat',
    'Photosynthesis And Energy Pathways',
    'Energy Conversion In Everyday Objects',
  ],
  Interactions: [
    'Interaction Of Magnetic Forces',
    'Frictional Force',
    'Gravitational Force',
    'Elastic Spring Force',
    'Effects Of Forces On Objects',
    'Interactions Within The Environment',
    'Food Chains And Food Webs',
  ],
};

const buildLevel = (level: string, badge: string, callout: string, topicNames: string[]): SyllabusLevelSci => ({
  level,
  badge,
  callout,
  topics: topicNames.map((t) => ({ topic: t, subTopics: subTopicsByTopic[t] || [] })),
});

export const syllabusSci: SyllabusLevelSci[] = [
  buildLevel(
    'P3', 'Science Begins',
    'First exposure to formal Science. Curiosity-led — the right disposition matters more than facts.',
    ['Diversity', 'Cycles', 'Interactions']
  ),
  buildLevel(
    'P4', 'Systems Introduced',
    'Plant parts, human digestion, energy. The first time children must explain a system as a whole.',
    ['Systems', 'Matter', 'Cycles', 'Energy']
  ),
  buildLevel(
    'P5', 'Most Content-Dense',
    'Two body systems, electrical circuits, and photosynthesis. The double-up of Cycles and Systems.',
    ['Cycles', 'Systems']
  ),
  buildLevel(
    'P6', 'PSLE Year',
    'Forces, food chains, environmental interactions. Open-ended Paper 2 questions can pull from any P3–P6 topic.',
    ['Energy', 'Interactions']
  ),
];
```

### `src/components/subjects/science/SyllabusMapSci.tsx`

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { syllabusSci } from './data/syllabusSci';

export default function SyllabusMapSci() {
  const [activeIdx, setActiveIdx] = useState(2); // P5 default
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  // When tab changes, close any open topic drawer
  const handleTabChange = (i: number) => {
    setActiveIdx(i);
    setOpenTopic(null);
  };

  const activeLevel = syllabusSci[activeIdx];
  const subTopicCount = activeLevel.topics.reduce((sum, t) => sum + t.subTopics.length, 0);

  return (
    <section id="syllabus" className="section-pad" data-section="syllabus">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="07">SYLLABUS MAP</Eyebrow>
          <h2 className="h2-as">What your child learns, year by year.</h2>
          <p className="body-md section-sub">
            Verified against the MOE 2023 Primary Science syllabus. Tap a topic to see all sub-topics covered.
          </p>
        </FadeUp>

        <div className="level-tabs-as level-tabs-as--science" role="tablist" aria-label="Primary level">
          {syllabusSci.map((lvl, i) => (
            <button
              key={lvl.level}
              type="button"
              role="tab"
              aria-selected={activeIdx === i}
              className={`level-tab-as ${activeIdx === i ? 'is-active' : ''}`}
              onClick={() => handleTabChange(i)}
            >
              {lvl.level}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel.level}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card-glass syllabus-panel"
          >
            <div className="syllabus-panel-head">
              <h3 className="syllabus-level-title">{activeLevel.level}</h3>
              <span className="badge-rose">{activeLevel.badge}</span>
            </div>
            <p className="body-md syllabus-callout">{activeLevel.callout}</p>

            <div className="syllabus-topic-list">
              {activeLevel.topics.map((t) => {
                const isOpen = openTopic === t.topic;
                return (
                  <div key={t.topic} className={`syllabus-topic ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="syllabus-topic-header"
                      onClick={() => setOpenTopic(isOpen ? null : t.topic)}
                      aria-expanded={isOpen}
                      aria-controls={`subs-${t.topic}`}
                    >
                      <span className="syllabus-topic-name">{t.topic}</span>
                      <span className="syllabus-topic-count">
                        {t.subTopics.length} sub-topic{t.subTopics.length === 1 ? '' : 's'}
                      </span>
                      <svg
                        className={`syllabus-topic-chevron ${isOpen ? 'is-open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`subs-${t.topic}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                          className="syllabus-subtopic-wrap"
                        >
                          <div className="syllabus-subtopic-grid">
                            {t.subTopics.map((s, i) => (
                              <motion.span
                                key={s}
                                className="syllabus-subtopic-chip"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.025 }}
                              >
                                {s}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="syllabus-count label-caps">
              {activeLevel.topics.length} topics · {subTopicCount} sub-topics in {activeLevel.level}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
```

---

## 9 · §8 Misconceptions

### `src/components/subjects/science/MisconceptionsSci.tsx`

```tsx
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const cases = [
  {
    title: '"All living things move"',
    wrong: 'A plant is non-living because it doesn\'t move.',
    right: 'All living things have life processes. Plants grow and respond to stimuli — they are living.',
    explain: 'Movement is one response, not the definition of life. The 7 life processes (MRS GREN: Movement, Reproduction, Sensitivity, Growth, Respiration, Excretion, Nutrition) are the test.',
  },
  {
    title: '"Heavier objects fall faster"',
    wrong: 'A heavier ball falls faster than a lighter one.',
    right: 'In the absence of air resistance, all objects fall at the same rate due to gravity.',
    explain: 'Mass doesn\'t affect free-fall acceleration. Air resistance is the only thing that makes lighter objects appear to fall slower in everyday life.',
  },
];

export default function MisconceptionsSci() {
  return (
    <section className="section-pad" data-section="misconceptions">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="08">MARK LOSS</Eyebrow>
          <h2 className="h2-as">Two errors. Thousands of lost marks.</h2>
          <p className="body-md section-sub">Every wrong-answer explanation in our bank names the exact misconception.</p>
        </FadeUp>
        <div className="misconception-grid">
          {cases.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.1}>
              <article className="card-glass misconception-card">
                <h3 className="misconception-title">{c.title}</h3>
                <div className="misconception-row misconception-row--wrong">
                  <span className="label-caps">Common error</span>
                  <p>{c.wrong}</p>
                </div>
                <div className="misconception-row misconception-row--right">
                  <span className="label-caps">What examiners want</span>
                  <p>{c.right}</p>
                </div>
                <p className="misconception-explain body-md">{c.explain}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## 10 · CSS — append to globals.css

```css
/* ───────────────── Science page additions ───────────────── */

/* Themes 2+3 grid */
.theme-grid {
  display: grid;
  align-items: stretch;
  gap: var(--space-4);
  max-width: 960px;
  margin: 0 auto;
}
.theme-grid > * { display: flex; }
.theme-grid > * > .theme-card { width: 100%; }
.theme-grid--top {
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: var(--space-4);
}
.theme-grid--bottom {
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: 760px) {
  .theme-grid--top, .theme-grid--bottom { grid-template-columns: 1fr; }
}
.theme-card {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  height: 100%;
}
.theme-card p { flex: 1; color: var(--text-muted); }
.theme-icon {
  margin-bottom: var(--space-3);
}
.theme-title {
  font-family: var(--font-display, 'Bebas Neue', sans-serif);
  letter-spacing: 0.04em;
  font-size: 26px;
  line-height: 1.1;
  margin: 0 0 var(--space-2);
  color: var(--text-main);
}

/* Science AL band overall colour override */
.al-mock-overall-band--science {
  color: var(--science-colour);
}

/* Format rail two-column variant (Science Pillar 03) */
.format-rail--two {
  grid-template-columns: repeat(2, 1fr);
}
@media (max-width: 480px) { .format-rail--two { grid-template-columns: 1fr; } }

/* Wena thinking dots */
.wena-thinking {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px !important;
}
.wena-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--cream);
  opacity: 0.5;
  display: inline-block;
  animation: wena-dot-pulse 1.2s infinite ease-in-out;
}
.wena-dot:nth-child(2) { animation-delay: 0.2s; }
.wena-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes wena-dot-pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Sample open-ended question */
.sample-oe {
  padding: var(--space-5);
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.sample-oe-diagram {
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
.photo-diagram { width: 100%; height: auto; }
.sample-oe-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.sample-oe-setup {
  color: var(--text-muted);
  font-style: italic;
  border-left: 3px solid var(--science-colour);
  padding-left: var(--space-3);
  margin: 0;
}
.sample-oe-textarea {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.55;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface-container-lowest);
  color: var(--text-main);
  resize: vertical;
  min-height: 96px;
}
.sample-oe-textarea:focus {
  outline: none;
  border-color: var(--science-colour);
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.12);
}
.sample-oe-textarea:disabled { opacity: 0.7; }
.sample-oe-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-2);
  gap: var(--space-3);
}
.sample-oe-wordcount {
  font-size: 12px;
  color: var(--text-muted);
}

/* Rubric */
.sample-oe-rubric {
  background: var(--surface-container-low);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.rubric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rubric-score {
  font-family: var(--font-display, 'Bebas Neue', sans-serif);
  font-size: 24px;
  letter-spacing: 0.04em;
}
.rubric-score--0 { color: var(--brand-rose); }
.rubric-score--1 { color: var(--brand-amber); }
.rubric-score--2 { color: var(--brand-mint); }
.rubric-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.rubric-row {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--surface-container-lowest);
}
.rubric-row--pass { border-left: 3px solid var(--brand-mint); }
.rubric-row--fail { border-left: 3px solid var(--brand-rose); }
.rubric-row-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.rubric-row-label {
  display: block;
  margin-bottom: 2px;
  color: var(--text-muted);
}
.rubric-row-criterion {
  font-size: 14px;
  color: var(--text-main);
}
.rubric-model {
  padding: var(--space-3);
  background: var(--surface-container-lowest);
  border-radius: var(--radius-md);
}
.rubric-model .label-caps {
  display: block;
  margin-bottom: var(--space-1);
  color: var(--science-colour);
}
.rubric-model p { margin: 0; color: var(--text-main); }
.rubric-coach {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  background: rgba(183, 110, 121, 0.08);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--brand-rose);
}
.rubric-coach p { margin: 0; }
.rubric-coach-avatar {
  width: 32px; height: 32px; border-radius: 999px;
  background: var(--brand-rose); color: var(--cream);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-display, 'Bebas Neue', sans-serif);
  font-size: 14px;
  flex-shrink: 0;
}

/* Science syllabus topic accordion */
.level-tabs-as--science .level-tab-as.is-active {
  background: var(--science-colour);
  color: var(--cream);
}
.syllabus-topic-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.syllabus-topic {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--surface-container-lowest);
  overflow: hidden;
  transition: border-color 0.16s ease;
}
.syllabus-topic.is-open {
  border-color: var(--science-colour);
}
.syllabus-topic-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 14px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.16s ease;
}
.syllabus-topic-header:hover {
  background: var(--surface-container-low);
}
.syllabus-topic-name {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
}
.syllabus-topic-count {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
}
.syllabus-topic-chevron {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}
.syllabus-topic-chevron.is-open {
  transform: rotate(180deg);
  color: var(--science-colour);
}
.syllabus-subtopic-wrap {
  overflow: hidden;
}
.syllabus-subtopic-grid {
  padding: 0 16px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.syllabus-subtopic-chip {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--surface-container-low);
  color: var(--science-colour);
  border: 1px solid rgba(5, 150, 105, 0.25);
}
```

---

## 11 · Acceptance criteria

Visit `localhost:3000/subjects/science`. All:

**Hero**
- [ ] Eyebrow: `SCIENCE · P3 → PSLE`
- [ ] H1 reveals headline + rose accent line
- [ ] CER scaffold animates: claim panel + text → arrow → evidence panel + line chart → arrow → reason panel + sun/leaf diagram. Loops every 18s
- [ ] Subject rule = mint
- [ ] Wandering dog visible on desktop

**§1 Themes**
- [ ] 5 cards in 2+3 layout, equal heights
- [ ] Each card has a 2s icon animation that loops
- [ ] H2 + lede centred

**§2 Pillar 01 (Diagnose)**
- [ ] 4 theme bars animate from 0% to widths on scroll
- [ ] Energy bar in rose, AL6, marked weak
- [ ] Pointer text: "Energy needs work — root cause traced next"
- [ ] Overall AL5 in mint

**§3 Pillar 02 (Analyse)**
- [ ] Photosynthesis → Plant Parts and Functions → Cell as basic unit of life
- [ ] Each node + edge appears progressively as user scrolls
- [ ] Root-cause node has slow amber pulse

**§4 Pillar 03 (Practice)**
- [ ] 2 chips in 2-column rail: MCQ · Open-Ended
- [ ] Chip heights equal
- [ ] Sample MCQ on water cycle works (B = correct = Condensation)
- [ ] Wrong-answer click reveals misconception

**§5 Pillar 04 (Tutor)**
- [ ] Sage section, all text legible
- [ ] On scroll-in: thinking dots → tutor msg 1 (typewriter) → student msg → thinking dots → tutor msg 2 (typewriter)
- [ ] Plan Quest badge appears

**§6 Sample Open-Ended**
- [ ] Photosynthesis diagram animates on scroll-in: Plant A grows tall + green, Plant B stunted + yellowing
- [ ] Setup paragraph + question stem visible
- [ ] Textarea + word counter
- [ ] Submit disabled until ≥ 5 words
- [ ] Type "plants need sunlight for photosynthesis" → check answer → 2/2 marks, both rubric rows ✓
- [ ] Type "the plants are different" → check answer → 0/2 marks, both rubric rows ✗, Wena coach line shows
- [ ] Type "plant A had sunlight" → check answer → 1/2 marks, claim ✓, reason ✗, Wena coach line shows
- [ ] "Try again" resets

**§7 Syllabus**
- [ ] 4 tabs (P3, P4, P5, P6), P5 default
- [ ] Topics list as collapsed accordion items by default
- [ ] Each topic shows sub-topic count
- [ ] Click topic → smooth height expansion → sub-topics fade in staggered
- [ ] Click another topic → previous closes, new opens
- [ ] Tab switch closes any open drawer
- [ ] Bottom shows total topic + sub-topic count for level

**§8 Misconceptions**
- [ ] Heading centred
- [ ] 2 cards with science-specific misconceptions

**§9 Pricing**
- [ ] Identical to Maths

**Functional**
- [ ] No "Begin a 7-day free trial" final section
- [ ] Hydration error absent
- [ ] All Plausible events fire (`trial_start_science`, `pricing_teaser_science_*`)
- [ ] Trial CTAs link to `/pages/signup.html?subject=science&mode=trial`

**Accessibility**
- [ ] `prefers-reduced-motion: reduce` → CER scaffold shows static version, theme icons stop animating, photosynthesis diagram shows end state, Wena dialogue all visible at once
- [ ] Keyboard tab through all interactive elements works
- [ ] Open-ended textarea has label
- [ ] Topic accordion buttons have `aria-expanded` + `aria-controls`

---

## 12 · Execution order

1. Install confirm (§0)
2. Theme icons (§5) — 5 files
3. CerScaffold + HeroScience (§4)
4. ThemesScience + Pillar 01-04 components (§5, §6) — test after each
5. Typewriter primitive
6. PhotosynthesisDiagram + sampleOpenEnded data + SampleQuestionSci (§7)
7. syllabusSci data + SyllabusMapSci (§8)
8. MisconceptionsSci (§9)
9. CSS append (§10)
10. page.tsx (§2) — final integration
11. Acceptance pass (§11)

---

## 13 · Out of scope

- Don't touch Maths page
- Don't touch English page  
- Don't modify `/public/pages/subject-science.html` (vanilla page stays live until Vercel rewrite)
- Don't add Vercel rewrite — that's a manual cutover after QA
- Don't commit to git
- Don't recreate primitives that exist on Maths page — import them

End of spec.