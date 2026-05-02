/* ════════════════════════════════════════════════════════════════════════════
   admin.js  —  v3.1  (Commit 2: Architect-Scholar reskin)
   ----------------------------------------------------------------------------
   Visual-only diff vs v3.0:
     - Emoji glyphs in innerHTML strings → window.adminIcon('<name>') SVG calls
     - Inline style="background:..." in innerHTML → BEM class names from
       admin.css (.flag-red, .funnel-row, .feed-header, .modal-head etc.)
     - After every innerHTML mutation that injects [data-admin-icon],
       call window.adminIconRefresh(scopeEl) to render new SVGs.
     - Pulse cards: pulse-card-icon now wraps an SVG instead of a font-emoji.

   Preserved verbatim:
     - All var declarations, all window.* globals
     - All fetch() URLs, payloads, headers
     - All Supabase queries
     - All branching logic, conditions, classNames added/removed
     - Auth gate behaviour
     - System-settings IIFE behaviour
     - Wena telemetry IIFE behaviour
   ════════════════════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════════════════════
   1. SHARED STATE
   ════════════════════════════════════════════════════════════════════════════ */

var allProfiles = []; var allStudents = []; var allSubs = [];
var subsByProfile = {}; var lastActivityMap = {}; var breakdown = {};
var adminSession = null; var callerRole = 'sub-admin'; var editTargetId = null;
var currentRadarTab = 'failed'; var contactPending = 0; var qaPending = 0;


/* ════════════════════════════════════════════════════════════════════════════
   2. UTILITIES
   ════════════════════════════════════════════════════════════════════════════ */

function showError(msg) {
  var el = document.getElementById('errorMsg');
  el.textContent = msg;
  el.classList.add('is-visible');
  setTimeout(function () { el.classList.remove('is-visible'); }, 8000);
}

function fmtDate(iso) {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: '2-digit' });
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmtSGD(n) { return 'S$' + Number(n || 0).toFixed(2); }

function tierPill(t) {
  var lbl = { trial: 'Trial', all_subjects: 'All Subjects', family: 'Family', single_subject: 'Single Sub', paused: 'Paused' }[t] || t;
  var cls = { trial: 'tier-trial', all_subjects: 'tier-paid', family: 'tier-paid', single_subject: 'tier-paid', paused: 'tier-paused' }[t] || 'tier-trial';
  return '<span class="tier-pill ' + cls + '">' + esc(lbl) + '</span>';
}

function daysSince(iso) {
  if (!iso) return Infinity;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function buildContactLink(e, s, b) {
  return 'mailto:' + encodeURIComponent(e) + '?subject=' + encodeURIComponent(s) + '&body=' + encodeURIComponent(b);
}

function updateClock() {
  var el = document.getElementById('liveClock');
  if (el) el.textContent = new Date().toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }) + ' SGT';
}
setInterval(updateClock, 1000); updateClock();

// adminIcon shorthand: returns SVG string for a given icon name. Falls back
// to empty string if admin-icons.js failed to load — page still renders,
// just without icons.
function _icon(name, size) {
  if (typeof window.adminIcon !== 'function') return '';
  return window.adminIcon(name, { size: size || 16 });
}


/* ════════════════════════════════════════════════════════════════════════════
   3. PAGE TAB SWITCHING
   ════════════════════════════════════════════════════════════════════════════ */

var qaFirstLoad = true;
var wenaFirstLoad = true;

window.switchAdminTab = function (tab) {
  document.getElementById('crmView').style.display  = tab === 'crm'  ? '' : 'none';
  document.getElementById('qaView').style.display   = tab === 'qa'   ? '' : 'none';
  document.getElementById('wenaView').style.display = tab === 'wena' ? '' : 'none';
  document.getElementById('tabCRM').classList.toggle('is-active',  tab === 'crm');
  document.getElementById('tabQA').classList.toggle('is-active',   tab === 'qa');
  var wenaBtn = document.getElementById('tabWena');
  if (wenaBtn) wenaBtn.classList.toggle('is-active', tab === 'wena');
  if (tab === 'qa'   && qaFirstLoad)   { qaFirstLoad   = false; loadQAQueue();          }
  if (tab === 'wena' && wenaFirstLoad) { wenaFirstLoad = false; window.wenaLoadAll();   }
};


/* ════════════════════════════════════════════════════════════════════════════
   4. AUTH GATE & BOOT
   ════════════════════════════════════════════════════════════════════════════ */

async function loadAdminData() {
  var sb = await getSupabase();
  var { data: { session } } = await sb.auth.getSession();
  if (!session) { window.location.href = '/pages/login.html'; return; }
  adminSession = session;
  var { data: myProfile } = await sb.from('profiles').select('role, full_name').eq('id', session.user.id).single();
  if (!myProfile || !['admin', 'sub-admin'].includes(myProfile.role)) {
    document.body.innerHTML = '<div style="padding:80px;text-align:center;"><h2 class="h2-as" style="margin-bottom:var(--space-3);">Access Denied</h2><p class="text-muted">Admin role required.</p></div>';
    return;
  }
  callerRole = myProfile.role;
  if (callerRole === 'admin') {
    var wenaBtn = document.getElementById('tabWena');
    if (wenaBtn) wenaBtn.hidden = false;
  }
  if (myProfile.full_name) document.getElementById('adminName').textContent = myProfile.full_name.split(' ')[0];
  var res = await fetch('/api/admin', { method: 'GET', headers: { 'Authorization': 'Bearer ' + session.access_token } });
  if (!res.ok) { showError('Failed to load admin data \u2014 server returned ' + res.status); return; }
  var data = await res.json();
  allProfiles = data.profiles || []; allStudents = data.students || []; allSubs = data.subscriptions || [];
  subsByProfile = data.subscriptions_by_profile || {}; lastActivityMap = data.last_activity_by_parent || {};
  breakdown = data.subscription_breakdown || {}; contactPending = data.contact_pending || 0; qaPending = data.qa_pending || 0;
  var badge = document.getElementById('qaTabBadge'); if (badge) badge.textContent = qaPending;
  renderPulse(); renderRadarCounts(); renderRadarTab(currentRadarTab); renderParents(); renderActivityFeed(); loadAnalytics('30d');
}


/* ════════════════════════════════════════════════════════════════════════════
   5. CRM — BUSINESS PULSE
   ════════════════════════════════════════════════════════════════════════════ */

function makeCard(iconName, value, label, sub, cls, action) {
  var oc = action ? ' onclick="window.' + action + '()"' : '';
  var iconHtml = '<div class="pulse-card-icon">' + _icon(iconName, 24) + '</div>';
  return '<div class="pulse-card ' + cls + '"' + oc + '>'
    + iconHtml
    + '<div class="pulse-card-value">' + value + '</div>'
    + '<div class="pulse-card-label">' + label + '</div>'
    + (sub ? '<div class="pulse-card-sub">' + sub + '</div>' : '')
    + '</div>';
}

function renderPulse() {
  var total = allProfiles.length;
  var paid = allProfiles.filter(function (p) { return ['all_subjects', 'family', 'single_subject'].includes(p.subscription_tier); }).length;
  var trial = allProfiles.filter(function (p) { return p.subscription_tier === 'trial'; }).length;
  var grossMRR = 0, netMRR = 0;
  ['all_subjects_monthly', 'all_subjects_annual', 'family_monthly', 'family_annual'].forEach(function (k) {
    if (breakdown[k]) { grossMRR += breakdown[k].gross_mrr || 0; netMRR += breakdown[k].net_mrr || 0; }
  });
  document.getElementById('pulseFeatured').innerHTML =
      makeCard('card', paid, 'Subscribers', 'Click for breakdown', 'pulse-card-rose clickable', 'openSubBreakdown')
    + makeCard('trend-up', fmtSGD(netMRR), 'Net MRR', 'Gross: ' + fmtSGD(grossMRR), 'pulse-card-mint clickable', 'openMRR');
  document.getElementById('pulseStats').innerHTML =
      makeCard('users',    total,          'Total Parents',   '',                          '',                            null)
    + makeCard('gift',     trial,          'On Trial',        '',                          '',                            null)
    + makeCard('inbox',    contactPending, 'Contact Pending', 'From contact page',         'pulse-card-amber clickable',  'openContactInbox')
    + makeCard('flask',    qaPending,      'QA Queue',        'Click to audit',            'pulse-card-sage clickable',   'openQATab');
  if (typeof window.adminIconRefresh === 'function') {
    window.adminIconRefresh(document.getElementById('pulseFeatured'));
    window.adminIconRefresh(document.getElementById('pulseStats'));
  }
}

window.openSubBreakdown = function () {
  var bd = breakdown; var gross = 0, net = 0;
  var rows = [
    { label: 'All Subjects \u2014 Monthly', key: 'all_subjects_monthly' },
    { label: 'All Subjects \u2014 Annual', key: 'all_subjects_annual' },
    { label: 'Family \u2014 Monthly', key: 'family_monthly' },
    { label: 'Family \u2014 Annual', key: 'family_annual' }
  ];
  var html = '<table class="mrr-table"><thead><tr>'
    + '<th>Plan</th><th class="num-center">Count</th><th class="num">Gross MRR</th><th class="num">Est. Net MRR</th>'
    + '</tr></thead><tbody>';
  rows.forEach(function (r) {
    var d = bd[r.key] || { count: 0, gross_mrr: 0, net_mrr: 0 };
    gross += d.gross_mrr; net += d.net_mrr;
    html += '<tr>'
      + '<td>' + r.label + '</td>'
      + '<td class="num-center">' + d.count + '</td>'
      + '<td class="num">' + fmtSGD(d.gross_mrr) + '</td>'
      + '<td class="num is-mint">' + fmtSGD(d.net_mrr) + '</td>'
      + '</tr>';
  });
  var pd = bd.past_due ? bd.past_due.count : 0; var pa = bd.paused ? bd.paused.count : 0;
  html += '<tr class="mrr-divider"><td colspan="4"><hr></td></tr>'
    + '<tr><td class="is-error">Past Due</td><td class="num-center is-error">' + pd + '</td><td></td><td></td></tr>'
    + '<tr><td class="is-paused">Paused</td><td class="num-center is-paused">' + pa + '</td><td></td><td></td></tr>'
    + '<tr class="total-row"><td><strong>Total</strong></td><td></td><td class="num">' + fmtSGD(gross) + '</td><td class="num is-mint">' + fmtSGD(net) + '</td></tr>'
    + '</tbody></table>'
    + '<p class="mrr-note" style="margin-top:var(--space-3);">Annual subscriptions recognised at 1/12 per month per Singapore FRS 115. Stripe fee estimated at 3.4% + S$0.50 per transaction.</p>';
  document.getElementById('subBreakdownContent').innerHTML = html;
  document.getElementById('subBreakdownModal').classList.add('is-open');
};

window.openMRR = function () {
  var gross = 0, net = 0;
  ['all_subjects_monthly', 'all_subjects_annual', 'family_monthly', 'family_annual'].forEach(function (k) {
    if (breakdown[k]) { gross += breakdown[k].gross_mrr || 0; net += breakdown[k].net_mrr || 0; }
  });
  var fees = gross - net;
  document.getElementById('mrrContent').innerHTML =
      '<table class="mrr-table"><tbody>'
    +   '<tr><td>Gross MRR (recognised)</td><td class="num">' + fmtSGD(gross) + '</td></tr>'
    +   '<tr><td class="is-error">Less: Est. Stripe Fees</td><td class="num is-error">- ' + fmtSGD(fees) + '</td></tr>'
    +   '<tr class="total-row"><td>Net MRR</td><td class="num is-mint">' + fmtSGD(net) + '</td></tr>'
    + '</tbody></table>'
    + '<div class="mrr-notes-block">'
    +   '<p class="mrr-note"><strong>Revenue recognition (FRS 115):</strong> Annual subscriptions recognised at 1/12 of annual price per month.</p>'
    +   '<p class="mrr-note"><strong>Stripe fee assumption:</strong> 3.4% + S$0.50 per successful charge for Singapore-issued cards.</p>'
    + '</div>';
  document.getElementById('mrrModal').classList.add('is-open');
};

window.openContactInbox = function () {
  window.open('mailto:linzy@superholiclab.com?subject=Superholic Lab Contact Submissions', '_blank');
};

window.openQATab = function () { window.switchAdminTab('qa'); };


/* ════════════════════════════════════════════════════════════════════════════
   6. CRM — AT-RISK RADAR
   ════════════════════════════════════════════════════════════════════════════ */

function getAtRiskGroups() {
  var nowMs = Date.now(); var days3 = 3 * 86400000; var paidTiers = ['all_subjects', 'family', 'single_subject'];
  var failed = []; var inactive = []; var expiring = []; var unconverted = [];
  allProfiles.forEach(function (p) {
    var sub = subsByProfile[p.id]; var lastAct = lastActivityMap[p.id];
    var isPaid = paidTiers.includes(p.subscription_tier); var isTrial = p.subscription_tier === 'trial';
    var trialEnd = p.trial_ends_at ? new Date(p.trial_ends_at).getTime() : 0;
    if (sub && sub.status === 'past_due') failed.push({ profile: p, reason: 'Payment failed', days: daysSince(lastAct) });
    if (isPaid && (!lastAct || daysSince(lastAct) > 30)) inactive.push({ profile: p, reason: 'No quiz in 30+ days', days: lastAct ? daysSince(lastAct) : 999 });
    if (isTrial && trialEnd > nowMs && (trialEnd - nowMs) <= days3) expiring.push({ profile: p, reason: 'Trial expires in ' + Math.ceil((trialEnd - nowMs) / 86400000) + ' day(s)', days: Math.ceil((trialEnd - nowMs) / 86400000) });
    if (isTrial && trialEnd > 0 && trialEnd < nowMs) unconverted.push({ profile: p, reason: 'Trial expired ' + daysSince(p.trial_ends_at) + ' day(s) ago', days: daysSince(p.trial_ends_at) });
  });
  return { failed: failed, inactive: inactive, expiring: expiring, unconverted: unconverted };
}

function renderRadarCounts() {
  var g = getAtRiskGroups();
  ['failed', 'inactive', 'expiring', 'unconverted'].forEach(function (k) {
    var el = document.getElementById('cnt-' + k); if (el) el.textContent = g[k].length;
  });
}

function renderRadarTab(tab) {
  currentRadarTab = tab; var g = getAtRiskGroups(); var rows = g[tab] || [];
  if (rows.length === 0) {
    document.getElementById('radarContent').innerHTML =
        '<div class="p-8 text-center" style="color:var(--text-muted);">'
      +   '<div style="display:flex;justify-content:center;margin-bottom:var(--space-2);color:var(--brand-mint);">' + _icon('check', 28) + '</div>'
      +   '<p class="text-sm">No accounts in this category.</p>'
      + '</div>';
    return;
  }
  var subj = {
    failed: 'Superholic Lab \u2014 Action Required: Payment Update',
    inactive: 'We miss you on Superholic Lab!',
    expiring: 'Your Superholic Lab trial is ending soon',
    unconverted: 'Your Superholic Lab trial has ended'
  };
  var body = {
    failed:      function (p) { return 'Hi ' + (p.full_name ? p.full_name.split(' ')[0] : 'there') + ',\n\nWe noticed your recent payment did not go through. Please update your payment method:\nhttps://www.superholiclab.com/pages/account.html\n\nWarm regards,\nDeyao\nSuperholic Lab'; },
    inactive:    function (p) { return 'Hi ' + (p.full_name ? p.full_name.split(' ')[0] : 'there') + ',\n\nWe have not seen your child on Superholic Lab recently. Is everything okay?\n\nWarm regards,\nDeyao'; },
    expiring:    function (p) { return 'Hi ' + (p.full_name ? p.full_name.split(' ')[0] : 'there') + ',\n\nYour free trial is ending soon. Subscribe to keep your child\'s progress going:\nhttps://www.superholiclab.com/pages/pricing.html\n\nWarm regards,\nDeyao'; },
    unconverted: function (p) { return 'Hi ' + (p.full_name ? p.full_name.split(' ')[0] : 'there') + ',\n\nYour free trial has ended. We would love to welcome your family back:\nhttps://www.superholiclab.com/pages/pricing.html\n\nWarm regards,\nDeyao'; }
  };
  var flagCls = { failed: 'flag-red', inactive: 'flag-amber', expiring: 'flag-orange', unconverted: 'flag-gray' };
  var html = '<table class="risk-table"><thead><tr><th>Name</th><th>Email</th><th>Reason</th><th>Days</th><th>Action</th></tr></thead><tbody>';
  rows.sort(function (a, b) { return (b.days || 0) - (a.days || 0); }).slice(0, 50).forEach(function (r) {
    var p = r.profile; var ml = buildContactLink(p.email || '', subj[tab], body[tab](p));
    html += '<tr>'
      + '<td class="font-bold">' + esc(p.full_name || '\u2014') + '</td>'
      + '<td class="cell-muted">' + esc(p.email || '\u2014') + '</td>'
      + '<td><span class="risk-flag ' + flagCls[tab] + '">' + esc(r.reason) + '</span></td>'
      + '<td class="cell-muted">' + (r.days === 999 ? 'Never' : r.days) + '</td>'
      + '<td><a href="' + esc(ml) + '" class="btn btn-sm btn-secondary hover-lift" target="_blank">' + _icon('mail', 14) + ' Contact</a></td>'
      + '</tr>';
  });
  document.getElementById('radarContent').innerHTML = html + '</tbody></table>';
  if (typeof window.adminIconRefresh === 'function') {
    window.adminIconRefresh(document.getElementById('radarContent'));
  }
}

window.showRadarTab = function (tab, btn) {
  document.querySelectorAll('.radar-tab').forEach(function (b) { b.classList.remove('is-active'); });
  btn.classList.add('is-active');
  renderRadarTab(tab);
};


/* ════════════════════════════════════════════════════════════════════════════
   7. CRM — PARENTS TABLE
   ════════════════════════════════════════════════════════════════════════════ */

window.renderParents = function () {
  var q = (document.getElementById('parentSearch').value || '').toLowerCase();
  var filtered = allProfiles.filter(function (p) { return (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q); });
  var sByP = {}; allStudents.forEach(function (s) { if (!sByP[s.parent_id]) sByP[s.parent_id] = []; sByP[s.parent_id].push(s); });
  var tbody = document.getElementById('parentsBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">No parents found.</td></tr>';
    return;
  }
  var levels = ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4'];
  var html = '';
  filtered.forEach(function (p) {
    var lastAct = lastActivityMap[p.id]; var students = sByP[p.id] || [];
    var safeId = esc(p.id); var safeEmail = esc(p.email || ''); var safeTier = p.subscription_tier || 'trial';
    var stuLabel = students.length > 0 ? students.map(function (s) { return esc(s.name); }).join(', ') : '\u2014';
    var mailto = 'mailto:' + encodeURIComponent(p.email || '');

    var delBtn = callerRole === 'admin'
      ? '<button class="btn-row-icon is-danger" title="Delete account" onclick="window.deleteUser(\'' + safeId + '\',\'' + safeEmail + '\')">' + _icon('trash', 14) + '</button>'
      : '';

    var stuFields = students.map(function (s) {
      var opts = levels.map(function (l) { return '<option value="' + l + '"' + (s.level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('');
      return '<div class="edit-student-block">'
        +   '<div class="edit-student-block__lbl">Learner: ' + esc(s.name) + '</div>'
        +   '<div class="edit-student-block__row">'
        +     '<div class="edit-group"><label>Name</label><input type="text" class="form-input" id="sn-' + s.id + '" value="' + esc(s.name || '') + '"></div>'
        +     '<div class="edit-group"><label>Level</label><select class="form-select" id="sl-' + s.id + '">' + opts + '</select></div>'
        +     '<div class="flex items-end pb-1"><button class="btn btn-sm btn-secondary hover-lift" onclick="window.saveStudent(\'' + s.id + '\')">Save</button></div>'
        +   '</div>'
        + '</div>';
    }).join('');

    html += '<tr class="data-row">'
      + '<td class="cell-name">' + esc(p.full_name || '\u2014') + '</td>'
      + '<td class="cell-muted">' + safeEmail + '</td>'
      + '<td>' + tierPill(safeTier) + '</td>'
      + '<td class="cell-meta">' + (lastAct ? fmtDate(lastAct) : 'Never') + '</td>'
      + '<td><span class="text-xs cell-muted">' + students.length + ' \u00B7 </span><span class="text-xs">' + stuLabel + '</span></td>'
      + '<td class="cell-meta">' + fmtDate(p.created_at) + '</td>'
      + '<td>'
      +   '<div class="row-actions">'
      +     '<button class="btn-row-icon" title="Edit" onclick="window.toggleEdit(\'' + safeId + '\')">' + _icon('pencil', 14) + '</button>'
      +     '<a href="' + esc(mailto) + '" class="btn-row-icon" title="Contact">' + _icon('mail', 14) + '</a>'
      +     '<button class="btn-row-icon" title="Edit plan" onclick="window.openEditTier(\'' + safeId + '\',\'' + safeEmail + '\',\'' + safeTier + '\')">' + _icon('ticket', 14) + '</button>'
      +     delBtn
      +   '</div>'
      + '</td>'
      + '</tr>'
      + '<tr class="edit-row" id="editrow-' + safeId + '"><td colspan="7"><div class="edit-panel">'
      +   '<div class="edit-group"><label>Parent Name</label><input type="text" class="form-input" id="pname-' + safeId + '" value="' + esc(p.full_name || '') + '"></div>'
      +   '<div class="edit-group"><label>Parent Email</label><input type="email" class="form-input" id="pemail-' + safeId + '" value="' + safeEmail + '"></div>'
      +   '<div class="flex items-end pb-1"><button class="btn btn-sm btn-primary hover-lift" onclick="window.saveParent(\'' + safeId + '\')">Save Parent</button></div>'
      + '</div>' + stuFields + '</td></tr>';
  });
  tbody.innerHTML = html;
  if (typeof window.adminIconRefresh === 'function') {
    window.adminIconRefresh(tbody);
  }
};

window.toggleEdit = function (id) {
  var r = document.getElementById('editrow-' + id);
  if (r) r.classList.toggle('is-open');
};

window.saveParent = async function (uid) {
  var name = (document.getElementById('pname-' + uid) || {}).value || '';
  var email = (document.getElementById('pemail-' + uid) || {}).value || '';
  if (!name.trim() && !email.trim()) return;
  try {
    var res = await fetch('/api/admin-edit', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_parent', userId: uid, data: { full_name: name.trim(), email: email.trim() } })
    });
    var data = await res.json(); if (!res.ok) throw new Error(data.error);
    var p = allProfiles.find(function (x) { return x.id === uid; });
    if (p) { p.full_name = name; p.email = email; }
    window.toggleEdit(uid); window.renderParents();
  } catch (err) { showError('Save failed: ' + err.message); }
};

window.saveStudent = async function (sid) {
  var name = (document.getElementById('sn-' + sid) || {}).value || '';
  var level = (document.getElementById('sl-' + sid) || {}).value || '';
  if (!name.trim()) { showError('Student name cannot be empty.'); return; }
  try {
    var res = await fetch('/api/admin-edit', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_student', studentId: sid, data: { name: name.trim(), level: level } })
    });
    var data = await res.json(); if (!res.ok) throw new Error(data.error);
    var s = allStudents.find(function (x) { return x.id === sid; });
    if (s) { s.name = name; s.level = level; }
    window.renderParents();
  } catch (err) { showError('Save failed: ' + err.message); }
};

window.openEditTier = function (uid, email, tier) {
  editTargetId = uid;
  document.getElementById('editTierEmail').textContent = email;
  document.getElementById('editTierSelect').value = tier || 'trial';
  document.getElementById('editTierModal').classList.add('is-open');
};

window.closeEditTierModal = function () {
  document.getElementById('editTierModal').classList.remove('is-open');
  editTargetId = null;
};

window.saveTier = async function () {
  if (!editTargetId) return;
  var tier = document.getElementById('editTierSelect').value;
  var res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_tier', userId: editTargetId, tier: tier })
  });
  var data = await res.json();
  if (data.success) {
    var p = allProfiles.find(function (x) { return x.id === editTargetId; });
    if (p) p.subscription_tier = tier;
    window.closeEditTierModal(); renderPulse(); window.renderParents();
  } else {
    showError('Plan update failed: ' + (data.error || 'Unknown error'));
  }
};

window.deleteUser = async function (uid, email) {
  if (!confirm('Delete account for ' + email + '?\n\nThis permanently deletes their profile and all student data.')) return;
  var res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + adminSession.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete_user', userId: uid })
  });
  var data = await res.json();
  if (data.success) {
    allProfiles = allProfiles.filter(function (p) { return p.id !== uid; });
    allStudents = allStudents.filter(function (s) { return s.parent_id !== uid; });
    renderPulse(); window.renderParents();
  } else {
    showError('Delete failed: ' + (data.error || 'Unknown'));
  }
};

window.exportCSV = function () {
  var sByP = {};
  allStudents.forEach(function (s) { if (!sByP[s.parent_id]) sByP[s.parent_id] = []; sByP[s.parent_id].push(s.name || '?'); });
  var rows = [['Name', 'Email', 'Plan', 'Last Active', 'Students', 'Joined'].join(',')];
  allProfiles.forEach(function (p) {
    rows.push([
      '"' + (p.full_name || '').replace(/"/g, '""') + '"',
      '"' + (p.email || '').replace(/"/g, '""') + '"',
      '"' + (p.subscription_tier || '') + '"',
      '"' + (lastActivityMap[p.id] ? fmtDate(lastActivityMap[p.id]) : 'Never') + '"',
      '"' + ((sByP[p.id] || []).join('; ')).replace(/"/g, '""') + '"',
      '"' + fmtDate(p.created_at) + '"'
    ].join(','));
  });
  var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'superholiclab-parents-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};


/* ════════════════════════════════════════════════════════════════════════════
   8. CRM — ACTIVITY FEED
   ════════════════════════════════════════════════════════════════════════════ */

function renderActivityFeed() {
  var el = document.getElementById('activityFeed');
  var sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  var newSubs = allSubs.filter(function (s) { return s.status === 'active' && s.created_at && new Date(s.created_at) >= sevenDaysAgo; });
  var groups = [
    { key: 'all_subjects_monthly', label: 'All Subjects \u2014 Monthly', icon: 'book' },
    { key: 'all_subjects_annual',  label: 'All Subjects \u2014 Annual',  icon: 'book' },
    { key: 'family_monthly',       label: 'Family Plan \u2014 Monthly',  icon: 'users' },
    { key: 'family_annual',        label: 'Family Plan \u2014 Annual',   icon: 'users' }
  ];
  var counts = { all_subjects_monthly: 0, all_subjects_annual: 0, family_monthly: 0, family_annual: 0 };
  newSubs.forEach(function (s) {
    var key = (s.plan_name || '') + '_' + (s.billing_cycle || '');
    if (counts[key] !== undefined) counts[key]++;
  });
  var total = newSubs.length;

  var groupItems = groups.filter(function (g) { return counts[g.key] > 0; }).map(function (g) {
    return '<div class="feed-item">'
      +   '<div class="feed-icon">' + _icon(g.icon, 16) + '</div>'
      +   '<div class="feed-body">'
      +     '<div class="feed-text">' + g.label + '</div>'
      +     '<div class="feed-sub">' + counts[g.key] + ' new subscriber' + (counts[g.key] !== 1 ? 's' : '') + '</div>'
      +   '</div>'
      + '</div>';
  }).join('') || '<p class="feed-empty">No new subscribers in the last 7 days.</p>';

  el.innerHTML = '<div class="feed-header">New Subscribers \u2014 Last 7 Days</div>'
    + '<div class="feed-total">'
    +   '<span class="feed-total__num">' + total + '</span>'
    +   '<span class="feed-total__lbl">new subscriber' + (total !== 1 ? 's' : '') + '</span>'
    + '</div>'
    + groupItems;
  if (typeof window.adminIconRefresh === 'function') {
    window.adminIconRefresh(el);
  }
}


/* ════════════════════════════════════════════════════════════════════════════
   9. CRM — ANALYTICS
   ════════════════════════════════════════════════════════════════════════════ */

window.loadAnalytics = async function (period, btn) {
  if (btn) {
    document.querySelectorAll('.period-btn').forEach(function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
  }
  var content = document.getElementById('analyticsContent');
  content.innerHTML = '<div class="text-center py-6"><div class="spinner-sm mx-auto"></div></div>';
  try {
    if (!adminSession) return;
    var res = await fetch('/api/analytics?period=' + period, { headers: { 'Authorization': 'Bearer ' + adminSession.access_token } });
    var data = await res.json(); if (!res.ok) throw new Error(data.error || 'Analytics fetch failed');
    var agg = data.aggregate || {}; var ts = data.timeseries || []; var evts = data.events || [];

    function evtCount(name) {
      var e = evts.find(function (x) { return x.name === name || x.name === name.toLowerCase(); });
      return e ? (e.events || e.visitors || 0) : 0;
    }

    var signups = evtCount('Signup'); var subClicks = evtCount('Subscribe Click'); var subComp = evtCount('Subscribe Complete');
    var quizComp = evtCount('Quiz Complete'); var tutorSess = evtCount('Tutor Session'); var trialD5 = evtCount('Trial Day 5');
    var visitors = (agg.visitors || {}).value || 0; var pageviews = (agg.pageviews || {}).value || 0;

    var sparkHtml = '';
    if (ts.length > 1) {
      var vals = ts.map(function (d) { return d.visitors || 0; });
      var max = Math.max.apply(null, vals) || 1; var min = Math.min.apply(null, vals);
      var W = 360, H = 56, pad = 4;
      var pts = vals.map(function (v, i) {
        var x = pad + (i / (vals.length - 1)) * (W - pad * 2);
        var y = H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      sparkHtml = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" class="analytics-spark">'
        + '<polyline points="' + pts + '" fill="none" stroke="var(--brand-rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        + '</svg>';
    }

    var c1 = signups > 0 ? Math.round((subClicks / signups) * 100) : 0;
    var c2 = subClicks > 0 ? Math.round((subComp / subClicks) * 100) : 0;
    var maxF = Math.max(signups, subClicks, subComp, 1);

    function fBar(label, val, mod) {
      var pct = Math.round((val / maxF) * 100);
      return '<div class="funnel-row">'
        +   '<div class="funnel-row__head">'
        +     '<span class="funnel-row__lbl">' + label + '</span>'
        +     '<span class="funnel-row__val">' + val + '</span>'
        +   '</div>'
        +   '<div class="funnel-row__track">'
        +     '<div class="funnel-row__fill funnel-row__fill--' + mod + '" style="width:' + pct + '%;"></div>'
        +   '</div>'
        + '</div>';
    }

    content.innerHTML =
        '<div class="mb-4">'
      +   sparkHtml
      +   '<div class="analytics-grid">'
      +     '<div class="metric-card"><div class="metric-val">' + visitors.toLocaleString() + '</div><div class="metric-lbl">Unique Visitors</div></div>'
      +     '<div class="metric-card"><div class="metric-val">' + pageviews.toLocaleString() + '</div><div class="metric-lbl">Pageviews</div></div>'
      +   '</div>'
      + '</div>'
      + '<div class="mb-4">'
      +   '<p class="metric-lbl" style="margin-bottom:var(--space-2);">Conversion Funnel</p>'
      +   fBar('Signups', signups, 'sage')
      +   fBar('Subscribe Clicks', subClicks, 'rose')
      +   fBar('Subscribe Completes', subComp, 'mint')
      +   '<div class="funnel-rates">'
      +     '<span>Signup\u2192Click: <strong>' + c1 + '%</strong></span>'
      +     '<span>Click\u2192Complete: <strong>' + c2 + '%</strong></span>'
      +   '</div>'
      + '</div>'
      + '<p class="metric-lbl" style="margin-bottom:var(--space-1);">Key Events</p>'
      + '<div>'
      +   '<div class="event-row"><span>Quiz Complete</span><span class="font-bold">' + quizComp + '</span></div>'
      +   '<div class="event-row"><span>Tutor Session</span><span class="font-bold">' + tutorSess + '</span></div>'
      +   '<div class="event-row"><span>Trial Day 5 (urgency trigger)</span><span class="font-bold">' + trialD5 + '</span></div>'
      + '</div>';
  } catch (err) {
    content.innerHTML = '<p class="text-sm text-muted text-center py-6">Could not load analytics. ' + esc(err.message) + '</p>';
  }
};


/* ════════════════════════════════════════════════════════════════════════════
   10. SYSTEM SETTINGS — show_question_counts toggle
   ----------------------------------------------------------------------------
   Reads/writes public.system_settings via Supabase. RLS on the table
   ensures only profiles.is_admin = true can write; non-admins will see
   the toggle reflect current state but writes will fail silently with
   a status message.
   ════════════════════════════════════════════════════════════════════════════ */

(async function initAdminSettings() {
  'use strict';

  if (document.readyState === 'loading') {
    await new Promise(function (resolve) {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  const section = document.getElementById('admin-settings-section');
  if (!section) return;

  const checkbox = section.querySelector('#toggle-show-counts');
  const labelEl = section.querySelector('.admin-settings__switch-label');
  const statusEl = section.querySelector('.admin-settings__status');

  if (!checkbox || !labelEl || !statusEl) {
    console.error('[admin-settings] Required elements missing.');
    return;
  }

  let sb;
  try {
    sb = await window.getSupabase();
  } catch (err) {
    statusEl.textContent = 'Supabase unavailable.';
    statusEl.classList.add('is-error');
    checkbox.disabled = true;
    return;
  }

  function setUi(enabled) {
    checkbox.checked = Boolean(enabled);
    labelEl.textContent = enabled ? labelEl.dataset.on : labelEl.dataset.off;
  }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.classList.remove('is-success', 'is-error');
    if (kind) statusEl.classList.add('is-' + kind);
  }

  async function loadCurrent() {
    try {
      const { data, error } = await sb
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'show_question_counts')
        .maybeSingle();

      if (error) throw error;

      let enabled = true;
      if (data) {
        const v = data.value;
        if (typeof v === 'boolean') enabled = v;
        else if (typeof v === 'string') enabled = v.toLowerCase() !== 'false';
        else if (v && typeof v === 'object' && 'enabled' in v) enabled = Boolean(v.enabled);
      }
      setUi(enabled);

      if (data && data.updated_at) {
        const when = new Date(data.updated_at).toLocaleString();
        setStatus('Last updated ' + when);
      } else {
        setStatus('Default value (ON)');
      }
    } catch (err) {
      console.error('[admin-settings] read failed:', err);
      setStatus('Could not read setting. Check connection.', 'error');
    }
  }

  async function writeValue(enabled) {
    checkbox.disabled = true;
    setStatus('Saving\u2026');
    try {
      const { error } = await sb
        .from('system_settings')
        .upsert({
          key: 'show_question_counts',
          value: enabled,
          description: 'Wizard surfaces (subjects.html) \u2014 show "N questions" subline on subject/topic/type cards.'
        }, { onConflict: 'key' });

      if (error) throw error;

      setUi(enabled);
      setStatus('Saved \u00B7 ' + new Date().toLocaleTimeString(), 'success');
    } catch (err) {
      console.error('[admin-settings] write failed:', err);
      setStatus('Save failed. You may not have admin permissions.', 'error');
      await loadCurrent();
    } finally {
      checkbox.disabled = false;
    }
  }

  checkbox.addEventListener('change', function (e) { writeValue(e.target.checked); });

  await loadCurrent();
})();


/* ════════════════════════════════════════════════════════════════════════════
   11. WENA TELEMETRY (Sprint 4)
   Lazy-loaded on first activation of the Wena tab via switchAdminTab.
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
  function $(sel)         { return document.querySelector(sel); }
  function tbody(sel)     { return $(sel).querySelector('tbody'); }
  function fmtTime(iso)   { try { return new Date(iso).toLocaleString(); } catch (e) { return iso || ''; } }
  function pct(n, d)      { if (!d) return '\u2014'; return ((n / d) * 100).toFixed(1) + '%'; }
  function isoSince(hrs)  { return new Date(Date.now() - hrs * 3600 * 1000).toISOString(); }
  function statBox(num, lbl, mod) {
    return '<div class="wena-stat' + (mod ? ' ' + mod : '') + '">' +
           '<div class="num">' + num + '</div>' +
           '<div class="lbl">' + lbl + '</div></div>';
  }

  async function loadHeadline() {
    var sb = await getSupabase();
    $('#wmeta-headline').textContent = 'loading\u2026';
    var { data: rows24 } = await sb.from('pedagogy_events')
      .select('rap_enabled, mode, cell_hit_kind')
      .gte('occurred_at', isoSince(24)).limit(50000);
    rows24 = rows24 || [];
    var total24 = rows24.length;
    var rapFired24 = rows24.filter(r => r.mode && r.mode !== 'LEGACY').length;
    var legacy24 = total24 - rapFired24;
    $('#wstats-24h').innerHTML =
      statBox(total24, 'total turns', '') +
      statBox(rapFired24, 'RAP fired', rapFired24 ? '' : 'warn') +
      statBox(legacy24, 'legacy', legacy24 ? 'warn' : '') +
      statBox(pct(rapFired24, total24), 'RAP %', '');

    var { data: rows7 } = await sb.from('pedagogy_events')
      .select('rap_enabled, mode, cell_hit_kind')
      .gte('occurred_at', isoSince(24*7)).limit(200000);
    rows7 = rows7 || [];
    var total7 = rows7.length;
    var rapFired7 = rows7.filter(r => r.mode && r.mode !== 'LEGACY').length;
    var legacy7 = total7 - rapFired7;
    $('#wstats-7d').innerHTML =
      statBox(total7, 'total turns', '') +
      statBox(rapFired7, 'RAP fired', '') +
      statBox(legacy7, 'legacy', legacy7 ? 'warn' : '') +
      statBox(pct(rapFired7, total7), 'RAP %', '');

    var modeCounts = {};
    rows7.forEach(r => { var k = r.mode || '(null)'; modeCounts[k] = (modeCounts[k] || 0) + 1; });
    var modeRows = Object.entries(modeCounts).sort((a,b) => b[1]-a[1]);
    var maxMode = Math.max(1, ...modeRows.map(e => e[1]));
    tbody('#wtbl-mode-dist').innerHTML = modeRows.length
      ? modeRows.map(e => '<tr><td>' + esc(e[0]) + '</td><td class="numeric">' + e[1] +
          '</td><td><span class="wena-bar" style="width:' + (e[1]/maxMode*200) + 'px"></span></td></tr>').join('')
      : '<tr><td colspan="3" class="empty">no events yet</td></tr>';

    var hitCounts = {};
    rows7.forEach(r => { if (!r.mode || r.mode === 'LEGACY') return; var k = r.cell_hit_kind || '(null)'; hitCounts[k] = (hitCounts[k] || 0) + 1; });
    var hitRows = Object.entries(hitCounts).sort((a,b) => b[1]-a[1]);
    var maxHit = Math.max(1, ...hitRows.map(e => e[1]));
    tbody('#wtbl-cellhit-dist').innerHTML = hitRows.length
      ? hitRows.map(e => '<tr><td>' + esc(e[0]) + '</td><td class="numeric">' + e[1] +
          '</td><td><span class="wena-bar" style="width:' + (e[1]/maxHit*200) + 'px"></span></td></tr>').join('')
      : '<tr><td colspan="3" class="empty">no RAP-fired events yet</td></tr>';

    $('#wmeta-headline').textContent = 'as of ' + new Date().toLocaleTimeString();
  }

  async function loadTransitions() {
    var sb = await getSupabase();
    var { data } = await sb.from('pedagogy_events')
      .select('previous_mode, mode')
      .gte('occurred_at', isoSince(24*7)).limit(200000);
    data = data || [];
    var trans = {};
    data.forEach(r => { var k = (r.previous_mode || '(null)') + '\u2192' + (r.mode || '(null)'); trans[k] = (trans[k] || 0) + 1; });
    var rows = Object.entries(trans).sort((a,b) => b[1]-a[1]);
    tbody('#wtbl-transitions').innerHTML = rows.length
      ? rows.map(e => { var p = e[0].split('\u2192'); return '<tr><td>' + esc(p[0]) + '</td><td>\u2192</td><td>' + esc(p[1]) + '</td><td class="numeric">' + e[1] + '</td></tr>'; }).join('')
      : '<tr><td colspan="4" class="empty">no events yet</td></tr>';
  }

  async function loadOrphans() {
    var sb = await getSupabase();
    var [pb, ev] = await Promise.all([
      fetch('/data/wena-english-playbook.json').then(r => r.json()),
      sb.from('pedagogy_events')
        .select('level_normalised, topic, sub_topic')
        .gte('occurred_at', isoSince(24*30))
        .not('mode', 'in', '("LEGACY")')
        .limit(200000)
    ]);
    var seen = new Set();
    (ev.data || []).forEach(r => {
      if (r.level_normalised && r.topic && r.sub_topic) seen.add(r.level_normalised + '|' + r.topic + '|' + r.sub_topic);
    });
    var orphans = (pb.cells || []).filter(c => !seen.has(c.level + '|' + c.topic + '|' + c.sub_topic));
    tbody('#wtbl-orphans').innerHTML = orphans.length
      ? (orphans.slice(0, 100).map(c => '<tr><td>' + esc(c.level) + '</td><td>' + esc(c.topic) + '</td><td>' + esc(c.sub_topic) + '</td></tr>').join('') +
         (orphans.length > 100 ? '<tr><td colspan="3" class="empty">showing 100 of ' + orphans.length + '</td></tr>' : ''))
      : '<tr><td colspan="3" class="empty">all cells have fired in the last 30 days</td></tr>';
  }

  async function loadTopDirect() {
    var sb = await getSupabase();
    var { data } = await sb.from('pedagogy_events')
      .select('level_normalised, topic, sub_topic')
      .eq('mode', 'DIRECT_TEACH')
      .gte('occurred_at', isoSince(24*7)).limit(50000);
    data = data || [];
    var counts = {};
    data.forEach(r => { var k = (r.level_normalised||'?') + '|' + (r.topic||'?') + '|' + (r.sub_topic||'?'); counts[k] = (counts[k] || 0) + 1; });
    var rows = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 100);
    tbody('#wtbl-top-direct').innerHTML = rows.length
      ? rows.map(e => { var p = e[0].split('|'); return '<tr><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td><td>' + esc(p[2]) + '</td><td class="numeric">' + e[1] + '</td></tr>'; }).join('')
      : '<tr><td colspan="4" class="empty">no DIRECT_TEACH events in the last 7 days</td></tr>';
  }

  async function loadFaithfulness() {
    var sb = await getSupabase();
    var { data } = await sb.from('pedagogy_events')
      .select('id, occurred_at, level_normalised, topic, sub_topic, teach_script_keyword_overlap')
      .eq('mode', 'DIRECT_TEACH')
      .gte('occurred_at', isoSince(24*7))
      .not('teach_script_keyword_overlap', 'is', null)
      .order('occurred_at', { ascending: false }).limit(2000);
    data = data || [];
    var buckets = new Array(10).fill(0);
    data.forEach(r => {
      var v = Number(r.teach_script_keyword_overlap);
      if (!Number.isFinite(v)) return;
      var idx = Math.min(9, Math.max(0, Math.floor(v * 10)));
      buckets[idx] += 1;
    });
    var maxB = Math.max(1, ...buckets);
    tbody('#wtbl-faith-hist').innerHTML = buckets.map((c, i) => {
      var lo = (i/10).toFixed(1), hi = ((i+1)/10).toFixed(1);
      var flag = i < 2 ? 'row-flag-low' : (i < 4 ? 'row-flag-warn' : '');
      return '<tr class="' + flag + '"><td>' + lo + '\u2013' + hi + '</td><td class="numeric">' + c +
             '</td><td><span class="wena-bar" style="width:' + (c/maxB*200) + 'px"></span></td></tr>';
    }).join('');
    var low = data.filter(r => Number(r.teach_script_keyword_overlap) < 0.2).slice(0, 5);
    tbody('#wtbl-faith-low').innerHTML = low.length
      ? low.map(r => '<tr class="row-flag-low"><td>' + fmtTime(r.occurred_at) + '</td><td>' + esc(r.level_normalised || '\u2014') +
          '</td><td>' + esc(r.topic || '\u2014') + ' / ' + esc(r.sub_topic || '\u2014') +
          '</td><td class="numeric">' + Number(r.teach_script_keyword_overlap).toFixed(2) + '</td></tr>').join('')
      : '<tr><td colspan="4" class="empty">no low-overlap DIRECT_TEACH events in the last 7 days</td></tr>';
  }

  async function loadLevels() {
    var sb = await getSupabase();
    var { data } = await sb.from('pedagogy_events')
      .select('level_raw, level_normalised')
      .gte('occurred_at', isoSince(24*30)).limit(200000);
    data = data || [];
    var counts = {};
    data.forEach(r => {
      var k = (r.level_raw === null ? '(null)' : r.level_raw) + '|' + (r.level_normalised === null ? '(null)' : r.level_normalised);
      counts[k] = (counts[k] || 0) + 1;
    });
    var rows = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 100);
    tbody('#wtbl-levels').innerHTML = rows.length
      ? rows.map(e => { var p = e[0].split('|'); var flag = p[1] === '(null)' ? 'row-flag-low' : ''; return '<tr class="' + flag + '"><td>' + esc(p[0]) + '</td><td>' + esc(p[1]) + '</td><td class="numeric">' + e[1] + '</td></tr>'; }).join('')
      : '<tr><td colspan="3" class="empty">no events yet</td></tr>';
  }

  async function loadVision() {
    var sb = await getSupabase();
    var { data } = await sb.from('pedagogy_events')
      .select('id, occurred_at, mode, cell_hit_kind, output_length_chars, has_image, rap_enabled')
      .eq('has_image', true).eq('rap_enabled', true)
      .gte('occurred_at', isoSince(24*7))
      .order('occurred_at', { ascending: false }).limit(100);
    data = data || [];
    $('#wstats-vision').innerHTML = statBox(data.length, 'vision + RAP turns (7d)', data.length ? 'warn' : '');
    tbody('#wtbl-vision').innerHTML = data.length
      ? data.map(r => '<tr><td>' + fmtTime(r.occurred_at) + '</td><td>' + esc(r.mode || '\u2014') +
          '</td><td>' + esc(r.cell_hit_kind || '\u2014') + '</td><td class="numeric">' + (r.output_length_chars == null ? '\u2014' : r.output_length_chars) + '</td></tr>').join('')
      : '<tr><td colspan="4" class="empty">no vision+RAP events in the last 7 days</td></tr>';
  }

  var LOADERS = {
    headline: loadHeadline, transitions: loadTransitions, orphans: loadOrphans,
    'top-direct': loadTopDirect, faithfulness: loadFaithfulness, levels: loadLevels, vision: loadVision
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#wenaView .wena-refresh').forEach(btn => {
      btn.addEventListener('click', async () => {
        var key = btn.dataset.refresh;
        var fn = LOADERS[key];
        if (!fn) return;
        btn.disabled = true;
        var prev = btn.textContent;
        btn.textContent = 'Loading\u2026';
        try { await fn(); }
        catch (err) {
          console.error('[wena-telemetry] panel "' + key + '" load failed:', err);
          alert('Panel "' + key + '" failed: ' + (err && err.message || err));
        }
        btn.disabled = false;
        btn.textContent = prev;
      });
    });
  });

  window.wenaLoadAll = async function () {
    await Promise.allSettled(Object.values(LOADERS).map(fn => fn().catch(err => {
      console.error('[wena-telemetry] panel load failed:', err);
    })));
  };
})();


/* ════════════════════════════════════════════════════════════════════════════
   12. BOOT
   ════════════════════════════════════════════════════════════════════════════ */

loadAdminData();