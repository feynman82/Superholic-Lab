'use client';

import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

interface SpecGroup {
  category: string;
  items: string[];
}

const SHIPPING_GROUPS: SpecGroup[] = [
  {
    category: 'Diagnosis',
    items: [
      'BKT mastery scoring per topic and sub-topic',
      'Live AL band per subject',
      'AO1 / AO2 / AO3 cognitive-skill breakdown',
    ],
  },
  {
    category: 'Analysis',
    items: [
      'Topic dependency graph in dashboard',
      'Misconception-named explanations on every wrong answer',
    ],
  },
  {
    category: 'Practice',
    items: [
      'MOE-canon question bank · 3 subjects · daily additions',
      'Plan Quest UI',
    ],
  },
  {
    category: 'Tutor',
    items: [
      'Miss Wena cell-based scaffolds (English)',
      'Miss Wena CER coaching (Science)',
    ],
  },
  {
    category: 'Parents',
    items: ['Parent dashboard analytics'],
  },
  {
    category: 'Trust',
    items: [
      'PDPA-registered · Singapore servers',
      '7-day free trial · No card · Cancel anytime',
    ],
  },
];

export default function ShippingAbout() {
  return (
    <section className="section-pad" data-section="shipping">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="04">WHAT WE SHIP</Eyebrow>
          <h2 className="h2-as">What&apos;s shipping today.</h2>
          <p className="body-md section-sub">
            An honest list. No roadmap promises. No vapourware. Everything below is in production right now, used daily by families.
          </p>
        </FadeUp>

        <dl className="shipping-spec">
          {SHIPPING_GROUPS.map((group, gi) => (
            <FadeUp key={group.category} delay={gi * 0.06}>
              <div className="shipping-spec-group">
                <dt className="shipping-spec-category">{group.category}</dt>
                <dd className="shipping-spec-items">
                  {group.items.map((item) => (
                    <span key={item} className="shipping-spec-item">{item}</span>
                  ))}
                </dd>
              </div>
            </FadeUp>
          ))}
        </dl>
      </div>
    </section>
  );
}
