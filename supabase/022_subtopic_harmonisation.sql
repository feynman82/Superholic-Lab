-- ============================================================
-- 022_subtopic_harmonisation.sql
-- Maps ~280 fragmented question_bank.sub_topic values to the canonical
-- list in canon_sub_topics, then enables the deferred FK constraint.
--
-- Strategy:
--   1. Build a temporary alias table (subject, topic, alias, canonical)
--   2. UPDATE question_bank rows where alias matches
--   3. Catch-all UPDATE: any remaining off-canon sub_topic → NULL
--   4. Add fk_question_bank_sub_topic FK constraint
--
-- Notes:
--   - canonical = NULL in the alias table means "set sub_topic to NULL".
--   - FK uses MATCH SIMPLE (default), so NULL sub_topic is allowed.
--     The (subject, topic) FK from migration 021 still enforces validity.
-- ============================================================

CREATE TEMPORARY TABLE temp_subtopic_alias (
  subject   text NOT NULL,
  topic     text NOT NULL,
  alias     text NOT NULL,
  canonical text,
  PRIMARY KEY (subject, topic, alias)
);

INSERT INTO temp_subtopic_alias (subject, topic, alias, canonical) VALUES
  -- ─── English / Cloze ─────────────────────────────────────────────
  ('English', 'Cloze', 'Comprehension',                 'Comprehension Free-Text Cloze'),
  ('English', 'Cloze', 'Grammar',                       'Grammar Cloze With Word Bank'),
  ('English', 'Cloze', 'Vocabulary',                    'Vocabulary Cloze With Dropdowns'),

  -- ─── English / Comprehension ─────────────────────────────────────
  ('English', 'Comprehension', 'Direct Retrieval',      'Direct Visual Retrieval'),
  ('English', 'Comprehension', 'Inference',             'Deep Inference And Claim Evidence Reasoning'),

  -- ─── English / Grammar — Tenses cluster ──────────────────────────
  ('English', 'Grammar', 'Past Tense',                  'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Simple Past Tense',           'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Present Continuous Tense',    'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Tenses',                      'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Verb Tenses',                 'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Tenses & Moods',              'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Mood',                        'Simple Present And Past Tenses'),
  ('English', 'Grammar', 'Perfect Tense',               'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Perfect Tenses',              'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Present Perfect Tense',       'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Conditional Sentences',       'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Conditionals',                'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Conditionals (Inversion)',    'Perfect And Continuous Tenses'),
  ('English', 'Grammar', 'Subjunctive Mood',            'Perfect And Continuous Tenses'),

  -- ─── English / Grammar — SVA cluster ─────────────────────────────
  ('English', 'Grammar', 'Quantifiers',                 'Subject-Verb Agreement'),
  ('English', 'Grammar', 'Quantifiers and SVA',         'Subject-Verb Agreement'),
  ('English', 'Grammar', 'Proximity Rule',              'Subject-Verb Agreement'),

  -- ─── English / Grammar — Nouns cluster ───────────────────────────
  ('English', 'Grammar', 'Plural Nouns',                'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Plurals',                     'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Singular and Plural Nouns',   'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Singular/Plural Nouns',       'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Irregular Plurals',           'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Nouns',                       'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Nouns (Plural)',              'Singular And Plural Nouns'),
  ('English', 'Grammar', 'Countable and Uncountable Nouns', 'Singular And Plural Nouns'),

  -- ─── English / Grammar — Prepositions / Phrasal cluster ──────────
  ('English', 'Grammar', 'Prepositions',                'Prepositions And Phrasal Verbs'),
  ('English', 'Grammar', 'Prepositions (Position)',     'Prepositions And Phrasal Verbs'),
  ('English', 'Grammar', 'Prepositions of Place',       'Prepositions And Phrasal Verbs'),
  ('English', 'Grammar', 'Prepositions of Time',        'Prepositions And Phrasal Verbs'),
  ('English', 'Grammar', 'Phrasal Verbs',               'Prepositions And Phrasal Verbs'),

  -- ─── English / Grammar — Conjunctions cluster ────────────────────
  ('English', 'Grammar', 'Connectors',                  'Conjunctions'),
  ('English', 'Grammar', 'Connectors of Contrast',      'Conjunctions'),

  -- ─── English / Grammar — Voice / Inversion cluster ───────────────
  ('English', 'Grammar', 'Active-Passive Voice',        'Active And Passive Voice'),
  ('English', 'Grammar', 'Inversion',                   'Active And Passive Voice'),

  -- ─── English / Grammar — Pronouns cluster ────────────────────────
  ('English', 'Grammar', 'Pronouns',                    'Relative Pronouns'),
  ('English', 'Grammar', 'Personal Pronouns',           'Relative Pronouns'),
  ('English', 'Grammar', 'Possessive Pronouns',         'Relative Pronouns'),
  ('English', 'Grammar', 'Subject Pronouns',            'Relative Pronouns'),

  -- ─── English / Grammar — no-fit (set NULL) ───────────────────────
  ('English', 'Grammar', 'Adjectives',                  NULL),
  ('English', 'Grammar', 'Adjectives (Comparison)',     NULL),
  ('English', 'Grammar', 'Adverbs',                     NULL),
  ('English', 'Grammar', 'Adverbs of Manner',           NULL),
  ('English', 'Grammar', 'Articles',                    NULL),
  ('English', 'Grammar', 'Comparatives',                NULL),
  ('English', 'Grammar', 'Modal Verbs',                 NULL),
  ('English', 'Grammar', 'Modals',                      NULL),
  ('English', 'Grammar', 'Participle Phrases',          NULL),
  ('English', 'Grammar', 'Question Tags',               NULL),
  ('English', 'Grammar', 'Relative Clauses',            NULL),
  ('English', 'Grammar', 'Reported Speech',             NULL),
  ('English', 'Grammar', 'Synthesis',                   NULL),

  -- ─── English / Synthesis ─────────────────────────────────────────
  ('English', 'Synthesis', 'Active & Passive Voice',    'Active To Passive Voice Transformation'),
  ('English', 'Synthesis', 'Connectors',                'Combining With Conjunctions'),
  ('English', 'Synthesis', 'Adverbs',                   NULL),
  ('English', 'Synthesis', 'Preference',                NULL),

  -- ─── English / Vocabulary — Contextual cluster ───────────────────
  ('English', 'Vocabulary', 'Contextual',               'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Choice',        'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Clues',         'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Meaning',       'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Nuance',        'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Vocabulary',    'Contextual Vocabulary Meaning'),
  ('English', 'Vocabulary', 'Contextual Word Choice',   'Contextual Vocabulary Meaning'),

  -- ─── English / Vocabulary — Synonyms cluster ─────────────────────
  ('English', 'Vocabulary', 'Synonyms',                 'Synonyms And Antonyms'),
  ('English', 'Vocabulary', 'Nuanced Synonyms',         'Synonyms And Antonyms'),

  -- ─── English / Vocabulary — Thematic catch-all ───────────────────
  ('English', 'Vocabulary', 'Abstract Nouns',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Action Verbs',             'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Actions',                  'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Actions at Home',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives',               'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives (Character)',   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives (Feelings)',    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives (Nuance)',      'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives of Character',  'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adjectives of Feeling',    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Advanced Verbs',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adverbs',                  'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Adverbs of Manner',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animal Actions',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animal Groups',            'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animal Habitats',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animal Movements',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animal Sounds',            'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Animals',                  'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'At the Zoo',               'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Character Traits',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Classroom Objects',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Collective Nouns',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Collocations',             'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Common Animals',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Common Feelings',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Common Nouns',             'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Community',                'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Community Places',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Daily Actions',            'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Daily Routines',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Describing Feelings',      'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Describing Objects',       'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Descriptive Adjectives',   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Emotional States',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Emotions',                 'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Environment',              'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Family',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Family Members',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Family/Relationships',     'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Feelings',                 'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Feelings and Emotions',    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Idiomatic Expressions',    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Idioms',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Idioms (Simple)',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Idioms & Phrasal Verbs',   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Idioms and Phrases',       'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Jobs',                     'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Jobs and People',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Kitchen/Household',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Movement Verbs',           'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Nature',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Nature/Environment',       'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Nouns',                    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Nuance',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Occupations',              'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Occupations/Tools',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'People and Places',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Phrasal Verbs',            'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Places',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Places in School',         'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Precise Adjectives',       'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Precise Word Choice',      'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Precision',                'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Precision Verbs',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'School',                   'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'School Life',              'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Thematic (Animals)',       'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Thematic (Family)',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Thematic Vocabulary',      'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Verbs',                    'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Verbs (Collocations)',     'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Verbs at the Park',        'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Verbs of Action',          'Thematic Vocabulary Recall'),
  ('English', 'Vocabulary', 'Verbs of Movement',        'Thematic Vocabulary Recall'),

  -- ─── Science / Cells ─────────────────────────────────────────────
  ('Science', 'Cells', 'Cell Comparison',               'Plant And Animal Cells'),
  ('Science', 'Cells', 'Cell Parts',                    'Parts Of A Cell And Their Functions'),
  ('Science', 'Cells', 'Cell Parts and Functions',      'Parts Of A Cell And Their Functions'),
  ('Science', 'Cells', 'Cell Structures',               'Parts Of A Cell And Their Functions'),
  ('Science', 'Cells', 'Cell structures in plant and animal cells', 'Plant And Animal Cells'),

  -- ─── Science / Cycles — life cycles cluster ──────────────────────
  ('Science', 'Cycles', 'Life Cycles of Fungi',         'Life Cycles Of Fungi'),
  ('Science', 'Cycles', 'Life Cycles of Plants',        'Life Cycles Of Flowering Plants'),
  ('Science', 'Cycles', 'Plant Life Cycle',             'Life Cycles Of Flowering Plants'),
  ('Science', 'Cycles', 'Life Cycles',                  NULL),
  ('Science', 'Cycles', 'Life Cycles of Animals',       NULL),
  ('Science', 'Cycles', 'Cycles in Animals',            NULL),
  ('Science', 'Cycles', 'Animals',                      NULL),

  -- ─── Science / Cycles — reproduction cluster ─────────────────────
  ('Science', 'Cycles', 'Animal Reproduction',          'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Plant Reproduction',           'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Reproduction',                 'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Reproduction in Humans',       'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Reproduction in Plants',       'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Human Reproduction',           'Reproduction In Plants And Animals'),
  ('Science', 'Cycles', 'Human Reproductive System',    'Reproduction In Plants And Animals'),

  -- ─── Science / Cycles — water cycle cluster ──────────────────────
  ('Science', 'Cycles', 'Stages of the water cycle',    'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'States of Water',              'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'The Water Cycle',              'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'Water',                        'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'Water and Changes of State',   'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'Water Cycle',                  'Stages Of The Water Cycle'),
  ('Science', 'Cycles', 'Matter',                       'Stages Of The Water Cycle'),

  -- ─── Science / Diversity — materials cluster ─────────────────────
  ('Science', 'Diversity', 'Materials',                 'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Properties',       'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Absorbency',       'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Flexibility',      'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Magnetism',        'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Selection',        'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Strength',         'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Testing',          'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Material Transparency',     'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Selection of Materials',    'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Suitability of Materials',  'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Strength',                  'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Flexibility',               'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Transparency',              'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Waterproof Property',       'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Exploring Materials',       'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Fishtank Material',         'Diversity Of Materials And Their Properties'),
  ('Science', 'Diversity', 'Absorption',                'Diversity Of Materials And Their Properties'),

  -- ─── Science / Diversity — living/non-living cluster ─────────────
  ('Science', 'Diversity', 'Living and Non-living things', 'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Living and Non-living Things', 'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Living and Non-Living Things', 'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Living Things',             'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Characteristics of Living Things', 'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Classification',            'Classification Of Living And Non-Living Things'),

  -- ─── Science / Diversity — animal cluster ────────────────────────
  ('Science', 'Diversity', 'Animals',                   'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Animal Characteristics',    'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Animal Classification',     'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Animal Groups',             'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Animal Parts',              'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Bird Characteristics',      'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Birds',                     'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Body Covering',             'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Body Coverings',            'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Insect Characteristics',    'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Insect Traits',             'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Insects',                   'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Mammals',                   'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Reptiles vs Amphibians',    'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Reptiles vs Fish',          'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Amphibians',                'Classification Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Plants',                    'Classification Of Living And Non-Living Things'),

  -- ─── Science / Diversity — fungi/bacteria + misc ─────────────────
  ('Science', 'Diversity', 'Bacteria',                  'General Characteristics Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Fungi',                     'General Characteristics Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Fungi and Bacteria',        'General Characteristics Of Living And Non-Living Things'),
  ('Science', 'Diversity', 'Matter',                    NULL),
  ('Science', 'Diversity', 'Experimental Fairness',     NULL),

  -- ─── Science / Energy — light cluster ────────────────────────────
  ('Science', 'Energy', 'Light',                        'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Path of Light)',        'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Reflection)',           'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Shadows)',              'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Sources)',              'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Transparency)',         'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light (Visibility)',           'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light and Shadow',             'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light and Shadows',            'Light Energy Forms And Uses'),
  ('Science', 'Energy', 'Light Energy',                 'Light Energy Forms And Uses'),

  -- ─── Science / Energy — heat cluster ─────────────────────────────
  ('Science', 'Energy', 'Heat',                         'Heat Energy Forms And Uses'),
  ('Science', 'Energy', 'Heat and Temperature',         'Heat Energy Forms And Uses'),
  ('Science', 'Energy', 'Heat Energy',                  'Heat Energy Forms And Uses'),
  ('Science', 'Energy', 'Effects of Heat',              'Heat Energy Forms And Uses'),

  -- ─── Science / Energy — photosynthesis cluster ───────────────────
  ('Science', 'Energy', 'Photosynthesis',               'Photosynthesis And Energy Pathways'),
  ('Science', 'Energy', 'Energy in Plants',             'Photosynthesis And Energy Pathways'),
  ('Science', 'Energy', 'Energy in Food',               'Photosynthesis And Energy Pathways'),

  -- ─── Science / Energy — conversion / forms cluster ───────────────
  ('Science', 'Energy', 'Energy Conversion',            'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy conversion in electrical appliances', 'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Conversions',           'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms',                 'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms (Electricity)',   'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms (Solar)',         'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms & Conversions',   'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms and Conversions', 'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Forms and Uses',        'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Forms and Conversions',        'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Forms of Energy',              'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Sources of Energy',            'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Sources',               'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Resources',             'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Kinetic Energy',               'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Potential Energy',             'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Kinetic and Potential Energy', 'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Potential and Kinetic Energy', 'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Elastic Potential Energy',     'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Energy Conservation',          'Energy Conversion In Everyday Objects'),

  -- ─── Science / Energy — electrical cluster ───────────────────────
  ('Science', 'Energy', 'Electrical Circuits',          'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Electrical Energy',            'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Electrical Systems',           'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Electricity',                  'Energy Conversion In Everyday Objects'),
  ('Science', 'Energy', 'Systems (Electrical)',         'Energy Conversion In Everyday Objects'),

  -- ─── Science / Forces ────────────────────────────────────────────
  ('Science', 'Forces', 'Friction',                     'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Friction and Gravity',         'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Frictional Force',             'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Direction of friction',        'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Air Resistance',               'Frictional Force And Its Applications'),
  ('Science', 'Forces', 'Gravity',                      'Gravitational Force'),
  ('Science', 'Forces', 'Forces',                       'Push And Pull Forces'),
  ('Science', 'Forces', 'Forces in motion',             'Push And Pull Forces'),
  ('Science', 'Forces', 'Forces Integration',           'Push And Pull Forces'),
  ('Science', 'Forces', 'Types of Forces',              'Push And Pull Forces'),
  ('Science', 'Forces', 'Magnetic Force',               'Push And Pull Forces'),
  ('Science', 'Forces', 'Effects of Forces',            'Effects Of Forces On Objects'),

  -- ─── Science / Heat ──────────────────────────────────────────────
  ('Science', 'Heat', 'Conduction',                     'Good And Poor Conductors Of Heat'),
  ('Science', 'Heat', 'Conductors of Heat',             'Good And Poor Conductors Of Heat'),
  ('Science', 'Heat', 'Heat Conductivity',              'Good And Poor Conductors Of Heat'),
  ('Science', 'Heat', 'Good and Poor Conductors',       'Good And Poor Conductors Of Heat'),
  ('Science', 'Heat', 'Effects of Heat',                'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Expansion',                      'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Expansion and Contraction',      'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Heat Absorption',                'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Heat Flow',                      'Effects Of Heat Gain And Heat Loss'),
  ('Science', 'Heat', 'Temperature',                    'Temperature And Use Of Thermometers'),
  ('Science', 'Heat', 'Heat and Temperature',           'Temperature And Use Of Thermometers'),
  ('Science', 'Heat', 'Temperature and Heat',           'Temperature And Use Of Thermometers'),
  ('Science', 'Heat', 'Measuring Temperature',          'Temperature And Use Of Thermometers'),
  ('Science', 'Heat', 'Temperature Reading',            'Temperature And Use Of Thermometers'),

  -- ─── Science / Interactions — forces sub-cluster ─────────────────
  ('Science', 'Interactions', 'Forces',                 'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Friction',               'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Frictional Force',       'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Gravitational Force',    'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Elastic Spring Force',   'Interaction Of Frictional, Gravitational And Elastic Spring Forces'),
  ('Science', 'Interactions', 'Magnetic Force',         'Interaction Of Magnetic Forces'),
  ('Science', 'Interactions', 'Magnets',                'Interaction Of Magnetic Forces'),

  -- ─── Science / Interactions — environment cluster ────────────────
  ('Science', 'Interactions', 'Adaptations',            'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Environment',            'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Environmental Factors',  'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Environmental Impact',   'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Environmental Interactions', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Ecosystem Balance',      'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Energy Flow',            'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Global Warming',         'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Impact of Human Activities', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Impact of Man',          'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Impact on Environment',  'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Man''s Impact',          'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Man''s Impact on Environment', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Man''s Impact on the Environment', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Population and Community', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Structural Adaptations', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Structural/Behavioural Adaptations', 'Interactions Within The Environment'),
  ('Science', 'Interactions', 'Interactions within the Environment', 'Interactions Within The Environment'),

  -- ─── Science / Interactions — food cluster ───────────────────────
  ('Science', 'Interactions', 'Decomposers',            'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Effects of population change in a food chain', 'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Food Chains and Food Webs', 'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Food Web',               'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Food Webs',              'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Web of Life',            'Food Chains And Food Webs'),
  ('Science', 'Interactions', 'Matter',                 NULL),

  -- ─── Science / Light ─────────────────────────────────────────────
  ('Science', 'Light', 'Properties of Light',           NULL),
  ('Science', 'Light', 'Reflection',                    'Reflection Of Light'),
  ('Science', 'Light', 'Shadows',                       'Formation Of Shadows'),

  -- ─── Science / Matter ────────────────────────────────────────────
  ('Science', 'Matter', 'Air Occupies Space',           'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Compressibility',              'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Mass',                         'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Mass and Volume',              'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Mass and Weight',              'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Mass of Air',                  'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Measuring Matter',             'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Air',            'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Gas',            'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Gases',          'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Liquids',        'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Matter',         'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Solid',          'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of Solids',         'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Properties of States',         'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Volume',                       'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Volume Displacement',          'Properties Of Solids, Liquids And Gases'),
  ('Science', 'Matter', 'Gases',                        'States Of Matter'),
  ('Science', 'Matter', 'Liquids',                      'States Of Matter'),
  ('Science', 'Matter', 'Solids',                       'States Of Matter'),
  ('Science', 'Matter', 'Classification',               NULL),

  -- ─── Science / Systems — digestive cluster ───────────────────────
  ('Science', 'Systems', 'Absorption',                  'Human Digestive System'),
  ('Science', 'Systems', 'Absorption of Nutrients',     'Human Digestive System'),
  ('Science', 'Systems', 'Chewing',                     'Human Digestive System'),
  ('Science', 'Systems', 'Chewing Process',             'Human Digestive System'),
  ('Science', 'Systems', 'Digestion Process',           'Human Digestive System'),
  ('Science', 'Systems', 'Digestive Flow',              'Human Digestive System'),
  ('Science', 'Systems', 'Digestive Juices',            'Human Digestive System'),
  ('Science', 'Systems', 'Digestive Organs',            'Human Digestive System'),
  ('Science', 'Systems', 'Digestive Organs Flow',       'Human Digestive System'),
  ('Science', 'Systems', 'Digestive Process',           'Human Digestive System'),
  ('Science', 'Systems', 'Digestive System',            'Human Digestive System'),
  ('Science', 'Systems', 'Digestive System Anatomy',    'Human Digestive System'),
  ('Science', 'Systems', 'Functions of Mouth',          'Human Digestive System'),
  ('Science', 'Systems', 'Functions of Stomach',        'Human Digestive System'),
  ('Science', 'Systems', 'Gullet Function',             'Human Digestive System'),
  ('Science', 'Systems', 'Human - Digestive System',    'Human Digestive System'),
  ('Science', 'Systems', 'Intestinal Functions',        'Human Digestive System'),
  ('Science', 'Systems', 'Large Intestine',             'Human Digestive System'),
  ('Science', 'Systems', 'Mechanical Digestion',        'Human Digestive System'),
  ('Science', 'Systems', 'Mouth',                       'Human Digestive System'),
  ('Science', 'Systems', 'Mouth Function',              'Human Digestive System'),
  ('Science', 'Systems', 'Path of Food',                'Human Digestive System'),
  ('Science', 'Systems', 'Small Intestine',             'Human Digestive System'),
  ('Science', 'Systems', 'Small Intestine Function',    'Human Digestive System'),
  ('Science', 'Systems', 'Stomach',                     'Human Digestive System'),
  ('Science', 'Systems', 'Stomach Function',            'Human Digestive System'),

  -- ─── Science / Systems — circulatory/respiratory cluster ─────────
  ('Science', 'Systems', 'Circulatory System',          'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human - Circulatory System',  'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human - Respiratory System',  'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human Circulatory & Respiratory Systems', 'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human Circulatory System',    'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human Respiratory System',    'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human Transport System',      'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Respiratory and Circulatory Systems', 'Human Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Respiratory System',          'Human Respiratory And Circulatory Systems'),

  -- ─── Science / Systems — plant cluster ───────────────────────────
  ('Science', 'Systems', 'Plant Reproduction',          'Plant Parts And Functions'),
  ('Science', 'Systems', 'Plant System',                'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Plant Systems',               'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Plant Transport System',      'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human/Plant Transport',       'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Plant vs Human Transport',    'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Human vs Plant Systems',      'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Absorption of Water',         'Plant Respiratory And Circulatory Systems'),
  ('Science', 'Systems', 'Transport Systems',           'Plant Respiratory And Circulatory Systems'),

  -- ─── Science / Systems — electrical cluster ──────────────────────
  ('Science', 'Systems', 'Electrical Circuits',         'Electrical Systems And Circuits'),
  ('Science', 'Systems', 'Electrical Systems',          'Electrical Systems And Circuits'),
  ('Science', 'Systems', 'Conductors and Insulators',   'Electrical Systems And Circuits'),
  ('Science', 'Systems', 'Systems (Electrical)',        'Electrical Systems And Circuits'),

  -- ─── Science / Systems — umbrella / no-fit (set NULL) ────────────
  ('Science', 'Systems', 'Cell System',                 NULL),
  ('Science', 'Systems', 'Cells',                       NULL),
  ('Science', 'Systems', 'Human - General',             NULL),
  ('Science', 'Systems', 'Human - Muscular System',     NULL),
  ('Science', 'Systems', 'Human - Skeletal System',     NULL),
  ('Science', 'Systems', 'Human Body',                  NULL),
  ('Science', 'Systems', 'Human Body Systems',          NULL),
  ('Science', 'Systems', 'Human Reproductive System',   NULL),
  ('Science', 'Systems', 'Human System',                NULL),
  ('Science', 'Systems', 'Human Systems',               NULL),
  ('Science', 'Systems', 'Human Systems Integration',   NULL),
  ('Science', 'Systems', 'Waste Removal',               NULL);

-- ─── Apply alias-driven UPDATE ──────────────────────────────────────
UPDATE question_bank qb
   SET sub_topic = a.canonical
  FROM temp_subtopic_alias a
 WHERE qb.subject = a.subject
   AND qb.topic   = a.topic
   AND qb.sub_topic = a.alias;

-- ─── Catch-all: any remaining off-canon sub_topic → NULL ────────────
UPDATE question_bank qb
   SET sub_topic = NULL
 WHERE qb.sub_topic IS NOT NULL
   AND qb.sub_topic <> ''
   AND NOT EXISTS (
     SELECT 1 FROM canon_sub_topics cst
      WHERE cst.subject   = qb.subject
        AND cst.topic     = qb.topic
        AND cst.sub_topic = qb.sub_topic
   );

-- ─── Normalise empty-string sub_topic to NULL (cleanliness) ─────────
UPDATE question_bank
   SET sub_topic = NULL
 WHERE sub_topic = '';

DROP TABLE temp_subtopic_alias;

-- ─── Add the deferred FK on (subject, topic, sub_topic) ─────────────
-- MATCH SIMPLE (default): NULL sub_topic is accepted, but subject + topic
-- still validate via the existing fk_question_bank_topic constraint.
ALTER TABLE question_bank
  DROP CONSTRAINT IF EXISTS fk_question_bank_sub_topic;
ALTER TABLE question_bank
  ADD CONSTRAINT fk_question_bank_sub_topic
  FOREIGN KEY (subject, topic, sub_topic)
  REFERENCES canon_sub_topics(subject, topic, sub_topic) ON UPDATE CASCADE;
