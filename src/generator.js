import { runtimeSource } from './runtime.js'
import { getTemplate } from './templates.js'
import { getTemplateStyle } from './templateStyles.js'
import { buildRouteConfig, pageFileName } from './route-config.js'

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const rich=s=>esc(s).replace(/\n/g,'<br>').replace(/&lt;(\/?(?:b|strong|i|em|u|br))&gt;/gi,'<$1>').replace(/&lt;a data-arg-link=&quot;([^&]+)&quot;&gt;/gi,(_,port)=>`<a data-arg-link="${port}">`).replace(/&lt;\/a&gt;/gi,'</a>')
export function buildPageHtml(node,state,{preview=false}={}){
  const config=buildRouteConfig(node,state,{preview});
  const f=node.fields||{};const richFields=new Set(['body','links','siteName','title','date','author','forumName','username','time','replies','navigation','buttonText','systemName','path','message']);const values=Object.fromEntries(Object.entries(f).map(([key,value])=>[key,richFields.has(key)?rich(value):esc(value)]));Object.assign(values,{ARG_LINKS:rich(f.links||''),replies:rich(f.replies||''),navigation:rich(f.navigation||'')});
  let template=getTemplate(node.type,node.template)||'';
  template=template.replace(/<link[^>]+stylesheet[^>]*>/gi,'').replace(/{{\s*([A-Z_a-z][\w]*)\s*}}/g,(_,key)=>String(values[key]??''));
  if(node.type==='Search') { if(!template.includes('data-arg-component="search"')) template=template.replace('<form id="searchForm"','<form id="searchForm" data-arg-component="search"'); if(!template.includes('data-arg-input="keyword"')) template=template.replace('id="keyword"','id="keyword" data-arg-input="keyword"'); if(!template.includes('data-arg-submit')) template=template.replace('<button>','<button data-arg-submit>'); if(!template.includes('data-arg-result')) template=template.replace('<div id="result">','<div id="result" data-arg-result>'); }
  if(node.type==='Login') template=template.replace('id="password"','id="password" data-arg-input="password"').replace('<button data-arg-submit>','<button data-arg-submit>').replace('<p id="error">','<p id="error" data-arg-error>');
  const templateStyle=getTemplateStyle(node.type,node.template);template=template.replace('</head>',`<style>${templateStyle}input{padding:10px;margin:5px;border:1px solid #adb8c7}button{padding:10px 18px;background:#356ae6;color:#fff;border:0;border-radius:4px}a{color:#245bcf;margin:8px;display:inline-block}</style></head>`);
  const configTag=`<script type="application/json" id="arg-config">${JSON.stringify(config).replace(/</g,'\\u003c')}</script>`;
  const runtimeTag=preview?`<script>${runtimeSource}</script>`:'<script src="arg-runtime.js"></script>';
  return template.replace('</body>',`${configTag}${runtimeTag}</body>`);
}
