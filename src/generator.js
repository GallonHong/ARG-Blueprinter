import { runtimeSource } from './runtime.js'
import { getTemplate } from './templates.js'
import { getTemplateStyle } from './templateStyles.js'
import { buildRouteConfig, pageFileName, generateLinksHtml, generateNavLinksHtml, generateHotLinksHtml, generateDesktopIconsHtml } from './route-config.js'

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const rich=s=>esc(s).replace(/\n/g,'<br>').replace(/&lt;(\/?(?:b|strong|i|em|u|br|span))&gt;/gi,'<$1>').replace(/&lt;a data-arg-link=&quot;([^&]+)&quot;&gt;/gi,(_,port)=>`<a data-arg-link="${port}">`).replace(/&lt;\/a&gt;/gi,'</a>')

export { generateLinksHtml, generateNavLinksHtml, generateHotLinksHtml, generateDesktopIconsHtml }

import { setCustomTemplates } from './templates.js'

export function buildPageHtml(node,state,{preview=false}={}){
  if (state.customTemplates) {
    setCustomTemplates(state.customTemplates);
  }
  const config=buildRouteConfig(node,state,{preview});
  const f=node.fields||{};
  const richFields=new Set(['body','links','siteName','title','date','author','forumName','username','time','replies','navigation','buttonText','systemName','path','message','categoryTitle','subtitle','notice','notFoundText','stickyNote','startTitle']);
  const values=Object.fromEntries(Object.entries(f).map(([key,value])=>[key,richFields.has(key)?rich(value):esc(value)]));
  
  const linksContent = f.links ? rich(f.links) : generateLinksHtml(node, state);
  const navLinksContent = f.navLinks ? rich(f.navLinks) : generateNavLinksHtml(node, state);
  const hotLinksContent = f.hotLinks ? rich(f.hotLinks) : generateHotLinksHtml(node, state);
  const desktopIconsContent = f.desktopIcons ? rich(f.desktopIcons) : generateDesktopIconsHtml(node, state);

  const bodyContent = rich(f.body || f.message || f.stickyNote || '');
  const imageContent = f.image ? esc(f.image) : (f.bgImage ? esc(f.bgImage) : '');

  Object.assign(values,{
    ARG_LINKS: linksContent,
    ARG_NAV_LINKS: navLinksContent,
    ARG_HOT_LINKS: hotLinksContent,
    ARG_DESKTOP_ICONS: desktopIconsContent,
    ARG_CONTENT: bodyContent,
    body: bodyContent,
    image: imageContent,
    title: rich(f.title || node.name || ''),
    siteName: rich(f.siteName || state.title || 'ARG Blueprint'),
    links: linksContent,
    replies: rich(f.replies||''),
    navigation: rich(f.navigation||''),
    categoryTitle: rich(f.categoryTitle||'最新索引 / 快捷入口'),
    subtitle: rich(f.subtitle||''),
    notice: rich(f.notice||''),
    stickyNote: rich(f.stickyNote||''),
    startTitle: rich(f.startTitle||'开始'),
    time: rich(f.time||'23:17')
  });

  let template=getTemplate(node.type,node.template)||'';
  template=template.replace(/<link[^>]+stylesheet[^>]*>/gi,'').replace(/{{\s*([A-Z_a-z][\w]*)\s*}}/g,(_,key)=>String(values[key]??''));
  
  if(node.type==='Search') {
    if(!template.includes('data-arg-component="search"')) template=template.replace('<form id="searchForm"','<form id="searchForm" data-arg-component="search"');
    if(!template.includes('data-arg-input="keyword"')) template=template.replace('id="keyword"','id="keyword" data-arg-input="keyword"');
    if(!template.includes('data-arg-submit')) template=template.replace('<button','<button data-arg-submit');
    if(!template.includes('data-arg-result')) template=template.replace('<div id="result">','<div id="result" data-arg-result>');
  }
  if(node.type==='Login') {
    template=template.replace('id="password"','id="password" data-arg-input="password"').replace('<button data-arg-submit>','<button data-arg-submit>').replace('<p id="error">','<p id="error" data-arg-error>');
  }

  const isTerminal = node.template === '终端搜索' || node.template === '暗黑加密通讯';
  
  let defaultBg = '#f4f6f9';
  if (f.bgColor) defaultBg = f.bgColor;
  else if (isTerminal) defaultBg = '#0a0d14';
  else if (node.type === 'Desktop' && node.template === 'Windows 98 桌面') defaultBg = '#008080';
  else if (node.type === 'Desktop' && node.template === 'Windows XP 桌面') defaultBg = 'linear-gradient(180deg, #1b5cb8 0%, #4691e8 45%, #63b333 75%, #3c821b 100%)';
  else if (node.type === 'Desktop' && node.template === '调查员工作台') defaultBg = '#0b0f19';
  else if (node.type === 'Chat' && node.template === '经典 QQ 风格') defaultBg = '#c3daf9';

  if (f.bgImage) {
    defaultBg = `url('${f.bgImage}') center center / cover no-repeat, ${defaultBg}`;
  }

  let defaultPrimary = '#174a8b';
  if (f.primaryColor) defaultPrimary = f.primaryColor;
  else if (isTerminal) defaultPrimary = '#00ff66';
  else if (node.type === 'Chat' && node.template === '微信 UI 风格') defaultPrimary = '#95ec69';
  else if (node.type === 'Desktop') defaultPrimary = '#000080';

  let defaultCardBg = '#ffffff';
  if (f.cardBg) defaultCardBg = f.cardBg;
  else if (isTerminal) defaultCardBg = '#0d111a';
  else if (node.type === 'Desktop') defaultCardBg = '#c0c0c0';

  let defaultText = '#222222';
  if (f.textColor) defaultText = f.textColor;
  else if (isTerminal) defaultText = '#00ff66';
  else if (node.type === 'Desktop') defaultText = '#ffffff';

  let defaultFont = '"SimSun", "宋体", serif';
  if (f.fontFamily) defaultFont = f.fontFamily;
  else if (isTerminal) defaultFont = '"Courier New", monospace';
  else if (node.type === 'Desktop') defaultFont = '"MS Sans Serif", "SimSun", "宋体", sans-serif';
  else if (node.type === 'Chat') defaultFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif';

  const customVars = `
    :root {
      --arg-primary-color: ${defaultPrimary};
      --arg-bg-color: ${defaultBg};
      --arg-card-bg: ${defaultCardBg};
      --arg-text-color: ${defaultText};
      --arg-font-family: ${defaultFont};
    }
    .arg-atmosphere-crt:before {
      content: " ";
      display: block;
      position: fixed;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
      z-index: 99999;
      background-size: 100% 3px, 6px 100%;
      pointer-events: none;
      opacity: 0.6;
    }
    .arg-atmosphere-vignette:after {
      content: " ";
      display: block;
      position: fixed;
      inset: 0;
      box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.6);
      pointer-events: none;
      z-index: 99998;
    }
    .arg-atmosphere-glitch {
      animation: arg-glitch-flicker 4s infinite;
    }
    @keyframes arg-glitch-flicker {
      0%, 95%, 100% { filter: none; }
      96% { filter: hue-rotate(90deg) contrast(1.2); }
      97% { filter: invert(0.1) saturate(1.4); }
      98% { filter: none; }
    }
    ${f.customCss || ''}
  `;

  const deleteElementCss = `
    ${(f.showStickyNote === false || f.stickyNote === '__deleted__' || f.stickyNote === '') ? '[data-arg-slot="stickyNote"], .win-sticky-note, .dark-sticky-note, .mac-stickies, .cyber-hud-card { display: none !important; }' : ''}
    ${(f.showNotice === false || f.notice === '__deleted__' || f.notice === '') ? '[data-arg-slot="notice"], .search-notice { display: none !important; }' : ''}
    ${(f.showSubtitle === false || f.subtitle === '__deleted__' || f.subtitle === '') ? '[data-arg-slot="subtitle"], .search-subtitle { display: none !important; }' : ''}
  `;

  const templateStyle=getTemplateStyle(node.type,node.template);
  template=template.replace('</head>',`<style>${templateStyle}${customVars}${deleteElementCss}</style></head>`);
  const configTag=`<script type="application/json" id="arg-config">${JSON.stringify(config).replace(/</g,'\\u003c')}</script>`;
  const runtimeTag=preview?`<script>${runtimeSource}</script>`:'<script src="arg-runtime.js"></script>';
  
  const customTpl = (state.customTemplates || []).find(t => t.name === node.template && (t.type === node.type || t.type === 'Custom'));
  const customScriptTag = (customTpl && customTpl.js)
    ? `<script>(function(){ try { const run = function(){ try { (function(ARG_RUNTIME, config){ ${customTpl.js} })(window.ARG_RUNTIME, window.ARG_CONFIG || {}); } catch(e){ console.warn('[Custom Template Script Error]', e); } }; if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', run); } else { run(); } } catch(err){} })();</script>`
    : '';

  return template.replace('</body>',`${configTag}${runtimeTag}${customScriptTag}</body>`);
}



