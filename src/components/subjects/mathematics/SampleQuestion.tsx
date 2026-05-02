'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { sampleWordProblem } from './data/sampleWordProblem';

export default function SampleQuestion() {
  const reduce = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');

  const isCorrect =
    submitted && answer.trim().replace(/\s/g, '') === sampleWordProblem.correctAnswer.replace(/\s/g, '');

  return (
    <section className="section-pad" data-section="sample-question">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="06">SAMPLE QUESTION · WORD PROBLEM</Eyebrow>
          <h2 className="h2-as">Try a Paper 2 word problem.</h2>
          <p className="body-md section-sub">
            Type your numerical answer. See the worked solution and misconception trace.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="card-glass sample-wp" data-pillar-viz="sample-word-problem">
            <div className="sample-meta">
              <span className="label-caps">
                {sampleWordProblem.level} · {sampleWordProblem.topic} · {sampleWordProblem.marks} marks
              </span>
            </div>

            <p className="sample-stem">{sampleWordProblem.stem}</p>

            <div className="sample-wp-input-row">
              <label htmlFor="wp-answer" className="label-caps sample-wp-label">
                Your answer
              </label>
              <div className="sample-wp-input-wrap">
                <input
                  id="wp-answer"
                  type="text"
                  inputMode="numeric"
                  className="sample-wp-input"
                  placeholder={sampleWordProblem.placeholder}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={submitted}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && answer.trim()) setSubmitted(true);
                  }}
                />
                <span className="sample-wp-unit">{sampleWordProblem.unit}</span>
              </div>
              {!submitted ? (
                <button
                  type="button"
                  className="btn btn-primary sample-wp-submit"
                  disabled={!answer.trim()}
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

            <AnimatePresence>
              {submitted && (
                <motion.div
                  className={`sample-explain ${isCorrect ? 'sample-explain--correct' : 'sample-explain--wrong'}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  {isCorrect ? (
                    <>
                      <strong>Correct.</strong>
                    </>
                  ) : (
                    <>
                      <strong>Not quite.</strong> The answer is{' '}
                      <em>
                        {sampleWordProblem.correctAnswer} {sampleWordProblem.unit}
                      </em>
                      .
                    </>
                  )}
                  <ol className="sample-wp-steps">
                    {sampleWordProblem.workedSteps.map((step, i) => (
                      <motion.li
                        key={i}
                        initial={reduce ? {} : { opacity: 0, x: -8 }}
                        animate={reduce ? {} : { opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 + i * 0.15 }}
                      >
                        {step}
                      </motion.li>
                    ))}
                  </ol>
                  {sampleWordProblem.misconception && (
                    <p className="sample-wp-misconception">
                      <strong>Common error:</strong> {sampleWordProblem.misconception}
                    </p>
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
