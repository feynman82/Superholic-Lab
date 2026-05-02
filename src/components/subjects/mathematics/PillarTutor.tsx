'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const messages = [
  { from: 'tutor', text: "I see Ratio is at AL6. Before we practise more, let's check Fractions. What is 2/5 + 1/5?" },
  { from: 'student', text: '3/10' },
  { from: 'tutor', text: 'That tells us where the gap is. The denominator stays the same when adding like fractions. Want me to walk you through?' },
];

export default function PillarTutor() {
  const reduce = useReducedMotion();

  return (
    <section className="section-pad pillar-section bg-charcoal-section" data-section="pillar-4">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text pillar-text--dark">
            <FadeUp>
              <Eyebrow num="05">04 · AI-TUTOR REINFORCEMENT</Eyebrow>
              <h2 className="h2-as">Miss Wena. 24/7. MOE-aligned.</h2>
              <p className="body-lg">
                When a topic falls below threshold, Miss Wena builds a three-day Plan Quest. Day 1 ramps practice. Day 2 is Socratic dialogue. Day 3 proves mastery.
              </p>
              <ul className="rose-list pillar-bullets pillar-bullets--dark">
                <li>Plan Quests built from real diagnosis</li>
                <li>Saves conversations as study notes</li>
                <li>Honest Compass — values self-awareness over fake celebration</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual">
            <div className="card-glass-dark wena-mock" data-pillar-viz="wena-chat">
              <div className="wena-header">
                <motion.div
                  className="wena-avatar"
                  animate={reduce ? {} : { scaleY: [1, 1, 0.1, 1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.5, 0.55, 1] }}
                  aria-hidden="true"
                >
                  W
                </motion.div>
                <div>
                  <div className="wena-name">Miss Wena</div>
                  <div className="wena-status">● Quest mode</div>
                </div>
              </div>

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  className={m.from === 'tutor' ? 'bubble-tutor' : 'bubble-user'}
                  initial={reduce ? {} : { opacity: 0, y: 8 }}
                  whileInView={reduce ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.5 }}
                >
                  {m.text}
                </motion.div>
              ))}

              <FadeUp delay={2.2}>
                <div className="quest-badge">
                  <span className="label-caps">▸ Plan Quest generated · 3 days · Fractions</span>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
