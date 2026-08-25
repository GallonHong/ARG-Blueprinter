import { useEffect, useRef, useState } from 'react'
import { buildPageHtml } from './generator.js'
import { pageFileName } from './route-config.js'
import { runtimeSource } from './runtime.js'

const TYPES = {
  Search: { label: '搜索页', templates: ['经典搜索'], fields: [['siteName', '站点名称', '百度搜索'], ['placeholder', '输入框提示', '请输入关键词'], ['buttonText', '按钮文字', '搜索']] },
  Index: { label: '索引页', templates: ['2001 门户'], fields: [['siteName', '站点名称', '临江在线'], ['navigation', '导航文字', '首页　新闻　论坛']] },
  Browse: { label: '浏览页', templates: ['2001 新闻', 'BBS 帖子'], fields: [['siteName', '站点名称', '临江在线'], ['title', '页面标题', '案件详情'], ['date', '日期', '2001-07-17'], ['author', '作者', '记者 林默'], ['forumName', '论坛名称', '临江论坛'], ['username', '用户名', '匿名用户'], ['time', '发帖时间', '2001-07-17 23:17'], ['replies', '回复内容', '暂无回复'], ['body', '正文', '这里是 ARG 的正文内容。\n你可以在这里放置线索、报道和故事。']] },
  Login: { label: '登录页', templates: ['后台登录'], fields: [['systemName', '系统名称', '档案管理后台'], ['password', '正确密码', '0717']] },
  Files: { label: '文件页', templates: ['Windows 文件夹'], fields: [['path', '文件路径', 'C:\\ARCHIVE\\0717\\']] },
  Ending: { label: '结局页', templates: ['CRT 黑屏'], fields: [['message', '结局文字', 'CASE CLOSED.\n感谢游玩。']] },
}

const empty = () => ({ title: '未命名 ARG', nodes: [], edges: [], selected: null, startId: null })
const copy = value => JSON.parse(JSON.stringify(value))

function newNode(type, count) {
  const node = { id: `n${Date.now()}${Math.random()}`, name: `${TYPES[type].label} ${count}`, type, template: TYPES[type].templates[0], x: 80 + (count % 3) * 230, y: 70 + Math.floor((count - 1) / 3) * 145, fields: {} }
  TYPES[type].fields.forEach(field => { node.fields[field[0]] = field[2] })
  return node
}

export default function App() {
  const [state, setState] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('arg-blueprint-react') || 'null') || empty()
    if (saved.nodes.length && !saved.startId) saved.startId = saved.nodes[0].id
    if (saved.nodes.length && !saved.nodes.some(node => node.isStart)) saved.nodes[0].isStart = true
    return saved
  })
  const [drag, setDrag] = useState(null)
  const [connect, setConnect] = useState(null)
  const [previewNode, setPreviewNode] = useState(null)
  const canvas = useRef(null)
  const selected = state.nodes.find(node => node.id === state.selected)

  const update = fn => setState(current => {
    const next = copy(current)
    fn(next)
    localStorage.setItem('arg-blueprint-react', JSON.stringify(next))
    return next
  })

  useEffect(() => localStorage.setItem('arg-blueprint-react', JSON.stringify(state)), [state])

  useEffect(() => {
    const move = event => {
      if (!drag || !canvas.current) return
      const rect = canvas.current.getBoundingClientRect()
      update(next => {
        const node = next.nodes.find(item => item.id === drag.id)
        if (!node) return
        node.x = Math.max(0, Math.min(canvas.current.clientWidth - 185, event.clientX - rect.left - drag.dx))
        node.y = Math.max(0, Math.min(canvas.current.clientHeight - 80, event.clientY - rect.top - drag.dy))
      })
    }
    const up = event => {
      if (connect) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.map-node')?.dataset.id
        if (target && target !== connect) update(next => {
          next.edges = next.edges.filter(edge => !(edge.from === connect && edge.to === target))
          const targetNode = next.nodes.find(node => node.id === target)
          next.edges.push({ from: connect, to: target, port: targetNode?.name || target })
        })
        setConnect(null)
      }
      setDrag(null)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [drag, connect])

  const add = type => update(next => {
    const node = newNode(type, next.nodes.length + 1)
    next.nodes.push(node)
    if (!next.startId) { next.startId = node.id; node.isStart = true }
    next.selected = node.id
  })
  const remove = () => selected && update(next => {
    next.nodes = next.nodes.filter(node => node.id !== selected.id)
    next.edges = next.edges.filter(edge => edge.from !== selected.id && edge.to !== selected.id)
    if (next.startId === selected.id) { next.startId = next.nodes[0]?.id || null; next.nodes.forEach((node, index) => { node.isStart = index === 0 }) }
    next.selected = next.nodes[0]?.id || null
  })
  const patchSelected = fn => selected && update(next => fn(next.nodes.find(node => node.id === selected.id)))
  const editSlots = (id, slots) => update(next => {
    const node = next.nodes.find(item => item.id === id)
    if (node) Object.assign(node.fields, slots)
  })

  return <>
    <header className="topbar">
      <div className="brand"><span className="brand-mark">◆</span><div><strong>ARG Blueprint</strong><small>用思维导图生成可玩的 ARG 网页 · React</small></div></div>
      <div className="toolbar"><button className="ghost" onClick={() => confirm('确定新建项目？') && setState(empty())}>新建</button><button className="secondary" onClick={() => setPreviewNode(state.nodes.find(node => node.id === state.startId) || state.nodes[0])}>▶ 预览游戏</button><button className="primary" onClick={() => exportGame(state)}>↓ 导出 HTML</button></div>
    </header>
    <main className="workspace">
      <aside className="sidebar"><div className="panel-title"><span>页面节点</span><button className="icon-btn" onClick={() => add('Browse')}>＋</button></div>{state.nodes.map(node => <div key={node.id} className={`node-item ${node.id === state.selected ? 'active' : ''}`} onClick={() => update(next => { next.selected = node.id })}><span className={`node-dot ${node.type === 'Ending' ? 'ending' : ''}`}/><div className="node-name">{node.name}<span className="node-type">{TYPES[node.type].label}{node.isStart ? ' · 起始页' : ''}</span></div></div>)}<div className="sidebar-tip">拖动节点移动位置。<br/>拖动节点上的圆点到目标页面完成连线。</div></aside>
      <section className="canvas-wrap"><div className="canvas-head"><div><span className="eyebrow">FLOW MAP</span><h1>{state.title}</h1></div><span className="status">已保存到本地</span></div><div className="canvas" ref={canvas}><svg className="edges">{state.edges.map((edge, index) => { const from = state.nodes.find(node => node.id === edge.from); const to = state.nodes.find(node => node.id === edge.to); return from && to ? <path key={`${edge.from}-${edge.to}-${index}`} className="edge" d={`M${from.x + 185} ${from.y + 29} C${from.x + 255} ${from.y + 29},${to.x - 70} ${to.y + 29},${to.x} ${to.y + 29}`}/> : null })}</svg>{!state.nodes.length && <div className="empty"><div className="empty-icon">✦</div><h2>从一个页面开始</h2><p>点击左侧 ＋ 添加你的第一个 ARG 页面</p></div>}{state.nodes.map(node => <div key={node.id} data-id={node.id} className={`map-node ${node.id === state.selected ? 'selected' : ''} ${node.isStart ? 'start-node' : ''}`} style={{ left: node.x, top: node.y }} onClick={() => update(next => { next.selected = node.id })} onDoubleClick={() => setPreviewNode(node)} onMouseDown={event => { if (event.target.classList.contains('port') || event.target.closest('.node-preview')) return; const rect = event.currentTarget.getBoundingClientRect(); setDrag({ id: node.id, dx: event.clientX - rect.left, dy: event.clientY - rect.top }) }}><div className="node-top"><span className={`node-dot ${node.type === 'Ending' ? 'ending' : ''}`}/><strong>{node.name}</strong><button className="node-preview" title="实时预览当前 HTML" onClick={event => { event.stopPropagation(); setPreviewNode(node) }}>↗</button></div><div className="node-body">{node.isStart ? '起始页 · ' : ''}{summary(node)}</div>{node.type !== 'Ending' && <span className="port" onMouseDown={event => { event.stopPropagation(); setConnect(node.id) }}/>}</div>)}</div><div className="canvas-foot"><span>拖动节点移动位置；双击卡片或点击 ↗ 实时预览 HTML</span><span>{state.nodes.length} 个页面 · {state.edges.length} 条连线</span></div></section>
      <Inspector selected={selected} nodes={state.nodes} edges={state.edges} update={update} patch={patchSelected} remove={remove} addRule={() => patchSelected(node => { node.rules = node.rules || []; node.rules.push({ keyword: '新关键词', target: state.nodes.find(item => item.id !== node.id)?.id || '' }) })}/>
    </main>
    {previewNode && <Preview state={state} initialNode={previewNode} onEdit={editSlots} close={() => setPreviewNode(null)}/>} 
  </>
}

function summary(node) { if (node.type === 'Search') return `关键词规则 ${(node.rules || []).length} 条`; if (node.type === 'Login') return `密码验证 · ${node.fields.password ? '已设置' : '未设置'}`; return node.fields.title || node.fields.siteName || node.fields.path || node.fields.message || '未填写内容' }

function Inspector({ selected, nodes, edges, update, patch, remove, addRule }) {
  if (!selected) return <aside className="inspector"><div className="inspector-empty">在流程图中选择节点<br/>开始编辑页面内容。</div></aside>
  return <aside className="inspector"><div className="inspector-head"><span className="eyebrow">INSPECTOR</span><h2>{selected.name}</h2></div><div className="inspector-body"><Field label="页面名称"><input value={selected.name} onChange={event => patch(node => { node.name = event.target.value })}/></Field><Field label="页面类型"><select value={selected.type} onChange={event => patch(node => { node.type = event.target.value; node.template = TYPES[node.type].templates[0]; node.fields = {}; TYPES[node.type].fields.forEach(field => { node.fields[field[0]] = field[2] }) })}>{Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></Field><Field label="HTML 模板"><select value={selected.template} onChange={event => patch(node => { node.template = event.target.value })}>{TYPES[selected.type].templates.map(template => <option key={template}>{template}</option>)}</select></Field>{TYPES[selected.type].fields.map(field => <Field key={field[0]} label={field[1]}>{field[0] === 'body' || field[0] === 'message' || field[0] === 'replies' ? <textarea value={selected.fields[field[0]]} onChange={event => patch(node => { node.fields[field[0]] = event.target.value })}/> : <input value={selected.fields[field[0]]} onChange={event => patch(node => { node.fields[field[0]] = event.target.value })}/>}</Field>)}{selected.type === 'Search' && <div className="field"><label>搜索规则</label>{(selected.rules || []).map((rule, index) => <div className="rule" key={index}><button className="rule-remove" onClick={() => patch(node => { node.rules.splice(index, 1) })}>×</button><div className="rule-row"><input value={rule.keyword} onChange={event => patch(node => { node.rules[index].keyword = event.target.value })}/><select value={rule.target} onChange={event => patch(node => { node.rules[index].target = event.target.value })}>{nodes.filter(node => node.id !== selected.id).map(node => <option key={node.id} value={node.id}>{node.name}</option>)}</select></div></div>)}<button className="ghost" onClick={addRule}>＋ 添加规则</button></div>}<LinkEditor selected={selected} nodes={nodes} edges={edges} update={update}/><button className="danger" onClick={remove}>删除这个页面</button></div></aside>
}

function LinkEditor({ selected, nodes, edges, update }) { const outgoing = edges.filter(edge => edge.from === selected.id); const targets = nodes.filter(node => node.id !== selected.id); return <div className="field"><label>页面出口 / 超链接</label><button className="ghost start-toggle" onClick={() => update(next => { next.startId = selected.id; next.nodes.forEach(node => { node.isStart = node.id === selected.id }) })}>{selected.isStart ? '✓ 当前起始页' : '◎ 设为起始页'}</button>{outgoing.map((edge, index) => { const target = nodes.find(node => node.id === edge.to); return <div className="rule" key={`${edge.from}-${edge.to}-${index}`}><button className="rule-remove" onClick={() => update(next => { next.edges.splice(edges.indexOf(edge), 1) })}>×</button><div className="field"><label>链接文字 / port</label><input value={edge.port || target?.name || edge.to} onChange={event => update(next => { next.edges[edges.indexOf(edge)].port = event.target.value })}/></div><select value={edge.to} onChange={event => update(next => { next.edges[edges.indexOf(edge)].to = event.target.value })}>{targets.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}</select></div> })}<button className="ghost" onClick={() => { const target = targets.find(node => !outgoing.some(edge => edge.to === node.id)); if (target) update(next => next.edges.push({ from: selected.id, to: target.id, port: target.name })) }}>＋ 添加页面出口</button></div> }

const Field = ({ label, children }) => <div className="field"><label>{label}</label>{children}</div>

function Preview({ state, close, initialNode, onEdit }) {
  const [id, setId] = useState(initialNode?.id || state.startId || state.nodes[0]?.id)
  const [linkPort, setLinkPort] = useState('')
  const frame = useRef(null)
  const node = state.nodes.find(item => item.id === id)
  const outgoing = state.edges.filter(edge => edge.from === node?.id)
  const portName = edge => edge.port || state.nodes.find(item => item.id === edge.to)?.name || edge.to
  const prepare = () => frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => { element.contentEditable = 'true'; element.classList.add('arg-editable') })
  const format = command => { frame.current?.contentDocument?.execCommand(command, false, null); frame.current?.contentWindow.focus() }
  const linkSelection = () => { const doc = frame.current?.contentDocument; const selection = doc?.getSelection(); if (!doc || !selection || selection.rangeCount === 0 || selection.isCollapsed || !linkPort) return; if (linkPort === '__unlink__') doc.execCommand('unlink', false, null); else { doc.execCommand('createLink', false, '#'); const anchor = selection.anchorNode?.parentElement?.closest('a'); if (anchor) { anchor.removeAttribute('href'); anchor.dataset.argLink = linkPort } } frame.current?.contentWindow.focus() }
  const saveSlots = () => { const slots = {}; frame.current?.contentDocument?.querySelectorAll('[data-arg-slot]').forEach(element => { slots[element.dataset.argSlot] = element.innerHTML }); onEdit(node.id, slots) }
  useEffect(() => { const onMessage = event => { if (event.data?.type === 'arg-route') setId(event.data.target) }; window.addEventListener('message', onMessage); return () => window.removeEventListener('message', onMessage) }, [])
  useEffect(() => setLinkPort(''), [id])
  if (!node) return null
  return <div className="modal"><div className="modal-card"><div className="modal-head"><div><span className="eyebrow">HTML PREVIEW</span><h2>实时页面预览</h2></div><button className="icon-btn" onClick={close}>×</button></div><div className="preview-bar"><span>{pageFileName(state, node.id)}</span><span className="preview-live">LIVE · 模板实时渲染</span></div><div className="editor-toolbar"><button className="ghost" onClick={() => format('bold')}><strong>B</strong> 加粗</button><button className="ghost" onClick={() => format('italic')}><em>I</em> 斜体</button><select className="link-target" value={linkPort} onChange={event => setLinkPort(event.target.value)}><option value="">选择链接目标</option>{outgoing.map((edge, index) => <option key={`${edge.to}-${index}`} value={portName(edge)}>{portName(edge)}</option>)}<option value="__unlink__">删除选中的超链接</option></select><button className="ghost" onClick={linkSelection} disabled={!linkPort}>{linkPort === '__unlink__' ? '取消链接' : '🔗 设为链接'}</button><button className="primary" onClick={saveSlots}>保存内容</button><span>选择文字后，可绑定出口或删除链接</span></div><iframe ref={frame} onLoad={prepare} title="ARG 游戏预览" srcDoc={buildPageHtml(node, state, { preview: true })}/></div></div>
}

function exportGame(state) { const download = (name, content, type) => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = name; link.click() }; download('arg-runtime.js', runtimeSource, 'text/javascript'); state.nodes.forEach(node => download(pageFileName(state, node.id), buildPageHtml(node, state), 'text/html')) }
