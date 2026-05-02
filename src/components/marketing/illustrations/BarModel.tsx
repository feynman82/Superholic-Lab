'use client';

import { motion, useReducedMotion } from 'framer-motion';
import DrawPath from '@/components/marketing/motion/DrawPath';

export default function BarModel() {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 360 280"
      className="hero-illustration"
      role="img"
      aria-label="Bar model illustration showing two parts that compare to make a whole"
    >
      {/* Drafting grid backdrop */}
      <g opacity="0.18">
        {[...Array(8)].map((_, i) => (
          <line key={`v${i}`} x1={i * 48} y1="0" x2={i * 48} y2="280" stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
        {[...Array(7)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 48} x2="360" y2={i * 48} stroke="var(--brand-sage)" strokeWidth="0.5" />
        ))}
      </g>

      {/* Whole bar (top) */}
      <DrawPath
        d="M30 60 L330 60 L330 100 L30 100 Z"
        stroke="var(--maths-colour)"
        strokeWidth="2"
        fill="rgba(59, 130, 246, 0.06)"
        duration={1.2}
        delay={0.2}
      />
      <motion.text
        x="180"
        y="84"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        fontSize="14"
        fontWeight="600"
        fill="var(--maths-colour)"
        textAnchor="middle"
        initial={reduce ? {} : { opacity: 0 }}
        animate={reduce ? {} : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
      >
        300
      </motion.text>

      {/* Brace */}
      <motion.path
        d="M30 110 Q30 116 36 116 L176 116 Q180 116 180 122 Q180 116 184 116 L324 116 Q330 116 330 110"
        stroke="var(--brand-sage)"
        strokeWidth="1"
        fill="none"
        initial={reduce ? {} : { opacity: 0 }}
        animate={reduce ? {} : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.4 }}
      />

      {/* Two parts (bottom) */}
      <DrawPath
        d="M30 150 L150 150 L150 200 L30 200 Z"
        stroke="var(--brand-rose)"
        strokeWidth="2"
        fill="rgba(183, 110, 121, 0.08)"
        duration={1}
        delay={1.6}
      />
      <DrawPath
        d="M165 150 L330 150 L330 200 L165 200 Z"
        stroke="var(--brand-mint)"
        strokeWidth="2"
        fill="rgba(5, 150, 105, 0.06)"
        duration={1}
        delay={1.8}
      />

      <motion.text
        x="90"
        y="180"
        fontSize="13"
        fontWeight="600"
        fill="var(--brand-rose)"
        textAnchor="middle"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={reduce ? {} : { opacity: 0 }}
        animate={reduce ? {} : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.4 }}
      >
        2 parts
      </motion.text>
      <motion.text
        x="247"
        y="180"
        fontSize="13"
        fontWeight="600"
        fill="var(--brand-mint)"
        textAnchor="middle"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        initial={reduce ? {} : { opacity: 0 }}
        animate={reduce ? {} : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 2.4 }}
      >
        3 parts
      </motion.text>

      {/* Annotation arrow */}
      <motion.path
        d="M40 240 Q90 230 130 232"
        stroke="var(--brand-rose)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="3 3"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 2.6 }}
      />
      <motion.text
        x="160"
        y="238"
        fontSize="11"
        fill="var(--text-muted)"
        fontFamily="var(--font-body, 'Plus Jakarta Sans')"
        fontStyle="italic"
        initial={reduce ? {} : { opacity: 0 }}
        animate={reduce ? {} : { opacity: 1 }}
        transition={{ duration: 0.4, delay: 3.0 }}
      >
        ratio 2 : 3
      </motion.text>
    </svg>
  );
}
