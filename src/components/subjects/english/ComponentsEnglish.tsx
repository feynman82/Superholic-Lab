'use client';

import { ReactNode } from 'react';
import FadeUp from '@/components/marketing/motion/FadeUp';
import Eyebrow from '@/components/marketing/Eyebrow';
import ComponentIconCloze from '@/components/marketing/illustrations/english/ComponentIconCloze';
import ComponentIconEditing from '@/components/marketing/illustrations/english/ComponentIconEditing';
import ComponentIconComprehension from '@/components/marketing/illustrations/english/ComponentIconComprehension';
import ComponentIconSynthesis from '@/components/marketing/illustrations/english/ComponentIconSynthesis';
import ComponentIconMcq from '@/components/marketing/illustrations/english/ComponentIconMcq';
import ComponentIconMcqVocab from '@/components/marketing/illustrations/english/ComponentIconMcqVocab';

interface Comp {
  icon: ReactNode;
  title: string;
  body: string;
  accent: string;
}

const components: Comp[] = [
  {
    icon: <ComponentIconCloze />,
    title: 'Cloze',
    body: 'Choose the right word for each blank. Tests grammar, vocabulary, and contextual reasoning.',
    accent: 'var(--english-colour)',
  },
  {
    icon: <ComponentIconEditing />,
    title: 'Editing',
    body: 'Spot the error. Provide the correction. The most trainable component — pure pattern recognition.',
    accent: 'var(--brand-rose)',
  },
  {
    icon: <ComponentIconComprehension />,
    title: 'Comprehension',
    body: 'Open-ended questions on a passage. Inference is where most marks are won and lost.',
    accent: 'var(--brand-mint)',
  },
  {
    icon: <ComponentIconSynthesis />,
    title: 'Synthesis',
    body: 'Combine two sentences into one. Conjunctions, relative clauses, conditional transformations.',
    accent: 'var(--brand-sage)',
  },
  {
    icon: <ComponentIconMcq />,
    title: 'MCQ Grammar',
    body: 'Tests tenses, agreement, prepositions, conjunctions. The fastest scoring on Paper 2.',
    accent: 'var(--brand-amber)',
  },
  {
    icon: <ComponentIconMcqVocab />,
    title: 'MCQ Vocab',
    body: 'Pick the right word from four options. Tests sight vocabulary, synonyms, and contextual fit.',
    accent: 'var(--english-colour)',
  },
];

export default function ComponentsEnglish() {
  return (
    <section className="section-pad" data-section="components">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="01">THE SIX COMPONENTS</Eyebrow>
          <h2 className="h2-as">Six components. Each tests something different.</h2>
          <p className="body-md section-sub">
            Most platforms drill &ldquo;comprehension and grammar.&rdquo; PSLE doesn&apos;t work that way. Each component has its own format, its own technique, and its own way to lose marks.
          </p>
        </FadeUp>

        <div className="component-grid">
          {[0, 3].map((rowStart) => (
            <div key={rowStart} className="component-row">
              {components.slice(rowStart, rowStart + 3).map((c, i) => (
                <FadeUp key={c.title} delay={(rowStart + i) * 0.06}>
                  <article className="card-glass component-card">
                    <div className="component-icon" style={{ color: c.accent }}>{c.icon}</div>
                    <h3 className="component-title">{c.title}</h3>
                    <p className="body-md">{c.body}</p>
                  </article>
                </FadeUp>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
