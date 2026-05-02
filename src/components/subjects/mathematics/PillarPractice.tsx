'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { sampleQuestion } from './data/sampleQuestion';

const formats = [
  { label: 'MCQ', sub: 'Booklet A', accent: 'var(--maths-colour)' },
  { label: 'Short Answer', sub: 'Booklet B', accent: 'var(--brand-rose)' },
  { label: 'Word Problem', sub: 'Paper 2', accent: 'var(--brand-mint)' },
];

export default function PillarPractice() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected === sampleQuestion.options.find((o) => o.correct)?.letter;
  const selectedOpt = sampleQuestion.options.find((o) => o.letter === selected);

  return (
    <section className="section-pad pillar-section" data-section="pillar-3">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="04">03 · TARGETED PRACTICE</Eyebrow>
              <h2 className="h2-as">Three formats. PSLE-true. No filler.</h2>
              <p className="body-lg">
                MCQ for Booklet A. Short answer for Booklet B. Word problems for Paper 2. Adaptive selection from a curated bank, calibrated to your child&apos;s current band.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>MCQ · Short Answer · Word Problem</li>
                <li>Adaptive difficulty by current AL band</li>
                <li>Every wrong answer earns a misconception explanation</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual">
            <div className="format-rail">
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
                  <span className="label-caps">{sampleQuestion.level} · {sampleQuestion.topic}</span>
                  <span className="sample-tap-hint">Tap an option ▸</span>
                </div>
                <p className="sample-stem">{sampleQuestion.stem}</p>
                <div className="sample-options">
                  {sampleQuestion.options.map((opt) => {
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
                          <strong>Correct.</strong> {sampleQuestion.workedExplanation}
                        </>
                      ) : (
                        <>
                          <strong>Not quite.</strong> {selectedOpt?.misconception} <br />
                          <em>The right answer is {sampleQuestion.options.find((o) => o.correct)?.letter}.</em> {sampleQuestion.workedExplanation}
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
