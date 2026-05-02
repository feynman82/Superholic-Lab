'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import CountUp from '@/components/marketing/motion/CountUp';
import FadeUp from '@/components/marketing/motion/FadeUp';
import PaperPlane from '@/components/marketing/PaperPlane';

const componentsProgress = [
  { name: 'Grammar (MCQ)',  pct: 78, band: 'AL3' },
  { name: 'Cloze',          pct: 62, band: 'AL5' },
  { name: 'Comprehension',  pct: 41, band: 'AL6', weak: true },
  { name: 'Synthesis',      pct: 55, band: 'AL5' },
  { name: 'Editing',        pct: 70, band: 'AL4' },
];

const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min) + min);

const generatePlanePath = (): [number, number, number, number] =>
  [rand(-180, 180), rand(-180, 180), rand(-180, 180), rand(-180, 180)];

export default function PillarDiagnoseEng() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();

  // 4 random Y offsets — one per crossing — refreshed each 10s cycle.
  // Initialised null so SSR renders the wanderer-less; client-side mount
  // populates it and re-rolls every loop iteration.
  const [planeYs, setPlaneYs] = useState<[number, number, number, number] | null>(null);
  useEffect(() => {
    setPlaneYs(generatePlanePath());
    const interval = setInterval(() => setPlaneYs(generatePlanePath()), 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section-pad pillar-section paper-plane-host" data-section="pillar-1">
      <div className="container-as">
        {/* English layout: visual LEFT, text RIGHT — pillar-grid.reverse */}
        <div className="pillar-grid reverse">
          <div className="pillar-visual" ref={ref} data-pillar-viz="al-band">
            <div className="card-glass al-mock">
              <div className="al-mock-head">
                <span className="label-caps">Component Mastery — English P5</span>
                <span className="al-mock-overall">
                  <span className="label-caps">Overall</span>
                  <span className="al-mock-overall-band al-mock-overall-band--english">
                    AL<CountUp to={5} />
                  </span>
                </span>
              </div>
              {componentsProgress.map((t, i) => (
                <div className="al-mock-row" key={t.name}>
                  <span className="al-mock-label">{t.name}</span>
                  <div className="al-mock-bar">
                    <motion.span
                      initial={reduce ? { width: `${t.pct}%` } : { width: 0 }}
                      animate={inView ? { width: `${t.pct}%` } : {}}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{ background: t.weak ? 'var(--brand-rose)' : 'var(--english-colour)' }}
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
                ▸ Comprehension needs work — root cause traced next
              </motion.div>
            </div>
          </div>

          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="02">01 · DIAGNOSE</Eyebrow>
              <h2 className="h2-as">Honest signal. No inflated scores.</h2>
              <p className="body-lg">
                Bayesian Knowledge Tracing scores every component. Live AL band per subject. The dashboard shows exactly where mastery is — and exactly where it isn&apos;t.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>BKT mastery score per component and topic</li>
                <li>Live AL band that updates after every quiz</li>
                <li>No participation trophies, no inflated percentages</li>
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>

      {/* Paper plane: 4 crossings per 10s loop, each at a different random
          Y entry point (re-rolled every cycle). 2s per crossing + 0.5s
          flip pauses at each edge. Linear ease for constant-speed zoom.
          Wanderer is render-gated on planeYs to avoid SSR hydration
          mismatch from Math.random(). */}
      {planeYs && (
        <motion.div
          className="paper-plane-wanderer"
          initial={reduce ? {} : { x: '-10vw', y: planeYs[0] }}
          animate={
            reduce
              ? {}
              : {
                  x: ['-10vw', '100vw', '100vw', '-10vw', '-10vw', '100vw', '100vw', '-10vw', '-10vw'],
                  y: [planeYs[0], planeYs[0], planeYs[1], planeYs[1], planeYs[2], planeYs[2], planeYs[3], planeYs[3], planeYs[0]],
                  scaleX: [1, 1, -1, -1, 1, 1, -1, -1, 1],
                }
          }
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.20, 0.25, 0.45, 0.50, 0.70, 0.75, 0.95, 1.0],
          }}
          aria-hidden="true"
        >
          <PaperPlane />
        </motion.div>
      )}
    </section>
  );
}
