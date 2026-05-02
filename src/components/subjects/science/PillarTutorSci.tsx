'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import Typewriter from '@/components/marketing/motion/Typewriter';

interface Msg {
  from: 'tutor' | 'student';
  text: string;
}

const script: Msg[] = [
  { from: 'tutor',   text: "Your answer says plants need sunlight. That's a claim. What evidence from the experiment supports it?" },
  { from: 'student', text: 'The plant in the dark cupboard turned yellow.' },
  { from: 'tutor',   text: "Good evidence. Now: why does the absence of sunlight cause yellowing? That's the reason mark — and where most students lose 1 point." },
];

export default function PillarTutorSci() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [step, setStep] = useState(-1);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setStep(2);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setThinking(true), 400));
    timers.push(setTimeout(() => { setThinking(false); setStep(0); }, 1000));

    const t0Length = script[0].text.length * 25;
    timers.push(setTimeout(() => setStep(1), 1000 + t0Length + 700));

    const t1Reveal = 1000 + t0Length + 700;
    timers.push(setTimeout(() => setThinking(true), t1Reveal + 1000));
    timers.push(setTimeout(() => { setThinking(false); setStep(2); }, t1Reveal + 1600));

    return () => timers.forEach(clearTimeout);
  }, [inView, reduce]);

  return (
    <section className="section-pad pillar-section bg-charcoal-section" data-section="pillar-4">
      <div className="container-as">
        <div className="pillar-grid">
          <div className="pillar-text pillar-text--dark">
            <FadeUp>
              <Eyebrow num="05">04 · AI-TUTOR REINFORCEMENT</Eyebrow>
              <h2 className="h2-as">Miss Wena. 24/7. CER-trained.</h2>
              <p className="body-lg">
                When an answer is half-right, Miss Wena pushes for the reason — the same way examiners do. Claim. Evidence. Reason. Until the thinking is whole.
              </p>
              <ul className="rose-list pillar-bullets pillar-bullets--dark">
                <li>Plan Quests built from real diagnosis</li>
                <li>Saves conversations as study notes</li>
                <li>Pushes for the reason, not just the right answer</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual" ref={ref}>
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
                  <div className="wena-status">● CER mode</div>
                </div>
              </div>

              {script.map((m, i) => {
                if (step < i) return null;
                return (
                  <motion.div
                    key={i}
                    className={m.from === 'tutor' ? 'bubble-tutor' : 'bubble-user'}
                    initial={reduce ? {} : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {m.from === 'tutor' ? (
                      <Typewriter text={m.text} charDuration={0.025} />
                    ) : (
                      m.text
                    )}
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {thinking && !reduce && (
                  <motion.div
                    className="bubble-tutor wena-thinking"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Miss Wena is thinking"
                  >
                    <span className="wena-dot" />
                    <span className="wena-dot" />
                    <span className="wena-dot" />
                  </motion.div>
                )}
              </AnimatePresence>

              {step >= 2 && (
                <FadeUp delay={0.3}>
                  <div className="quest-badge">
                    <span className="label-caps">▸ Plan Quest generated · 3 days · Photosynthesis</span>
                  </div>
                </FadeUp>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
