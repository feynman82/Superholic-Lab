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
  let currentStudentPhoto = '../assets/images/kid_studying.png'; // Default fallback
  let currentSubjectContext = 'general';
  let currentTopicContext = 'mixed';
  let messageQueue = [];
  let batchTimeout = null;
  const BATCH_DELAY_MS = 1500;
  let _sessionTracked = false; // Prevents duplicate Tutor Session analytics events

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

    // If the student clicked "Ask Miss Wena", auto-trigger the data-driven greeting.
    // If not, drop the standard greeting.
    const isRemedial = await handleRemedialIntent();
    if (!isRemedial) {
      appendBubble('tutor', "Hello! I'm Miss Wena. 😊 I'm your Superholic Tutor, so you can ask me about Mathematics, Science, or English all in one place! Need help with a bar model, a science experiment, or grammar? Let's figure it out together!");
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

    // DEEP TECH ENGINE: Inject Cognitive Diagnostic Context (Runs once per session)
    if (currentStudentId && !history.some(m => m.role === 'system' && m.content.includes('[Diagnostic Alert]'))) {
      try {
        const db = await getSupabase();
        // Dynamic import of the weakness engine
        const { runCognitiveDiagnosis } = await import('../js/analyze-weakness.js');
        const diagnostic = await runCognitiveDiagnosis(db, currentStudentId, currentSubjectContext);

        if (diagnostic) {
          history.push({
            role: 'system',
            content: `[Diagnostic Alert] The engine has detected the student's root weakness is ${diagnostic.identified_weakness} with a mastery score of ${diagnostic.mastery_score}. Their specific failed skills are: ${diagnostic.failed_skills.join(', ')}. If they ask for help, guide them towards mastering these prerequisites first.`
          });
        }
      } catch (err) {
        console.error('Failed to load cognitive diagnostic engine:', err);
      }
    }

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
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

        if (saveBtn && history.filter(m => m.role === 'user').length >= 1) {
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

      const urlParams = new URLSearchParams(window.location.search);
      let activeStudentId = urlParams.get('student') || localStorage.getItem('shl_active_student_id');

      // Fetch student data INCLUDING photo_url
      const { data: students } = await sb.from('students').select('id, photo_url').eq('parent_id', session.user.id);
      let student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];

      if (student) {
        currentStudentId = student.id;
        currentStudentPhoto = student.photo_url || '../assets/images/kid_studying.png';
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
          body: JSON.stringify({ messages: history })
        });

        const data = await res.json();
        typingEl.remove();

        if (res.ok && !data.error) {
          appendBubble('tutor', data.reply);
          history.push({ role: 'assistant', content: data.reply });
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
