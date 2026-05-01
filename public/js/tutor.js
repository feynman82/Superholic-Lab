/**
 * tutor.js
 * Omni-Tutor 3.0 Chat Logic with Multi-modal Canvas Support.
 * Connects to /api/summarize-chat to build persistent Study Notes.
 */

(() => {
  const TRIAL_AI_LIMIT = 10;
  let history = [];
  let isLoading = false;
  let currentStudentId = null;
  let currentParentId = null;           // session.user.id — used by Sprint 4 telemetry RLS denorm column
  let currentStudentPhoto = '../assets/images/kid_studying.png'; // Default fallback
  let currentStudentLevel = null;       // e.g., 'Primary 3' — server normalises to P-form
  let currentStudentName = null;        // first name preferred; passed for warmth in RAP persona
  let currentSubjectContext = 'general';
  let currentTopicContext = 'mixed';
  let currentSubTopicContext = null;    // populated from ?sub_topic= URL param when present
  let lastWenaMode = null;              // Sprint 4 — echoed back to server next turn for CHECK_RESPONSE detection
  // One conversation_id per page-load groups all turns of a single Miss Wena
  // session for telemetry. Reload = new conversation. Quick UUIDv4 via
  // crypto.randomUUID() (always available in modern browsers).
  const conversationId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  let messageQueue = [];
  let batchTimeout = null;
  const BATCH_DELAY_MS = 1500;
  let _sessionTracked = false; // Prevents duplicate Tutor Session analytics events

  // Quest mode state
  let fromQuestId = null;
  let fromQuestStep = null;
  let questMessageCount = 0;
  let markCompleteBtn = null;

  // Canvas State
  let isDrawMode = false;
  let ctx = null;
  let isDrawing = false;
  let canvasHasContent = false;

  // DOM
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const saveBtn = document.getElementById('saveChatBtn');
  const modeTextBtn = document.getElementById('modeTextBtn');
  const modeDrawBtn = document.getElementById('modeDrawBtn');
  const drawArea = document.getElementById('drawArea');
  const canvas = document.getElementById('tutorCanvas');
  const limitBanner = document.getElementById('tutor-limit-banner');

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    initCanvas();

    // Starter Prompts wiring
    document.querySelectorAll('.starter-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!chatInput.disabled) {
          chatInput.value = btn.textContent;
          chatInput.focus();
          adjustTextareaHeight();
        }
      });
    });

    // Check student usage, fetch avatar, & check Remedial intent FIRST
    await checkStudentLimits();

    // Quest mode detection
    const questParams = new URLSearchParams(window.location.search);
    const qFromQuest = questParams.get('from_quest');
    const qStep = questParams.get('step');
    if (qFromQuest && qStep !== null) {
      fromQuestId = qFromQuest;
      fromQuestStep = parseInt(qStep, 10);
      currentSubjectContext = questParams.get('subject') || currentSubjectContext;
      currentTopicContext = questParams.get('topic') || currentTopicContext;
      injectQuestTutorBanner(fromQuestStep, currentTopicContext);
      insertMarkCompleteBtn();
      injectQuestChips();
    }

    // Curriculum sub-topic (used by Wena RAP retrieval). Populated when the
    // caller (quiz.html / quest tutor link) appends ?sub_topic=…. Null is fine —
    // server falls back to topic-level retrieval.
    currentSubTopicContext = questParams.get('sub_topic') || null;

    // Event Listeners
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    chatInput.addEventListener('input', adjustTextareaHeight);
    modeTextBtn.addEventListener('click', () => setMode('text'));
    modeDrawBtn.addEventListener('click', () => setMode('draw'));
    if (saveBtn) saveBtn.addEventListener('click', generateStudyNote);

    // Quest mode: fire diagnostic opener. Otherwise use the standard or remedial greeting.
    if (fromQuestId) {
      await fireQuestOpener();
    } else {
      const isRemedial = await handleRemedialIntent();
      if (!isRemedial) {
        appendBubble('tutor', "Hello! I'm Miss Wena. 😊 I'm your Superholic Tutor, so you can ask me about Mathematics, Science, or English all in one place! Need help with a bar model, a science experiment, or grammar? Let's figure it out together!");
      }
    }
  }

  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  // ── Canvas Pen Tool Logic ──
  function initCanvas() {
    const getPos = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x, y };
    };

    const start = (e) => { isDrawing = true; canvasHasContent = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const draw = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const stop = () => { if (isDrawing) isDrawing = false; };

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stop);
  }

  window.clearCanvas = () => {
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvasHasContent = false;
    }
  };

  // ── Mode Toggles ──
  function setMode(mode) {
    isDrawMode = (mode === 'draw');
    if (isDrawMode) {
      modeDrawBtn.className = 'btn btn-primary btn-sm';
      modeTextBtn.className = 'btn btn-ghost btn-sm';
      drawArea.style.display = 'block';

      // Resize canvas safely after display block
      setTimeout(() => {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (canvas.width !== rect.width) {
          const imgData = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
          canvas.width = rect.width;
          canvas.height = 200;
          ctx = canvas.getContext('2d');
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#2C3E3A';
          if (imgData) ctx.putImageData(imgData, 0, 0);
        }
      }, 50);
    } else {
      modeTextBtn.className = 'btn btn-primary btn-sm';
      modeDrawBtn.className = 'btn btn-ghost btn-sm';
      drawArea.style.display = 'none';
    }
  }

  // ── Chat Logic ──
  let currentTypingEl = null;

  async function handleSend() {
    if (isLoading) return;
    const text = chatInput.value.trim();
    const hasImage = isDrawMode && canvasHasContent;

    if (!text && !hasImage) return;

    const imageData = hasImage ? canvas.toDataURL('image/png') : null;
    appendBubble('user', text, imageData);
    // Analytics: record first message per tutor session (fires once per page load)
    if (!_sessionTracked) {
      _sessionTracked = true;
      if (window.plausible) window.plausible('Tutor Session', { props: { subject: currentSubjectContext } });
    }
    messageQueue.push({ text, image: imageData });

    chatInput.value = '';
    chatInput.style.height = 'auto';
    if (hasImage) window.clearCanvas();

    if (batchTimeout) clearTimeout(batchTimeout);

    if (!currentTypingEl) {
      currentTypingEl = appendTyping();
    }

    batchTimeout = setTimeout(() => {
      processBatchQueue();
    }, BATCH_DELAY_MS);
  }

  async function processBatchQueue() {
    if (messageQueue.length === 0) return;

    isLoading = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;

    const combinedText = messageQueue.map(m => m.text).filter(Boolean).join('\n');
    const lastImage = messageQueue.reverse().find(m => m.image)?.image || null;

    messageQueue = [];

    history.forEach(msg => msg.image = null);

    // (Removed) Cognitive diagnostic context injection used to dynamic-import
    // ../js/analyze-weakness.js, which never existed at that path. The proper
    // BKT root-cause is now served by /api/analyze-weakness via the gateway.
    // If we want diagnostic context in chat again, fetch it here and push as
    // a system message — keeping the call out for now to avoid noise.

    history.push({ role: 'user', content: combinedText, image: lastImage });

    // AI LOGGING: Store the user's combined batched prompt
    if (currentStudentId) {
      try {
        const db = await getSupabase();
        await db.from('ai_tutor_logs').insert([{
          student_id: currentStudentId,
          role: 'user',
          content: combinedText,
          subject: currentSubjectContext,
          topic: currentTopicContext
        }]);
      } catch (err) {
        console.error('Failed to log user tutor interaction:', err);
      }
    }

    try {
      // from_quest must be a URL query param — server reads it from req.url, not body
      const chatUrl = fromQuestId
        ? `/api/chat?from_quest=${encodeURIComponent(fromQuestId)}`
        : '/api/chat';
      const sb = await getSupabase();
      const { data: { session: chatSession } } = await sb.auth.getSession();
      const chatToken = chatSession?.access_token;
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(chatToken && { 'Authorization': `Bearer ${chatToken}` }),
        },
        // Curriculum coordinates carry no behaviour change unless the
        // server has WENA_RAP_ENABLED=true (or canary bucket includes the
        // student) AND subject==='English'. Sprint 4 adds studentId,
        // parentId, conversationId, lastWenaMode so canary bucketing,
        // telemetry RLS, and CHECK_RESPONSE detection all work end-to-end.
        body: JSON.stringify({
          messages: history,
          subject: currentSubjectContext,
          level: currentStudentLevel,
          currentQuestion: { topic: currentTopicContext, sub_topic: currentSubTopicContext },
          studentName: currentStudentName,
          studentId:    currentStudentId,
          parentId:     currentParentId,
          conversationId,
          lastWenaMode
        }),
      });

      const data = await res.json();

      if (currentTypingEl) {
        currentTypingEl.remove();
        currentTypingEl = null;
      }

      if (!res.ok || data.error) {
        if ((data.error && data.error.includes("temporarily unavailable")) || res.status === 500) {
          appendBubble('tutor', 'Miss Wena is thinking a bit too fast! 😅 Give me about 30 seconds to catch my breath before we continue.');
        } else {
          appendBubble('tutor', data.error || 'Sorry, something went wrong. Please try again.');
        }
        history.pop();
        chatInput.value = combinedText;
        adjustTextareaHeight();
      } else {
        appendBubble('tutor', data.reply);
        history.push({ role: 'assistant', content: data.reply });

        // Sprint 4: capture the resolved RAP mode so the next request can
        // echo it back as `lastWenaMode` (drives CHECK_RESPONSE detection).
        if (data.wena_mode) lastWenaMode = data.wena_mode;

        // AI LOGGING: Store Miss Wena's final response
        if (currentStudentId) {
          try {
            const db = await getSupabase();
            await db.from('ai_tutor_logs').insert([{
              student_id: currentStudentId,
              role: 'assistant',
              content: data.reply,
              subject: currentSubjectContext,
              topic: currentTopicContext
            }]);
          } catch (err) {
            console.error('Failed to log assistant tutor interaction:', err);
          }
        }

        // Quest mode: track message count and update mark-complete button
        if (fromQuestId && data.quest_message_count !== undefined) {
          questMessageCount = data.quest_message_count;
          updateMarkCompleteBtn();
        } else if (fromQuestId) {
          // Server may not return count yet; count locally from history
          questMessageCount = history.filter(m => m.role === 'user').length;
          updateMarkCompleteBtn();
        }

        if (!fromQuestId && saveBtn && history.filter(m => m.role === 'user').length >= 1) {
          saveBtn.classList.remove('hidden');
        }
      }
    } catch (err) {
      if (currentTypingEl) {
        currentTypingEl.remove();
        currentTypingEl = null;
      }
      appendBubble('tutor', 'Could not reach the tutor. Please check your connection.');
      history.pop();
      chatInput.value = combinedText;
      adjustTextareaHeight();
    } finally {
      isLoading = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  // ── DOM Helpers ──
  function formatMessage(text) {
    let safe = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    safe = safe.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2');
    safe = safe.replace(/\$([^$]*?[/+\-=][^$]*?)\$/g, '$1');
    safe = safe.replace(/\$\s*([0-9a-zA-Z])\s*\$/g, '$1');

    return safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-rose">$1</strong>');
  }

  function appendBubble(role, text, imageBase64 = null) {
    const isUser = role === 'user';

    const wrap = document.createElement('div');
    wrap.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'}`;
    wrap.style.display = 'flex';
    wrap.style.width = '100%';
    wrap.style.justifyContent = isUser ? 'flex-end' : 'flex-start';

    const innerFlex = document.createElement('div');
    innerFlex.className = `flex gap-4`;
    innerFlex.style.display = 'flex';
    innerFlex.style.maxWidth = '85%';

    const avatar = document.createElement('img');
    avatar.src = isUser ? currentStudentPhoto : '../assets/images/miss_wena.png';
    avatar.alt = isUser ? 'You' : 'Miss Wena';
    avatar.className = 'wena-avatar';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderWidth = '2px';
    avatar.style.borderRadius = '50%';
    avatar.style.objectFit = 'cover';
    avatar.style.flexShrink = '0';

    const bubble = document.createElement('div');
    bubble.className = isUser ? 'chat-bubble-user text-sm' : 'glass-panel-2 chat-bubble-tutor text-sm';

    if (imageBase64) {
      const img = document.createElement('img');
      img.src = imageBase64;
      img.className = 'w-full h-auto bg-white rounded border border-light mb-2';
      bubble.appendChild(img);
    }

    if (text) {
      const textContainer = document.createElement('div');
      textContainer.style.whiteSpace = 'pre-wrap';
      textContainer.style.wordBreak = 'break-word';
      textContainer.style.overflowWrap = 'anywhere';
      textContainer.style.width = '100%';
      textContainer.innerHTML = formatMessage(text);
      bubble.appendChild(textContainer);
    }

    if (isUser) {
      innerFlex.appendChild(bubble);
      innerFlex.appendChild(avatar);
    } else {
      innerFlex.appendChild(avatar);
      innerFlex.appendChild(bubble);
    }

    wrap.appendChild(innerFlex);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return wrap;
  }

  function appendTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'flex justify-start w-full';
    wrap.style.display = 'flex';
    wrap.style.width = '100%';
    wrap.style.justifyContent = 'flex-start';

    const innerFlex = document.createElement('div');
    innerFlex.className = 'flex gap-4 flex-row';
    innerFlex.style.display = 'flex';
    innerFlex.style.maxWidth = '85%';

    const avatar = document.createElement('img');
    avatar.src = '../assets/images/miss_wena.png';
    avatar.alt = 'Miss Wena';
    avatar.className = 'wena-avatar';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderWidth = '2px';
    avatar.style.borderRadius = '50%';
    avatar.style.objectFit = 'cover';
    avatar.style.flexShrink = '0';

    const bubble = document.createElement('div');
    bubble.className = 'glass-panel-2 chat-bubble-tutor text-sm flex items-center justify-center';
    bubble.style.minWidth = '60px';
    bubble.style.height = '40px';

    const spinner = document.createElement('div');
    spinner.className = 'spinner-sm';
    spinner.style.width = '16px';
    spinner.style.height = '16px';
    spinner.style.borderWidth = '2px';

    bubble.appendChild(spinner);
    innerFlex.appendChild(avatar);
    innerFlex.appendChild(bubble);
    wrap.appendChild(innerFlex);

    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return wrap;
  }

  // ── Context & Limit Handling ──
  async function checkStudentLimits() {
    try {
      const sb = await window.getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      currentParentId = session.user.id;  // captured for Sprint 4 telemetry denorm column

      const urlParams = new URLSearchParams(window.location.search);
      let activeStudentId = urlParams.get('student') || localStorage.getItem('shl_active_student_id');

      // Fetch student data INCLUDING photo_url + level/name (level + name feed
      // the Wena RAP curriculum coordinates and persona block).
      const { data: students } = await sb.from('students').select('id, photo_url, level, name').eq('parent_id', session.user.id);
      let student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];

      if (student) {
        currentStudentId = student.id;
        currentStudentPhoto = student.photo_url || '../assets/images/kid_studying.png';
        currentStudentLevel = student.level || null;
        // First-name only — the persona instructs Miss Wena to use it sparingly.
        currentStudentName = student.name ? String(student.name).trim().split(/\s+/)[0] : null;
        localStorage.setItem('shl_active_student_id', currentStudentId);
      }

      // Fetch Limit
      const { data: profile } = await sb.from('profiles').select('subscription_tier').eq('id', session.user.id).single();
      const isTrial = !profile || profile.subscription_tier === 'trial';

      if (isTrial && currentStudentId) {
        const { count } = await sb.from('ai_tutor_logs').select('*', { count: 'exact', head: true }).eq('student_id', currentStudentId);

        if (count >= TRIAL_AI_LIMIT) {
          limitBanner.hidden = false;
          chatInput.disabled = true;
          sendBtn.disabled = true;
          modeDrawBtn.disabled = true;
          chatInput.placeholder = "Free trial limit reached.";
        }
      }
    } catch (e) {
      console.error("Tutor state resolution failed:", e);
    }
  }

  async function handleRemedialIntent() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'remedial' && params.get('topic')) {
      const banner = document.getElementById('remedial-banner');
      const topicEl = document.getElementById('quest-topic-name');
      const topic = params.get('topic').replace(/-/g, ' ');
      const score = params.get('score') || 0;

      currentSubjectContext = params.get('subject') || 'general';
      currentTopicContext = params.get('topic');

      if (topicEl) topicEl.textContent = topic;
      if (banner) banner.hidden = false;

      isLoading = true;
      chatInput.disabled = true;
      sendBtn.disabled = true;
      const typingEl = appendTyping();

      let sName = 'there';
      try {
        const sb = await window.getSupabase();
        const { data: { session } } = await sb.auth.getSession();
        if (session && currentStudentId) {
          const { data: stu } = await sb.from('students').select('name').eq('id', currentStudentId).single();
          if (stu && stu.name) sName = stu.name;
        }
      } catch (e) { }

      const autoPrompt = `SYSTEM INSTRUCTION: The student just clicked "Ask Miss Wena" from their Progress Dashboard because they are struggling. They scored ${score}% in ${topic}. 
      Generate your opening message. It MUST exactly follow this format: "Hi ${sName}! I saw you scored ${score}% on ${topic} recently. Don't worry, we are going to master this together. Let's start with..." and then immediately ask a foundational, easy question to start scaffolding.`;

      history.push({ role: 'user', content: autoPrompt });

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history,
            subject: currentSubjectContext,
            level: currentStudentLevel,
            currentQuestion: { topic: currentTopicContext, sub_topic: currentSubTopicContext },
            studentName: currentStudentName,
            studentId:    currentStudentId,
            parentId:     currentParentId,
            conversationId,
            lastWenaMode
          })
        });

        const data = await res.json();
        typingEl.remove();

        if (res.ok && !data.error) {
          appendBubble('tutor', data.reply);
          history.push({ role: 'assistant', content: data.reply });
          if (data.wena_mode) lastWenaMode = data.wena_mode;
        } else {
          appendBubble('tutor', "Hi " + sName + "! I saw you needed help with " + topic + ". Let's master it together. What's your first question?");
        }
      } catch (e) {
        typingEl.remove();
        appendBubble('tutor', "Hi " + sName + "! I'm Miss Wena. I see you want to work on " + topic + ". What's your first question?");
      } finally {
        isLoading = false;
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
      }
      return true;
    }
    return false;
  }


  // ── QUEST INTEGRATION ──

  // Replaces generic "Try asking" chips with topic-targeted quest chips.
  function injectQuestChips() {
    const section = document.getElementById('tutor-starter-prompts');
    if (!section) return;
    const topic = currentTopicContext
      ? decodeURIComponent(currentTopicContext).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'this topic';
    section.innerHTML = '';
    const label = document.createElement('p');
    label.className = 'text-xs font-bold text-muted uppercase tracking-wider mb-4';
    label.textContent = `Ask Miss Wena about ${topic}:`;
    section.appendChild(label);
    const chipWrap = document.createElement('div');
    chipWrap.className = 'flex flex-wrap gap-3';
    const chips = [
      `What were my mistakes from yesterday's ${topic} practice?`,
      `Explain a key concept in ${topic} step by step.`,
      `Give me a hint — what should I focus on in ${topic}?`,
      `What do examiners look for in ${topic} questions?`,
    ];
    chips.forEach(text => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary btn-sm starter-prompt hover-lift';
      btn.textContent = text;
      btn.addEventListener('click', () => {
        if (!chatInput.disabled) {
          chatInput.value = text;
          chatInput.focus();
          adjustTextareaHeight();
        }
      });
      chipWrap.appendChild(btn);
    });
    section.appendChild(chipWrap);
  }

  // Fires an AI-generated diagnostic opener at the start of Day 2 (Socratic mode).
  // Uses the from_quest URL param so the server builds the full Socratic system prompt.
  async function fireQuestOpener() {
    if (!fromQuestId) return;
    if (!currentTypingEl) currentTypingEl = appendTyping();
    try {
      const sb = await getSupabase();
      const { data: { session: openerSession } } = await sb.auth.getSession();
      const openerToken = openerSession?.access_token;
      const trigger = `Please open our Day 2 session. In under 100 words, briefly diagnose what I struggled with in yesterday's quiz and what we will focus on together today.`;
      const res = await fetch(`/api/chat?from_quest=${encodeURIComponent(fromQuestId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(openerToken && { 'Authorization': `Bearer ${openerToken}` }),
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: trigger }],
          subject: currentSubjectContext,
          level: currentStudentLevel,
          currentQuestion: { topic: currentTopicContext, sub_topic: currentSubTopicContext },
          studentName: currentStudentName,
          studentId:    currentStudentId,
          parentId:     currentParentId,
          conversationId,
          lastWenaMode
        }),
      });
      if (currentTypingEl) { currentTypingEl.remove(); currentTypingEl = null; }
      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          appendBubble('tutor', data.reply);
          // Keep hidden trigger in history so subsequent turns have context
          history.push({ role: 'user', content: trigger });
          history.push({ role: 'assistant', content: data.reply });
          if (data.wena_mode) lastWenaMode = data.wena_mode;
          questMessageCount = data.quest_message_count ?? 1;
          updateMarkCompleteBtn();
        }
      } else {
        appendBubble('tutor', `Hi! Let's work on ${currentTopicContext || 'your topic'} today. What from yesterday's practice would you like to revisit first?`);
      }
    } catch (err) {
      console.error('[quest-opener] failed:', err);
      if (currentTypingEl) { currentTypingEl.remove(); currentTypingEl = null; }
      appendBubble('tutor', `Hi! Today we're focusing on ${currentTopicContext || 'your topic'}. What part from yesterday tripped you up?`);
    }
  }

  function injectQuestTutorBanner(stepIndex, topicSlug) {
    const dayNum = stepIndex + 1;
    const topicDisplay = topicSlug
      ? decodeURIComponent(topicSlug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Quest';

    const banner = document.createElement('div');
    banner.id = 'quest-tutor-banner';
    banner.setAttribute('aria-label', `Plan Quest Day ${dayNum} tutor session`);
    banner.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:8px',
      'padding:10px 16px',
      'background:color-mix(in srgb, var(--brand-rose, #B76E79) 10%, var(--surface, #fff))',
      'border-bottom:1px solid color-mix(in srgb, var(--brand-rose, #B76E79) 20%, transparent)',
      'font-size:0.8rem',
      'font-weight:600',
      'color:var(--brand-rose, #B76E79)',
      'letter-spacing:0.08em',
      'text-transform:uppercase',
      'position:sticky',
      'top:0',
      'z-index:200'
    ].join(';');
    banner.textContent = `Plan Quest · Day ${dayNum} · ${topicDisplay} — Talk through what tripped you up yesterday`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  function insertMarkCompleteBtn() {
    if (!saveBtn) return;
    // Keep Save Notes visible — insert Mark Day 2 Complete to its LEFT

    markCompleteBtn = document.createElement('button');
    markCompleteBtn.id = 'quest-mark-complete-btn';
    markCompleteBtn.textContent = 'Mark Day 2 Complete';
    markCompleteBtn.disabled = true;
    markCompleteBtn.title = 'Exchange at least 8 messages with Miss Wena to unlock this';
    markCompleteBtn.style.cssText = [
      'padding:10px 20px',
      'border-radius:9999px',
      'background:var(--surface-container, #f0f0f0)',
      'color:var(--text-muted)',
      'border:1.5px solid var(--border-light)',
      'font-weight:700',
      'font-size:0.875rem',
      'cursor:not-allowed',
      'opacity:0.6',
      'transition:all 200ms ease'
    ].join(';');
    markCompleteBtn.addEventListener('click', handleDay2Complete);
    // Insert BEFORE saveBtn so it appears to its left in the flex container
    saveBtn.parentNode.insertBefore(markCompleteBtn, saveBtn);
  }

  function updateMarkCompleteBtn() {
    if (!markCompleteBtn) return;
    if (questMessageCount >= 8) {
      markCompleteBtn.disabled = false;
      markCompleteBtn.style.background = 'var(--brand-rose, #B76E79)';
      markCompleteBtn.style.color = 'var(--cream, #e3d9ca)';
      markCompleteBtn.style.borderColor = 'var(--brand-rose, #B76E79)';
      markCompleteBtn.style.cursor = 'pointer';
      markCompleteBtn.style.opacity = '1';
      markCompleteBtn.title = 'Mark your Day 2 session complete and return to your quest';
    }
  }

  async function handleDay2Complete() {
    if (!fromQuestId || questMessageCount < 8 || !markCompleteBtn) return;
    markCompleteBtn.disabled = true;
    markCompleteBtn.textContent = 'Saving…';

    try {
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const token = session?.access_token;

      // Auto-save Study Note. Was previously fire-and-forget; now we check the
      // response so the parent sees a clear retry path if the AI summarise fails.
      const cleanMessages = history
        .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map(m => ({ role: m.role, content: m.content }));

      if (cleanMessages.length >= 2) {
        let saveOk = false;
        let saveErr = null;
        try {
          const ctrl  = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 20000);
          const summRes = await fetch('/api/summarize-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              student_id: currentStudentId,
              subject: currentSubjectContext,
              topic: currentTopicContext,
              messages: cleanMessages,
              quest_id: fromQuestId
            }),
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          if (summRes.ok) {
            const sd = await summRes.json().catch(() => ({}));
            saveOk = !!(sd && sd.success);
            if (!saveOk) saveErr = sd.error || 'Server returned no success flag';
          } else {
            const errBody = await summRes.json().catch(() => ({}));
            const detail  = errBody.detail ? ` (${errBody.stage || 'server'}: ${errBody.detail})` : '';
            saveErr = `HTTP ${summRes.status}: ${errBody.error || 'unknown error'}${detail}`;
            console.error('[Day 2 auto-save] HTTP error:', summRes.status, errBody);
          }
        } catch (e) {
          saveErr = e.message || String(e);
          console.error('[Day 2 auto-save] Network/timeout:', e);
        }

        if (!saveOk) {
          const goAhead = confirm(
            'Could not auto-save your Miss Wena notes to the dashboard.\n\n' +
            'Reason: ' + (saveErr || 'unknown') + '\n\n' +
            'Click OK to mark Day 2 complete anyway (notes will be lost), or ' +
            'Cancel to stay on this page and try the "Save Notes" button manually first.'
          );
          if (!goAhead) {
            markCompleteBtn.disabled = false;
            markCompleteBtn.textContent = 'Mark Day 2 Complete';
            return;
          }
        }
      }

      // Advance quest step
      const res = await fetch(`/api/quests/${fromQuestId}/advance-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          step_index: fromQuestStep,
          trigger: 'tutor',
          score: null
        })
      });

      const celebData = await res.json();
      if (res.ok) {
        try {
          const xp = celebData.xp || {};
          const levelData = xp.levelData || {};
          const shaped = {
            completedDay:   fromQuestStep + 1,
            trigger:        'tutor',
            score:          null,
            xpAwarded:      (xp.totalXpAfter || 0) - (xp.totalXpBefore || 0),
            levelUp:        levelData.leveled_up ? {
              fromLevel: levelData.level_before,
              toLevel:   levelData.level_after,
              fromRank:  levelData.rank_before,
              toRank:    levelData.rank_after,
            } : null,
            badgesUnlocked: (celebData.badges_earned || []).map(b => ({
              id: b.id, name: b.name, description: b.description || '', rarity: b.rarity || 'common',
            })),
            questComplete: celebData.quest?.status === 'completed',
          };
          sessionStorage.setItem(`quest_celebration_${fromQuestId}`, JSON.stringify(shaped));
        } catch (e) { }
        window.location.href = `/quest?id=${fromQuestId}&returning=true`;
      } else {
        throw new Error(celebData.error || 'Failed to complete quest step');
      }
    } catch (err) {
      console.error('Day 2 complete error:', err);
      alert('Could not mark Day 2 complete: ' + err.message);
      markCompleteBtn.disabled = false;
      markCompleteBtn.textContent = 'Mark Day 2 Complete';
    }
  }

  // ── STUDY NOTES ENGINE: Generate & Save ──
  // Calls /api/summarize-chat (handled by lib/api/handlers.js handleSummarizeChat).
  // Endpoint expects: { student_id, subject, topic, messages }
  //   messages: array of {role, content} pairs (user/assistant only)
  //   Authorization: Bearer ${access_token}
  // Returns: { success: true } on success.
  async function generateStudyNote() {
    if (!currentStudentId || history.length < 2) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;border-top-color:currentColor;"></span> Saving...';

    try {
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();

      // Build the payload that handleSummarizeChat expects.
      // Filter to user/assistant messages only with {role, content} shape.
      const cleanMessages = history
        .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
        .map(m => ({ role: m.role, content: m.content }));

      if (cleanMessages.length < 2) {
        throw new Error('Need at least one user message and one tutor response to summarise.');
      }

      const res = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          student_id: currentStudentId,
          subject: currentSubjectContext,
          topic: currentTopicContext,
          messages: cleanMessages
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        saveBtn.innerHTML = '✅ Saved to Backpack';
        saveBtn.className = 'btn btn-success btn-sm hover-lift';
        setTimeout(() => {
          saveBtn.innerHTML = '💾 Save Notes';
          saveBtn.disabled = false;
          saveBtn.className = 'btn btn-secondary btn-sm hover-lift';
        }, 3000);
      } else {
        throw new Error(data.error || 'Save failed');
      }
    } catch (e) {
      console.error('Save Notes error:', e);
      alert('Failed to save note: ' + e.message);
      saveBtn.innerHTML = '💾 Save Notes';
      saveBtn.disabled = false;
      saveBtn.className = 'btn btn-secondary btn-sm hover-lift';
    }
  }
})();
