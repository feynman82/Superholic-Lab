/**
 * api/checkout.js — Vercel Serverless Function
 *
 * Creates a Stripe Checkout Session for a subscription plan and
 * returns the hosted checkout URL for the frontend to redirect to.
 *
 * Request body:
 *   { plan: 'single_subject'|'all_subjects'|'family', userId: string, email: string, billing: 'monthly'|'annual' }
 *
 * Response:
 *   200 → { url: string }
 *   400 → { error: string }
 *   500 → { error: string }
 *
 * ⚠️ CONFIGURE: The following must be set in .env and Vercel dashboard:
 *   STRIPE_SECRET_KEY
 *   STRIPE_SINGLE_SUBJECT_PRICE_ID
 *   STRIPE_ALL_SUBJECTS_PRICE_ID
 *   STRIPE_FAMILY_PRICE_ID
 *   STRIPE_SINGLE_SUBJECT_ANNUAL_PRICE_ID
 *   STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID
 *   STRIPE_FAMILY_ANNUAL_PRICE_ID
 *   NEXT_PUBLIC_APP_URL  (e.g. https://www.superholiclab.com)
 *
 * TEST: POST { plan: 'all_subjects', billing: 'monthly', userId: 'uuid', email: 'test@test.com' }
 *   to /api/checkout and verify a Stripe Checkout URL is returned.
 */

const Stripe = require('stripe');

/**
 * Maps plan + billing cycle to the correct Stripe Price ID.
 * Annual price IDs must be created in the Stripe dashboard and added to env vars.
 */
function getPriceId(plan, billing) {
  if (billing === 'annual') {
    const annualMap = {
      single_subject: process.env.STRIPE_SINGLE_SUBJECT_ANNUAL_PRICE_ID,
      all_subjects:   process.env.STRIPE_ALL_SUBJECTS_ANNUAL_PRICE_ID,
      family:         process.env.STRIPE_FAMILY_ANNUAL_PRICE_ID,
    };
    return annualMap[plan] || null;
  }
  // monthly (default)
  const map = {
    single_subject: process.env.STRIPE_SINGLE_SUBJECT_PRICE_ID,
    all_subjects:   process.env.STRIPE_ALL_SUBJECTS_PRICE_ID,
    family:         process.env.STRIPE_FAMILY_PRICE_ID,
  };
  return map[plan] || null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('[checkout] STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Checkout is not configured. Please contact support.' });
  }

  const { plan, userId, email, billing } = req.body || {};

  if (!plan || !userId) {
    return res.status(400).json({ error: 'plan and userId are required' });
  }

  const billingCycle = billing === 'annual' ? 'annual' : 'monthly';
  const priceId = getPriceId(plan, billingCycle);
  if (!priceId) {
    return res.status(400).json({ error: `Unknown plan or missing price ID: ${plan} (${billingCycle})` });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.superholiclab.com';

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    const session = await stripe.checkout.sessions.create({
      mode:                 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Store our Supabase user ID so the webhook can link the subscription back
      client_reference_id:  userId,
      // Prefill email if known
      ...(email ? { customer_email: email } : {}),
      success_url: `${appUrl}/pages/dashboard.html?checkout=success&plan=${plan}`,
      cancel_url:  `${appUrl}/pages/pricing.html`,
      subscription_data: {
        metadata: { supabase_user_id: userId, plan },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout] Stripe error:', err?.message || err);
    return res.status(500).json({ error: 'Could not create checkout session. Please try again.' });
  }
};
