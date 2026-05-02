class GlobalHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
<style>
  global-header, .navbar, header { position: relative; z-index: 10000 !important; }
  .subjects-menu { display: none; position: absolute; right: 0; top: calc(100% + 8px); background: var(--sage-dark); border: 1px solid rgba(255,255,255,0.12); border-radius: var(--radius-md); padding: 6px; min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 9999; }
  .subjects-menu.is-open { display: block; animation: fadeDown 0.2s ease; }
  @keyframes fadeDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
  .subjects-menu a { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: var(--radius-sm); color: var(--cream); text-decoration: none; font-size: var(--text-sm); font-weight: 600; transition: background 0.15s; }
  .subjects-menu a:hover { background: rgba(255,255,255,0.1); }
  .subjects-menu a.billing-link { color: var(--brand-rose); border-top: 1px solid rgba(255,255,255,0.1); margin-top: 4px; padding-top: 12px; }
  .subjects-menu a.billing-link:hover { background: rgba(183,110,121,0.15); }
</style>

<header class="navbar justify-between bg-sage-dark" id="navbar">
  <a href="/index.html" class="flex items-center gap-2 font-display text-2xl" style="text-decoration:none;color:var(--text-logo);">
    <img src="/assets/logo.svg" width="32" height="32" alt="Superholic Lab Logo" style="border-radius:var(--radius-sm);flex-shrink:0;">
    Superholic Lab
  </a>

  <div id="nav-timer-container" class="hidden sm:flex"></div>

  <div class="navbar-actions flex items-center gap-4">
    <span class="badge hidden" id="planBadge" style="background:rgba(255,255,255,0.15);color:var(--brand-mint);"></span>
    <div id="wc-auth-container" style="display:flex;">
      <a href="/pages/login.html" class="btn btn-sm hover-lift" style="background:var(--brand-sage)!important;color:#fffde7!important;border:none!important;">Log In</a>
    </div>
    <button class="navbar-toggle" id="navToggle" aria-label="Open menu">
      <span style="background-color:var(--text-logo);"></span>
      <span style="background-color:var(--text-logo);"></span>
      <span style="background-color:var(--text-logo);"></span>
    </button>
  </div>

  <div class="subjects-menu" id="navDropdown">
    <a href="/index.html">Home</a>
    <a href="/subjects/mathematics"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maths-colour)" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Mathematics</a>
    <a href="/subjects/science"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--science-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M9 3h6v7l3 10H6L9 10V3z"/><line x1="6" y1="7" x2="18" y2="7"/></svg>Science</a>
    <a href="/subjects/english"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--english-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>English</a>
    <a href="/pages/pricing.html">Pricing</a>
    <a href="/pages/about.html">About Us</a>
    <a href="/pages/contact.html">Contact Support</a>
    <a href="/pages/signup.html" id="navSignUp">Start Free Trial</a>
  </div>
</header>
    `;

    // Toggle dropdown
    this.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('#navToggle');
      const dropdown  = this.querySelector('#navDropdown');
      if (toggleBtn && dropdown) {
        e.stopPropagation();
        dropdown.classList.toggle('is-open');
        toggleBtn.classList.toggle('is-active');
      }
    });

    document.addEventListener('click', (e) => {
      const dropdown  = this.querySelector('#navDropdown');
      const toggleBtn = this.querySelector('#navToggle');
      if (dropdown && dropdown.classList.contains('is-open') && !this.contains(e.target)) {
        dropdown.classList.remove('is-open');
        if (toggleBtn) toggleBtn.classList.remove('is-active');
      }
    });

    // Auth + profile-aware nav links
    if (typeof window.getSupabase === 'function') {
      window.getSupabase().then(async (sb) => {
        try {
          const { data: { session } } = await sb.auth.getSession();
          if (!session) return;

          // Swap Log In for Dashboard
          const authContainer = this.querySelector('#wc-auth-container');
          if (authContainer) {
            authContainer.innerHTML = '<a href="/pages/dashboard.html" class="btn btn-sm hover-lift" style="background:var(--brand-sage)!important;color:#fffde7!important;border:none!important;">Dashboard</a>';
          }

          // Fetch profile to personalise nav
          const { data: prof } = await sb.from('profiles')
            .select('subscription_tier, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const navLinks = this.querySelector('#navDropdown');
          if (navLinks) {
            // Remove any stale sign-out links
            navLinks.querySelectorAll('a').forEach(el => {
              if (el.id === 'navSignOut' || el.textContent.trim() === 'Sign Out') el.remove();
            });

            // Add Manage Billing for subscribers
            const isPaid = prof && ['all_subjects','family','single_subject'].includes(prof.subscription_tier);
            if (isPaid) {
              const billingLink = document.createElement('a');
              billingLink.href = '/pages/account.html';
              billingLink.textContent = 'Manage Billing';
              billingLink.className = 'billing-link';
              navLinks.appendChild(billingLink);
            }

            // Add Admin Panel link for admins
            if (prof && (prof.role === 'admin' || prof.role === 'sub-admin')) {
              const adminLink = document.createElement('a');
              adminLink.href  = '/pages/admin.html';
              adminLink.textContent = 'Admin Panel';
              adminLink.style.color = 'var(--brand-rose)';
              navLinks.appendChild(adminLink);
            }

            // Add Sign Out
            const signOut = document.createElement('a');
            signOut.id          = 'navSignOut';
            signOut.href        = '#';
            signOut.textContent = 'Sign Out';
            signOut.style.color = 'var(--brand-rose)';
            signOut.onclick = async (e) => {
              e.preventDefault();
              await sb.auth.signOut();
              window.location.href = '/index.html';
            };
            navLinks.appendChild(signOut);

            // Remove Sign Up link
            const signUpLink = this.querySelector('#navSignUp');
            if (signUpLink) signUpLink.remove();
          }
        } catch (e) {
          console.error('Header auth check failed:', e);
        }
      });
    }
  }
}

if (!customElements.get('global-header')) {
  customElements.define('global-header', GlobalHeader);
}
