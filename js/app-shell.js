// /js/app-shell.js

export async function initAppShell(profile) {
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

  if (profile) {
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

    /* ── 4. GLOBAL UNIFIED STATE RESOLVER & JUNIOR GUARDRAIL ── */
    try {
      const sb = await window.getSupabase();
      const urlParams = new URLSearchParams(window.location.search);
      let activeStudentId = urlParams.get('student') || localStorage.getItem('shl_active_student_id');
      
      if (profile.id) {
        const { data: students } = await sb.from('students').select('id, level').eq('parent_id', profile.id);
        const student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];
        
        if (student) {
          // 1. Establish the global truth
          localStorage.setItem('shl_active_student_id', student.id);
          
          const isJunior = student.level.toLowerCase().includes('primary 1') || student.level.toLowerCase().includes('primary 2');
          
          // 2. Format the Bottom Navigation globally
          if (bottomNav) {
            document.querySelectorAll('.bottom-nav-item').forEach(link => {
              const url = new URL(link.href, window.location.origin);
              url.searchParams.set('student', student.id);
              link.href = url.pathname + url.search;
              
              if (isJunior && link.getAttribute('href').includes('exam.html')) {
                link.style.display = 'none';
              }
            });
            
            // Rebalance flexbox if a tab was hidden
            if (isJunior) {
              bottomNav.style.justifyContent = 'space-evenly';
            }
          }

          // 3. The Global Route Bouncer (Kicks juniors out of the exam page)
          if (isJunior && window.location.pathname.includes('exam.html')) {
            window.location.replace(`quiz.html?student=${student.id}`);
          }
        }
      }
    } catch (err) {
      console.error('Global State Resolution failed:', err);
    }

  } else {
    // If user is not logged in, ensure bottom nav is hidden
    if (bottomNav) bottomNav.hidden = true;
  }
}