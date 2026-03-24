# Performance & Token Optimization — Superholic Lab

## Claude Code Session Management

- Read CLAUDE.md and ARCHITECTURE.md at the start of every session
- Use `/compact` between major task transitions
- Use `/clear` between completely unrelated tasks
- Default to sonnet for most coding tasks
- Use opus only for complex architectural decisions

## Context Window Management

- Keep MCP servers to minimum needed (supabase, github, filesystem)
- Disable unused MCP servers per session
- Don't load entire files when only a section is needed
- Reference files by path rather than pasting full contents

## Frontend Performance

- Minimize DOM manipulation — batch updates
- Lazy-load question data (don't fetch all at page load)
- Use CSS animations over JS animations where possible
- Optimize images in assets/ folder
- Use semantic HTML for accessibility and SEO
- Load fonts with `display=swap` to prevent FOIT

## Supabase Performance

- Always use `.limit()` on queries
- Select only needed columns (never `select('*')`)
- Index frequently queried columns
- Use compound queries instead of multiple round trips
- Cache user profile data in session where appropriate

## Vercel Serverless

- Keep cold start times low — minimal dependencies in api/ files
- Use edge functions for latency-sensitive endpoints
- Set appropriate cache headers for static assets
