'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

export default function PillarAnalyse() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.85', 'end 0.4'],
  });

  // Map scroll progress (0 → 1) to staged build:
  //   0.00 - 0.25 → top node fades in
  //   0.20 - 0.40 → top edge draws
  //   0.35 - 0.55 → middle node fades in
  //   0.50 - 0.70 → middle edge draws
  //   0.65 - 0.85 → root node fades in
  //   0.80 - 1.00 → pulse begins
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
        <div className="pillar-grid reverse">
          <div className="pillar-visual">
            <div className="card-glass dep-graph-wrap" data-pillar-viz="dependency-graph">
              <span className="label-caps dep-graph-title">Root-cause trace</span>
              <svg
                viewBox="0 0 320 260"
                className="dep-graph-svg"
                role="img"
                aria-label="Dependency graph showing ratio weakness traced to division"
              >
                {/* Top — symptom */}
                <motion.g style={reduce ? {} : { opacity: topOpacity, y: topY }}>
                  <rect
                    x="100" y="20" width="120" height="44" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5"
                  />
                  <text x="160" y="40" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Ratio
                  </text>
                  <text x="160" y="56" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    symptom · 41%
                  </text>
                </motion.g>

                {/* Edge 1 */}
                <motion.path
                  d="M 160 64 L 160 100"
                  stroke="var(--border-dark)"
                  strokeWidth="1.5"
                  fill="none"
                  style={reduce ? { pathLength: 1 } : { pathLength: edge1 }}
                />

                {/* Middle */}
                <motion.g style={reduce ? {} : { opacity: midOpacity, y: midY }}>
                  <rect
                    x="100" y="100" width="120" height="44" rx="8"
                    fill="rgba(183, 110, 121, 0.08)"
                    stroke="var(--brand-rose)" strokeWidth="1.5"
                  />
                  <text x="160" y="120" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Fractions
                  </text>
                  <text x="160" y="136" textAnchor="middle" fontSize="11"
                    fill="var(--text-muted)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    linked · 58%
                  </text>
                </motion.g>

                {/* Edge 2 */}
                <motion.path
                  d="M 160 144 L 160 180"
                  stroke="var(--border-dark)"
                  strokeWidth="1.5"
                  fill="none"
                  style={reduce ? { pathLength: 1 } : { pathLength: edge2 }}
                />

                {/* Root cause */}
                <motion.g style={reduce ? {} : { opacity: rootOpacity, y: rootY }}>
                  <motion.rect
                    x="90" y="180" width="140" height="56" rx="8"
                    fill="rgba(217, 119, 6, 0.10)"
                    stroke="var(--brand-amber)" strokeWidth={2}
                    animate={reduce ? {} : { strokeWidth: [2, 3, 2] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  />
                  <text x="160" y="206" textAnchor="middle" fontSize="14" fontWeight="700"
                    fill="var(--brand-amber)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    Division
                  </text>
                  <text x="160" y="224" textAnchor="middle" fontSize="11" fontWeight="600"
                    fill="var(--text-main)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
                    ROOT CAUSE
                  </text>
                </motion.g>
              </svg>
            </div>
          </div>

          <div className="pillar-text">
            <FadeUp>
              <Eyebrow num="03">02 · ANALYSE WEAKNESS</Eyebrow>
              <h2 className="h2-as">Find the upstream gap.</h2>
              <p className="body-lg">
                Ratio weakness usually traces to fractions. Fractions weakness traces to division. Superholic Lab maps the dependency chain and shows you the root cause, not just the symptom.
              </p>
              <ul className="rose-list pillar-bullets">
                <li>Topic dependency graph traces root cause</li>
                <li>AO1 / AO2 / AO3 cognitive-skill breakdown</li>
                <li>Misconception-specific wrong-answer explanations</li>
              </ul>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
