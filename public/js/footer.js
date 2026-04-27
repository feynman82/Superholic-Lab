class GlobalFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        /* ── Footer Dropdown Menu (Mobile-Friendly Toggle) ── */
        .useful-links-wrap { position: relative; display: inline-block; outline: none; }
        
        .useful-links-btn {
          background: rgba(255,255,255,0.08); 
          color: var(--text-logo) !important; 
          border: 1px solid rgba(255,255,255,0.15);
          padding: 8px 16px; 
          border-radius: var(--radius-md); 
          font-size: var(--text-sm); 
          font-weight: 600;
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .useful-links-btn:hover { 
          background: rgba(255,255,255,0.15); 
          border-color: rgba(255,255,255,0.3);
        }
        
        /* Menu drops UPWARDS so it never gets cut off by the bottom of the screen */
        .useful-links-menu {
          display: none; 
          position: absolute; 
          right: 0; 
          bottom: calc(100% + 8px); 
          background: var(--sage-dark);
          border: 1px solid rgba(255,255,255,0.15); 
          border-radius: var(--radius-md); 
          box-shadow: 0 -10px 25px rgba(0,0,0,0.3);
          min-width: 200px; 
          flex-direction: column; 
          padding: var(--space-2); 
          z-index: 999;
          animation: fadeUp 0.2s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        
        .useful-links-menu.is-open { display: flex; flex-direction: column; gap: 4px; }
        
        .useful-links-menu a {
          padding: 10px 12px; 
          color: var(--cream) !important; 
          text-decoration: none;
          font-size: var(--text-sm); 
          font-weight: 500; 
          border-radius: var(--radius-sm);
          transition: background 0.2s, color 0.2s; 
          text-align: left;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .useful-links-menu a:hover { 
          background: rgba(255,255,255,0.1); 
          color: var(--brand-rose) !important; 
        }
        global-footer { display: block; width: 100%; }
      </style>

      <footer class="footer bg-sage-dark texture-whimsical pt-10 pb-1" style="position: relative; z-index: 100; display: flow-root; margin-top: -1px;">        <div class="container" style="position: relative; z-index: 10;">
          
          <div class="flex flex-wrap items-center justify-between gap-4 mt-4" style="margin-bottom: var(--space-4);">
            
            <div class="flex items-center gap-3 font-display text-2xl text-white">
              <img src="/assets/logo.svg" width="36" height="36" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <span style="color: var(--text-logo);">SUPERHOLIC LAB</span>
            </div>
            
            <div class="useful-links-wrap" tabindex="0">
              <button class="useful-links-btn hover-lift" aria-haspopup="true" aria-expanded="false">
                Useful Links
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div class="useful-links-menu" role="menu">
                <a href="/pages/subject-mathematics.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--maths-colour)" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Mathematics</a>
                <a href="/pages/subject-science.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--science-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M9 3h6v7l3 10H6L9 10V3z"/><line x1="6" y1="7" x2="18" y2="7"/></svg>Science</a>
                <a href="/pages/subject-english.html"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--english-colour)" stroke-width="2.5" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>English</a>
                <a href="/pages/subjects.html" role="menuitem">Quiz</a>
                <a href="/pages/exam.html" role="menuitem">Exams</a>
                <a href="/pages/tutor.html" role="menuitem">Miss Wena Tutor</a>
                <a href="/pages/dashboard.html" role="menuitem">Dashboard</a>
                <a href="/pages/about.html" role="menuitem">About Us</a>
                <a href="/pages/pricing.html" role="menuitem">Pricing</a>
                <a href="/pages/faq.html" role="menuitem">FAQ</a>
                <a href="/pages/signup.html" role="menuitem">Sign Up</a>
              </div>
            </div>

          </div>
          
          <div class="footer-pet-track" style="position: relative; top: auto; left: auto; width: 100%; border: none; margin-bottom: -1px;">
            <div class="walking-pet">🐈</div>
          </div>

          <div class="flex flex-wrap justify-between items-center footer-mid-row" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--space-4); gap: 20px;">
            
            <div class="flex flex-wrap items-center gap-4">
              <img src="/assets/made_in_sg.png" alt="Made in Singapore" style="height: 32px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
              <img src="/assets/moe_aligned.png" alt="100% MOE Aligned" style="height: 32px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
            </div>

            <div class="flex items-center gap-6 footer-social-wrap">
              
              <div class="flex gap-4 items-center">
                <a href="#" class="social-icon text-muted" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="#" class="social-icon text-muted" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" class="social-icon text-muted" aria-label="X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.73 16h5L9 4z"/><path d="M4 20l6.76-6.76M20 4l-6.76 6.76"/></svg>
                </a>
              </div>

              <div class="hidden md:block" style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>

              <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="btn btn-sm hover-lift flex items-center gap-2 footer-top-btn">
                ↑ Top
              </button>
              
            </div>
          </div>

          <div class="w-full mt-8 flex flex-col items-center gap-3">
            <div class="text-sm text-center" style="color: rgba(255,255,255,0.5);">© 2026 Superholic Lab Pte. Ltd. All rights reserved.</div>
            <div class="flex flex-wrap justify-center items-center gap-4 text-sm" style="color: rgba(255,255,255,0.5);">
              <a href="/pages/contact.html" class="footer-link" style="text-decoration:none; color: inherit;">Contact Us</a>
              <span class="opacity-50">|</span>
              <a href="/pages/privacy.html" class="footer-link" style="text-decoration:none; color: inherit;">Privacy Policy</a>
              <span class="opacity-50">|</span>
              <a href="/pages/terms.html" class="footer-link" style="text-decoration:none; color: inherit;">Terms of Services</a>
            </div>
          </div>

        </div>
      </footer>
    `;

    // Wait for DOM insertion, then attach interaction listeners
    setTimeout(() => {
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

      // Close if clicking outside
      document.addEventListener('click', (e) => {
        if (wrap && !wrap.contains(e.target)) {
          menu.classList.remove('is-open');
          if(btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    }, 0);
  }
}

// Register the custom element
if (!customElements.get('global-footer')) {
  customElements.define('global-footer', GlobalFooter);
}