'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import SubjectRule from '@/components/marketing/SubjectRule';
import Dog from '@/components/marketing/Dog';
import BarModel from '@/components/marketing/illustrations/BarModel';

export default function HeroMaths() {
  const reduce = useReducedMotion();

  const headline = 'Singapore Maths has a method.';
  const accent = 'We made the method visible.';

  return (
    <section className="hero-as grid-texture-lg" data-section="hero">
      <div className="container-as">
        <div className="hero-grid">
          <div className="hero-text">
            <Eyebrow num="00">MATHEMATICS · P1 → PSLE</Eyebrow>
            <SubjectRule />

            <h1 className="h1-as hero-headline">
              <motion.span
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block' }}
              >
                {headline}
              </motion.span>
              <motion.em
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block', color: 'var(--brand-rose)', fontStyle: 'normal' }}
              >
                {accent}
              </motion.em>
            </h1>

            <motion.p
              className="body-lg hero-lede"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Your child&apos;s struggle isn&apos;t lack of effort — it&apos;s a missing upstream concept the school never had time to find.
            </motion.p>

            <motion.div
              className="hero-ctas"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <a
                href="/pages/signup.html?subject=mathematics&mode=trial"
                className="btn btn-primary"
                data-auth-cta
                data-plausible-event="trial_start_maths"
              >
                Start 7-day free trial
              </a>
              <a href="#syllabus" className="btn btn-outlined">
                See full syllabus
              </a>
            </motion.div>
          </div>

          <div className="hero-visual">
            <BarModel />
          </div>
        </div>
      </div>

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
        <Dog variant="wander" />
      </motion.div>
    </section>
  );
}
