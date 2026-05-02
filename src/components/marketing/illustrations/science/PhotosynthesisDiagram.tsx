'use client';

import { motion, useReducedMotion } from 'framer-motion';

export default function PhotosynthesisDiagram() {
  const reduce = useReducedMotion();

  return (
    <svg viewBox="0 0 600 320" className="photo-diagram" role="img"
      aria-label="Animated diagram showing two plants — one in sunlight grows tall and green, one in darkness yellows and grows little.">
      {/* ─── LEFT: Plant in sun ─── */}
      <g>
        <motion.circle
          cx="80" cy="70" r="22"
          fill="var(--brand-amber)"
          initial={reduce ? {} : { scale: 0 }}
          animate={reduce ? {} : { scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ transformOrigin: '80px 70px' }}
        />
        {[0, 30, 60, 90, 120, 150, 180, -30, -60, -90, -120, -150].map((deg, i) => (
          <motion.line
            key={deg}
            x1="80" y1="70" x2="80" y2="40"
            stroke="var(--brand-amber)" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${deg} 80 70)`}
            initial={reduce ? {} : { opacity: 0 }}
            animate={reduce ? {} : { opacity: [0, 1, 0.6, 1, 0.6, 1] }}
            transition={{ duration: 8, repeat: Infinity, delay: 0.5 + i * 0.04, ease: 'easeInOut' }}
          />
        ))}

        <path d="M40 240 L120 240 L116 280 L44 280 Z"
          fill="var(--brand-rose)" opacity="0.4"
          stroke="var(--brand-rose)" strokeWidth="1.5" />
        <ellipse cx="80" cy="240" rx="40" ry="6" fill="#8B5A3C" opacity="0.6" />

        <motion.line
          x1="80" y1="240" x2="80" y2="240"
          stroke="var(--brand-mint)" strokeWidth="3" strokeLinecap="round"
          initial={reduce ? { y2: 130 } : { y2: 240 }}
          animate={reduce ? { y2: 130 } : { y2: 130 }}
          transition={{ duration: 4, delay: 1, ease: 'easeOut' }}
        />

        <motion.path
          d="M80 200 Q 60 195 55 205 Q 60 215 80 210"
          fill="rgba(5, 150, 105, 0.45)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 2.4 }}
          style={{ transformOrigin: '80px 205px' }}
        />
        <motion.path
          d="M80 175 Q 100 170 105 180 Q 100 190 80 185"
          fill="rgba(5, 150, 105, 0.45)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 3.4 }}
          style={{ transformOrigin: '80px 180px' }}
        />
        <motion.path
          d="M80 145 Q 60 140 55 150 Q 60 160 80 155"
          fill="rgba(5, 150, 105, 0.55)"
          stroke="var(--brand-mint)" strokeWidth="1.5"
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 4.4 }}
          style={{ transformOrigin: '80px 150px' }}
        />

        <line x1="140" y1="240" x2="140" y2="130" stroke="var(--text-muted)" strokeWidth="1" />
        {[0, 5, 10, 15, 20, 25].map((cm) => (
          <line key={cm} x1="138" y1={240 - cm * 4.4} x2="142" y2={240 - cm * 4.4}
            stroke="var(--text-muted)" strokeWidth="1" />
        ))}
        <motion.text
          x="148" y="135" fontSize="14" fontWeight="700"
          fill="var(--science-colour)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ delay: 5 }}
        >
          24 cm
        </motion.text>

        <text x="80" y="305" textAnchor="middle" fontSize="12" fontWeight="700"
          fill="var(--brand-sage)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
          PLANT A · IN SUNLIGHT
        </text>
      </g>

      <line x1="300" y1="40" x2="300" y2="290" stroke="var(--border-light)" strokeWidth="1" strokeDasharray="3 3" />

      {/* ─── RIGHT: Plant in dark ─── */}
      <g>
        <rect x="380" y="40" width="180" height="240" rx="4"
          fill="rgba(60, 60, 70, 0.85)" stroke="var(--text-main)" strokeWidth="1.5" />
        <text x="470" y="60" textAnchor="middle" fontSize="9" fontWeight="700"
          fill="var(--cream)" opacity="0.5" letterSpacing="0.1em">
          CUPBOARD (NO LIGHT)
        </text>

        <path d="M430 240 L510 240 L506 280 L434 280 Z"
          fill="var(--brand-rose)" opacity="0.4"
          stroke="var(--brand-rose)" strokeWidth="1.5" />
        <ellipse cx="470" cy="240" rx="40" ry="6" fill="#8B5A3C" opacity="0.6" />

        <motion.line
          x1="470" y1="240" x2="470" y2="240"
          stroke="var(--brand-mint)" strokeWidth="3" strokeLinecap="round"
          initial={reduce ? { y2: 200 } : { y2: 240 }}
          animate={reduce ? { y2: 200 } : { y2: 200 }}
          transition={{ duration: 4, delay: 1, ease: 'easeOut' }}
        />

        <motion.path
          d="M470 220 Q 450 215 448 222 Q 452 228 470 225"
          stroke="var(--brand-amber)" strokeWidth="1.5"
          initial={reduce ? { fill: 'rgba(217, 119, 6, 0.35)', opacity: 1 } : { fill: 'rgba(5, 150, 105, 0.35)', opacity: 0 }}
          animate={reduce ? {} : { fill: ['rgba(5, 150, 105, 0.35)', 'rgba(5, 150, 105, 0.35)', 'rgba(217, 119, 6, 0.35)'], opacity: [0, 1, 1] }}
          transition={{ duration: 3, delay: 3, ease: 'easeInOut', times: [0, 0.2, 1] }}
        />
        <motion.path
          d="M470 205 Q 490 200 492 207 Q 488 213 470 210"
          stroke="var(--brand-amber)" strokeWidth="1.5"
          initial={reduce ? { fill: 'rgba(217, 119, 6, 0.35)', opacity: 1 } : { fill: 'rgba(5, 150, 105, 0.35)', opacity: 0 }}
          animate={reduce ? {} : { fill: ['rgba(5, 150, 105, 0.35)', 'rgba(5, 150, 105, 0.35)', 'rgba(217, 119, 6, 0.35)'], opacity: [0, 1, 1] }}
          transition={{ duration: 3, delay: 4, ease: 'easeInOut', times: [0, 0.2, 1] }}
        />

        <line x1="530" y1="240" x2="530" y2="200" stroke="var(--cream)" strokeWidth="1" opacity="0.6" />
        {[0, 5, 10].map((cm) => (
          <line key={cm} x1="528" y1={240 - cm * 4} x2="532" y2={240 - cm * 4}
            stroke="var(--cream)" strokeWidth="1" opacity="0.6" />
        ))}
        <motion.text
          x="540" y="205" fontSize="14" fontWeight="700"
          fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={reduce ? {} : { opacity: 1 }}
          transition={{ delay: 5 }}
        >
          15 cm
        </motion.text>

        <text x="470" y="305" textAnchor="middle" fontSize="12" fontWeight="700"
          fill="var(--brand-rose)" fontFamily="var(--font-body, 'Plus Jakarta Sans')">
          PLANT B · IN DARKNESS
        </text>
      </g>
    </svg>
  );
}
