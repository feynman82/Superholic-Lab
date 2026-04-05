class GlobalHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        /* 1. Force Auth Button to be persistent on mobile */
        .navbar-actions #auth-header-container {
          display: flex !important;
        }
        
        /* 2. Change Hamburger Menu Lines Color to match logo */
        .navbar-toggle span {
          background-color: var(--text-logo) !important;
        }

        /* 3. Wrap Dropdown Menu to content size instead of full width */
        #navDropdown {
          left: auto !important;
          right: var(--space-4) !important;
          width: max-content !important;
          min-width: 200px;
          border-radius: var(--radius-md) !important;
          top: 68px !important; /* Pushed down to cleanly clear the rose border */
          box-shadow: var(--shadow-md);
        }
      </style>
      
      <!-- 4. Text Color Overrides -->
      <header class="navbar justify-between bg-sage-dark" id="navbar" style="color: var(--text-logo);">
        
        <!-- Logo & Brand Text -->
        <a href="/index.html" class="flex items-center gap-2 font-display text-2xl" style="text-decoration: none; color: var(--text-logo);">
          <img src="/assets/logo.svg" width="32" height="32" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius: var(--radius-sm); flex-shrink:0;">
          SUPERHOLIC LAB
        </a>

        <!-- Timer injects here during EXAM phase (Removed '.hidden' to prevent !important CSS overrides) -->
        <div id="nav-timer-container" style="display: flex; align-items: center; justify-content: center;"></div>

        <div class="navbar-actions flex items-center gap-4">
          <!-- Dynamic Plan Badge (e.g., Trial, Admin) -->
          <span class="badge hidden" id="planBadge" style="background: rgba(255,255,255,0.15); color: var(--brand-mint);"></span>
          
          <!-- Persistent Login/Dashboard button -->
          <div id="auth-header-container">
            <a href="/pages/login.html" class="btn btn-sm hover-lift" style="background: rgba(255,255,255,0.15); color: var(--text-logo); border: 1px solid rgba(255,255,255,0.1);">Log In</a>
          </div>
          
          <!-- Hamburger Menu (Lines colored via injected CSS) -->
          <button class="navbar-toggle" id="navToggle" aria-label="Open menu">
            <span></span><span></span><span></span>
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

    // ── 1. Robust Event Delegation for Hamburger Menu ──
    const toggleBtn = this.querySelector('#navToggle');
    const dropdown = this.querySelector('#navDropdown');
    
    if (toggleBtn && dropdown) {
      // Bind directly to the button and STOP PROPAGATION so inline HTML scripts don't double-toggle it
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        dropdown.classList.toggle('is-open');
        toggleBtn.classList.toggle('is-active'); 
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = this.querySelector('#navDropdown');
      const toggleBtn = this.querySelector('#navToggle');
      
      if (dropdown && dropdown.classList.contains('is-open')) {
        if (!dropdown.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
          dropdown.classList.remove('is-open');
          if (toggleBtn) toggleBtn.classList.remove('is-active');
        }
      }
    });

    // ── 2. Self-Aware Auth Logic ──
    if (typeof window.getSupabase === 'function') {
      window.getSupabase().then(async (sb) => {
        try {
          const { data: { session } } = await sb.auth.getSession();
          
          if (session) {
            // Swap "Log In" for "Dashboard" using the exact classes from index.html (Removed btn-secondary)
            const authContainer = this.querySelector('#auth-header-container');
            if (authContainer) {
              authContainer.innerHTML = '<a href="/pages/dashboard.html" class="btn btn-sm" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.1);">Dashboard</a>';
            }

            // Append "Sign Out" to Dropdown Menu & Remove "Free Trial"
            const navLinks = this.querySelector('#navDropdown');
            if (navLinks && !this.querySelector('#navSignOut')) {
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