'use client';
import { motion, useReducedMotion } from 'framer-motion';

/** Sun with radiating rays. */
export default function ThemeIconEnergy() {
  const reduce = useReducedMotion();

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <motion.circle
        cx="24" cy="24" r="8" fill="currentColor"
        animate={reduce ? {} : { scale: [1, 1.1, 1] }}
        transition={reduce ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '24px 24px' }}
      />
      <motion.g
        animate={reduce ? {} : { rotate: 360 }}
        transition={reduce ? {} : { duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '24px 24px' }}
      >
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <line
            key={deg}
            x1="24" y1="6" x2="24" y2="12"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${deg} 24 24)`}
            opacity={i % 2 === 0 ? 1 : 0.5}
          />
        ))}
      </motion.g>
    </svg>
  );
}
