'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';
import FadeUp from '@/components/marketing/motion/FadeUp';
import Eyebrow from '@/components/marketing/Eyebrow';
import Cat from '@/components/marketing/Cat';
import ThemeIconDiversity from '@/components/marketing/illustrations/science/ThemeIconDiversity';
import ThemeIconCycles from '@/components/marketing/illustrations/science/ThemeIconCycles';
import ThemeIconSystems from '@/components/marketing/illustrations/science/ThemeIconSystems';
import ThemeIconEnergy from '@/components/marketing/illustrations/science/ThemeIconEnergy';
import ThemeIconInteractions from '@/components/marketing/illustrations/science/ThemeIconInteractions';

interface Theme {
  icon: ReactNode;
  title: string;
  body: string;
  accent: string;
}

const themes: Theme[] = [
  {
    icon: <ThemeIconDiversity />,
    title: 'Diversity',
    body: 'Living and non-living things, classification, properties of materials. Builds the ability to observe and compare.',
    accent: 'var(--science-colour)',
  },
  {
    icon: <ThemeIconCycles />,
    title: 'Cycles',
    body: 'Life cycles of plants and animals, water cycle, states of matter. Patterns repeat — and reasoning about them does too.',
    accent: 'var(--brand-sage)',
  },
  {
    icon: <ThemeIconSystems />,
    title: 'Systems',
    body: "Plant systems, human digestive, respiratory, circulatory, electrical. Each part's function contributes to the whole.",
    accent: 'var(--brand-rose)',
  },
  {
    icon: <ThemeIconEnergy />,
    title: 'Energy',
    body: 'Light, heat, photosynthesis, energy conversion. The theme that shows up in almost every PSLE paper.',
    accent: 'var(--brand-amber)',
  },
  {
    icon: <ThemeIconInteractions />,
    title: 'Interactions',
    body: 'Forces, magnets, food chains, ecosystem balance. Cause and effect at every scale.',
    accent: 'var(--brand-mint)',
  },
];

export default function ThemesScience() {
  const reduce = useReducedMotion();

  return (
    <section className="section-pad themes-section" data-section="themes">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="01">THE FIVE THEMES</Eyebrow>
          <h2 className="h2-as">Five themes. Every topic belongs to one.</h2>
          <p className="body-md section-sub">
            Understanding the theme behind each topic helps children connect ideas across years. Examiners test connections, not isolated facts.
          </p>
        </FadeUp>

        {/* Top row: 2 cards */}
        <div className="theme-grid theme-grid--top">
          {themes.slice(0, 2).map((t, i) => (
            <FadeUp key={t.title} delay={i * 0.08}>
              <article className="card-glass theme-card">
                <div className="theme-icon" style={{ color: t.accent }}>{t.icon}</div>
                <h3 className="theme-title">{t.title}</h3>
                <p className="body-md">{t.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
        {/* Bottom row: 3 cards */}
        <div className="theme-grid theme-grid--bottom">
          {themes.slice(2).map((t, i) => (
            <FadeUp key={t.title} delay={(i + 2) * 0.08}>
              <article className="card-glass theme-card">
                <div className="theme-icon" style={{ color: t.accent }}>{t.icon}</div>
                <h3 className="theme-title">{t.title}</h3>
                <p className="body-md">{t.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* Wandering grey cat — section-level, not container-constrained, so the
          % motion uses full themes-section width. Hidden on tablet+mobile. */}
      {/* Cat wanders the right side of the themes section only. */}
      <motion.div
        className="themes-cat-wanderer"
        initial={reduce ? {} : { x: '65%', y: '20%' }}
        animate={
          reduce
            ? {}
            : {
                x: ['65%', '88%', '72%', '90%', '70%', '85%', '65%'],
                y: ['20%', '40%', '70%', '15%', '85%', '55%', '20%'],
                scaleX: [1, -1, 1, 1, -1, -1, 1],
              }
        }
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.18, 0.34, 0.5, 0.68, 0.85, 1],
        }}
        aria-hidden="true"
      >
        <Cat />
      </motion.div>
    </section>
  );
}
