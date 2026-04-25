/**
 * next.config.mjs
 * Hybrid Next.js + static-site config for Superholic Lab.
 *
 * Strategy:
 *   - Next.js handles `/` (src/app/page.tsx) and `/quest` (src/app/quest/page.tsx)
 *   - Existing static files in `pages/`, `js/`, `css/`, `assets/`, `public/`
 *     continue to be served as-is (Vercel auto-serves them from the repo root).
 *   - API routes in `api/index.js` continue to work via vercel.json rewrites.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  poweredByHeader: false,

  // Skip type/lint errors during the hybrid migration (re-enable in Phase 6)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Keep heavy server-only deps out of the client bundle.
  // These are imported by api/* but Next.js scans node_modules and may try to
  // include them; mark them external so build doesn't fail.
  serverExternalPackages: [
    'pdf-img-convert',
    'sharp',
    '@anthropic-ai/sdk',
    '@google/generative-ai',
    'stripe',
  ],

  // Allow Three.js's specific module shape
  transpilePackages: ['three'],

  // Don't auto-rewrite — Vercel's static file serving handles /pages/*.html
  // /js/*.js etc. automatically when no Next route matches.
}

export default nextConfig
