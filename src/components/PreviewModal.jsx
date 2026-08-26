import React, { useEffect, useRef, useState } from 'react';
import { buildPageHtml } from '../generator.js';
import { pageFileName } from '../route-config.js';

export function Preview({ state, close, initialNode, onEdit }) {
  const [id, setId] = useState(initialNode?.id || state.startId || state.nodes[0]?.id)
  const [linkPort, setLinkPort] = useState('')
  const [isMaximized, setIsMaximized] = useState(false)
  const frame = useRef(null)
  const node = state.nodes.find(item => item.id === id || item.name === id || pageFileName(state, item.id) === id) || state.nodes.find(item => item.id === state.startId) || state.nodes[0]
  const outgoing = state.edges.filter(edge => edge.from === node?.id)
  const portName = edge => edge.port || state.nodes.find(item => item.id === edge.to)?.name || edge.to
  const prepare = () => frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => {
    element.contentEditable = 'true'
    element.spellcheck = false
    element.classList.add('arg-editable')
    element.title = '点击此处直接编辑'
  })
  const format = command => {
    const doc = frame.current?.contentDocument
    frame.current?.contentWindow?.focus()
    doc?.execCommand(command, false, null)
  }
  const linkSelection = () => {
    const doc = frame.current?.contentDocument
    const selection = doc?.getSelection()
    if (!doc || !selection || selection.rangeCount === 0 || selection.isCollapsed || !linkPort) return
    frame.current?.contentWindow?.focus()
    if (linkPort === '__unlink__') doc.execCommand('unlink', false, null)
    else {
      doc.execCommand('createLink', false, '#')
      const anchor = selection.anchorNode?.parentElement?.closest('a')
      if (anchor) {
        anchor.removeAttribute('href')
        anchor.dataset.argLink = linkPort
      }
    }
    frame.current?.contentWindow.focus()
  }
  const mosaicSelection = () => {
    const doc = frame.current?.contentDocument
    const selection = doc?.getSelection()
    if (!doc || !selection || selection.rangeCount === 0 || selection.isCollapsed) return
    const range = selection.getRangeAt(0)
    const mask = doc.createElement('span')
    mask.className = 'arg-redacted'
    try {
      range.surroundContents(mask)
    } catch (err) {
      const content = range.extractContents()
      mask.appendChild(content)
      range.insertNode(mask)
    }
    selection.removeAllRanges()
    const nextRange = doc.createRange()
    nextRange.selectNodeContents(mask)
    selection.addRange(nextRange)
    frame.current?.contentWindow.focus()
  }
  const saveSlots = () => {
    const slots = {}
    frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => { slots[element.dataset.argSlot] = element.innerHTML })
    onEdit(node.id, slots)
  }
  useEffect(() => {
    const onMessage = event => {
      if (event.data?.type === 'arg-route') {
        const target = event.data.target
        const matched = state.nodes.find(n => n.id === target || n.name === target || pageFileName(state, n.id) === target)
        if (matched) setId(matched.id)
        else setId(target)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [state])
  useEffect(() => setLinkPort(''), [id])
  if (!node) return null
  return <div className="modal">
    <div className={`modal-card ${isMaximized ? 'fullscreen' : ''}`}>
      <div className="modal-head">
        <div><span className="eyebrow">HTML PREVIEW</span><h2>实时页面预览 · {node.name}</h2></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="ghost icon-tiny" style={{ fontSize: 12, padding: '3px 8px' }} onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? '恢复窗口大小' : '最大化铺满窗口'}>
            {isMaximized ? '🗗 还原' : '⛶ 展开大屏'}
          </button>
          <button className="icon-btn" onClick={close} title="关闭预览">×</button>
        </div>
      </div>
      <div className="preview-bar">
        <span>{pageFileName(state, node.id)}</span>
        <span className="preview-live">编辑模式 · 点击虚线内容直接修改，保存后同步画布与导出文件</span>
      </div>
      <div className="editor-toolbar">
        <button className="ghost" onClick={() => format('bold')}><strong>B</strong> 加粗</button>
        <button className="ghost" onClick={() => format('italic')}><em>I</em> 斜体</button>
        <button className="ghost" onClick={() => format('underline')}><u>U</u> 下划线</button>
        <button className="ghost" onClick={mosaicSelection} title="选中文字后添加马赛克遮挡">▦ 马赛克</button>
        <select className="link-target" value={linkPort} onChange={event => setLinkPort(event.target.value)}>
          <option value="">选择链接目标</option>
          {outgoing.map((edge, index) => <option key={`${edge.to}-${index}`} value={portName(edge)}>{portName(edge)}</option>)}
          <option value="__unlink__">删除选中的超链接</option>
        </select>
        <button className="ghost" onClick={linkSelection} disabled={!linkPort}>{linkPort === '__unlink__' ? '取消链接' : '🔗 设为链接'}</button>
        <button className="primary" onClick={saveSlots}>保存内容</button>
        <span>双击画布卡片也可打开；先选中文字，再使用样式或链接工具</span>
      </div>
      <iframe ref={frame} onLoad={prepare} title="ARG 游戏预览" srcDoc={buildPageHtml(node, state, { preview: true })}/>
    </div>
  </div>
}

export function openPreviewInNewTab(state, initialNode) {
  if (!state.nodes || !state.nodes.length) {
    alert('画布上暂无页面节点，请先添加页面或载入官方范例！')
    return
  }
  const startNode = initialNode || state.nodes.find(n => n.id === state.startId) || state.nodes[0]
  const pages = {}
  state.nodes.forEach(node => {
    const html = buildPageHtml(node, state, { preview: true, trackProgress: true })
    pages[node.id] = html
    const fileName = pageFileName(state, node.id)
    pages[fileName] = html
    if (node.name) pages[node.name] = html
  })

  const pagesJsonSafe = JSON.stringify(pages).replace(/</g, '\\u003c')
  const nodesJsonSafe = JSON.stringify(state.nodes.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type,
    file: pageFileName(state, n.id)
  }))).replace(/</g, '\\u003c')
  const edgesJsonSafe = JSON.stringify(state.edges || []).replace(/</g, '\\u003c')
  const rawNodesJsonSafe = JSON.stringify(state.nodes).replace(/</g, '\\u003c')

  const runnerHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARG 游戏独立运行器 · ${state.title || 'ARG'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100vw; height: 100vh; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif; }
    #arg-preview-frame { width: 100vw; height: 100vh; border: none; display: block; background: #fff; }
    .runner-floating-bar {
      position: fixed;
      top: 12px;
      right: 16px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      padding: 6px 12px;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      color: #fff;
      font-size: 12px;
      user-select: none;
      transition: all 0.25s ease;
    }
    .runner-floating-bar.collapsed {
      padding: 6px 10px;
      background: rgba(15, 23, 42, 0.6);
      opacity: 0.6;
    }
    .runner-floating-bar.collapsed:hover {
      opacity: 1;
      background: rgba(15, 23, 42, 0.9);
    }
    .runner-pill-btn {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      padding: 4px 9px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: background 0.15s, transform 0.1s;
    }
    .runner-pill-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .runner-pill-btn:active {
      transform: scale(0.96);
    }
    .runner-select {
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      outline: none;
      max-width: 150px;
      cursor: pointer;
    }
    .runner-select option {
      background: #1e293b;
      color: #fff;
    }
  </style>
</head>
<body>
  <div id="runnerBar" class="runner-floating-bar">
    <span style="color:#fafafa; font-weight:600; cursor:pointer;" onclick="toggleCollapse()" title="点击收起/展开控制条">ARG 运行器</span>
    <span id="pageTitle" style="max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.9;"></span>
    <select id="nodeSelect" class="runner-select" onchange="loadPage(this.value)">
    </select>
    <button class="runner-pill-btn" onclick="restartGame()" title="重新从起始页开始">重开</button>
    <button class="runner-pill-btn" onclick="toggleFullscreen()" title="全屏体验">全屏</button>
    <button class="runner-pill-btn" onclick="toggleCollapse()" title="收起控制条" id="collapseBtn">◀</button>
  </div>
  <iframe id="arg-preview-frame" title="ARG Runtime Game Player"></iframe>

  <script type="application/json" id="arg-pages-data">${pagesJsonSafe}</script>
  <script type="application/json" id="arg-nodes-data">${nodesJsonSafe}</script>
  <script type="application/json" id="arg-edges-data">${edgesJsonSafe}</script>
  <script type="application/json" id="arg-raw-nodes-data">${rawNodesJsonSafe}</script>

  <script>
    const PAGES = JSON.parse(document.getElementById('arg-pages-data').textContent);
    const NODES = JSON.parse(document.getElementById('arg-nodes-data').textContent);
    const EDGES = JSON.parse(document.getElementById('arg-edges-data').textContent);
    const RAW_NODES = JSON.parse(document.getElementById('arg-raw-nodes-data').textContent);
    const START_ID = ${JSON.stringify(state.startId || state.nodes[0]?.id)};
    let currentId = ${JSON.stringify(startNode.id)};
    let isCollapsed = false;

    const frame = document.getElementById('arg-preview-frame');
    const pageTitle = document.getElementById('pageTitle');
    const nodeSelect = document.getElementById('nodeSelect');
    const runnerBar = document.getElementById('runnerBar');
    const collapseBtn = document.getElementById('collapseBtn');

    function resetProgress() {
      try { sessionStorage.removeItem('arg_visited_nodes'); } catch (err) {}
    }

    NODES.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.id;
      opt.textContent = n.name;
      nodeSelect.appendChild(opt);
    });

    function resolveTarget(fromNodeId, key) {
      if (!key) return null;
      const raw = String(key).trim();

      // 1. Direct hit in PAGES
      if (PAGES[raw]) return raw;

      // 2. Direct hit in NODES (id, name, file)
      const node = NODES.find(n => n.id === raw || n.name === raw || n.file === raw);
      if (node && PAGES[node.id]) return node.id;

      // 3. Search in EDGES (port, label, to) from current page first
      if (fromNodeId) {
        const currentEdges = EDGES.filter(e => e.from === fromNodeId);
        const edgeInCurrent = currentEdges.find(e => e.port === raw || e.label === raw || e.to === raw);
        if (edgeInCurrent && (PAGES[edgeInCurrent.to] || NODES.some(n => n.id === edgeInCurrent.to))) {
          return edgeInCurrent.to;
        }
      }
      const anyEdge = EDGES.find(e => e.port === raw || e.label === raw || e.to === raw);
      if (anyEdge && (PAGES[anyEdge.to] || NODES.some(n => n.id === anyEdge.to))) {
        return anyEdge.to;
      }

      // 4. Search in RULES (keyword -> target)
      for (const n of RAW_NODES) {
        if (n.type === 'Search' && n.rules) {
          const r = n.rules.find(rule => rule.keyword && rule.keyword.trim().toLowerCase() === raw.toLowerCase());
          if (r && (PAGES[r.target] || NODES.some(item => item.id === r.target))) return r.target;
        }
      }

      // 5. Search in Contacts (choice text -> target)
      for (const n of RAW_NODES) {
        if (n.type === 'Chat' && n.contacts) {
          for (const c of n.contacts) {
            const opt = (c.choices || []).find(o => o.text === raw || o.target === raw);
            if (opt && opt.target && (PAGES[opt.target] || NODES.some(item => item.id === opt.target))) {
              return opt.target;
            }
          }
        }
      }

      // 6. Match by .html filename
      const withHtml = raw.endsWith('.html') ? raw : raw + '.html';
      if (PAGES[withHtml]) return withHtml;

      return raw;
    }

    function loadPage(idOrPortOrName) {
      if (!idOrPortOrName) return;
      const targetId = resolveTarget(currentId, idOrPortOrName);
      const html = PAGES[targetId] || PAGES[idOrPortOrName];
      if (html) {
        currentId = targetId;
        frame.srcdoc = html;
        const nodeInfo = NODES.find(n => n.id === targetId || n.name === targetId || n.file === targetId);
        const name = nodeInfo ? nodeInfo.name : targetId;
        pageTitle.textContent = name;
        nodeSelect.value = nodeInfo ? nodeInfo.id : targetId;
        document.title = name + ' · ARG 游戏独立运行器';
      } else {
        console.warn('Target page not found in preview cache:', idOrPortOrName, '-> resolved:', targetId);
        frame.srcdoc = '<div style="padding:60px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;color:#333;background:#f8fafc;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
          '<div style="font-size:48px;margin-bottom:16px;">🔍</div>' +
          '<h2 style="margin-bottom:8px;font-size:20px;color:#1e293b;">未找到目标页面</h2>' +
          '<p style="color:#64748b;font-size:14px;max-width:400px;line-height:1.6;margin-bottom:20px;">' +
            '请求的跳转目标 <code>' + String(idOrPortOrName) + '</code> 尚未关联到有效的页面节点。' +
          '</p>' +
          '<button style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;" onclick="window.parent.postMessage({type:\\'arg-route\\', target:\\'' + START_ID + '\\'}, \\'*\\')">返回起始桌面</button>' +
        '</div>';
      }
    }

    function restartGame() {
      resetProgress();
      loadPage(START_ID);
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
      } else {
        document.exitFullscreen().catch(e => console.log(e));
      }
    }

    function toggleCollapse() {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        runnerBar.classList.add('collapsed');
        pageTitle.style.display = 'none';
        nodeSelect.style.display = 'none';
        collapseBtn.textContent = '▶';
      } else {
        runnerBar.classList.remove('collapsed');
        pageTitle.style.display = 'inline';
        nodeSelect.style.display = 'inline';
        collapseBtn.textContent = '◀';
      }
    }

    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'arg-route') {
        loadPage(event.data.target);
      }
    });

    frame.addEventListener('load', function() {
      try {
        const doc = frame.contentDocument;
        if (!doc) return;
        doc.addEventListener('click', function(e) {
          const el = e.target && e.target.closest ? e.target.closest('[data-arg-link], [data-arg-port]') : null;
          if (el) {
            e.preventDefault();
            e.stopPropagation();
            const port = el.dataset.argLink || el.dataset.argPort;
            if (port) loadPage(port);
          }
        }, true);

        doc.addEventListener('submit', function(e) {
          const form = e.target;
          if (form && (form.dataset.argComponent === 'login' || form.querySelector('input[type="password"]'))) {
            e.preventDefault();
            e.stopPropagation();
            const input = form.querySelector('input[type="password"], input');
            const val = (input ? input.value : '').trim().toLowerCase();
            if (val === 'yxzyddx' || val === '0717' || val === '一切自愿的大学') {
              loadPage('node_files');
            }
          }
        }, true);
      } catch (err) {}
    });

    // A new runner must never inherit evidence collected by the editor preview.
    resetProgress();

    // Initial load
    loadPage(currentId);
  </script>
</body>
</html>`

  const blob = new Blob([runnerHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const newWin = window.open(url, '_blank')
  if (!newWin) {
    alert('浏览器拦截了新窗口，请在地址栏允许打开新标签页！')
  }
}
