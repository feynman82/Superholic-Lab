'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { syllabusSci } from './data/syllabusSci';

export default function SyllabusMapSci() {
  const [activeIdx, setActiveIdx] = useState(2); // P5 default
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  const handleTabChange = (i: number) => {
    setActiveIdx(i);
    setOpenTopic(null);
  };

  const activeLevel = syllabusSci[activeIdx];
  const subTopicCount = activeLevel.topics.reduce((sum, t) => sum + t.subTopics.length, 0);

  return (
    <section id="syllabus" className="section-pad" data-section="syllabus">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="07">SYLLABUS MAP</Eyebrow>
          <h2 className="h2-as">What your child learns, year by year.</h2>
          <p className="body-md section-sub">
            Verified against the MOE 2023 Primary Science syllabus. Tap a topic to see all sub-topics covered.
          </p>
        </FadeUp>

        <div className="level-tabs-as level-tabs-as--science" role="tablist" aria-label="Primary level">
          {syllabusSci.map((lvl, i) => (
            <button
              key={lvl.level}
              type="button"
              role="tab"
              aria-selected={activeIdx === i}
              className={`level-tab-as ${activeIdx === i ? 'is-active' : ''}`}
              onClick={() => handleTabChange(i)}
            >
              {lvl.level}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeLevel.level}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card-glass syllabus-panel"
          >
            <div className="syllabus-panel-head">
              <h3 className="syllabus-level-title">{activeLevel.level}</h3>
              <span className="badge-rose">{activeLevel.badge}</span>
            </div>
            <p className="body-md syllabus-callout">{activeLevel.callout}</p>

            <div className="syllabus-topic-list">
              {activeLevel.topics.map((t) => {
                const isOpen = openTopic === t.topic;
                return (
                  <div key={t.topic} className={`syllabus-topic ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="syllabus-topic-header"
                      onClick={() => setOpenTopic(isOpen ? null : t.topic)}
                      aria-expanded={isOpen}
                      aria-controls={`subs-${t.topic}`}
                    >
                      <span className="syllabus-topic-name">{t.topic}</span>
                      <span className="syllabus-topic-count">
                        {t.subTopics.length} sub-topic{t.subTopics.length === 1 ? '' : 's'}
                      </span>
                      <svg
                        className={`syllabus-topic-chevron ${isOpen ? 'is-open' : ''}`}
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`subs-${t.topic}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                          className="syllabus-subtopic-wrap"
                        >
                          <div className="syllabus-subtopic-grid">
                            {t.subTopics.map((s, i) => (
                              <motion.span
                                key={s}
                                className="syllabus-subtopic-chip"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.025 }}
                              >
                                {s}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <p className="syllabus-count label-caps">
              {activeLevel.topics.length} topics · {subTopicCount} sub-topics in {activeLevel.level}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
