class GlobalFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        /* ── Footer Dropdown Menu (Matching Header Subjects & Nav Menus) ── */
        .useful-links-wrap { position: relative; display: inline-block; }
        
        .useful-links-menu {
          display: none; position: absolute; bottom: calc(100% + 8px); right: 0;
          background: var(--sage-dark); border: 1px solid rgba(255,255,255,0.12);
          border-radius: var(--radius-md); padding: 6px;
          min-width: 180px; box-shadow: 0 -8px 24px rgba(0,0,0,0.4);
          z-index: 50;
        }
        .useful-links-menu.is-open { display: flex; flex-direction: column; gap: 4px; }
        
        .useful-links-menu a {
          display: block; color: rgba(255,255,255,0.85); padding: 8px 12px;
          border-radius: var(--radius-sm); text-decoration: none;
          font-size: var(--text-sm); font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .useful-links-menu a:hover { background: rgba(255,255,255,0.1); color: var(--cream); }
      </style>

      <footer class="footer bg-sage-dark pt-10 pb-8" style="position: relative; overflow: hidden;">
        <div class="container" style="position: relative; z-index: 10;">
          
          <div class="flex flex-wrap items-center justify-between gap-4 mt-4" style="margin-bottom: var(--space-4);">
            
            <div class="flex items-center gap-3 font-display text-2xl text-white">
              <img src="/assets/logo.svg" width="36" height="36" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <span style="color: var(--text-logo);">SUPERHOLIC LAB</span>
            </div>
            
            <div class="useful-links-wrap" tabindex="0">
              <button class="btn btn-secondary btn-sm flex items-center gap-2 useful-links-btn hover-lift" aria-haspopup="true" aria-expanded="false" style="color: var(--cream); border-color: rgba(255,255,255,0.22);">
                Useful Links
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="useful-links-menu">
                <a href="/pages/dashboard.html">Dashboard</a>
                <a href="/pages/subjects.html">Practise</a>
                <a href="/pages/tutor.html">AI Tutor</a>
                <a href="/pages/progress.html">Progress</a>
                <a href="/pages/pricing.html">Pricing</a>
              </div>
            </div>
          </div>

          <div class="w-full bg-light mt-6 mb-6 opacity-20" style="height:1px;"></div>

          <div class="flex flex-wrap items-start justify-between gap-8 mb-8">
            
            <div class="flex flex-col gap-2">
              <div class="text-xs font-bold label-spaced mb-2" style="color: rgba(255,255,255,0.6);">Subjects</div>
              <a href="/pages/subject-mathematics.html" class="text-sm hover-lift" style="color: rgba(255,255,255,0.85); text-decoration: none;">Mathematics</a>
              <a href="/pages/subject-science.html" class="text-sm hover-lift" style="color: rgba(255,255,255,0.85); text-decoration: none;">Science</a>
              <a href="/pages/subject-english.html" class="text-sm hover-lift" style="color: rgba(255,255,255,0.85); text-decoration: none;">English</a>
            </div>

            <div class="flex flex-col gap-2">
              <div class="text-xs font-bold label-spaced mb-2" style="color: rgba(255,255,255,0.6);">Company</div>
              <a href="/pages/about.html" class="text-sm hover-lift" style="color: rgba(255,255,255,0.85); text-decoration: none;">Our Story</a>
              <a href="/pages/method.html" class="text-sm hover-lift" style="color: rgba(255,255,255,0.85); text-decoration: none;">The CER Method</a>
            </div>

            <div class="hidden md:block" style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>

            <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="btn btn-sm btn-secondary hover-lift flex items-center gap-2 footer-top-btn" style="color: var(--cream); border-color: rgba(255,255,255,0.22);">
              ↑ Top
            </button>
            
          </div>
        </div>

        <div class="w-full mt-8 flex flex-col items-center gap-3" style="position: relative; z-index: 10;">
          <div class="text-sm text-center" style="color: rgba(255,255,255,0.5);">© 2026 Superholic Lab Pte. Ltd. All rights reserved.</div>
          <div class="flex flex-wrap justify-center items-center gap-4 text-sm" style="color: rgba(255,255,255,0.5);">
            <a href="/pages/contact.html" class="footer-link hover-lift" style="text-decoration:none; color: inherit;">Contact Us</a>
            <span class="opacity-50">|</span>
            <a href="/pages/privacy.html" class="footer-link hover-lift" style="text-decoration:none; color: inherit;">Privacy Policy</a>
            <span class="opacity-50">|</span>
            <a href="/pages/terms.html" class="footer-link hover-lift" style="text-decoration:none; color: inherit;">Terms of Service</a>
          </div>
        </div>
      </footer>
    `;

    const wrap = this.querySelector('.useful-links-wrap');
    const btn = this.querySelector('.useful-links-btn');
    const menu = this.querySelector('.useful-links-menu');

    if (wrap && btn && menu) {
      wrap.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', menu.classList.contains('is-open'));
      });
    }

    document.addEventListener('click', (e) => {
      if (wrap && !wrap.contains(e.target)) {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

if (!customElements.get('global-footer')) {
  customElements.define('global-footer', GlobalFooter);
}