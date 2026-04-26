// /js/app-shell.js
// Initialises page-level shell behaviour (nav dropdown, scroll reveal,
// auth-aware UI swaps, active-student resolution, junior guardrail,
// and the Quest item on <global-bottom-nav>).

export async function initAppShell(profile) {
  /* ── 1. Dropdown Toggle Logic ───────────────────────────────── */
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

  /* ── 2. Scroll Reveal Observer ──────────────────────────────── */
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

  /* ── 3. Auth-Aware UI Injection ─────────────────────────────── */
  const body = document.getElementById('mainBody');
  // Bottom nav lookup: prefer the new <global-bottom-nav> custom element;
  // legacy inline <nav id="bottomNav"> still supported during the migration.
  const bottomNavEl  = document.querySelector('global-bottom-nav') || document.getElementById('bottomNav');
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

    if (bottomNavEl) {
      body?.classList.add('is-logged-in', 'has-bottom-nav');
      // Reveal the legacy inline nav (no-op for the web component which is always rendered)
      if (bottomNavEl.id === 'bottomNav') bottomNavEl.hidden = false;
    }

    /* ── 4. GLOBAL UNIFIED STATE RESOLVER & JUNIOR GUARDRAIL ─── */
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

          // 2. Format the bottom navigation globally
          //    Every <a class="bottom-nav-item"> in the page (whether inside the
          //    web component or the legacy inline nav) gets the active student id
          //    appended, except the Quest item — /quest reads activeStudentId from
          //    URL OR localStorage and we don't want every page link to keep a stale
          //    student in the URL on the Quest page.
          document.querySelectorAll('.bottom-nav-item').forEach(link => {
            const slug = link.getAttribute('data-slug') || '';
            const href = link.getAttribute('href') || '';

            // Junior guardrail — hide Exam tab for P1/P2 students
            if (isJunior && (slug === 'exam' || href.includes('exam.html'))) {
              link.style.display = 'none';
              return;
            }

            // Skip Quest — its active student comes from localStorage on the page
            if (slug === 'quest') return;

            // For everything else, append/refresh ?student=<id>
            try {
              const url = new URL(href, window.location.origin);
              url.searchParams.set('student', student.id);
              link.href = url.pathname + url.search;
            } catch { /* href like '#' — ignore */ }
          });

          // 3. The Global Route Bouncer (kicks juniors out of the exam page)
          if (isJunior && window.location.pathname.includes('exam.html')) {
            window.location.replace(`quiz.html?student=${student.id}`);
          }

          /* ── 5. QUEST INDICATOR ON BOTTOM NAV ──────────────────
             Reveal the Quest item on <global-bottom-nav> if the
             active student has an in-flight quest. The query is
             fast (single row by index on student_id + status) and
             cached for 60s on window.__shlQuestCache so subsequent
             pages within the same session don't re-query.

             Result is intentionally "best-effort" — failures don't
             block the rest of the shell. If remedial_quests doesn't
             exist on this Supabase project, the catch swallows it. */
          await applyQuestNavState(sb, student.id, bottomNavEl);
        }
      }
    } catch (err) {
      console.error('Global State Resolution failed:', err);
    }

  } else {
    // If user is not logged in, ensure bottom nav is hidden
    if (bottomNavEl && bottomNavEl.id === 'bottomNav') bottomNavEl.hidden = true;
  }
}

// ─── Quest indicator helper ──────────────────────────────────────
// Looks up active quest for the given student. Caches the result
// on window for 60 seconds. Toggles the Quest item on the
// <global-bottom-nav> via its setQuestActive() method. Safe to call
// even when the page uses the legacy inline <nav id="bottomNav">
// (in that case there is no Quest item, so we early-return).

async function applyQuestNavState(sb, studentId, bottomNavEl) {
  if (!bottomNavEl || typeof bottomNavEl.setQuestActive !== 'function') {
    // Legacy inline nav — has no Quest item, nothing to toggle
    return;
  }

  try {
    const cache = window.__shlQuestCache;
    const now   = Date.now();
    let hasActiveQuest = null;

    if (cache && cache.studentId === studentId && (now - cache.cachedAt) < 60_000) {
      hasActiveQuest = cache.hasActiveQuest;
    } else {
      const { data, error } = await sb
        .from('remedial_quests')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (error) {
        // Table may not exist yet on this project — just hide Quest gracefully.
        hasActiveQuest = false;
      } else {
        hasActiveQuest = !!data;
      }
      window.__shlQuestCache = { studentId, hasActiveQuest, cachedAt: now };
    }

    bottomNavEl.setQuestActive(hasActiveQuest);
  } catch (err) {
    // Never let a Quest lookup break the page
    console.warn('[app-shell] quest indicator skipped:', err?.message || err);
    bottomNavEl.setQuestActive(false);
  }
}
