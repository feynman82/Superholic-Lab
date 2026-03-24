# Coding Style — Superholic Lab

## Immutability

ALWAYS create new objects, NEVER mutate existing ones:
```js
// WRONG: array.push(item)
// CORRECT: const newArray = [...array, item]

// WRONG: obj.key = value
// CORRECT: const newObj = { ...obj, key: value }
```

## File Organization

- All styles in `css/style.css` — never create new CSS files
- All frontend JS in `js/` — one module per concern
- All serverless functions in `api/` — one per endpoint
- Question data in `data/questions/` — JSON files by subject+level
- 200-400 lines per file typical, 800 max
- Functions under 50 lines

## Naming

- Functions: camelCase, verb-first (`fetchQuestions`, `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`MAX_DAILY_QUESTIONS`)
- CSS classes: kebab-case (`btn-primary`, `card-header`)
- Files: kebab-case (`supabase-client.js`)
- HTML IDs: kebab-case (`quiz-container`)

## Error Handling

- Every async function has try/catch
- User-facing errors show friendly messages, never raw errors
- Server-side logs detailed context
- Never silently swallow errors
- No blank screens — always show fallback UI on error

## Input Validation

- Validate all user input before processing
- Sanitize before inserting into DOM (textContent, not innerHTML)
- Validate URL parameters before using
- Never trust data from the client — validate server-side too

## Variables

- `const` by default, `let` when reassignment needed
- NEVER use `var`
- Use CSS variables for all colors — never hardcode hex values
