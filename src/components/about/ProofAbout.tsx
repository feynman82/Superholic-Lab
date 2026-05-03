'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

export default function ProofAbout() {
  const reduce = useReducedMotion();

  return (
    <section className="section-pad" data-section="proof">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="06">BUILT IN SG</Eyebrow>
          <h2 className="h2-as">Built in Singapore, for Singapore.</h2>
          <p className="body-md section-sub">
            MOE-canon-aligned. PDPA-registered. Singapore servers. The platform speaks the syllabus your child&apos;s school speaks.
          </p>
        </FadeUp>

        <div className="proof-grid">
          {/* SG map — generated image with SVG overlays for the Superholic Lab pin */}
          <div className="proof-map">
            <svg viewBox="0 0 480 280" role="img" aria-label="Map of Singapore with Superholic Lab marked">
              {/* Generated map (3:2 source, slice-cropped to fit 480x280) */}
              <motion.image
                href="/assets/images/sg-map.png"
                x="0" y="0" width="480" height="280"
                preserveAspectRatio="xMidYMid slice"
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                whileInView={reduce ? {} : { opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 1.0, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* Pin dot */}
              <motion.circle
                cx="240" cy="180" r="4"
                fill="var(--brand-rose)"
                initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                whileInView={reduce ? {} : { opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 1.0 }}
              />
              {/* Pulse ring */}
              <motion.circle
                cx="240" cy="180" r="4"
                fill="none"
                stroke="var(--brand-rose)" strokeWidth="1"
                initial={reduce ? { opacity: 0 } : { opacity: 0.6, scale: 1 }}
                animate={reduce ? {} : { opacity: 0, scale: 4 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 1.4 }}
              />
              {/* SUPERHOLIC LAB · SG label — kept as SVG text for crisp scaling + a11y */}
              <motion.text
                x="240" y="142" fontSize="11" fontWeight="700"
                letterSpacing="0.1em" textAnchor="middle"
                fill="var(--brand-rose)"
                fontFamily="var(--font-body, 'Plus Jakarta Sans')"
                initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                whileInView={reduce ? {} : { opacity: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 1.2 }}
              >
                SUPERHOLIC LAB · SG
              </motion.text>
            </svg>
          </div>

          {/* Proof rows + stamp */}
          <div className="proof-info">
            <div className="proof-rows">
              <ProofRow label="Maths Syllabus" value="MOE 2021 — verified P1 to P6" />
              <ProofRow label="Science Syllabus" value="MOE 2023 — verified P3 to P6" />
              <ProofRow label="English Syllabus" value="MOE 2020 — verified P1 to P6" />
              <ProofRow label="Privacy" value="PDPA-registered" />
              <ProofRow label="Servers" value="Supabase · Singapore region" />
            </div>

            <motion.div
              className="proof-stamp"
              initial={reduce ? { opacity: 1, rotate: -4 } : { opacity: 0, rotate: -20, scale: 0.6 }}
              whileInView={reduce ? {} : { opacity: 1, rotate: -4, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: 1.4, type: 'spring', stiffness: 80 }}
              aria-hidden="true"
            >
              <div className="proof-stamp-inner">
                <div className="proof-stamp-text-top">BUILT IN SG</div>
                <div className="proof-stamp-divider">◆</div>
                <div className="proof-stamp-text-bot">2026</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="proof-row">
      <span className="label-caps">{label}</span>
      <span className="proof-row-value">{value}</span>
    </div>
  );
}
