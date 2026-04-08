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
  let currentSubjectContext = 'general';
  let currentTopicContext = 'mixed';
  let messageQueue = [];
  let batchTimeout = null;
  const BATCH_DELAY_MS = 1500; // Wait 1.5 seconds after last message before sending


  // Canvas State
  let isDrawMode = false;
  let ctx = null;
  let isDrawing = false;
  let canvasHasContent = false;

  // DOM
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const saveBtn = document.getElementById('saveChatBtn'); // Study Note Button
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

    // Study Note save action
    if (saveBtn) saveBtn.addEventListener('click', generateStudyNote);

    // Welcome message
    appendBubble('tutor', "Hello! I'm Miss Wena. 😊 I'm your Superholic Tutor, so you can ask me about Mathematics, Science, or English all in one place! Need help with a bar model, a science experiment, or grammar? Let's figure it out together!");
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

  let currentTypingEl = null; 

// 2. Replace your handleSend and processBatchQueue with this:
async function handleSend() {
  if (isLoading) return;
  const text = chatInput.value.trim();
  const hasImage = isDrawMode && canvasHasContent;
  
  if (!text && !hasImage) return;

  const imageData = hasImage ? canvas.toDataURL('image/png') : null;
  appendBubble('user', text, imageData);
  
  messageQueue.push({ text, image: imageData });
  
  chatInput.value = '';
  if (hasImage) window.clearCanvas();

  if (batchTimeout) clearTimeout(batchTimeout);
  
  // Create the typing dots globally so the queue can delete them later
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
  history.push({ role: 'user', content: combinedText, image: lastImage });

  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: history }),
    });

    const data = await res.json();

    // Safely remove the typing element!
    if (currentTypingEl) {
        currentTypingEl.remove();
        currentTypingEl = null;
    }

    if (!res.ok || data.error) {
      // Gracefully handle the 15 RPM limit 500 error
      if ((data.error && data.error.includes("temporarily unavailable")) || res.status === 500) {
          appendBubble('tutor', 'Miss Wena is thinking a bit too fast! 😅 Give me about 30 seconds to catch my breath before we continue.');
      } else {
          appendBubble('tutor', data.error || 'Sorry, something went wrong. Please try again.');
      }
      history.pop(); 
      chatInput.value = combinedText; // Give the student their text back!
    } else {
      appendBubble('tutor', data.reply);
      history.push({ role: 'assistant', content: data.reply });
      
      if (saveBtn && history.filter(m => m.role === 'user').length >= 1) {
        saveBtn.classList.remove('hidden');
      }
    }
  } catch (err) {
    // Safely remove the typing element on a hard network crash
    if (currentTypingEl) {
        currentTypingEl.remove();
        currentTypingEl = null;
    }
    appendBubble('tutor', 'Could not reach the tutor. Please check your connection.');
    history.pop();
    chatInput.value = combinedText; 
  } finally {
    isLoading = false;
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

  // ── DOM Helpers ──
  function formatMessage(text) {
    let safe = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    
    // Convert LaTeX fractions \frac{1}{2} to 1/2
    safe = safe.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2');
    // Clean up annoying $ delimiters wrapped around equations or fractions
    safe = safe.replace(/\$([^$]*?[/+\-=][^$]*?)\$/g, '$1');
    safe = safe.replace(/\$\s*([0-9a-zA-Z])\s*\$/g, '$1');
    
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

    // Add Text with robust text wrapping
    if (text) {
      const textContainer = document.createElement('div');
      textContainer.style.whiteSpace = 'pre-wrap';
      textContainer.style.wordBreak = 'break-word';
      textContainer.style.overflowWrap = 'anywhere';
      textContainer.style.width = '100%'; // <-- ADD THIS LINE
      textContainer.innerHTML = formatMessage(text);
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
      const sb = await window.getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      // --- UNIFIED STATE RESOLVER ---
      const urlParams = new URLSearchParams(window.location.search);
      let activeStudentId = urlParams.get('student') || localStorage.getItem('shl_active_student_id');

      const { data: students } = await sb.from('students').select('id').eq('parent_id', session.user.id);
      
      let student = (students || []).find(s => s.id === activeStudentId) || (students || [])[0];
      
      if (student) {
        currentStudentId = student.id;
        localStorage.setItem('shl_active_student_id', currentStudentId);
      }
      // ------------------------------

    } catch (e) {
      console.error("Tutor state resolution failed:", e);
    }
  }

  function handleRemedialIntent() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'remedial' && params.get('topic')) {
      const banner = document.getElementById('remedial-banner');
      const topicEl = document.getElementById('quest-topic-name');
      const topic = params.get('topic').replace(/-/g, ' ');
      
      currentSubjectContext = params.get('subject') || 'general';
      currentTopicContext = params.get('topic');

      topicEl.textContent = topic;
      banner.classList.remove('hidden');

      const score = params.get('score');
      history.push({
        role: 'user',
        content: `SYSTEM CONTEXT: The student scored ${score}% in ${topic}. Initiate a highly-encouraging remedial session. Break down the basics step-by-step and ask a simple checking question.`
      });
    }
  }

  // ── STUDY NOTES ENGINE: Generate & Save ──
  async function generateStudyNote() {
    if (!currentStudentId || history.length < 2) return;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;border-top-color:var(--brand-rose);"></span> Saving...';

    try {
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      
      const res = await fetch('/api/summarize-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ 
          student_id: currentStudentId, 
          subject: currentSubjectContext, 
          topic: currentTopicContext, 
          messages: history 
        })
      });
      
      const data = await res.json();
      if(data.success) {
         saveBtn.innerHTML = '✅ Saved to Backpack';
         saveBtn.style.color = 'var(--brand-mint)';
         saveBtn.style.background = 'rgba(5, 150, 105, 0.1)';
         saveBtn.style.borderColor = 'rgba(5, 150, 105, 0.3)';
         setTimeout(() => { 
           saveBtn.innerHTML = '💾 Save Notes'; 
           saveBtn.disabled = false; 
           saveBtn.style.color = 'var(--brand-rose)';
           saveBtn.style.background = 'rgba(183,110,121,0.1)';
           saveBtn.style.borderColor = 'rgba(183,110,121,0.3)';
         }, 3000);
      } else { 
         throw new Error(data.error); 
      }
    } catch(e) {
      alert("Failed to save note: " + e.message);
      saveBtn.innerHTML = '💾 Save Notes';
      saveBtn.disabled = false;
    }
  }
})();