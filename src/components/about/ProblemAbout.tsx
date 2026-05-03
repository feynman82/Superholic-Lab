'use client';

import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

export default function ProblemAbout() {
  return (
    <section className="section-pad" data-section="problem">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="01">THE PROBLEM</Eyebrow>
          <h2 className="h2-as">Practice doesn&apos;t make perfect. Understanding does.</h2>
          <p className="body-md section-sub">
            In Singapore&apos;s exam culture, parents are told endless practice papers are the path to mastery. But doing 1,000 questions means nothing if a child repeats the same conceptual mistake 1,000 times. The error hardens. Anxiety builds. Marks don&apos;t move.
          </p>
        </FadeUp>

        <div className="problem-grid">
          <FadeUp delay={0}>
            <article className="card-glass problem-card problem-card--wrong">
              <span className="label-caps problem-card-label">Standard assessment book</span>
              <div className="problem-q">
                <span className="problem-q-num">Q14</span>
                <span className="problem-q-mark problem-q-mark--wrong">✗ Wrong</span>
              </div>
              <div className="problem-a-row">
                <span>Student answer:</span>
                <strong>A</strong>
              </div>
              <div className="problem-a-row">
                <span>Correct answer:</span>
                <strong className="text-mint">B</strong>
              </div>
              <div className="problem-explain problem-explain--empty">
                <span className="label-caps">Explanation</span>
                <p><em>None provided. The student is left to guess why A is wrong.</em></p>
              </div>
            </article>
          </FadeUp>

          <FadeUp delay={0.1}>
            <article className="card-glass problem-card problem-card--right">
              <span className="label-caps problem-card-label">Superholic Lab</span>
              <div className="problem-q">
                <span className="problem-q-num">Q14</span>
                <span className="problem-q-mark problem-q-mark--wrong">✗ Answered: A</span>
              </div>
              <div className="problem-explain problem-explain--filled">
                <span className="label-caps">Why A is incorrect</span>
                <p>
                  Option A suggests water vapour condenses <em>inside</em> the glass. But condensation occurs when warm vapour in the surrounding air touches the <strong>cooler outer surface</strong> of the glass.
                </p>
              </div>
              <div className="problem-tags">
                <span className="problem-tag">AO2 · Application</span>
                <span className="problem-tag">Misconception named</span>
                <span className="problem-tag">Dependency: states of matter</span>
              </div>
            </article>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
