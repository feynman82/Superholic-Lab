// /js/app-shell.js

export function initAppShell(session) {
  /* ── 1. Dropdown Toggle Logic ── */
  const toggle = document.getElementById('navToggle');
  const dropdown = document.getElementById('navDropdown');
  
  if (toggle && dropdown) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
      toggle.classList.toggle('is-active'); 
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !toggle.contains(e.target)) {
        dropdown.classList.remove('is-open');
        toggle.classList.remove('is-active');
      }
    });
  }

  /* ── 2. Scroll Reveal Observer ── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('revealed'));
  }

  /* ── 3. Auth-Aware UI Injection ── */
  const body = document.getElementById('mainBody');
  const bottomNav = document.getElementById('bottomNav');
  const authContainer = document.getElementById('auth-header-container');
  const navLinks = document.getElementById('navLinks');

  if (session) {
    if (authContainer) authContainer.innerHTML = '<a href="dashboard.html" class="btn btn-secondary btn-sm">Dashboard</a>';
    
    if (navLinks && !document.getElementById('navSignOut')) {
      const signOut = document.createElement('a');
      signOut.id = "navSignOut"; signOut.href = "#"; signOut.textContent = "Sign Out";
      signOut.style.color = "var(--rose)";
      signOut.onclick = async (e) => { 
        e.preventDefault();
        const { signOut: authSignOut } = await import('/js/auth.js');
        await authSignOut(); 
        window.location.href = '../index.html'; 
      };
      navLinks.appendChild(signOut);
      document.getElementById('navSignUp')?.remove();
    }

    if (bottomNav) {
      body.classList.add('is-logged-in', 'has-bottom-nav');
      bottomNav.hidden = false;
    }
  } else {
    if (body) body.classList.remove('is-logged-in', 'has-bottom-nav');
    if (bottomNav) bottomNav.hidden = true;
  }
}