'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

const SECTIONS = [
  { id: 'hero',     label: '00' },
  { id: 'problem',  label: '01' },
  { id: 'method',   label: '02' },
  { id: 'engine',   label: '03' },
  { id: 'shipping', label: '04' },
  { id: 'compass',  label: '05' },
  { id: 'proof',    label: '06' },
  { id: 'closing',  label: '07' },
];

export default function ManifestoSpine() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const [activeIdx, setActiveIdx] = useState(0);

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    const handler = () => {
      let active = 0;
      for (let i = 0; i < SECTIONS.length; i++) {
        const el = document.querySelector(`[data-section="${SECTIONS[i].id}"]`);
        if (!el) continue;
        const rect = (el as HTMLElement).getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.4) {
          active = i;
        }
      }
      setActiveIdx(active);
    };
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <aside className="manifesto-spine" aria-hidden="true">
      <div className="spine-track" />
      <motion.div
        className="spine-fill"
        style={reduce ? { height: '100%' } : { height: lineHeight }}
      />
      <div className="spine-dots">
        {SECTIONS.map((s, i) => (
          <div
            key={s.id}
            className={`spine-dot ${i <= activeIdx ? 'is-active' : ''}`}
            style={{ top: `${(i / (SECTIONS.length - 1)) * 100}%` }}
          >
            <span className="spine-dot-marker" />
            <span className="spine-dot-label">{s.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
