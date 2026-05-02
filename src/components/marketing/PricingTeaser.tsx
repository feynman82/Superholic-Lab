import FadeUp from './motion/FadeUp';

interface Props {
  subject: 'mathematics' | 'science' | 'english';
}

const plans = [
  {
    name: 'All Subjects',
    price: '12.99',
    period: '/month',
    children: '1 child',
    features: ['All 3 subjects', 'BKT diagnostic', 'Plan Quests', 'Miss Wena 24/7'],
    href: '/pages/pricing.html?plan=all_subjects',
    accent: 'rose',
    featured: false,
  },
  {
    name: 'Family Plan',
    price: '19.99',
    period: '/month',
    children: 'Up to 3 children',
    features: ['Everything in All Subjects', 'Up to 3 child profiles', 'Parent dashboard', 'Best value'],
    href: '/pages/pricing.html?plan=family',
    accent: 'sage',
    featured: true,
  },
];

export default function PricingTeaser({ subject }: Props) {
  return (
    <section className="section-pad" data-section="pricing">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <span className="label-caps eyebrow-marketing">
            <span className="eyebrow-num">§ 09</span> <span className="eyebrow-sep">—</span> SIMPLE PRICING
          </span>
          <h2 className="h2-as">Two plans. Seven-day free trial. No card required.</h2>
        </FadeUp>

        <div className="mini-plan-grid">
          {plans.map((p, i) => (
            <FadeUp key={p.name} delay={i * 0.08}>
              <article
                className={`mini-plan ${p.featured ? 'mini-plan--featured' : ''}`}
                data-accent={p.accent}
              >
                {p.featured && <span className="mini-plan-flag">Best value</span>}
                <h3 className="mini-plan-name">{p.name}</h3>
                <div className="mini-plan-price">
                  <span className="mini-plan-currency">S$</span>
                  <span className="mini-plan-amount">{p.price}</span>
                  <span className="mini-plan-period">{p.period}</span>
                </div>
                <p className="mini-plan-children">{p.children}</p>
                <ul className="mini-plan-features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a
                  href={p.href}
                  className={p.featured ? 'btn btn-primary' : 'btn btn-outlined'}
                  data-plausible-event={`pricing_teaser_${subject}_${p.accent}`}
                >
                  Start free trial
                </a>
              </article>
            </FadeUp>
          ))}
        </div>

        <p className="mini-plan-trust label-caps">
          PDPA REGISTERED · 7-DAY REFUND · CANCEL ANYTIME · SINGAPORE SERVERS
        </p>
      </div>
    </section>
  );
}
