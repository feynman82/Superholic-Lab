/**
 * hud-strip.js
 * Renders a compact HUD strip: avatar, level, XP bar, streak.
 * Shared across progress.html and dashboard.html.
 *
 * Usage:
 *   await window.renderHUDStrip('container-id', { studentId });
 *
 * Fetches student_xp + student_streaks + students from Supabase in parallel.
 * Fails silently — HUD is non-essential chrome.
 */

window.renderHUDStrip = async function (containerId, { studentId }) {
  const container = document.getElementById(containerId);
  if (!container || !studentId) return;

  try {
    const sb = await window.getSupabase();

    const [xpRes, streakRes, studentRes] = await Promise.all([
      sb.from('student_xp').select('total_xp, current_level, xp_in_level').eq('student_id', studentId).maybeSingle(),
      sb.from('student_streaks').select('current_days, shield_count').eq('student_id', studentId).maybeSingle(),
      sb.from('students').select('name, photo_url').eq('id', studentId).single(),
    ]);

    const xp = xpRes.data || { total_xp: 0, current_level: 1, xp_in_level: 0 };
    const streak = streakRes.data || { current_days: 0, shield_count: 0 };
    const student = studentRes.data || { name: '—', photo_url: null };

    const xpToNext = 200 * (xp.current_level || 1);
    const xpPct = Math.min(100, Math.round(((xp.xp_in_level || 0) / xpToNext) * 100));
    const rank = rankFromLevel(xp.current_level || 1);

    container.innerHTML = `
      <div class="hud-strip glass-panel-1">
        <div class="hud-avatar">
          ${student.photo_url
            ? `<img src="${_escHud(student.photo_url)}" alt="${_escHud(student.name)}">`
            : `<div class="hud-avatar-placeholder" aria-hidden>👨‍🚀</div>`
          }
        </div>
        <div class="hud-info">
          <div class="hud-info-row">
            <span class="hud-name">${_escHud(student.name)}</span>
            <span class="quest-chip quest-chip-mint">
              Lvl ${xp.current_level || 1} · ${_escHud(rank)}
            </span>
          </div>
          <div class="hud-xp-row">
            <div class="quest-xp-track">
              <div class="quest-xp-fill" style="width:${xpPct}%;"></div>
            </div>
            <span class="label-caps hud-xp-label">${xp.xp_in_level || 0}/${xpToNext}</span>
          </div>
        </div>
        <div class="hud-streak" title="${streak.shield_count || 0} streak shield(s)">
          <div class="quest-flame" aria-hidden>🔥</div>
          <div class="label-caps hud-streak-days">${streak.current_days || 0}d</div>
          ${(streak.shield_count || 0) > 0
            ? `<div class="label-caps hud-streak-shield">🛡 ${streak.shield_count}</div>`
            : ''
          }
        </div>
      </div>
    `;
  } catch (err) {
    console.error('[hud-strip] Render failed:', err);
    container.innerHTML = '';
  }
};

function rankFromLevel(level) {
  if (level >= 50) return 'Legend';
  if (level >= 40) return 'Vanguard';
  if (level >= 30) return 'Commander';
  if (level >= 20) return 'Captain';
  if (level >= 15) return 'Lieutenant';
  if (level >= 10) return 'Specialist';
  if (level >= 5)  return 'Operator';
  return 'Cadet';
}

function _escHud(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
