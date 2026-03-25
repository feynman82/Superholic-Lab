# Patterns — Superholic Lab

## Supabase Query Pattern

```js
// Always: explicit columns, error handling, limit
const { data, error } = await supabase
  .from('table_name')
  .select('id, name, created_at')
  .eq('user_id', userId)
  .limit(50);

if (error) {
  console.error('Failed to fetch:', error.message);
  showError('Something went wrong. Please try again.');
  return;
}
```

## API Serverless Function Pattern

```js
// api/endpoint.js — Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate input
    // Process request
    // Return response
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('API error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Question JSON Schema (Master Question Template)

Full template: data/MASTER_QUESTION_TEMPLATE.md
Full spec: C:\SLabDrive\01 - Platform Intelligence\Master_Question_Template.md

### Universal base fields (ALL question types)
```json
{
  "id": "p4-math-frac-001",
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "sub_topic": "Adding unlike fractions",
  "difficulty": "Standard",
  "type": "mcq",
  "marks": 2,
  "question_text": "Ahmad ate 1/3 of a pizza...",
  "correct_answer": "C",
  "worked_solution": "Step 1: Find LCD... Step 2: Convert...",
  "examiner_note": "Always show working for fraction addition."
}
```

### MCQ additional fields
```json
{
  "options": ["2/7", "2/12", "7/12", "1/7"],
  "correct_answer": "C",
  "wrong_explanations": {
    "A": "Added numerators and denominators separately...",
    "B": "Found LCD but added original numerators...",
    "D": "Added denominators, kept numerator as 1..."
  }
}
```
Badge letter = array index (0→A, 1→B, 2→C, 3→D). NEVER from option text.

### short_ans additional fields
```json
{
  "correct_answer": "282",
  "accept_also": []
}
```

### word_problem additional fields
```json
{
  "parts": [
    {
      "label": "(a)",
      "question": "How many tarts did she give away?",
      "marks": 2,
      "correct_answer": "35",
      "worked_solution": "1/3 of 60 = 20, 1/4 of 60 = 15, total = 35"
    }
  ]
}
```
NOT auto-graded. Show model answer for comparison.

### open_ended additional fields (Science)
```json
{
  "keywords": ["heat", "flows", "hotter", "cooler"],
  "model_answer": "The Milo was hotter than the surrounding air..."
}
```
NOT auto-graded. Highlight keywords in model answer.

### cloze additional fields (English)
```json
{
  "passage": "Last Saturday, Mei Ling [1] to the library...",
  "blanks": [
    {
      "number": 1,
      "options": ["go", "goes", "went", "going"],
      "correct_answer": "C",
      "explanation": "Past tense required."
    }
  ]
}
```

### editing additional fields (English)
```json
{
  "passage_lines": [
    {
      "line_number": 1,
      "text": "Ahmad and his friends was playing...",
      "underlined_word": "was",
      "has_error": true,
      "correct_word": "were",
      "explanation": "Plural subject needs plural verb."
    }
  ]
}
```

### Supported types by subject
- Mathematics: mcq, short_ans, word_problem
- Science: mcq, open_ended
- English: mcq, cloze, editing, comprehension

### File naming
data/questions/{level}-{subject}-{topic}.json
Examples: p4-mathematics-fractions.json, p4-science-heat.json

## Page Load Pattern

Every page should:
1. Show loading skeleton immediately
2. Check auth state
3. Redirect to login if unauthenticated (for protected pages)
4. Fetch data with error handling
5. Render content or error state
6. Never show a blank screen
