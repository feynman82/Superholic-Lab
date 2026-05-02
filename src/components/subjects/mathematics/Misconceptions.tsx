import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const cases = [
  {
    title: 'Fraction addition error',
    wrong: '⅓ + ¼ = 2⁄7',
    right: '⅓ + ¼ = 4⁄12 + 3⁄12 = 7⁄12',
    explain: 'The denominator tells you what type of fraction you have. You cannot add different types without converting first.',
  },
  {
    title: 'Percentage reversal',
    wrong: '$80 after 20% off → original = $80 × 1.2 = $96',
    right: '$80 = 80% of original → 100% = $80 ÷ 0.8 = $100',
    explain: 'The $80 represents 80% of the original price, not 120%. Reversing the discount means dividing, not multiplying.',
  },
];

export default function Misconceptions() {
  return (
    <section className="section-pad" data-section="misconceptions">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="08">MARK LOSS</Eyebrow>
          <h2 className="h2-as">Two errors. Thousands of lost marks.</h2>
          <p className="body-md section-sub">Every wrong-answer explanation in our bank names the exact misconception.</p>
        </FadeUp>
        <div className="misconception-grid">
          {cases.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.1}>
              <article className="card-glass misconception-card">
                <h3 className="misconception-title">{c.title}</h3>
                <div className="misconception-row misconception-row--wrong">
                  <span className="label-caps">Common error</span>
                  <p>{c.wrong}</p>
                </div>
                <div className="misconception-row misconception-row--right">
                  <span className="label-caps">What examiners want</span>
                  <p>{c.right}</p>
                </div>
                <p className="misconception-explain body-md">{c.explain}</p>
              </article>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
