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

## Question JSON Schema

```json
{
  "subject": "Mathematics",
  "level": "Primary 4",
  "topic": "Fractions",
  "difficulty": "standard",
  "question": "What is 3/4 + 1/2?",
  "options": [
    { "label": "A", "text": "1 1/4", "correct": true },
    { "label": "B", "text": "4/6", "correct": false,
      "explanation": "You added numerators and denominators separately..." },
    { "label": "C", "text": "1", "correct": false,
      "explanation": "You may have simplified incorrectly..." },
    { "label": "D", "text": "3/8", "correct": false,
      "explanation": "You multiplied instead of adding..." }
  ],
  "worked_solution": "Step 1: Find common denominator...",
  "examiner_tip": null
}
```

## Page Load Pattern

Every page should:
1. Show loading skeleton immediately
2. Check auth state
3. Redirect to login if unauthenticated (for protected pages)
4. Fetch data with error handling
5. Render content or error state
6. Never show a blank screen
