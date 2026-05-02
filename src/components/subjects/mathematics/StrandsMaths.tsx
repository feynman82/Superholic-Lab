'use client';

import FadeUp from '@/components/marketing/motion/FadeUp';
import Eyebrow from '@/components/marketing/Eyebrow';
import Abacus from '@/components/marketing/illustrations/Abacus';
import RulerCircle from '@/components/marketing/illustrations/RulerCircle';
import BarChart from '@/components/marketing/illustrations/BarChart';

const strands = [
  {
    icon: <Abacus />,
    title: 'Number & Algebra',
    body: 'Whole numbers to algebra. The largest strand and most PSLE marks.',
    accent: 'var(--maths-colour)',
  },
  {
    icon: <RulerCircle />,
    title: 'Measurement & Geometry',
    body: 'Length, area, angles, circles. Spatial reasoning under exam pressure.',
    accent: 'var(--brand-rose)',
  },
  {
    icon: <BarChart />,
    title: 'Statistics',
    body: 'Picture graphs to pie charts. Data interpretation in every WA and PSLE paper.',
    accent: 'var(--brand-mint)',
  },
];

export default function StrandsMaths() {
  return (
    <section className="section-pad" data-section="strands">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="01">THE MOE FRAMEWORK</Eyebrow>
          <h2 className="h2-as">Three strands. Six years. One coherent system.</h2>
        </FadeUp>
        <div className="strand-grid">
          {strands.map((s, i) => (
            <FadeUp key={s.title} delay={i * 0.08}>
              <article className="card-glass strand-card">
                <div className="strand-icon" style={{ color: s.accent }}>{s.icon}</div>
                <h3 className="strand-title">{s.title}</h3>
                <p className="body-md">{s.body}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
