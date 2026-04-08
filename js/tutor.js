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
  const BATCH_DELAY_MS = 1500;

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

    document.querySelectorAll('.starter-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!chatInput.disabled) {
          chatInput.value = btn.textContent;
          chatInput.focus();
          adjustTextareaHeight();
        }
      });
    });

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    chatInput.addEventListener('input', adjustTextareaHeight);

    modeTextBtn.addEventListener('click', () => setMode('text'));
    modeDrawBtn.addEventListener('click', () => setMode('draw'));
    document.getElementById('clearCanvasBtn').addEventListener('click', clearCanvas);

    saveBtn.addEventListener('click', handleSaveNotes);

    try {
      const sb = await getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const urlParams = new URLSearchParams(window.location.search);
      currentStudentId = urlParams.get('student') || localStorage.getItem('shl_active_student_id');
      currentSubjectContext = urlParams.get('subject') || 'general';
      currentTopicContext = urlParams.get('topic') || 'mixed';
      
      const { data: profile } = await sb.from('users').select('subscription_tier').eq('id', user.id).single();
      const isTrial = !profile || profile.subscription_tier === 'trial';
      
      if (isTrial && currentStudentId) {
        const { count } = await sb.from('ai_tutor_logs')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', currentStudentId);
          
        if (count >= TRIAL_AI_LIMIT) {
          limitBanner.style.display = 'block';
          chatInput.disabled = true;
          sendBtn.disabled = true;
          modeDrawBtn.disabled = true;
          chatInput.placeholder = "Free trial limit reached.";
        }
      }

    } catch (e) {
      console.warn("Auth check failed in tutor.js", e);
    }
  }

  function adjustTextareaHeight() {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  }

  function setMode(mode) {
    isDrawMode = (mode === 'draw');
    if (isDrawMode) {
      modeDrawBtn.className = 'btn btn-sm bg-sage-dark text-white';
      modeTextBtn.className = 'btn btn-sm btn-ghost';
      drawArea.style.display = 'block';
      setTimeout(() => {
        const rect = canvas.parentElement.getBoundingClientRect();
        if (canvas.width !== rect.width) {
          const imgData = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
          canvas.width = rect.width;
          canvas.height = 200;
          ctx = canvas.getContext('2d');
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#2C3E3A';
          if (imgData) ctx.putImageData(imgData, 0, 0);
        }
      }, 50);
    } else {
      modeTextBtn.className = 'btn btn-sm bg-sage-dark text-white';
      modeDrawBtn.className = 'btn btn-sm btn-ghost';
      drawArea.style.display = 'none';
    }
  }

  function initCanvas() {
    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = 200;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#2C3E3A';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x, y };
    };

    const start = (e) => { isDrawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const draw = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); canvasHasContent = true; e.preventDefault(); };
    const stop = () => { if (isDrawing) isDrawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseout', stop);
    canvas.addEventListener('touchstart', start, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    canvas.addEventListener('touchend', stop);
  }

  function clearCanvas() {
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvasHasContent = false;
    }
  }

  function addMessage(role, content, imageData = null) {
    const isUser = role === 'user';
    const wrap = document.createElement('div');
    wrap.className = `flex gap-4 ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`;
    wrap.style.maxWidth = '85%';

    const avatar = document.createElement('img');
    avatar.src = isUser ? '../assets/images/kid_studying.png' : '../assets/images/wena.png';
    avatar.alt = isUser ? 'You' : 'Miss Wena';
    avatar.className = 'wena-avatar';
    avatar.style.width = '40px';
    avatar.style.height = '40px';
    avatar.style.borderWidth = '2px';

    const bubble = document.createElement('div');
    bubble.className = isUser ? 'chat-bubble-user text-sm' : 'chat-bubble-tutor text-sm';
    
    if (imageData) {
      const img = document.createElement('img');
      img.src = imageData;
      img.style.maxWidth = '100%';
      img.style.borderRadius = 'var(--radius-sm)';
      img.style.marginBottom = content ? 'var(--space-2)' : '0';
      img.style.backgroundColor = '#FFF'; 
      bubble.appendChild(img);
    }
    
    if (content) {
      const text = document.createElement('p');
      text.style.margin = '0';
      text.style.whiteSpace = 'pre-wrap';
      text.textContent = content;
      bubble.appendChild(text);
    }

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    const wrap = document.createElement('div');
    wrap.id = 'typing-indicator';
    wrap.className = 'flex gap-4 self-start';
    wrap.style.maxWidth = '85%';

    wrap.innerHTML = `
      <img src="../assets/images/wena.png" alt="Miss Wena" class="wena-avatar" style="width: 40px; height: 40px; border-width: 2px;">
      <div class="chat-bubble-tutor flex items-center h-10">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    `;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function handleSend() {
    if (isLoading) return;
    const text = chatInput.value.trim();
    let imgData = null;
    
    if (isDrawMode && canvasHasContent) {
      imgData = canvas.toDataURL('image/png');
    }

    if (!text && !imgData) return;

    addMessage('user', text, imgData);
    
    messageQueue.push({
      role: 'user',
      content: text,
      image: imgData
    });

    history.push({ role: 'user', content: text });

    chatInput.value = '';
    chatInput.style.height = 'auto';
    if (isDrawMode) clearCanvas();
    
    if (history.length >= 2) saveBtn.disabled = false;

    clearTimeout(batchTimeout);
    batchTimeout = setTimeout(processQueue, BATCH_DELAY_MS);
  }

  async function processQueue() {
    if (messageQueue.length === 0) return;
    isLoading = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;
    showTyping();

    const payload = {
      messages: messageQueue,
      student_id: currentStudentId,
      subject: currentSubjectContext,
      topic: currentTopicContext
    };

    messageQueue = [];

    try {
      const sb = await getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      
      const res = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      
      hideTyping();
      addMessage('assistant', data.reply);
      history.push({ role: 'assistant', content: data.reply });

    } catch (err) {
      console.error(err);
      hideTyping();
      addMessage('assistant', "I'm having trouble connecting to the lab right now. Could you try asking that again?");
    } finally {
      isLoading = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  async function handleSaveNotes() {
    if (history.length < 2) return;
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-sm" style="width:14px;height:14px;border-width:2px;display:inline-block;margin-right:6px;border-top-color:currentColor;"></span> Saving...';

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
         saveBtn.className = 'btn btn-success btn-sm hover-lift';
         setTimeout(() => { 
           saveBtn.innerHTML = '💾 Save Notes'; 
           saveBtn.disabled = false; 
           saveBtn.className = 'btn btn-secondary btn-sm hover-lift';
         }, 3000);
      } else {
        throw new Error("Save failed");
      }
    } catch(err) {
      console.error(err);
      saveBtn.innerHTML = '❌ Save Failed';
      saveBtn.className = 'btn btn-sm hover-lift';
      saveBtn.style.borderColor = 'var(--brand-error)';
      saveBtn.style.color = 'var(--brand-error)';
      setTimeout(() => { 
        saveBtn.innerHTML = '💾 Save Notes'; 
        saveBtn.disabled = false; 
        saveBtn.className = 'btn btn-secondary btn-sm hover-lift';
        saveBtn.style = '';
      }, 3000);
    }
  }
})();