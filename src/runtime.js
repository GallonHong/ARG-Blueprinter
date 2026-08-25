export const runtimeSource = `
(function(){
  const configEl = document.getElementById('arg-config');
  const config = configEl ? JSON.parse(configEl.textContent || '{}') : { rules: {}, files: {}, links: {}, preview: false };
  const result = (text) => { const el = document.querySelector('[data-arg-result]'); if (el) el.textContent = text; };
  const go = (target) => {
    const next = config.files[target] || target;
    if (!next) return;
    if (config.preview && window.parent !== window) window.parent.postMessage({ type: 'arg-route', target }, '*');
    else window.location.href = next;
  };
  const checkRule = (kind, value) => {
    const target = (config.rules[kind] || {})[String(value).trim().toLowerCase()];
    if (target) go(target); else result('没有找到相关结果');
  };
  const checkLink = (port) => go((config.links || {})[port]);
  window.ARG = { bind, go, checkRule, checkLink };
  function bindSearch(form){ form.addEventListener('submit', function(e){ e.preventDefault(); const input=form.querySelector('[data-arg-input="keyword"]'); checkRule('search', input ? input.value : ''); }); }
  function bindLogin(form){ form.addEventListener('submit', function(e){ e.preventDefault(); const input=form.querySelector('[data-arg-input="password"]'); const value=input ? input.value : ''; if(value === config.password) go(config.loginTarget); else { const error=form.querySelector('[data-arg-error]'); if(error) error.textContent='密码错误'; } }); }
  function bind(){
    document.querySelectorAll('[data-arg-component="search"]').forEach(bindSearch);
    document.querySelectorAll('[data-arg-component="login"]').forEach(bindLogin);
    document.querySelectorAll('[data-arg-link], [data-arg-port]').forEach(link=>link.addEventListener('click',function(e){ e.preventDefault(); checkLink(link.dataset.argLink || link.dataset.argPort); }));
  }
  bind();
})();`;

export function runtimeScript(config) {
  return `<script>window.ARG_CONFIG=${JSON.stringify(config)};${runtimeSource}</script>`;
}
