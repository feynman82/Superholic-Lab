'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Dog from '@/components/marketing/Dog';

export default function ClosingAbout() {
  const reduce = useReducedMotion();

  return (
    <section className="closing-about" data-section="closing">
      <div className="container-as closing-about-inner">
        <div className="closing-meta closing-meta--top">
          <span className="closing-page">page 8 of 8</span>
          <span className="closing-rule" aria-hidden="true" />
        </div>

        <motion.div
          className="closing-content"
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          whileInView={reduce ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="closing-line">
            Built by a Singaporean parent who got tired of guessing.
          </p>
          <p className="closing-line">
            Maintained by an incredible team of 7.
          </p>
          <p className="closing-line">
            Yours to try, free, for seven days.
          </p>

          <div className="closing-cta">
            <a
              href="/pages/signup.html?mode=trial"
              className="btn btn-primary"
              data-auth-cta
              data-plausible-event="trial_start_about"
            >
              Start free trial →
            </a>
          </div>
        </motion.div>

        <div className="closing-meta closing-meta--bottom">
          <span className="closing-rule" aria-hidden="true" />
          <span className="closing-copyright">© 2026 — Superholic Lab</span>
          <span className="closing-mark" aria-hidden="true">──◆──</span>
        </div>

        <div className="closing-dog" aria-hidden="true">
          <Dog variant="bookend" />
        </div>
      </div>
    </section>
  );
}
