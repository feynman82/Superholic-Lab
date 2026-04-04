class GlobalHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        /* Force Rose Border (Overrides global style.css !important) */
        header.navbar {
          border-bottom: 3px solid var(--brand-rose) !important;
        }

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

        <!-- Timer injects here during EXAM phase -->
        <div id="nav-timer-container" class="hidden sm:flex"></div>

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
  }
}

// Register the custom element
if (!customElements.get('global-header')) {
  customElements.define('global-header', GlobalHeader);
}