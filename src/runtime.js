export const runtimeSource = `
(function(){
  const configEl = document.getElementById('arg-config');
  const config = configEl ? JSON.parse(configEl.textContent || '{}') : { rules: {}, files: {}, links: {}, preview: false };
  const result = (text) => { const el = document.querySelector('[data-arg-result]'); if (el) el.textContent = text; };

  // ==================== Clue & Story State Engine ====================
  try {
    const visitedStr = sessionStorage.getItem('arg_visited_nodes') || '[]';
    const visited = JSON.parse(visitedStr);
    const currentPageId = config.nodeId || config.pageName || window.location.pathname.split('/').pop().replace('.html', '');
    if (currentPageId && !visited.includes(currentPageId)) {
      visited.push(currentPageId);
      sessionStorage.setItem('arg_visited_nodes', JSON.stringify(visited));
    }
  } catch (e) {}

  function hasClue(req) {
    if (!req) return true;
    try {
      const visited = JSON.parse(sessionStorage.getItem('arg_visited_nodes') || '[]');
      const reqList = String(req).split(',').map(s => s.trim().toLowerCase());
      return reqList.every(r => visited.some(v => String(v).toLowerCase() === r));
    } catch (e) {
      return true;
    }
  }

  // ==================== Web Audio Synthesizer (Zero-Asset Offline Engine) ====================
  let audioCtx = null;
  function getAudioCtx(){
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSynthSound(kind){
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;

      if (kind === 'click' || kind === 'type') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(kind === 'type' ? 380 + Math.random() * 160 : 700, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } else if (kind === 'notify') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (kind === 'unlock') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.06);
          osc.stop(ctx.currentTime + i * 0.06 + 0.22);
        });
      } else if (kind === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch (e) {}
  }

  // ==================== Typewriter Typography Engine ====================
  function applyTypewriter(el, speed = 20){
    if (!el || el.dataset.typewriterDone) return;
    const fullText = el.textContent || '';
    if (!fullText.trim() || fullText.length < 3) return;
    el.dataset.typewriterDone = 'pending';
    el.textContent = '';
    
    let i = 0;
    let timer = null;
    
    function complete(){
      if (timer) clearInterval(timer);
      el.textContent = fullText;
      el.dataset.typewriterDone = 'true';
      document.removeEventListener('click', complete);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e){
      if (e.key === ' ' || e.key === 'Enter') complete();
    }

    document.addEventListener('click', complete, { once: true });
    document.addEventListener('keydown', onKey, { once: true });

    timer = setInterval(() => {
      if (i < fullText.length) {
        el.textContent += fullText[i];
        if (i % 2 === 0) playSynthSound('type');
        i++;
      } else {
        complete();
      }
    }, speed);
  }

  // ==================== Core Routing ====================
  const go = (target) => {
    if (!target) return;
    playSynthSound('click');
    const key = String(target).trim();
    const next = (config.files && config.files[key]) ? config.files[key] : ((config.files && config.files[target]) ? config.files[target] : key);
    if (config.preview && (window.parent !== window || window.top !== window)) {
      window.parent.postMessage({ type: 'arg-route', target: key }, '*');
    } else {
      window.location.href = next.endsWith('.html') ? next : next + '.html';
    }
  };

  const checkRule = (kind, value) => {
    const key = String(value || '').trim().toLowerCase();
    const target = (config.rules[kind] || {})[key];
    if (target) {
      playSynthSound('click');
      go(target);
    } else {
      playSynthSound('error');
      result(config.notFoundText || '没有找到相关结果');
    }
  };

  const checkLink = (port) => {
    if (!port) return;
    playSynthSound('click');
    const raw = String(port).trim();
    const target = (config.links || {})[raw] || (config.links || {})[port] || ((config.files && config.files[raw]) ? raw : ((config.files && config.files[port]) ? port : null)) || raw;
    go(target);
  };

  window.ARG = { bind, go, checkRule, checkLink, playSynthSound };

  function bindSearch(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const input = form.querySelector('[data-arg-input="keyword"]') || form.querySelector('input[type="text"]') || form.querySelector('input');
      checkRule('search', input ? input.value : '');
    });
  }

  function bindLogin(form){
    const input = form.querySelector('[data-arg-input="password"]') || form.querySelector('input[type="password"]') || form.querySelector('input');
    const error = form.querySelector('[data-arg-error]') || form.querySelector('#error');
    const submitBtn = form.querySelector('[data-arg-submit], button[type="submit"], button');

    function doLogin(){
      const val = (input ? input.value : '').trim().toLowerCase();
      const rawExpected = String(config.password || '').trim().toLowerCase();
      const target = config.loginTarget || Object.values(config.links || {})[0] || '';
      
      const allowedPasswords = rawExpected ? rawExpected.split(/[,，;|/]+/).map(s => s.trim()).filter(Boolean) : [];
      const isMatch = allowedPasswords.length === 0 ? true : allowedPasswords.includes(val);

      if (isMatch) {
        playSynthSound('unlock');
        if (error) {
          error.style.color = '#10b981';
          error.textContent = '✓ 密码验证成功，正在解密载入...';
        }
        setTimeout(() => {
          if (target) go(target);
        }, 80);
      } else {
        playSynthSound('error');
        if (error) {
          error.style.color = '#ef4444';
          error.textContent = config.errorMessage || '❌ 密码错误，请重新输入！';
        }
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      e.stopPropagation();
      doLogin();
      return false;
    });

    if (submitBtn) {
      submitBtn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        doLogin();
      });
    }

    if (input) {
      input.addEventListener('keydown', function(e){
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          doLogin();
        }
      });
    }
  }

  function isImg(src){
    if (typeof src !== 'string') return false;
    const s = src.split('?')[0].toLowerCase();
    return s.startsWith('data:image/') || s.startsWith('blob:') || s.endsWith('.png') || s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.gif') || s.endsWith('.webp') || s.endsWith('.svg') || s.endsWith('.ico');
  }

  function renderAvatar(src, fallback){
    if (!src) return fallback || '👤';
    if (isImg(src)) return '<img src="' + src.replace(/"/g, '&quot;') + '" class="avatar-img" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" alt="avatar">';
    return src;
  }

  function bindChat(container){
    const contacts = config.contacts || [];
    let currentIdx = 0;
    const contactsList = container.querySelector('#contactsList');
    const nameEl = container.querySelector('#currentContactName');
    const bioEl = container.querySelector('#currentContactBio');
    const messagesEl = container.querySelector('#chatMessages');
    const choicesEl = container.querySelector('#chatChoicesArea');
    const form = container.querySelector('#chatForm');
    const input = container.querySelector('#chatInput');

    if (!contacts.length) {
      if (contactsList) {
        contactsList.innerHTML = '<div style="padding:16px 10px;text-align:center;color:var(--text-muted, #888);font-size:12px;">暂无联系人</div>';
      }
      if (messagesEl) {
        messagesEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted, #888);font-size:13px;">暂无对话内容</div>';
      }
      return;
    }

    function renderContacts(){
      if (!contactsList) return;
      contactsList.innerHTML = '';
      contacts.forEach((c, idx) => {
        const item = document.createElement('div');
        item.className = 'contact-item' + (idx === currentIdx ? ' active' : '');
        item.innerHTML = '<div class="contact-avatar">' + renderAvatar(c.avatar, '👤') + '</div>' +
          '<div class="contact-meta"><div class="contact-name">' + (c.name || '联系人') + '</div>' +
          '<div class="contact-bio">' + (c.bio || '') + '</div></div>';
        item.addEventListener('click', () => {
          playSynthSound('click');
          currentIdx = idx;
          renderContacts();
          loadChat(contacts[idx]);
        });
        contactsList.appendChild(item);
      });
    }

    function appendMessage(sender, text, avatar){
      if (!messagesEl) return;
      const isUser = sender === 'user' || sender === 'player';
      const row = document.createElement('div');
      row.className = 'msg-row ' + (isUser ? 'msg-user sent' : 'msg-npc received');
      
      const avDiv = document.createElement('div');
      avDiv.className = 'msg-avatar';
      avDiv.innerHTML = isUser ? '👤' : renderAvatar(avatar, '🤖');

      const bubble = document.createElement('div');
      bubble.className = 'msg-bubble';
      bubble.textContent = text;
      
      if (!isUser) {
        playSynthSound('notify');
      }

      if (isUser) {
        // WeChat User style: [Bubble] [Avatar] on far right
        row.appendChild(bubble);
        row.appendChild(avDiv);
      } else {
        // WeChat NPC style: [Avatar] [Bubble] on left
        row.appendChild(avDiv);
        row.appendChild(bubble);
      }
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function renderChoices(choices, contact){
      if (!choicesEl) return;
      choicesEl.innerHTML = '';
      if (!choices || !choices.length) return;
      
      const unlockedChoices = choices.filter(choice => hasClue(choice.requires || choice.req));
      
      if (unlockedChoices.length === 0) {
        const hint = document.createElement('div');
        hint.style.cssText = 'padding: 8px 14px; font-size: 11.5px; color: #94a3b8; font-style: italic; text-align: center; width: 100%;';
        hint.textContent = '（暂无可提交的调查物证。请先在电脑桌面、灵异论坛与全网搜索引擎中搜集线索...）';
        choicesEl.appendChild(hint);
        return;
      }

      unlockedChoices.forEach(choice => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => {
          playSynthSound('click');
          appendMessage('user', choice.text);
          if (choice.reply) {
            setTimeout(() => appendMessage('npc', choice.reply, contact.avatar), 300);
          }
          if (choice.target) {
            setTimeout(() => go(choice.target), choice.reply ? 600 : 250);
          }
        });
        choicesEl.appendChild(btn);
      });
    }

    function loadChat(contact){
      if (nameEl) nameEl.textContent = contact.name;
      if (bioEl) bioEl.textContent = contact.bio || '';
      if (messagesEl) messagesEl.innerHTML = '';
      if (choicesEl) choicesEl.innerHTML = '';

      const timeDiv = document.createElement('div');
      timeDiv.className = 'msg-time-divider';
      timeDiv.textContent = '—— 今日对话加密保护中 ——';
      messagesEl.appendChild(timeDiv);

      if (contact.messages && contact.messages.length) {
        contact.messages.forEach(m => {
          appendMessage(m.sender, m.text, contact.avatar);
        });
      }

      if (contact.dialogue && contact.dialogue.length) {
        contact.dialogue.forEach(item => {
          if (item.sender === 'npc' && item.text) appendMessage('npc', item.text, contact.avatar);
          else if ((item.sender === 'user' || item.sender === 'player') && item.text) appendMessage('user', item.text);
          else if (item.sender === 'choice' && item.options) renderChoices(item.options, contact);
        });
      }

      if (contact.choices && contact.choices.length) {
        renderChoices(contact.choices, contact);
      }
    }

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        appendMessage('user', text);
        const contact = contacts[currentIdx];
        setTimeout(() => appendMessage('npc', '收到。请继续核查其他线索。', contact?.avatar), 350);
      });
    }

    renderContacts();
    if (contacts.length > 0) loadChat(contacts[0]);
  }

  let bound = false;
  function bind(){
    if (bound) return;
    const comps = document.querySelectorAll('[data-arg-component]');
    if (comps.length) bound = true;
    document.querySelectorAll('[data-arg-component="search"]').forEach(bindSearch);
    document.querySelectorAll('[data-arg-component="login"]').forEach(bindLogin);
    document.querySelectorAll('[data-arg-component="chat"]').forEach(bindChat);

    // Apply typewriter on configured text bodies
    if (config.typewriter) {
      document.querySelectorAll('[data-arg-slot="body"], [data-arg-slot="message"]').forEach(el => applyTypewriter(el, 18));
    }

    // Atmosphere overlay
    if (config.atmosphere) {
      document.body.classList.add('arg-atmosphere-' + config.atmosphere);
    }

    // Click handler for all links/ports
    document.addEventListener('click', function(e){
      const el = e.target && e.target.closest ? e.target.closest('[data-arg-link], [data-arg-port]') : null;
      if (el) {
        e.preventDefault();
        const port = el.dataset.argLink || el.dataset.argPort;
        if (port) checkLink(port);
      }
    });

    // Double click handler for desktop icons
    document.addEventListener('dblclick', function(e){
      const el = e.target && e.target.closest ? e.target.closest('[data-arg-link], [data-arg-port]') : null;
      if (el) {
        e.preventDefault();
        const port = el.dataset.argLink || el.dataset.argPort;
        if (port) checkLink(port);
      }
    });

    // Expose official API for custom templates
    window.ARG_RUNTIME = {
      go: go,
      checkLink: checkLink,
      playSynthSound: playSynthSound,
      triggerClue: triggerClue,
      getClues: getClues,
      config: config
    };
  }

  bind();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  }
  window.addEventListener('load', bind);
})();`;

export function runtimeScript(config) {
  return `<script>window.ARG_CONFIG=${JSON.stringify(config)};${runtimeSource}</script>`;
}
