# Superholic Lab

AI-powered education platform for Singapore Primary School students (P1-P6) preparing for PSLE.

## Features

- **AI Question Generation**: Powered by Google Gemini 1.5 Flash with Singapore context
- **Multiple Game Modes**: Daily Sprint, Top Speed, Topic Quest, Exam Mode, Mistake Dojo
- **Progress Tracking**: Detailed analytics and progress monitoring
- **Spaced Repetition**: Smart mistake review system
- **Leaderboard**: Real-time rankings with other students
- **MOE 2026 Aligned**: Curriculum follows latest syllabus

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- Google Gemini API
- Framer Motion
- Recharts

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Student dashboard
│   ├── play/              # Game interface
│   ├── progress/          # Progress tracking
│   └── admin/             # Admin dashboard
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   └── gemini/           # Gemini prompts
├── types/                 # TypeScript types
└── database/              # Database schema
```

## Game Modes

1. **Daily Sprint**: 30 questions, mixed topics, untimed
2. **Top Speed**: 3-minute rapid-fire challenges
3. **Topic Quest**: Focus on specific topics with adaptive difficulty
4. **Exam Mode**: Full paper simulation with PSLE timing
5. **Mistake Dojo**: Spaced repetition for mastered learning

## Curriculum Coverage

### Mathematics (P1-P6)
- Numbers, fractions, decimals
- Algebra and ratios
- Geometry and measurements
- Speed, circles, volume

### English (P1-P6)
- Grammar and tenses
- Vocabulary and comprehension
- Synthesis and transformation
- PEEL writing structure

### Science (P3-P6)
- Living and non-living things
- Systems and cycles
- Forces and energy
- CER format for OEQ

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## License

MIT License - See LICENSE file for details
