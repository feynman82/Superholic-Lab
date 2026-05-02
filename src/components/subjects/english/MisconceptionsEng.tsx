import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';

const cases = [
  {
    title: 'Pronoun ambiguity in comprehension',
    wrong: "When asked who 'he' refers to, students name the most recently mentioned male character without checking context.",
    right: "Trace the pronoun back through the passage. The grammatical referent is whoever the sentence's logic points to — not just the last-named male.",
    explain: "Pronoun referent questions test logical tracking, not name recall. The Pronoun Referent Table format makes this discipline explicit.",
  },
  {
    title: 'Wrong tense in dialogue',
    wrong: "When the narrator speaks in past tense, students put the dialogue in past tense too: 'I am tired,' she said → wrongly written as 'I was tired,' she said.",
    right: "Direct speech keeps the speaker's original tense. The reporting verb (said) is past — but the words inside the quotes stay in their original form.",
    explain: "Tense agreement applies between subject and verb in one clause. Direct quotation preserves the speaker's tense regardless of the narrative tense around it.",
  },
];

export default function MisconceptionsEng() {
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
