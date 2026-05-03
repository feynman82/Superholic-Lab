'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import SubjectRule from '@/components/marketing/SubjectRule';

const HERO_IMAGES = [
  { src: '/assets/images/about-hero-desk-1.png', alt: 'Drafting table — morning light' },
  { src: '/assets/images/about-hero-desk-2.png', alt: 'Drafting table — midday' },
  { src: '/assets/images/about-hero-desk-3.png', alt: 'Drafting table — dusk' },
];

const STATIC_FALLBACK = {
  src: '/assets/images/about-hero-desk.png',
  alt: 'A teacher’s drafting table with a paper showing a hand-drawn bar model, a small notebook with handwritten notes asking "but why?", a coffee cup, and pencils — set in a Singapore home study.',
};

const CYCLE_MS = 6000;

export default function HeroAbout() {
  const reduce = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const interval = setInterval(() => {
      setActiveIdx((i) => (i + 1) % HERO_IMAGES.length);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, [reduce]);

  return (
    <section className="hero-as hero-about grid-texture-lg" data-section="hero">
      <div className="container-as">
        <div className="hero-about-grid">
          {/* Left: text */}
          <div className="hero-about-text">
            <Eyebrow num="00">ABOUT · SUPERHOLIC LAB</Eyebrow>
            <SubjectRule color="var(--brand-rose)" />

            <h1 className="h1-as hero-headline">
              <motion.span
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block' }}
              >
                Built solo. Built honestly.
              </motion.span>
              <motion.em
                initial={reduce ? {} : { opacity: 0, y: 12 }}
                animate={reduce ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ display: 'block', color: 'var(--brand-rose)', fontStyle: 'normal' }}
              >
                Built for parents like you.
              </motion.em>
            </h1>

            <motion.p
              className="body-lg hero-lede"
              initial={reduce ? {} : { opacity: 0, y: 8 }}
              animate={reduce ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Superholic Lab is a small Singapore team, an MOE-aligned database, and an AI that refuses to give your child the answer. There is no faceless corporation — just educators tired of assessment books that don&apos;t explain why.
            </motion.p>
          </div>

          {/* Right: crossfading hero scene */}
          <div className="hero-about-scene">
            {reduce ? (
              // Reduced-motion: single static image, no animation.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={STATIC_FALLBACK.src}
                alt={STATIC_FALLBACK.alt}
                className="hero-about-img hero-about-img--static"
                loading="eager"
              />
            ) : (
              HERO_IMAGES.map((img, i) => (
                <motion.img
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  className="hero-about-img"
                  loading="eager"
                  initial={{ opacity: 0, scale: 1.0 }}
                  animate={{
                    opacity: activeIdx === i ? 1 : 0,
                    // Ken Burns: slow zoom while active, reset while hidden.
                    scale: activeIdx === i ? 1.04 : 1.0,
                  }}
                  transition={{
                    opacity: { duration: 1.4, ease: 'easeInOut' },
                    scale: { duration: CYCLE_MS / 1000, ease: 'linear' },
                  }}
                />
              ))
            )}
            <p className="hero-scene-caption">
              <em>This is the desk where your child&apos;s confusion gets solved.</em>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
