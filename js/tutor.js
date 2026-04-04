/**
 * tutor.js
 * Omni-Tutor 3.0 Chat Logic with Multi-modal Canvas Support.
 */

(() => {
  const TRIAL_AI_LIMIT = 10;
  let history = [];
  let isLoading = false;
  let currentStudentId = null;
  
  // Canvas State
  let isDrawMode = false;
  let ctx = null;
  let isDrawing = false;
  let canvasHasContent = false;

  // DOM
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
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
        }
      });
    });

    // Check student usage & Remedial intent
    checkStudentLimits();
    handleRemedialIntent();

    // Welcome message
    appendBubble('assistant', "Hello! I'm Miss Wena. 😊 I'm your Superholic Tutor, so you can ask me about Mathematics, Science, or English all in one place! Need help with a bar model, a science experiment, or grammar? Let's figure it out together!");
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
    const stop = () => { if(isDrawing) isDrawing = false; };

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop); canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stop);
  }

  window.clearCanvas = () => {
    if(ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvasHasContent = false;
    }
  };

  // ── Mode Toggles ──
  modeTextBtn.addEventListener('click', () => {
    isDrawMode = false;
    drawArea.classList.remove('is-open');
    modeTextBtn.style.background = 'var(--sage-dark)'; modeTextBtn.style.color = 'white';
    modeDrawBtn.style.background = 'transparent'; modeDrawBtn.style.color = 'var(--text-muted)';
  });

  modeDrawBtn.addEventListener('click', () => {
    isDrawMode = true;
    drawArea.classList.add('is-open');
    modeDrawBtn.style.background = 'var(--sage-dark)'; modeDrawBtn.style.color = 'white';
    modeTextBtn.style.background = 'transparent'; modeTextBtn.style.color = 'var(--text-muted)';
    
    // Resize canvas safely after display block
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 200;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5; 
    ctx.lineCap = 'round'; 
    ctx.strokeStyle = '#2C3E3A';
  });

  // ── Chat Logic ──
  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } });

  async function handleSend() {
    if (isLoading) return;
    const text = chatInput.value.trim();
    const hasImage = isDrawMode && canvasHasContent;
    
    if (!text && !hasImage) return;

    // Fast fail for limits
    if (limitBanner && !limitBanner.classList.contains('hidden')) return;

    isLoading = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Grab image data if present
    const imageData = hasImage ? canvas.toDataURL('image/png') : null;

    // UI Updates
    appendBubble('user', text, imageData);
    
    // Fix 500 Error: Strip old images from history to prevent Vercel 4.5MB payload crashes
    history.forEach(msg => msg.image = null);
    history.push({ role: 'user', content: text, image: imageData });
    
    chatInput.value = '';
    if (hasImage) window.clearCanvas(); // reset for next turn
    
    const typingEl = appendTyping();

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      typingEl.remove();

      if (!res.ok || data.error) {
        appendBubble('assistant', data.error || 'Sorry, something went wrong. Please try again.');
        history.pop(); // Remove failed user message
      } else {
        appendBubble('assistant', data.reply);
        history.push({ role: 'assistant', content: data.reply });
        
        if (currentStudentId) incrementDailyUsage(currentStudentId, 'ai_tutor_messages').catch(()=>{});
      }
    } catch (err) {
      typingEl.remove();
      appendBubble('assistant', 'Could not reach the tutor. Please check your connection.');
      history.pop();
    } finally {
      isLoading = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  // ── DOM Helpers ──
  function formatMessage(text) {
    // Escapes HTML then replaces **bold** with the branded strong tag
    let safe = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-rose">$1</strong>');
  }

  function appendBubble(role, text, imageBase64 = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble-${role}`;

    // Add Image if present
    if (imageBase64) {
      const img = document.createElement('img');
      img.src = imageBase64;
      img.className = 'w-full h-auto bg-white rounded border border-light mb-2';
      bubble.appendChild(img);
    }

    // Add Text (parsing newlines and bold syntax)
    if (text) {
      const textContainer = document.createElement('div');
      const lines = String(text).split('\n');
      lines.forEach((line, i) => {
        const span = document.createElement('span');
        span.innerHTML = formatMessage(line);
        textContainer.appendChild(span);
        if (i < lines.length - 1) textContainer.appendChild(document.createElement('br'));
      });
      bubble.appendChild(textContainer);
    }

    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return bubble;
  }

  function appendTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(el);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return el;
  }

  // ── Context & Limit Handling ──
  async function checkStudentLimits() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const db = await getSupabase();
      const { data: students } = await db.from('students').select('id').eq('parent_id', user.id).limit(1);
      if (students?.length) {
        currentStudentId = students[0].id;
        const usage = await checkDailyUsage(currentStudentId);
        if (usage && usage.ai_tutor_messages >= TRIAL_AI_LIMIT) {
          limitBanner.classList.remove('hidden');
        }
      }
    } catch {}
  }

  function handleRemedialIntent() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'remedial' && params.get('topic')) {
      const banner = document.getElementById('remedial-banner');
      const topicEl = document.getElementById('quest-topic-name');
      const topic = params.get('topic').replace(/-/g, ' ');
      
      topicEl.textContent = topic;
      banner.classList.remove('hidden');

      // Secretly inject system context for Miss Wena
      const score = params.get('score');
      history.push({
        role: 'user',
        content: `SYSTEM CONTEXT: The student scored ${score}% in ${topic}. Initiate a highly-encouraging remedial session. Break down the basics step-by-step and ask a simple checking question.`
      });
    }
  }
})();