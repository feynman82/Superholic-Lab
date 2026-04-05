class GlobalHeader extends HTMLElement {
  connectedCallback() {
    // ── TEMPLATE ──
    // The inline <style> block was removed to enforce CSS hygiene.
    // Button classes and colors now perfectly match the non-bottom-nav pages (index.html).
    this.innerHTML = `
      <header class="navbar justify-between bg-sage-dark" id="navbar">
        
        <!-- Logo & Brand Text -->
        <a href="/index.html" class="flex items-center gap-2 font-display text-2xl" style="text-decoration: none; color: #FFFFFF;">
          <img src="/assets/logo.svg" width="32" height="32" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius: var(--radius-sm); flex-shrink:0;">
          Superholic Lab
        </a>

        <!-- Timer injects here during EXAM phase -->
        <div id="nav-timer-container" class="hidden sm:flex"></div>

        <div class="navbar-actions flex items-center gap-4">
          <!-- Dynamic Plan Badge (e.g., Trial, Admin) -->
          <span class="badge hidden" id="planBadge" style="background: rgba(255,255,255,0.15); color: var(--brand-mint);"></span>
          
          <!-- Persistent Login/Dashboard button (Matches index.html exactly) -->
          <div id="auth-header-container">
            <a href="/pages/login.html" class="btn btn-sm" style="background: rgba(255,255,255,0.15); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.1);">Log In</a>
          </div>
          
          <!-- Hamburger Menu -->
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

    // ── 1. Component-Level Event Delegation ──
    // By binding to 'this', we keep the logic completely isolated to the component.
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

    // ── 2. Self-Aware Auth Logic ──
    if (typeof window.getSupabase === 'function') {
      window.getSupabase().then(async (sb) => {
        try {
          const { data: { session } } = await sb.auth.getSession();
          
          if (session) {
            // Swap "Log In" for "Dashboard" (Matching index.html button styles)
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