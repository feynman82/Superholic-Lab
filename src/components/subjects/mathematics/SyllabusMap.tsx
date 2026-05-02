'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Eyebrow from '@/components/marketing/Eyebrow';
import FadeUp from '@/components/marketing/motion/FadeUp';
import { syllabus } from './data/syllabus';

export default function SyllabusMap() {
  const [activeIdx, setActiveIdx] = useState(3); // P4 default

  return (
    <section id="syllabus" className="section-pad" data-section="syllabus">
      <div className="container-as">
        <FadeUp className="section-head section-head--centered">
          <Eyebrow num="07">SYLLABUS MAP</Eyebrow>
          <h2 className="h2-as">What your child learns, year by year.</h2>
          <p className="body-md section-sub">
            Verified against the MOE 2021 Mathematics syllabus, updated October 2025.
          </p>
        </FadeUp>

        <div className="level-tabs-as" role="tablist" aria-label="Primary level">
          {syllabus.map((lvl, i) => (
            <button
              key={lvl.level}
              type="button"
              role="tab"
              aria-selected={activeIdx === i}
              className={`level-tab-as ${activeIdx === i ? 'is-active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              {lvl.level}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={syllabus[activeIdx].level}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="card-glass syllabus-panel"
          >
            <div className="syllabus-panel-head">
              <h3 className="syllabus-level-title">{syllabus[activeIdx].level}</h3>
              <span className="badge-rose">{syllabus[activeIdx].badge}</span>
            </div>
            <p className="body-md syllabus-callout">{syllabus[activeIdx].callout}</p>
            <div className="topic-grid-as">
              {syllabus[activeIdx].topics.map((label, i) => (
                <motion.span
                  key={label}
                  className="topic-chip-as topic-chip-as--rose"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.025 }}
                >
                  {label}
                </motion.span>
              ))}
            </div>
            <p className="syllabus-count label-caps">
              {syllabus[activeIdx].topics.length} topics in {syllabus[activeIdx].level}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
