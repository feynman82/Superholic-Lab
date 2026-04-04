class GlobalFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="footer bg-sage-dark texture-whimsical pt-10 pb-8" style="position: relative; overflow: hidden;">
        <div class="container" style="position: relative; z-index: 10;">
          
          <!-- TOP SECTION: Links and Brand -->
          <div class="flex flex-wrap justify-between gap-8 mt-4" style="margin-bottom: var(--space-4);">
            
            <!-- Brand & Trust Pillar -->
            <div class="flex-1 flex flex-col gap-4" style="min-width: 300px; max-width: 400px;">
              <div class="flex items-center gap-3 font-display text-2xl text-white">
                <img src="/assets/logo.svg" width="36" height="36" alt="Superholic Lab Logo" aria-hidden="true" style="border-radius:8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <span style="color: var(--text-logo);">SUPERHOLIC LAB</span>
              </div>
              <p class="text-sm text-muted leading-relaxed" style="color: rgba(255,255,255,0.7) !important; text-align: justify;">
                Singapore's premier AI-powered learning platform. Transforming assessment culture through deep conceptual understanding.
              </p>
            </div>
            
            <!-- Navigation Pillars -->
            <div class="flex flex-wrap gap-10" style="flex: 2; justify-content: flex-end;">
              
              <!-- Platform Column -->
              <div class="flex flex-col items-end text-right gap-2" style="min-width: 120px;">
                <div class="font-bold text-xs mb-2 text-white uppercase tracking-wider" style="letter-spacing: 0.05em; opacity: 0.5;">Platform</div>
                <a href="/pages/subjects.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Subjects</a>
                <a href="/pages/pricing.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Pricing</a>
                <a href="/pages/dashboard.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Dashboard</a>
              </div>
              
              <!-- Company Column -->
              <div class="flex flex-col items-end text-right gap-2" style="min-width: 120px;">
                <div class="font-bold text-xs mb-2 text-white uppercase tracking-wider" style="letter-spacing: 0.05em; opacity: 0.5;">Company</div>
                <a href="/pages/about.html" class="text-sm text-muted footer-link" style="text-decoration:none; color: var(--cream) !important; font-weight: bold;">About Us</a>
                <a href="/pages/contact.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Contact Us</a>
              </div>

              <!-- Legal Column -->
              <div class="flex flex-col items-end text-right gap-2" style="min-width: 120px;">
                <div class="font-bold text-xs mb-2 text-white uppercase tracking-wider" style="letter-spacing: 0.05em; opacity: 0.5;">Legal</div>
                <a href="/pages/terms.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Terms</a>
                <a href="/pages/privacy.html" class="text-sm text-muted footer-link" style="text-decoration:none;">Privacy</a>
              </div>
              
            </div>
          </div>
          
          <!-- Cute Exploring Pet Animation (Walks on the line) -->
          <div class="footer-pet-track" style="position: relative; top: auto; left: auto; width: 100%; border: none; margin-bottom: -1px;">
            <div class="walking-pet">🐈</div>
          </div>

          <!-- MIDDLE SECTION: Trust Badges, Socials, Back to Top -->
          <div class="flex flex-wrap justify-between items-center" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: var(--space-3); gap: 20px;">
            
            <!-- Trust Badges (Image Logos) -->
            <div class="flex flex-wrap items-center gap-4">
              <img src="/assets/made_in_sg.png" alt="Made in Singapore" style="height: 32px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
              <img src="/assets/moe_aligned.png" alt="100% MOE Aligned" style="height: 32px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
            </div>

            <!-- Socials & Back to Top -->
            <div class="flex items-center gap-6">
              
              <!-- Social Icons (Clean Line Art SVGs) -->
              <div class="flex gap-4 items-center">
                <!-- Instagram -->
                <a href="#" class="social-icon text-muted" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <!-- Facebook -->
                <a href="#" class="social-icon text-muted" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <!-- TikTok / X -->
                <a href="#" class="social-icon text-muted" aria-label="X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.73 16h5L9 4z"/><path d="M4 20l6.76-6.76M20 4l-6.76 6.76"/></svg>
                </a>
              </div>

              <div style="width: 1px; height: 24px; background: rgba(255,255,255,0.1);"></div>

              <!-- Back to Top Button -->
              <button onclick="window.scrollTo({top: 0, behavior: 'smooth'})" class="btn btn-sm btn-ghost hover-lift flex items-center gap-2" style="color: var(--text-logo); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius-full); padding: 0 16px;">
                ↑ Top
              </button>
              
            </div>
          </div>

          <!-- BOTTOM SECTION: Copyright -->
          <div class="w-full text-center mt-8">
            <div class="text-sm" style="color: rgba(255,255,255,0.5);">© 2026 Superholic Lab Pte. Ltd. All rights reserved.</div>
          </div>

        </div>
      </footer>
    `;
  }
}

// Register the custom element
customElements.define('global-footer', GlobalFooter);