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
  { from: 'tutor',   text: "Look at this: 'The boys ___ at the void deck.' Which sounds right — plays or play?" },
  { from: 'student', text: "I don't know." },
  { from: 'tutor',   text: "Let me show you. The 's' on a verb is like a special badge — it stays on the verb only when there's just one person. 'The boy plays' (one). 'The boys play' (more than one). So which fits 'The boys'?" },
];

export default function PillarTutorEng() {
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
        {/* English layout: visual LEFT, text RIGHT — pillar-grid.reverse */}
        <div className="pillar-grid reverse">
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
                  <div className="wena-status">● Direct teach mode</div>
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
                    <span className="label-caps">▸ Plan Quest generated · 3 days · Subject-Verb Agreement</span>
                  </div>
                </FadeUp>
              )}
            </div>
          </div>

          <div className="pillar-text pillar-text--dark">
            <FadeUp>
              <Eyebrow num="05">04 · AI-TUTOR REINFORCEMENT</Eyebrow>
              <h2 className="h2-as">Three teaching modes. One Singaporean tutor.</h2>
              <p className="body-lg">
                Most AI tutors loop forever. Miss Wena switches modes the way real Singapore teachers do — Socratic when your child is close, direct teaching when they stall, claim-evidence-reasoning when an answer needs structure.
              </p>
              <ul className="rose-list pillar-bullets pillar-bullets--dark">
                <li>180 MOE-aligned teaching scripts — not generic AI output</li>
                <li>Knows when to stop asking and start teaching</li>
                <li>Singapore context in every example — Wei Ming, Aishah, the void deck</li>
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
