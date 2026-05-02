'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import SubjectRule from '@/components/marketing/SubjectRule';
import SentenceDiagram from '@/components/marketing/illustrations/english/SentenceDiagram';

export default function HeroEnglish() {
  const reduce = useReducedMotion();

  return (
    <section className="hero-as grid-texture-lg" data-section="hero">
      <div className="container-as">
        {/* Reversed: visual on left, text on right */}
        <div className="hero-grid hero-grid--reverse">
          <div className="hero-visual">
            <SentenceDiagram />
          </div>

          <div className="hero-text">
            <Eyebrow num="00">ENGLISH · P1 → PSLE</Eyebrow>
            <SubjectRule color="var(--english-colour)" />

            <h1 className="h1-as hero-headline">
              <motion.span
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block' }}
              >
                English is six components.
              </motion.span>
              <motion.em
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block', color: 'var(--brand-rose)', fontStyle: 'normal' }}
              >
                We build all six. Wena steps in when stuck.
              </motion.em>
            </h1>

            <motion.p
              className="body-lg hero-lede"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Most parents think Primary English is just comprehension and grammar. PSLE tests <em>six</em> distinct components — each with its own technique. Superholic Lab drills every one, with Miss Wena stepping in the moment your child stalls.
            </motion.p>

            <motion.div
              className="hero-ctas"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <a
                href="/pages/signup.html?subject=english&mode=trial"
                className="btn btn-primary"
                data-auth-cta
                data-plausible-event="trial_start_english"
              >
                Start 7-day free trial
              </a>
              <a href="#syllabus" className="btn btn-outlined">
                See full syllabus
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
