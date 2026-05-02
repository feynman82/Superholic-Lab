'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import SubjectRule from '@/components/marketing/SubjectRule';
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
              Memorising facts won&apos;t pass PSLE Science. Examiners reward the <em>reason</em> behind the answer — the why, not just the what. Superholic Lab teaches that explicitly.
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
        </div>
      </div>
    </section>
  );
}
