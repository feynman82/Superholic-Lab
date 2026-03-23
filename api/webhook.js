/**
 * api/webhook.js — Vercel Serverless Function
 * Stripe webhook handler.
 * Handles events:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 * On payment success: updates subscriptions table and
 * subscription_tier in profiles table in Supabase.
 * PLACEHOLDER: Full implementation coming in Task 3.2
 *
 * ⚠️ CONFIGURE: STRIPE_WEBHOOK_SECRET must be set in .env
 * and in Vercel dashboard (get from Stripe Dashboard > Webhooks).
 * ⚠️ CONFIGURE: SUPABASE_SERVICE_ROLE_KEY required here
 * (server-side only — never expose in frontend JS).
 */

// TEST: Use Stripe CLI `stripe listen --forward-to localhost:3000/api/webhook`
// to replay a checkout.session.completed event and verify
// the subscriptions table is updated in Supabase.
