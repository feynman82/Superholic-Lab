/**
 * stripe.js
 * Frontend Stripe Checkout redirect logic for pages/pricing.html.
 *
 * Behaviour:
 *   - Logged-out users: "Start Free Trial" links go to signup.html (default)
 *   - Logged-in users:  buttons are relabelled "Subscribe Now" and call /api/checkout
 *   - Trial users:      a banner showing days remaining is shown at the top
 *
 * ⚠️ CONFIGURE: STRIPE_SECRET_KEY must NOT be used here — only in api/checkout.js.
 *
 * TEST: Log in, open pages/pricing.html, click a Subscribe button, and verify
 *   you land on the Stripe hosted checkout page in test mode.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Only run on pricing page
  if (!document.getElementById('pricing-cards')) return;

  try {
    const user = await getCurrentUser();
    if (!user) return; // keep default "Start Free Trial" links for guests

    const profile = await getProfile(user.id);

    // ── Trial status banner ──────────────────────────────────────
    if (profile && isTrialActive(profile)) {
      const banner = document.getElementById('trial-status-banner');
      if (banner) {
        const msLeft   = new Date(profile.trial_ends_at) - new Date();
        const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        const daysEl   = banner.querySelector('[data-days-left]');
        if (daysEl) daysEl.textContent = daysLeft;
        banner.hidden = false;
      }
    }

    // ── Swap "Start Free Trial" links to checkout buttons ────────
    document.querySelectorAll('[data-checkout-plan]').forEach(el => {
      el.textContent = 'Subscribe Now';
      // Ensure primary styling on all plans when logged in
      el.classList.remove('btn-secondary');
      el.classList.add('btn-primary');

      el.addEventListener('click', async (e) => {
        e.preventDefault();
        await startCheckout(el.dataset.checkoutPlan, user, el);
      });
    });

  } catch (err) {
    console.error('[stripe]', err);
    // Fail silently — default links still work
  }
});

/**
 * Calls /api/checkout with the selected plan and redirects to Stripe.
 * @param {string} plan  'single_subject' | 'all_subjects' | 'family'
 * @param {object} user  Supabase user object
 * @param {Element} btn  The clicked button (for loading state)
 */
async function startCheckout(plan, user, btn) {
  const originalText = btn.textContent;
  btn.disabled    = true;
  btn.textContent = 'Loading…';

  try {
    const res = await fetch('/api/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        plan,
        userId: user.id,
        email:  user.email,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || 'Checkout failed');
    }

    // Redirect to Stripe hosted checkout
    window.location.href = data.url;
  } catch (err) {
    console.error('[stripe] checkout error:', err);
    btn.disabled    = false;
    btn.textContent = originalText;
    showCheckoutError('Could not start checkout. Please try again or contact support.');
  }
}

/** Displays a temporary error message below the pricing cards. */
function showCheckoutError(msg) {
  let errEl = document.getElementById('checkout-error');
  if (!errEl) {
    errEl = document.createElement('div');
    errEl.id        = 'checkout-error';
    errEl.className = 'alert alert-danger mt-6';
    const cards = document.getElementById('pricing-cards');
    if (cards) cards.after(errEl);
  }
  errEl.textContent = msg;
  errEl.hidden      = false;
  errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { errEl.hidden = true; }, 8000);
}
