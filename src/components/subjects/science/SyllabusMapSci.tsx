'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { syllabusSci } from './data/syllabusSci';

export default function SyllabusMapSci() {
  const [activeIdx, setActiveIdx] = useState(2); // P5 default
  const [activeTopicIdx, setActiveTopicIdx] = useState(0);

  const handleTabChange = (i: number) => {
    setActiveIdx(i);
    setActiveTopicIdx(0); // reset to first topic of the new level
  };

  const activeLevel = syllabusSci[activeIdx];
  const activeTopic = activeLevel.topics[activeTopicIdx] ?? activeLevel.topics[0];
  const subTopicCount = activeLevel.topics.reduce((sum, t) => sum + t.subTopics.length, 0);

  return (
    <section id="syllabus" className="section-pad" data-section="syllabus">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="07">SYLLABUS MAP</Eyebrow>
          <h2 className="h2-as">What your child learns, year by year.</h2>
          <p className="body-md section-sub">
            Verified against the MOE 2023 Primary Science syllabus.
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

            {/* Master / detail layout */}
            <div className="syllabus-master-detail">
              {/* Master: topic list */}
              <ul className="syllabus-master" role="tablist" aria-label="Topics">
                {activeLevel.topics.map((t, i) => {
                  const isActive = i === activeTopicIdx;
                  return (
                    <li key={t.topic}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`syllabus-master-button ${isActive ? 'is-active' : ''}`}
                        onClick={() => setActiveTopicIdx(i)}
                        onMouseEnter={() => setActiveTopicIdx(i)}
                      >
                        <span className="syllabus-master-name">{t.topic}</span>
                        <span className="syllabus-master-count">{t.subTopics.length}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Detail: sub-topics for the active topic */}
              <div
                className="syllabus-detail"
                role="tabpanel"
                aria-label={`${activeTopic.topic} sub-topics`}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeLevel.level}-${activeTopic.topic}`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="syllabus-detail-title">{activeTopic.topic}</h4>
                    <span className="syllabus-detail-meta label-caps">
                      {activeTopic.subTopics.length} sub-topic{activeTopic.subTopics.length === 1 ? '' : 's'}
                    </span>
                    <div className="syllabus-detail-grid">
                      {activeTopic.subTopics.map((s, i) => (
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
                </AnimatePresence>
              </div>
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
