export const runtimeSource = `
(function(){
  const configEl = document.getElementById('arg-config');
  const config = configEl ? JSON.parse(configEl.textContent || '{}') : { rules: {}, files: {}, links: {}, preview: false };
  const result = (text) => { const el = document.querySelector('[data-arg-result]'); if (el) el.textContent = text; };

  const go = (target) => {
    if (!target) return;
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
    if (target) go(target); else result(config.notFoundText || '没有找到相关结果');
  };

  const checkLink = (port) => {
    if (!port) return;
    const raw = String(port).trim();
    const target = (config.links || {})[raw] || (config.links || {})[port] || ((config.files && config.files[raw]) ? raw : ((config.files && config.files[port]) ? port : null)) || raw;
    go(target);
  };

  window.ARG = { bind, go, checkRule, checkLink };

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
      const expected = String(config.password || '').trim().toLowerCase();
      const target = config.loginTarget || Object.values(config.links || {})[0] || 'node_files';
      const isMatch = (!expected) || (val === expected) || (val === 'yxzyddx') || (val === '0717') || (val === '一切自愿的大学');

      if (isMatch) {
        if (error) {
          error.style.color = '#10b981';
          error.textContent = '✓ 密码验证成功，正在解密载入档案...';
        }
        setTimeout(() => {
          go(target);
        }, 80);
      } else {
        if (error) {
          error.style.color = '#ef4444';
          error.textContent = '❌ 密码错误！提示：可在搜索“失踪”或“南鄣”新闻中获取暗号拼音首字母 (yxzyddx)';
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
    if (!contacts.length) return;
    let currentIdx = 0;
    const contactsList = container.querySelector('#contactsList');
    const nameEl = container.querySelector('#currentContactName');
    const bioEl = container.querySelector('#currentContactBio');
    const messagesEl = container.querySelector('#chatMessages');
    const choicesEl = container.querySelector('#chatChoicesArea');
    const form = container.querySelector('#chatForm');
    const input = container.querySelector('#chatInput');
    const searchInput = container.querySelector('#contactSearch');

    function renderContacts(filter){
      if (!contactsList) return;
      contactsList.innerHTML = '';
      contacts.forEach((c, idx) => {
        if (filter && !c.name.toLowerCase().includes(filter.toLowerCase())) return;
        const item = document.createElement('div');
        item.className = 'contact-item' + (idx === currentIdx ? ' active' : '');
        const last = c.lastMsg || (c.messages && c.messages[c.messages.length - 1]?.text) || (c.dialogue && c.dialogue[0]?.text) || '点击查看对话';
        item.innerHTML = '<div class="contact-avatar">' + renderAvatar(c.avatar, '👤') + '</div><div class="contact-info"><div class="contact-name">' + c.name + '</div><div class="contact-last-msg">' + last + '</div></div>' + (c.unread ? '<span class="contact-badge">1</span>' : '');
        item.addEventListener('click', () => {
          currentIdx = idx;
          c.unread = false;
          renderContacts(filter);
          loadChat(c);
        });
        contactsList.appendChild(item);
      });
    }

    if (searchInput) searchInput.addEventListener('input', (e) => renderContacts(e.target.value));

    function appendMessage(sender, text, avatar){
      if (!messagesEl) return;
      const row = document.createElement('div');
      const isUser = sender === 'user' || sender === 'player';
      row.className = 'msg-row ' + (isUser ? 'sent' : 'received');
      const av = isUser ? renderAvatar(config.userAvatar, '🧑') : renderAvatar(avatar || contacts[currentIdx]?.avatar, '👤');
      row.innerHTML = '<div class="msg-avatar">' + av + '</div><div class="msg-bubble">' + text + '</div>';
      messagesEl.appendChild(row);
      row.querySelectorAll('[data-arg-link], [data-arg-port]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          checkLink(link.dataset.argLink || link.dataset.argPort);
        });
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function renderChoices(options, contact){
      if (!choicesEl) return;
      choicesEl.innerHTML = '';
      if (!options || !options.length) return;
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'choice-pill-btn';
        btn.innerHTML = '<span>💬 ' + opt.text + '</span>' + (opt.target ? '<span class="pill-target"> ➔</span>' : '');
        btn.addEventListener('click', () => {
          choicesEl.innerHTML = '';
          appendMessage('user', opt.text);
          setTimeout(() => {
            if (opt.reply) appendMessage('npc', opt.reply, contact.avatar);
            if (opt.target) {
              appendMessage('npc', '线索入口：<a href="javascript:void(0)" class="arg-link-item" data-arg-link="' + opt.target + '">点击前往查看 ➔</a>', contact.avatar);
            }
          }, 300);
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

      // Support messages array
      if (contact.messages && contact.messages.length) {
        contact.messages.forEach(m => {
          appendMessage(m.sender, m.text, contact.avatar);
        });
      }

      // Support dialogue array
      if (contact.dialogue && contact.dialogue.length) {
        contact.dialogue.forEach(item => {
          if (item.sender === 'npc' && item.text) appendMessage('npc', item.text, contact.avatar);
          else if ((item.sender === 'user' || item.sender === 'player') && item.text) appendMessage('user', item.text);
          else if (item.sender === 'choice' && item.options) renderChoices(item.options, contact);
        });
      }

      // Support choices array
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
