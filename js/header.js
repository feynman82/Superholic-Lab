class GlobalHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        /* ── Dropdown Menus (Subjects & Mobile Hamburger) ── */
        .subjects-nav { display: none; }
        @media (min-width: 768px) { .subjects-nav { display: block; } }
        .subjects-wrap { position: relative; display: inline-block; }
        
        /* Unified Dropdown Styling */
        .subjects-menu, .nav-menu {
          display: none; position: absolute; top: calc(100% + 8px);
          background: var(--sage-dark); border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-md); padding: 6px;
          min-width: 180px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 50;
        }
        
        /* Anchor Anchors */
        .subjects-menu { right: 0; }
        .nav-menu { right: var(--space-4); min-width: 200px; }
        
        .subjects-menu.is-open, .nav-menu.is-open { display: flex; flex-direction: column; gap: 4px; }
        
        .subjects-menu a, .nav-menu a {
          display: block; color: rgba(255,255,255,0.85); padding: 8px 12px; 
          border-radius: var(--radius-sm); text-decoration: none; 
          font-size: var(--text-sm); font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .subjects-menu a:hover, .nav-menu a:hover { background: rgba(255,255,255,0.1); color: var(--cream); }
      </style>

      <header class="navbar justify-between bg-sage-dark" id="navbar" style="position: relative; z-index: 40;">
        <a href="/index.html" class="flex items-center gap-2 font-display text-2xl" style="text-decoration: none; color: #FFFFFF;">
          <img src="/assets/logo.svg" width="32" height="32" alt="" aria-hidden="true" style="border-radius: var(--radius-sm); flex-shrink:0;">
          Superholic Lab
        </a>
        
        <div class="navbar-actions flex items-center gap-3">
          
          <div class="subjects-nav">
            <div class="subjects-wrap" tabindex="0">
              <button class="btn btn-secondary btn-sm flex items-center gap-2 subjects-btn hover-lift" aria-haspopup="true" aria-expanded="false" style="color: var(--cream); border-color: rgba(255,255,255,0.22);">
                Subjects
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="subjects-menu">
                <a href="/pages/subject-mathematics.html">Mathematics</a>
                <a href="/pages/subject-science.html">Science</a>
                <a href="/pages/subject-english.html">English</a>
              </div>
            </div>
          </div>

          <div id="auth-header-container"></div>
          <a href="/pages/signup.html" id="navSignUp" class="btn btn-primary btn-sm hover-lift hidden sm:inline-flex">Start Free Trial</a>

          <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
          </button>
        </div>

        <nav class="nav-menu" id="navDropdown">
          <a href="/index.html">Home</a>
          <a href="/pages/pricing.html">Pricing</a>
          <div id="navLinks" class="flex flex-col gap-1"></div>
        </nav>
      </header>
    `;

    // Auth state modifications (Dashboard button injection)
    setTimeout(() => {
      if (typeof window.getSupabase === 'function') {
        window.getSupabase().then(async (sb) => {
          try {
            const { data: { session } } = await sb.auth.getSession();
            if (session) {
              const authContainer = this.querySelector('#auth-header-container');
              if (authContainer) {
                // Injected exactly like the new Subjects button
                authContainer.innerHTML = '<a href="/pages/dashboard.html" class="btn btn-secondary btn-sm hover-lift flex items-center" style="color: var(--cream); border-color: rgba(255,255,255,0.22);">Dashboard</a>';
              }

              const navLinks = this.querySelector('#navDropdown');
              if (navLinks) {
                const existingLinks = Array.from(navLinks.querySelectorAll('a'));
                existingLinks.forEach(el => {
                  if (el.id === 'navSignOut' || el.textContent.trim() === 'Sign Out') el.remove();
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
    }, 100);

    // Subjects dropdown interaction logic
    const subjWrap = this.querySelector('.subjects-wrap');
    const subjBtn = this.querySelector('.subjects-btn');
    const subjMenu = this.querySelector('.subjects-menu');
    
    if (subjWrap && subjBtn && subjMenu) {
      subjWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        subjMenu.classList.toggle('is-open');
        const expanded = subjMenu.classList.contains('is-open');
        subjBtn.setAttribute('aria-expanded', expanded);
      });
    }

    document.addEventListener('click', (e) => {
      if (subjWrap && !subjWrap.contains(e.target)) {
        subjMenu.classList.remove('is-open');
        subjBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

if (!customElements.get('global-header')) {
  customElements.define('global-header', GlobalHeader);
}