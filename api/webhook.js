/**
 * api/webhook.js — Vercel Serverless Function
 *
 * Receives Stripe webhook events, verifies the signature, and keeps
 * the Supabase database in sync with subscription state changes.
 *
 * Events handled:
 *   checkout.session.completed    → create subscription row, upgrade profile tier
 *   customer.subscription.updated → update subscription status + period dates
 *   customer.subscription.deleted → mark subscription cancelled, downgrade profile
 *
 * ⚠️ CONFIGURE: The following must be set in .env and Vercel dashboard:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET     ← get from Stripe Dashboard > Developers > Webhooks
 *   STRIPE_SINGLE_SUBJECT_PRICE_ID
 *   STRIPE_ALL_SUBJECTS_PRICE_ID
 *   STRIPE_FAMILY_PRICE_ID
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY ← server-side only, never expose in frontend
 *
 * ⚠️ CONFIGURE: Register webhook endpoint in Stripe Dashboard:
 *   URL: https://www.superholiclab.com/api/webhook
 *   Events: checkout.session.completed, customer.subscription.updated,
 *           customer.subscription.deleted
 *
 * TEST: stripe listen --forward-to localhost:3000/api/webhook
 *   Then trigger: stripe trigger checkout.session.completed
 *   Verify the subscriptions table is updated in Supabase.
 */

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Vercel must NOT parse the body — Stripe signature verification needs the raw bytes
module.exports.config = { api: { bodyParser: false } };

/** Reads the full raw request body as a string. */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end',  ()    => resolve(body));
    req.on('error', err  => reject(err));
  });
}

/** Returns the plan name for a Stripe price ID, or null if unknown. */
function planFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_SINGLE_SUBJECT_PRICE_ID) return 'single_subject';
  if (priceId === process.env.STRIPE_ALL_SUBJECTS_PRICE_ID)   return 'all_subjects';
  if (priceId === process.env.STRIPE_FAMILY_PRICE_ID)         return 'family';
  return null;
}

/** Returns the max_children value for a given plan. */
function maxChildrenForPlan(plan) {
  return plan === 'family' ? 3 : 1;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const db     = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // ── Verify Stripe webhook signature ─────────────────────────────────────────
  const rawBody = await getRawBody(req);
  const sig     = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  // ── Handle events ────────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId  = session.client_reference_id;
        if (!userId) { console.warn('[webhook] No client_reference_id on session'); break; }

        // Retrieve the full subscription to get price ID
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId  = subscription.items.data[0]?.price?.id;
        const planName = planFromPriceId(priceId);

        if (!planName) { console.warn('[webhook] Unknown price ID:', priceId); break; }

        // Upsert into subscriptions table (idempotent on stripe_subscription_id)
        await db.from('subscriptions').upsert({
          profile_id:             userId,
          stripe_subscription_id: subscription.id,
          stripe_price_id:        priceId,
          plan_name:              planName,
          status:                 subscription.status,
          current_period_start:   new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:     new Date(subscription.current_period_end   * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        // Upgrade the profile tier
        await db.from('profiles').update({
          subscription_tier: planName,
          max_children:      maxChildrenForPlan(planName),
          stripe_customer_id: session.customer,
        }).eq('id', userId);

        console.log(`[webhook] Subscription activated: ${planName} for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub     = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const plan    = planFromPriceId(priceId);

        // Update subscription row
        await db.from('subscriptions')
          .update({
            status:               sub.status,
            plan_name:            plan || undefined,
            stripe_price_id:      priceId || undefined,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);

        // If plan changed, update profile tier
        if (plan) {
          const userId = sub.metadata?.supabase_user_id;
          if (userId) {
            await db.from('profiles').update({
              subscription_tier: plan,
              max_children:      maxChildrenForPlan(plan),
            }).eq('id', userId);
          }
        }

        console.log(`[webhook] Subscription updated: ${sub.id} → ${sub.status}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;

        await db.from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', sub.id);

        // Downgrade profile — keep as trial (access paused, prompts upgrade)
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await db.from('profiles').update({
            subscription_tier: 'trial',
            max_children:      1,
          }).eq('id', userId);
        }

        console.log(`[webhook] Subscription cancelled: ${sub.id}`);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] Handler error:', err?.message || err);
    // Return 200 so Stripe does not retry — log the error for investigation
    return res.status(200).json({ received: true, warning: 'Handler error logged' });
  }
};
