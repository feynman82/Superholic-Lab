'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { sampleCloze } from './data/sampleCloze';

const formats = [
  { label: 'Cloze',         sub: 'Booklet B', accent: 'var(--english-colour)' },
  { label: 'Editing',       sub: 'Booklet B', accent: 'var(--brand-rose)' },
  { label: 'Comprehension', sub: 'Booklet B', accent: 'var(--brand-mint)' },
  { label: 'Synthesis',     sub: 'Booklet B', accent: 'var(--brand-sage)' },
  { label: 'MCQ Grammar',   sub: 'Booklet A', accent: 'var(--brand-amber)' },
];

export default function PillarPracticeEng() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const correctOpt = sampleCloze.options.find((o) => o.correct);
  const isCorrect = selected === correctOpt?.letter;
  const selectedOpt = sampleCloze.options.find((o) => o.letter === selected);

  const [before, after] = sampleCloze.stem.split('{BLANK}');
  const slotWord = selected ? sampleCloze.options.find((o) => o.letter === selected)?.text || '' : '';

  return (
    <section className="section-pad pillar-section" data-section="pillar-3">
      <div className="container-as">
        {/* English layout: visual LEFT, text RIGHT — pillar-grid.reverse */}
        <div className="pillar-grid reverse">
          <div className="pillar-visual">
            <div className="format-rail format-rail--five">
              {formats.map((f, i) => (
                <FadeUp key={f.label} delay={i * 0.05}>
                  <div className="format-chip" style={{ borderColor: f.accent }}>
                    <span className="format-label" style={{ color: f.accent }}>{f.label}</span>
                    <span className="format-sub">{f.sub}</span>
                  </div>
                </FadeUp>
              ))}
            </div>

            <FadeUp delay={0.2}>
              <div className="card-glass sample-question sample-cloze" data-pillar-viz="sample-cloze">
                <div className="sample-meta">
                  <span className="label-caps">{sampleCloze.level} · Cloze · {sampleCloze.subTopic}</span>
                  <span className="sample-tap-hint">Tap an option ▸</span>
                </div>

                <p className="cloze-stem">
                  {before}
                  <span className={`cloze-slot ${selected ? (isCorrect ? 'cloze-slot--correct' : 'cloze-slot--wrong') : 'cloze-slot--empty'}`}>
                    <AnimatePresence mode="wait">
                      {selected ? (
                        <motion.span
                          key={selected}
                          className="cloze-slot-word"
                          initial={reduce ? {} : { y: -16, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={reduce ? {} : { y: 16, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                          {slotWord}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="empty"
                          className="cloze-slot-empty"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ____________
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  {after}
                </p>

                <div className="cloze-options">
                  {sampleCloze.options.map((opt) => {
                    const isSelected = selected === opt.letter;
                    const state = !selected ? 'idle' : opt.correct ? 'correct' : isSelected ? 'wrong' : 'idle';
                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        className={`cloze-option cloze-option--${state}`}
                        onClick={() => setSelected(opt.letter)}
                        disabled={!!selected}
                        aria-pressed={isSelected}
                      >
                        <span className="opt-letter">{opt.letter}</span>
                        <span className="cloze-option-text">{opt.text}</span>
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
                          <strong>Correct.</strong> {sampleCloze.workedExplanation}
                        </>
                      ) : (
                        <>
                          <strong>Not quite.</strong> {selectedOpt?.misconception} <br />
                          <em>The right answer is {correctOpt?.letter} — {correctOpt?.text}.</em> {sampleCloze.workedExplanation}
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

          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="04">03 · TARGETED PRACTICE</Eyebrow>
              <h2 className="h2-as">Five formats. PSLE-true. No filler.</h2>
              <p className="body-lg">
                Cloze, Editing, Comprehension, Synthesis, MCQ Grammar. Each format demands a different technique. Adaptive selection from a curated bank, calibrated to your child&apos;s current AL band.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>5 question formats · 1 coached domain</li>
                <li>Adaptive difficulty by current AL band</li>
                <li>Every wrong answer earns a misconception explanation</li>
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
