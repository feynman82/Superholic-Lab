'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

export default function PillarAnalyseEng() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'end 0.4'],
  });

  const topOpacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const topY = useTransform(scrollYProgress, [0, 0.25], [-12, 0]);
  const edge1 = useTransform(scrollYProgress, [0.20, 0.40], [0, 1]);
  const midOpacity = useTransform(scrollYProgress, [0.35, 0.55], [0, 1]);
  const midY = useTransform(scrollYProgress, [0.35, 0.55], [-12, 0]);
  const edge2 = useTransform(scrollYProgress, [0.50, 0.70], [0, 1]);
  const rootOpacity = useTransform(scrollYProgress, [0.65, 0.85], [0, 1]);
  const rootY = useTransform(scrollYProgress, [0.65, 0.85], [-12, 0]);

  return (
    <section
      ref={sectionRef}
      className="section-pad pillar-section bg-white-section"
      data-section="pillar-2"
    >
      <div className="container-as">
        {/* English layout: text LEFT, visual RIGHT — pillar-grid (no reverse) */}
        <div className="pillar-grid">
          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="03">02 · ANALYSE WEAKNESS</Eyebrow>
              <h2 className="h2-as">Find the upstream gap.</h2>
              <p className="body-lg">
                Comprehension inference weakness usually traces to vocabulary in context. That traces to sight vocabulary. Reading more isn&apos;t the answer — building the right vocabulary layer is.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>Topic dependency graph traces root cause</li>
                <li>AO1 / AO2 / AO3 cognitive-skill breakdown</li>
                <li>Misconception-specific wrong-answer explanations</li>
              </ul>
            </FadeUp>
          </div>

          <div className="pillar-visual">
            <div className="card-glass dep-graph-wrap" data-pillar-viz="dependency-graph">
              <span className="label-caps dep-graph-title">Root-cause trace</span>
              <svg
                viewBox="0 0 320 280"
                className="dep-graph-svg"
                role="img"
                aria-label="Dependency graph showing comprehension inference traced to vocabulary in context, then to sight vocabulary"
              >
                {/* Symptom */}
                <motion.g style={reduce ? {} : { opacity: topOpacity, y: topY }}>
                  <rect x="60" y="20" width="200" height="48" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5" />
                  <text x="160" y="42" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Comprehension Inference
                  </text>
                  <text x="160" y="58" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    symptom · 41%
                  </text>
                </motion.g>

                {/* Edge 1 — motion.path swap */}
                <motion.path
                  d="M 160 68 L 160 108"
                  stroke="var(--border-dark)"
                  strokeWidth="1.5"
                  fill="none"
                  style={reduce ? { pathLength: 1 } : { pathLength: edge1 }}
                />

                {/* Linked weakness */}
                <motion.g style={reduce ? {} : { opacity: midOpacity, y: midY }}>
                  <rect x="60" y="108" width="200" height="48" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5" />
                  <text x="160" y="130" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Vocabulary in Context
                  </text>
                  <text x="160" y="146" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    linked · 55%
                  </text>
                </motion.g>

                {/* Edge 2 — motion.path swap */}
                <motion.path
                  d="M 160 156 L 160 196"
                  stroke="var(--border-dark)"
                  strokeWidth="1.5"
                  fill="none"
                  style={reduce ? { pathLength: 1 } : { pathLength: edge2 }}
                />

                {/* Root cause */}
                <motion.g style={reduce ? {} : { opacity: rootOpacity, y: rootY }}>
                  <motion.rect
                    x="50" y="196" width="220" height="60" rx="8"
                    fill="rgba(217, 119, 6, 0.10)"
                    stroke="var(--brand-amber)" strokeWidth={2}
                    animate={reduce ? {} : { strokeWidth: [2, 3, 2] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  />
                  <text x="160" y="222" textAnchor="middle" fontSize="14" fontWeight="700"
                    fill="var(--brand-amber)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Sight Vocabulary
                  </text>
                  <text x="160" y="240" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="var(--text-main)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    ROOT CAUSE
                  </text>
                </motion.g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
