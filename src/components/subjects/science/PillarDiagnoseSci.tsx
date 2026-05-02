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
                Bayesian Knowledge Tracing scores every theme. Live AL band per subject. The dashboard shows exactly where mastery is — and exactly where it isn&apos;t.
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
