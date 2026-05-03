'use client';

import dynamic from 'next/dynamic';
import { useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const PillarStack = dynamic(() => import('./r3f/PillarStack'), {
  ssr: false,
  loading: () => <PillarStackFallback />,
});

export default function MethodAbout() {
  const reduce = useReducedMotion();

  return (
    <section className="section-pad bg-sage-tinted" data-section="method">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="02">THE METHOD</Eyebrow>
          <h2 className="h2-as">Four pillars. Three subjects. One coherent system.</h2>
          <p className="body-md section-sub">
            Every Superholic Lab subject flows the same four pillars. Diagnose with BKT. Analyse with dependency graphs. Practise PSLE-true formats. Reinforce with Miss Wena.
          </p>
        </FadeUp>

        <div className="pillar-stack-wrap">
          {reduce ? <PillarStackFallback /> : <PillarStack />}
        </div>

        <FadeUp className="method-subject-strip">
          <p className="label-caps">SEE IT IN MOTION</p>
          <div className="method-subject-links">
            <a
              href="/subjects/mathematics"
              className="method-subject-link"
              data-plausible-event="about_to_maths"
            >
              Mathematics →
            </a>
            <a
              href="/subjects/science"
              className="method-subject-link"
              data-plausible-event="about_to_science"
            >
              Science →
            </a>
            <a
              href="/subjects/english"
              className="method-subject-link"
              data-plausible-event="about_to_english"
            >
              English →
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

/** Static fallback. Four pillar cards in a row. */
function PillarStackFallback() {
  const pillars = [
    { num: '01', name: 'Diagnose',  body: 'BKT mastery per topic and sub-topic.' },
    { num: '02', name: 'Analyse',   body: 'Dependency graph traces root cause.' },
    { num: '03', name: 'Practise',  body: 'PSLE-true formats. Adaptive difficulty.' },
    { num: '04', name: 'Reinforce', body: 'Miss Wena, scaffolded, never improvising.' },
  ];

  return (
    <div className="pillar-fallback-grid">
      {pillars.map((p) => (
        <div key={p.name} className="pillar-fallback-card">
          <div className="pillar-fallback-num">{p.num}</div>
          <div className="pillar-fallback-name">{p.name}</div>
          <p className="body-md">{p.body}</p>
        </div>
      ))}
    </div>
  );
}
