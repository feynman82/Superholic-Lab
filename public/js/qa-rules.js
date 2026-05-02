/* ════════════════════════════════════════════════════════════════════════════
   js/qa-rules.js  —  v1.0  (Commit 4a)
   ----------------------------------------------------------------------------
   Client-side advisory rules for QA review. Pure functions. Each rule takes
   a question_bank row and returns null (clean) or { rule, severity, message }.
   No DB writes; this is a soft signal layered on top of manual review.

   Public API:
     window.qaRules.evaluateAll(question)  → Array<{rule, severity, message}>
     window.qaRules.RULES                  → metadata for filter pills
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── RULE METADATA (used by sidebar filter pills in 4b) ─────────────────
  var RULES = [
    { id: 'non_sg_name',                    label: 'Non-SG Name',            severity: 'warn'  },
    { id: 'maths_mcq_verbose_option',       label: 'Verbose MCQ Option',     severity: 'error' },
    { id: 'missing_distractor_explanation', label: 'Missing Wrong Expl',     severity: 'error' },
    { id: 'legacy_cloze_grammar',           label: 'Legacy Cloze sub_topic', severity: 'warn'  },
    { id: 'science_non_moe_term',           label: 'Non-MOE Science Term',   severity: 'warn'  },
    { id: 'missing_worked_solution',        label: 'Missing Solution',       severity: 'error' },
    { id: 'field_completeness',             label: 'Incomplete Fields',      severity: 'warn'  },
    { id: 'topic_not_in_canon',             label: 'Off-Canon Topic',        severity: 'warn'  },
  ];

  // ─── RULE 1: Non-Singapore names in question text ───────────────────────
  // SG context is a quality requirement. Surfaces common Western names that
  // suggest the question wasn't localised. Allowlist for Singaporean-common
  // Western names (Christine, Sarah, John etc are also common in SG) is
  // intentionally narrow — better to false-positive and let reviewer dismiss.
  var NON_SG_NAMES = [
    'Brittany', 'Cody', 'Dakota', 'Hunter', 'Mackenzie', 'Madison',
    'Tyler', 'Brandon', 'Trevor', 'Connor', 'Logan', 'Hayden',
    'Nezuko', 'Tanjiro', 'Naruto', 'Sasuke', 'Goku', 'Pikachu',
    'Sven', 'Lars', 'Pierre', 'Hans', 'Hiroshi'
  ];

  function ruleNonSGName(q) {
    var text = ((q.question_text || '') + ' ' + (q.passage || '')).toLowerCase();
    for (var i = 0; i < NON_SG_NAMES.length; i++) {
      var name = NON_SG_NAMES[i].toLowerCase();
      // Word-boundary match
      var re = new RegExp('\\b' + name + '\\b');
      if (re.test(text)) {
        return { rule: 'non_sg_name', severity: 'warn',
                 message: 'Found "' + NON_SG_NAMES[i] + '" — consider Singapore-context name.' };
      }
    }
    return null;
  }

  // ─── RULE 2: Verbose Maths MCQ options ──────────────────────────────────
  // House rule: Maths MCQ options must be short numerical/symbolic values,
  // never explanatory sentences. Threshold: any option > 25 chars.
  function ruleMathsMcqVerboseOption(q) {
    if (q.subject !== 'Mathematics' || q.type !== 'mcq') return null;
    var opts = q.options;
    if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch (e) { return null; } }
    if (!Array.isArray(opts)) return null;
    var bad = opts.filter(function (o) { return typeof o === 'string' && o.length > 25; });
    if (bad.length === 0) return null;
    return { rule: 'maths_mcq_verbose_option', severity: 'error',
             message: bad.length + ' option(s) exceed 25 chars — Maths MCQ options must be short values.' };
  }

  // ─── RULE 3: MCQ missing distractor explanations ────────────────────────
  // Every wrong option in MCQ must have a wrong_explanations entry.
  function ruleMissingDistractorExplanation(q) {
    if (q.type !== 'mcq') return null;
    var opts = q.options;
    if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch (e) { return null; } }
    if (!Array.isArray(opts)) return null;

    var we = q.wrong_explanations;
    if (typeof we === 'string') { try { we = JSON.parse(we); } catch (e) { we = {}; } }
    we = we || {};

    var correct = (q.correct_answer || '').trim();
    var wrong = opts.filter(function (o) { return String(o).trim() !== correct; });
    var missing = wrong.filter(function (o) { return !we[o] || !String(we[o]).trim(); });

    if (missing.length === 0) return null;
    return { rule: 'missing_distractor_explanation', severity: 'error',
             message: missing.length + ' distractor(s) lack a wrong_explanations entry.' };
  }

  // ─── RULE 4: Legacy English Cloze sub_topic ─────────────────────────────
  // Per April 2026 rename: Cloze sub_topics must be one of the 3 canonical
  // names. "Grammar" alone, or anything with "(PSLE Paper 2)", is legacy.
  var CLOZE_CANON = [
    'Grammar Cloze With Word Bank',
    'Vocabulary Cloze With Dropdowns',
    'Comprehension Free-Text Cloze'
  ];
  function ruleLegacyClozeGrammar(q) {
    if (q.subject !== 'English Language' || q.topic !== 'Cloze') return null;
    var st = q.sub_topic || '';
    if (CLOZE_CANON.indexOf(st) >= 0) return null;
    return { rule: 'legacy_cloze_grammar', severity: 'warn',
             message: 'sub_topic "' + st + '" is not canonical — must be one of the 3 named cloze types.' };
  }

  // ─── RULE 5: Non-MOE Science term ───────────────────────────────────────
  // Conservative term list — common terms that appear in pop-sci but are
  // NOT in MOE Primary Science syllabus. Reviewer dismisses if context is fine.
  var NON_MOE_SCIENCE = [
    'mitochondria', 'ribosome', 'chloroplast', 'cytoplasm',
    'photosynthesis equation', 'glucose c6h12o6',
    'newton third law', 'inertia',
    'dna', 'rna', 'gene', 'allele',
    'electromagnetic spectrum', 'frequency hertz'
  ];
  function ruleScienceNonMoeTerm(q) {
    if (q.subject !== 'Science') return null;
    var text = ((q.question_text || '') + ' ' + (q.worked_solution || '')).toLowerCase();
    for (var i = 0; i < NON_MOE_SCIENCE.length; i++) {
      if (text.indexOf(NON_MOE_SCIENCE[i]) >= 0) {
        return { rule: 'science_non_moe_term', severity: 'warn',
                 message: 'Term "' + NON_MOE_SCIENCE[i] + '" is outside MOE Primary Science syllabus.' };
      }
    }
    return null;
  }

  // ─── RULE 6: Missing worked solution ────────────────────────────────────
  // House rule. Applies to all types except open_ended (rubric-based).
  function ruleMissingWorkedSolution(q) {
    if (q.type === 'open_ended' || q.type === 'comprehension') return null;
    var ws = (q.worked_solution || '').trim();
    if (ws.length >= 20) return null;
    return { rule: 'missing_worked_solution', severity: 'error',
             message: 'Worked solution is missing or too short (< 20 chars).' };
  }

  // ─── RULE 7: Generic field completeness ─────────────────────────────────
  // Surfaces empty fields that should be populated for the row's type.
  function ruleFieldCompleteness(q) {
    var missing = [];
    if (!(q.question_text || '').trim()) missing.push('question_text');
    if (!(q.correct_answer || '').trim() && q.type !== 'open_ended') missing.push('correct_answer');
    if (!(q.topic || '').trim()) missing.push('topic');
    if (!(q.difficulty || '').trim()) missing.push('difficulty');
    if (!q.marks) missing.push('marks');
    if (q.type === 'mcq') {
      var opts = q.options;
      if (typeof opts === 'string') { try { opts = JSON.parse(opts); } catch (e) { opts = []; } }
      if (!Array.isArray(opts) || opts.length < 4) missing.push('options (need 4)');
    }
    if (missing.length === 0) return null;
    return { rule: 'field_completeness', severity: 'warn',
             message: 'Missing fields: ' + missing.join(', ') };
  }

  // ─── RULE 8: Topic not in syllabus canon ────────────────────────────────
  // Requires CANONICAL_SYLLABUS to be available on window.qaSyllabus
  // (loaded by qa-panel.js on startup). If not loaded yet, rule is silent.
  function ruleTopicNotInCanon(q) {
    var canon = window.qaSyllabus && window.qaSyllabus.canonical;
    if (!canon) return null;
    var subjKey = subjectToKey(q.subject);
    if (!subjKey || !canon[subjKey]) return null;
    var validTopics = Object.keys(canon[subjKey]);
    if (validTopics.indexOf(q.topic) < 0) {
      return { rule: 'topic_not_in_canon', severity: 'warn',
               message: 'Topic "' + q.topic + '" not in ' + q.subject + ' canon.' };
    }
    return null;
  }

  function subjectToKey(s) {
    if (!s) return null;
    var k = s.toLowerCase();
    if (k.indexOf('math') === 0) return 'mathematics';
    if (k.indexOf('sci')  === 0) return 'science';
    if (k.indexOf('eng')  === 0) return 'english';
    return null;
  }

  // ─── PUBLIC: evaluateAll ────────────────────────────────────────────────
  function evaluateAll(q) {
    if (!q) return [];
    var fns = [
      ruleNonSGName,
      ruleMathsMcqVerboseOption,
      ruleMissingDistractorExplanation,
      ruleLegacyClozeGrammar,
      ruleScienceNonMoeTerm,
      ruleMissingWorkedSolution,
      ruleFieldCompleteness,
      ruleTopicNotInCanon
    ];
    var hits = [];
    for (var i = 0; i < fns.length; i++) {
      try {
        var r = fns[i](q);
        if (r) hits.push(r);
      } catch (err) {
        console.error('[qa-rules] rule failed:', err);
      }
    }
    return hits;
  }

  window.qaRules = {
    RULES: RULES,
    evaluateAll: evaluateAll,
    subjectToKey: subjectToKey
  };
})();