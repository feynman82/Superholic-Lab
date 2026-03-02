# Superholic Lab - Deployment Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key
- Vercel account (for deployment)
- Cloudflare account (for domain management)

## Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run the SQL from `database/schema.sql`
4. Enable Email provider in Authentication > Providers
5. Get your project URL and anon key from Settings > API

### 2. Google Gemini API

1. Get API key from https://makersuite.google.com/app/apikey
2. Store securely - this will be used server-side only

### 3. Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option 2: Git Integration

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure environment variables
4. Deploy

### Build Configuration

The `next.config.js` is already configured for static export:

```javascript
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
}
```

## Domain Configuration (Cloudflare)

1. Add domain to Vercel project settings
2. Configure DNS in Cloudflare:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Set proxy status to "DNS only" during verification
   - After verification, can enable Cloudflare proxy
3. Configure SSL/TLS to "Full (strict)"

## Post-Deployment Checklist

- [ ] Verify Supabase connection
- [ ] Test authentication flow
- [ ] Test question generation
- [ ] Verify RLS policies
- [ ] Check leaderboard realtime updates
- [ ] Test all game modes
- [ ] Verify mobile responsiveness

## Security Considerations

1. **API Keys**: Gemini API key is server-side only
2. **RLS**: Row Level Security enabled on all tables
3. **Rate Limiting**: 50 requests/day per user for AI generation
4. **CORS**: Configured for your domain

## Troubleshooting

### Build Errors
- Ensure all dependencies are installed
- Check TypeScript errors with `npm run build`

### Database Connection Issues
- Verify Supabase URL and anon key
- Check RLS policies

### AI Generation Not Working
- Verify Gemini API key
- Check API usage limits

## Support

For issues and feature requests, please contact support@superholiclab.com
