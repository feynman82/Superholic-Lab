/**
 * tutor.js
 * AI tutor chat logic for pages/tutor.html.
 *
 * Flow:
 *   1. Read ?subject=&level= URL params (set by quiz page or subject selector)
 *   2. Render welcome message from tutor
 *   3. User types question → POST to /api/chat with full conversation history
 *   4. Render assistant reply as chat bubble
 *   5. Track ai_tutor_messages in daily_usage (trial users: limit 10/day)
 *
 * TEST: Open pages/tutor.html?subject=mathematics&level=primary-4
 *   Type "What is a fraction?" and verify an AI response appears.
 */

(() => {
  // ── Constants ──────────────────────────────────────────────────
  const TRIAL_AI_LIMIT = 10; // max AI messages per day on trial

  const WELCOME_MESSAGES = {
    mathematics: "Hello! I'm your Maths tutor. What are you working on today? Ask me anything — fractions, word problems, geometry — I'm here to guide you step by step.",
    science:     "Hi there! I'm your Science tutor. What topic would you like to explore? Whether it's plants, forces, or the water cycle, I'll help you understand it like a PSLE examiner would.",
    english:     "Hello! I'm your English tutor. Need help with comprehension, composition, or grammar? Ask away — I'll help you think like a skilled reader and writer.",
    general:     "Hello! I'm your AI tutor. Ask me any question about your schoolwork and I'll guide you through it step by step.",
  };

  // ── DOM refs ───────────────────────────────────────────────────
  const chatMessages  = document.getElementById('chat-messages');
  const chatInput     = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('chat-send');
  const subjectTabs   = document.querySelectorAll('[data-subject]');
  const levelSelect   = document.getElementById('level-select');
  const headerSubject = document.getElementById('tutor-subject-label');
  const limitBanner   = document.getElementById('tutor-limit-banner');

  // ── State ──────────────────────────────────────────────────────
  let currentSubject  = 'mathematics';
  let currentLevel    = 'primary-4';
  let history         = []; // [{ role: 'user'|'assistant', content: string }]
  let isLoading       = false;
  let currentStudentId = null;

  // ── Init ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    // Read URL params set by quiz page or direct link
    const params = new URLSearchParams(window.location.search);
    currentSubject = (params.get('subject') || 'mathematics').toLowerCase();
    currentLevel   = (params.get('level')   || 'primary-4').toLowerCase();

    // Sync UI to params
    setActiveSubjectTab(currentSubject);
    if (levelSelect) {
      const match = Array.from(levelSelect.options).find(o => o.value === currentLevel);
      if (match) levelSelect.value = currentLevel;
    }

    // Load student for daily usage tracking
    try {
      const user = await getCurrentUser();
      if (user) {
        const db = await getSupabase();
        const { data: students } = await db
          .from('students')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1);
        if (students?.length) currentStudentId = students[0].id;
      }
    } catch { /* non-blocking */ }

    // Show welcome message
    appendBubble('assistant', WELCOME_MESSAGES[currentSubject] || WELCOME_MESSAGES.general);
    updateHeaderLabel();
  }

  // ── Subject tabs ───────────────────────────────────────────────
  subjectTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const subject = tab.dataset.subject;
      if (subject === currentSubject) return;
      currentSubject = subject;
      setActiveSubjectTab(subject);
      updateHeaderLabel();
      // Reset conversation for new subject
      history = [];
      clearMessages();
      appendBubble('assistant', WELCOME_MESSAGES[subject] || WELCOME_MESSAGES.general);
    });
  });

  function setActiveSubjectTab(subject) {
    subjectTabs.forEach(t => {
      const isActive = t.dataset.subject === subject;
      t.className = isActive
        ? 'btn btn-primary btn-sm'
        : 'btn btn-secondary btn-sm';
    });
  }

  if (levelSelect) {
    levelSelect.addEventListener('change', () => {
      currentLevel = levelSelect.value;
    });
  }

  // ── Send message ───────────────────────────────────────────────
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  async function handleSend() {
    if (isLoading) return;
    const text = chatInput.value.trim();
    if (!text) return;

    // Check trial daily limit
    if (currentStudentId) {
      try {
        const usage = await checkDailyUsage(currentStudentId);
        if (usage.ai_tutor_messages >= TRIAL_AI_LIMIT) {
          showLimitBanner();
          return;
        }
      } catch { /* continue — don't block on usage check failure */ }
    }

    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled   = true;
    isLoading = true;

    // Append user bubble
    appendBubble('user', text);

    // Add to history
    history.push({ role: 'user', content: text });

    // Show typing indicator
    const typingEl = appendTyping();

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          subject:  currentSubject,
          messages: history,
        }),
      });

      const data = await res.json();

      typingEl.remove();

      if (!res.ok || data.error) {
        appendBubble('assistant', data.error || 'Sorry, something went wrong. Please try again.');
        // Remove the last user message from history so they can retry
        history.pop();
      } else {
        appendBubble('assistant', data.reply);
        history.push({ role: 'assistant', content: data.reply });

        // Track usage for trial users
        if (currentStudentId) {
          incrementDailyUsage(currentStudentId, 'ai_tutor_messages').catch(() => {});
        }
      }
    } catch (err) {
      typingEl.remove();
      appendBubble('assistant', 'Could not reach the tutor. Please check your connection and try again.');
      history.pop();
      console.error('[tutor]', err);
    } finally {
      isLoading          = false;
      chatInput.disabled = false;
      sendBtn.disabled   = false;
      chatInput.focus();
    }
  }

  // ── DOM helpers ────────────────────────────────────────────────

  /**
   * Appends a chat bubble to the messages container.
   * Uses textContent to set message text — safe against XSS.
   * Preserves line breaks from the API response.
   */
  function appendBubble(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble-${role === 'user' ? 'user' : 'tutor'}`;

    // Split on newlines and create text nodes separated by <br> elements
    const lines = String(text).split('\n');
    lines.forEach((line, i) => {
      bubble.appendChild(document.createTextNode(line));
      if (i < lines.length - 1) bubble.appendChild(document.createElement('br'));
    });

    chatMessages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  }

  /** Shows an animated three-dot typing indicator. */
  function appendTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.setAttribute('aria-label', 'Tutor is typing');
    el.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(el);
    scrollToBottom();
    return el;
  }

  function clearMessages() {
    chatMessages.innerHTML = '';
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updateHeaderLabel() {
    if (!headerSubject) return;
    const labels = { mathematics: 'Mathematics', science: 'Science', english: 'English' };
    headerSubject.textContent = labels[currentSubject] || 'General';
  }

  function showLimitBanner() {
    if (!limitBanner) return;
    limitBanner.hidden = false;
    limitBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();
