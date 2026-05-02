'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { sampleComprehension } from './data/sampleComprehension';

function gradeAnswer(answer: string) {
  const normalised = answer.toLowerCase();
  const hasClaim = sampleComprehension.claimKeywords.some((k) => normalised.includes(k.toLowerCase()));
  const hasReason = sampleComprehension.reasonKeywords.some((k) => normalised.includes(k.toLowerCase()));
  return {
    claim: hasClaim,
    reason: hasReason,
    score: (hasClaim ? 1 : 0) + (hasReason ? 1 : 0),
  };
}

export default function SampleQuestionEng() {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const grading = submitted ? gradeAnswer(answer) : null;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  const lines = sampleComprehension.passage.split(/\n+/).filter(Boolean);
  const hasImage = !!sampleComprehension.imageUrl;

  return (
    <section className="section-pad" data-section="sample-question">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="06">SAMPLE QUESTION · COMPREHENSION</Eyebrow>
          <h2 className="h2-as">Try a P5 inference question.</h2>
          <p className="body-md section-sub">
            Read the passage. Type your answer. See how examiners mark inference — clue identification + inferential leap — with the model answer.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="card-glass sample-comp" data-pillar-viz="sample-comprehension">
            <div className="sample-meta">
              <span className="label-caps">
                {sampleComprehension.level} · {sampleComprehension.topic} · {sampleComprehension.subTopic} · {sampleComprehension.marks} marks
              </span>
            </div>

            {hasImage && (
              <motion.div
                className="comp-image"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleComprehension.imageUrl}
                  alt={sampleComprehension.imageAlt}
                  loading="lazy"
                />
              </motion.div>
            )}

            <div className="comp-passage">
              <span className="label-caps comp-passage-label">Passage</span>
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  className="comp-passage-line"
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {line}
                </motion.p>
              ))}
            </div>

            <p className="sample-stem comp-stem"><strong>Q:</strong> {sampleComprehension.stem}</p>

            <div className="sample-oe-answer">
              <label htmlFor="comp-answer" className="label-caps sample-wp-label">
                Your answer
              </label>
              <textarea
                id="comp-answer"
                className="sample-oe-textarea"
                rows={4}
                placeholder="Name the feeling. Then point to specific evidence in the passage."
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
                      {grading.score} / {sampleComprehension.marks} marks
                    </span>
                  </div>

                  <div className="rubric-rows">
                    <RubricRow
                      label="MARK 1 · IDENTIFY THE FEELING"
                      criterion="Names a plausible emotion (nervous, anxious, shy, etc.)"
                      pass={grading.claim}
                    />
                    <RubricRow
                      label="MARK 2 · CITE THE EVIDENCE"
                      criterion="References specific clues (gripping, looking down, far away)"
                      pass={grading.reason}
                    />
                  </div>

                  <div className="rubric-model">
                    <span className="label-caps">Model answer</span>
                    <p className="body-md">{sampleComprehension.modelAnswer}</p>
                  </div>

                  {grading.score < 2 && (
                    <div className="rubric-coach">
                      <span className="rubric-coach-avatar">W</span>
                      <p className="body-md">
                        <strong>Miss Wena:</strong> {sampleComprehension.wenaCoachLine}
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
