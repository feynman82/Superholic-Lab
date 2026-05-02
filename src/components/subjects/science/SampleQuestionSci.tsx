'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import PhotosynthesisDiagram from '@/components/marketing/illustrations/science/PhotosynthesisDiagram';
import { sampleOpenEnded } from './data/sampleOpenEnded';

function gradeAnswer(answer: string) {
  const normalised = answer.toLowerCase();
  const hasClaim = sampleOpenEnded.claimKeywords.some((k) => normalised.includes(k.toLowerCase()));
  const hasReason = sampleOpenEnded.reasonKeywords.some((k) => normalised.includes(k.toLowerCase()));
  return {
    claim: hasClaim,
    reason: hasReason,
    score: (hasClaim ? 1 : 0) + (hasReason ? 1 : 0),
  };
}

export default function SampleQuestionSci() {
  const [submitted, setSubmitted] = useState(false);
  const [answer, setAnswer] = useState('');
  const grading = submitted ? gradeAnswer(answer) : null;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <section className="section-pad" data-section="sample-question">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="06">SAMPLE QUESTION · OPEN-ENDED</Eyebrow>
          <h2 className="h2-as">Try a Paper 2 open-ended question.</h2>
          <p className="body-md section-sub">
            Type your answer. See how examiners mark it — claim, evidence, reason — with the model answer beside yours.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="card-glass sample-oe" data-pillar-viz="sample-open-ended">
            <div className="sample-meta">
              <span className="label-caps">
                {sampleOpenEnded.level} · {sampleOpenEnded.topic} · {sampleOpenEnded.marks} marks
              </span>
            </div>

            <div className="sample-oe-diagram">
              <PhotosynthesisDiagram />
            </div>

            <div className="sample-oe-text">
              <p className="sample-oe-setup body-md">{sampleOpenEnded.setup}</p>
              <p className="sample-stem"><strong>Q:</strong> {sampleOpenEnded.stem}</p>
            </div>

            <div className="sample-oe-answer">
              <label htmlFor="oe-answer" className="label-caps sample-wp-label">
                Your answer
              </label>
              <textarea
                id="oe-answer"
                className="sample-oe-textarea"
                rows={4}
                placeholder="Write 2–3 sentences. Mention what each plant received and why this caused the difference."
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
                      {grading.score} / {sampleOpenEnded.marks} marks
                    </span>
                  </div>

                  <div className="rubric-rows">
                    <RubricRow
                      label="MARK 1 · CLAIM"
                      criterion="Identifies the difference: sunlight vs darkness"
                      pass={grading.claim}
                    />
                    <RubricRow
                      label="MARK 2 · REASON"
                      criterion="Explains photosynthesis / food production / chlorophyll"
                      pass={grading.reason}
                    />
                  </div>

                  <div className="rubric-model">
                    <span className="label-caps">Model answer</span>
                    <p className="body-md">{sampleOpenEnded.modelAnswer}</p>
                  </div>

                  {grading.score < 2 && (
                    <div className="rubric-coach">
                      <span className="rubric-coach-avatar">W</span>
                      <p className="body-md">
                        <strong>Miss Wena:</strong> {sampleOpenEnded.wenaCoachLine}
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
