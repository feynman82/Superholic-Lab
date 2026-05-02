'use client';

import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { englishTopics } from './data/syllabusEng';

export default function SyllabusMapEng() {
  const totalSubFormats = englishTopics.reduce((sum, t) => sum + t.subTopics.length, 0);

  return (
    <section id="syllabus" className="section-pad" data-section="syllabus">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="07">SYLLABUS MAP</Eyebrow>
          <h2 className="h2-as">What your child learns, P1 to PSLE.</h2>
          <p className="body-md section-sub">
            Verified against the MOE 2020 English syllabus. Six topics, five sub-formats.
          </p>
        </FadeUp>

        <div className="card-glass eng-syllabus-list">
          {englishTopics.map((t, i) => (
            <FadeUp key={t.topic} delay={i * 0.05}>
              <article className={`eng-syllabus-row ${t.subTopics.length > 0 ? 'has-formats' : ''}`}>
                <div className="eng-syllabus-row-head">
                  <h3 className="eng-syllabus-topic">{t.topic}</h3>
                  <span className="eng-syllabus-intro label-caps">{t.intro}</span>
                </div>
                {t.subTopics.length > 0 && (
                  <div className="eng-syllabus-formats">
                    {t.subTopics.map((s) => (
                      <span key={s} className="eng-syllabus-chip">{s}</span>
                    ))}
                  </div>
                )}
              </article>
            </FadeUp>
          ))}
        </div>

        <p className="syllabus-count label-caps">
          {englishTopics.length} topics · {totalSubFormats} sub-formats
        </p>
      </div>
    </section>
  );
}
