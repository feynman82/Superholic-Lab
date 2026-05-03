'use client';

import { useState } from 'react';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { compassValues } from './data/compassValues';

export default function CompassAbout() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const toggle = (i: number) => setExpandedIdx(expandedIdx === i ? null : i);

  return (
    <section className="section-pad bg-rose-tinted" data-section="compass">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="05">THE HONEST COMPASS</Eyebrow>
          <h2 className="h2-as">Six promises. Six constraints.</h2>
          <p className="body-md section-sub">
            Every product is built on assumptions that are rarely written down. Ours are written down. They constrain what we will ship and what we will refuse to ship.
          </p>
        </FadeUp>

        <div className="compass-grid">
          {compassValues.map((v, i) => (
            <FadeUp key={v.num} delay={i * 0.08}>
              <article
                className={`compass-card ${expandedIdx === i ? 'is-expanded' : ''}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(i);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={expandedIdx === i}
              >
                <div className="compass-card-num">§ {v.num}</div>
                <h3 className="compass-card-promise">{v.promise}</h3>
                <p className="compass-card-meaning">{v.meaning}</p>
                <div className="compass-card-footnote">
                  <span className="label-caps">Example</span>
                  <p>{v.example}</p>
                </div>
                <div className="compass-card-signature label-caps">— Superholic Lab, 2026</div>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
