/**
 * api/generate.js — Vercel Serverless Function
 * Question generation serverless function.
 * Calls Anthropic API to generate MOE-aligned MCQ questions
 * with worked solutions and wrong-answer explanations for
 * every option.
 * PLACEHOLDER: Full implementation coming in Week 2
 *
 * ⚠️ CONFIGURE: ANTHROPIC_API_KEY must be set in .env
 * and in Vercel dashboard.
 */

// TEST: POST { subject: 'mathematics', level: 'Primary 4',
// topic: 'Fractions', difficulty: 'Standard', count: 5 }
// to /api/generate and verify 5 MCQ questions are returned.
