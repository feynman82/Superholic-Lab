class GlobalHeader extends HTMLElement {
  connectedCallback() {
    // ── TEMPLATE ──
this.innerHTML = `
      <style>
        /* ── Unified Dropdown Menus (Subjects & Mobile Hamburger) ── */
        .subjects-nav { display: none; }
        @media (min-width: 768px) { .subjects-nav { display: block; } }
        .subjects-wrap { position: relative; display: inline-block; }
        
        /* Core Styling Shared by Both */
        .subjects-menu, .nav-menu {
          display: none; position: absolute; top: calc(100% + 8px);
          background: var(--sage-dark); border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-md); padding: 6px;
          min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 50;
        }
        
        /* Positioning Differences */
        .subjects-menu { right: 0; }
        .nav-menu { right: var(--space-4); min-width: 200px; }
        
        /* Active State & Links Shared by Both */
        .subjects-menu.is-open, .nav-menu.is-open { display: flex; flex-direction: column; gap: 4px; }
        .subjects-menu a, .nav-menu a {
          display: block; color: rgba(255,255,255,0.85); padding: 8px 12px; 
          border-radius: var(--radius-sm); text-decoration: none; 
          font-size: var(--text-sm); font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .subjects-menu a:hover, .nav-menu a:hover { background: rgba(255,255,255,0.1); color: var(--text-logo); }
      </style>

      <header class="navbar justify-between bg-sage-dark" id="navbar">      <header class="navbar justify-between bg-sage-dark" id="navbar">
        
        <!-- Logo & Brand Text -->
        <a href="/index.html" class="flex items-center gap-2 font-display text-2xl" style="text-decoration: none; color: var(--text-logo);">
          <img src="/assets/logo.svg" width="32" height="32" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius: var(--radius-sm); flex-shrink:0;">
          Superholic Lab
        </a>

        <!-- Timer injects here during EXAM phase -->
        <div id="nav-timer-container" class="hidden sm:flex"></div>

        <!-- Subjects dropdown — desktop only -->
        <nav class="subjects-nav">
          <div class="subjects-wrap">
            <button class="subjects-btn" id="subjectsToggle" aria-haspopup="true" aria-expanded="false">
              Subjects
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="subjects-menu" id="subjectsMenu" role="menu">
              <a href="/pages/subject-mathematics.html" role="menuitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maths-colour)" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Mathematics
              </a>
              <a href="/pages/subject-science.html" role="menuitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--science-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M9 3h6v7l3 10H6L9 10V3z"/><line x1="6" y1="7" x2="18" y2="7"/></svg>
                Science
              </a>
              <a href="/pages/subject-english.html" role="menuitem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--english-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                English
              </a>
            </div>
          </div>
        </nav>

        <div class="navbar-actions flex items-center gap-4">
          <!-- Dynamic Plan Badge (e.g., Trial, Admin) -->
          <span class="badge hidden" id="planBadge" style="background: rgba(255,255,255,0.15); color: var(--brand-mint);"></span>
          
          <!-- Masterclass Fix: Renamed ID to 'wc-auth-container' to bypass all legacy script overwrites -->
          <div id="wc-auth-container" style="display: flex;">
            <a href="/pages/login.html" class="btn btn-sm hover-lift" style="background: var(--brand-sage) !important; color: #fffde7 !important; border: none !important;">Log In</a>
          </div>
          
          <!-- Hamburger Menu -->
          <button class="navbar-toggle" id="navToggle" aria-label="Open menu">
            <span style="background-color: var(--text-logo);"></span>
            <span style="background-color: var(--text-logo);"></span>
            <span style="background-color: var(--text-logo);"></span>
          </button>
        </div>

        <!-- Wrapped Mobile Dropdown Menu -->
        <div class="navbar-mobile" id="navDropdown">
          <a href="/index.html">Home</a>
          <a href="/pages/about.html">About Us</a>
          <a href="/pages/pricing.html">Pricing</a>
          <a href="/pages/contact.html">Contact Support</a>
          <a href="/pages/signup.html" id="navSignUp">Start Free Trial</a>
        </div>
      </header>
    `;

    // ── 1. Component-Level Event Delegation ──
    this.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('#navToggle');
      const dropdown = this.querySelector('#navDropdown');
      
      if (toggleBtn && dropdown) {
        e.stopPropagation(); // Prevents inline scripts on the page from double-triggering
        dropdown.classList.toggle('is-open');
        toggleBtn.classList.toggle('is-active'); 
      }
    });

    // Close dropdown when clicking outside the component
    document.addEventListener('click', (e) => {
      const dropdown = this.querySelector('#navDropdown');
      const toggleBtn = this.querySelector('#navToggle');
      
      if (dropdown && dropdown.classList.contains('is-open')) {
        if (!this.contains(e.target)) {
          dropdown.classList.remove('is-open');
          if (toggleBtn) toggleBtn.classList.remove('is-active');
        }
      }
    });
    
    // ── Subjects dropdown toggle ──
    const subjectsBtn  = this.querySelector('#subjectsToggle');
    const subjectsMenu = this.querySelector('#subjectsMenu');
    if (subjectsBtn && subjectsMenu) {
      subjectsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = subjectsMenu.classList.toggle('is-open');
        subjectsBtn.setAttribute('aria-expanded', isOpen);
      });
      document.addEventListener('click', (e) => {
        if (!subjectsBtn.contains(e.target) && !subjectsMenu.contains(e.target)) {
          subjectsMenu.classList.remove('is-open');
          subjectsBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
    // ── 2. Self-Aware Auth Logic ──
    if (typeof window.getSupabase === 'function') {
      window.getSupabase().then(async (sb) => {
        try {
          const { data: { session } } = await sb.auth.getSession();
          
          if (session) {
            // Swap "Log In" for "Dashboard" (Uniform Brand Sage Background)
            const authContainer = this.querySelector('#wc-auth-container');
            if (authContainer) {
              authContainer.innerHTML = '<a href="/pages/dashboard.html" class="btn btn-sm hover-lift" style="background: var(--brand-sage) !important; color: #fffde7 !important; border: none !important;">Dashboard</a>';
            }

            // Append "Sign Out" to Dropdown Menu & Remove "Free Trial"
            const navLinks = this.querySelector('#navDropdown');
            if (navLinks) {
              // Defensive Shield: Remove ANY existing sign out links
              const existingLinks = Array.from(navLinks.querySelectorAll('a'));
              existingLinks.forEach(el => {
                if (el.id === 'navSignOut' || el.textContent.trim() === 'Sign Out') {
                  el.remove();
                }
              });

              const signOut = document.createElement('a');
              signOut.id = "navSignOut";
              signOut.href = "#";
              signOut.textContent = "Sign Out";
              signOut.style.color = "var(--brand-rose)"; 
              signOut.onclick = async (e) => { 
                e.preventDefault();
                await sb.auth.signOut(); 
                window.location.href = '/index.html'; 
              };
              navLinks.appendChild(signOut);
              
              const signUpLink = this.querySelector('#navSignUp');
              if (signUpLink) signUpLink.remove();
            }
          }
        } catch (e) {
          console.error('Header auth check failed:', e);
        }
      });
    }
  }
}

// Register the custom element
if (!customElements.get('global-header')) {
  customElements.define('global-header', GlobalHeader);
}