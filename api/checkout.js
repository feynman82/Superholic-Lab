/**
 * api/checkout.js — Vercel Serverless Function
 * Creates a Stripe Checkout Session and returns the URL.
 * The frontend redirects the user to that URL.
 * PLACEHOLDER: Full implementation coming in Task 3.2
 *
 * ⚠️ CONFIGURE: STRIPE_SECRET_KEY must be set in .env
 * and in Vercel dashboard. Never expose this key in frontend JS.
 * ⚠️ CONFIGURE: Set STRIPE_SINGLE_SUBJECT_PRICE_ID,
 * STRIPE_ALL_SUBJECTS_PRICE_ID, STRIPE_FAMILY_PRICE_ID in .env
 */

// TEST: POST { priceId: 'price_...', userId: '...' } to /api/checkout
// and verify a Stripe Checkout URL is returned.
