---
name: question-factory
description: "Complete workflow for generating MOE-aligned question content across all 6 PSLE exam types. Read this skill before creating any question content."
origin: Superholic Lab
---

# Question Factory Skill

The authoritative workflow for generating question content for Superholic Lab.
Every question produced must pass through this skill's pipeline.

## When to Use

- User asks to generate questions for any subject/level/topic
- The `/generate-questions` command is invoked
- Any content is being added to `data/questions/` files
- AI tutor needs to generate practice questions on the fly

## Pre-flight Checklist

Before generating ANY question:
1. Confirm: subject, level, topic, sub_topic, difficulty
2. Read the Master Question Template: `C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md`
3. Verify the topic exists in MOE syllabus (check project knowledge PDFs)
4. Determine the correct question type(s) for this subject

See the full skill at .claude/skills/question-factory/SKILL.md in the repo.
