import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const cases = [
  {
    title: '"All living things move"',
    wrong: "A plant is non-living because it doesn't move.",
    right: 'All living things have life processes. Plants grow and respond to stimuli — they are living.',
    explain: 'Movement is one response, not the definition of life. The 7 life processes (MRS GREN: Movement, Reproduction, Sensitivity, Growth, Respiration, Excretion, Nutrition) are the test.',
  },
  {
    title: '"Heavier objects fall faster"',
    wrong: 'A heavier ball falls faster than a lighter one.',
    right: 'In the absence of air resistance, all objects fall at the same rate due to gravity.',
    explain: "Mass doesn't affect free-fall acceleration. Air resistance is the only thing that makes lighter objects appear to fall slower in everyday life.",
  },
];

export default function MisconceptionsSci() {
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
