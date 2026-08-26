import { useEffect, useMemo, useRef, useState } from 'react';
import { pageFileName, defaultContacts, getSmartIcon } from './route-config.js';
import { runtimeSource } from './runtime.js';
import { setCustomTemplates } from './templates.js';
import { getQiyuebanDemoProject } from './demo-project.js';
import { Terminal } from './Terminal.jsx';
import { validateStoryGraph } from './validator.js';
import { DshPanel } from './DshPanel.jsx';
import { EventsModal } from './EventsModal.jsx';
import { getStoredDshEndpoint, checkDshHealth } from './dsh-bridge.js';
import { executeBatchCli } from './cli.js';
import { TYPE_THEME_PRESETS } from './theme-presets.js';
import { TYPES, DESKTOP_ICON_SYMBOLS, empty, copy, newNode } from './types-config.js';
import { Inspector } from './components/Inspector.jsx';
import { Preview, openPreviewInNewTab } from './components/PreviewModal.jsx';
import { CustomTemplateModal } from './components/CustomTemplateModal.jsx';
import { ValidatorModal } from './components/ValidatorModal.jsx';
import { exportZip, parseAndLoadProject } from './project-io.js';

export { exportZip, parseAndLoadProject, openPreviewInNewTab };

export default function App() {
  const [state, setState] = useState(() => {
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem('arg-blueprint-react') || 'null')
    } catch (e) {
      saved = null
    }
    if (!saved || !Array.isArray(saved.nodes)) {
      saved = empty()
    }
    if (!saved.customTemplates) {
      try {
        saved.customTemplates = JSON.parse(localStorage.getItem('arg_custom_templates') || '[]')
      } catch (e) {
        saved.customTemplates = []
      }
    }
    setCustomTemplates(saved.customTemplates)
    saved.nodes = (saved.nodes || []).filter(Boolean)
    saved.edges = (saved.edges || []).filter(Boolean)
    saved.nodes.forEach((node, index) => {
      if (typeof node.x !== 'number' || isNaN(node.x)) node.x = 60 + (index % 3) * 230
      if (typeof node.y !== 'number' || isNaN(node.y)) node.y = 60 + Math.floor(index / 3) * 150
      if (!node.type || !TYPES[node.type]) node.type = 'Browse'
      if (!node.fields) node.fields = {}
    })
    saved.edges.forEach(edge => {
      const fromNode = saved.nodes.find(n => n.id === edge.from)
      const toNode = saved.nodes.find(n => n.id === edge.to)
      if (fromNode && (fromNode.type === 'Desktop' || fromNode.type === 'Files')) {
        if (!edge.icon || edge.icon === '📁') {
          edge.icon = getSmartIcon(edge, toNode)
        }
      }
    })
    if (saved.nodes.length && !saved.startId) saved.startId = saved.nodes[0].id
    if (saved.nodes.length && !saved.nodes.some(node => node.isStart)) saved.nodes[0].isStart = true
    return saved
  })
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
  const [panning, setPanning] = useState(null)
  const [drag, setDrag] = useState(null)
  const [connect, setConnect] = useState(null)
  const [previewNode, setPreviewNode] = useState(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showValidatorModal, setShowValidatorModal] = useState(false)
  const [showEventsModal, setShowEventsModal] = useState(false)
  const [showDshPanel, setShowDshPanel] = useState(false)
  const [dshOnline, setDshOnline] = useState(false)
  const [dshEndpoint, setDshEndpoint] = useState(getStoredDshEndpoint())
  const [history, setHistory] = useState({ past: [], future: [] })
  const [terminalOpen, setTerminalOpen] = useState(false)
  const canvas = useRef(null)
  const importInputRef = useRef(null)
  const selected = state.nodes.find(node => node.id === state.selected)

  const graphValidation = useMemo(() => validateStoryGraph(state), [state])

  const update = (fn, { recordHistory = true } = {}) => {
    setState(current => {
      const next = copy(current)
      fn(next)
      if (recordHistory) {
        setHistory(h => ({
          past: [...h.past.slice(-30), copy(current)],
          future: []
        }))
      }
      localStorage.setItem('arg-blueprint-react', JSON.stringify(next))
      if (next.customTemplates) {
        localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
        setCustomTemplates(next.customTemplates)
      }
      return next
    })
  }

  const undo = () => {
    if (!history.past.length) return
    const prev = history.past[history.past.length - 1]
    const newPast = history.past.slice(0, -1)
    setHistory(h => ({
      past: newPast,
      future: [copy(state), ...h.future.slice(0, 30)]
    }))
    setState(prev)
    localStorage.setItem('arg-blueprint-react', JSON.stringify(prev))
    if (prev.customTemplates) {
      setCustomTemplates(prev.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(prev.customTemplates))
    }
  }

  const redo = () => {
    if (!history.future.length) return
    const next = history.future[0]
    const newFuture = history.future.slice(1)
    setHistory(h => ({
      past: [...h.past.slice(-30), copy(state)],
      future: newFuture
    }))
    setState(next)
    localStorage.setItem('arg-blueprint-react', JSON.stringify(next))
    if (next.customTemplates) {
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    }
  }

  const selectNode = id => {
    update(next => { next.selected = id }, { recordHistory: false })
    setInspectorOpen(true)
  }

  const focusNode = (nodeId) => {
    const node = state.nodes.find(n => n.id === nodeId)
    if (node) {
      selectNode(node.id)
      setViewport({ x: -node.x + 200, y: -node.y + 150, zoom: 1 })
      setShowValidatorModal(false)
    }
  }

  const add = type => {
    update(next => {
      const node = newNode(type, next.nodes.length + 1)
      next.nodes.push(node)
      if (!next.startId || !next.nodes.some(n => n.id === next.startId)) {
        next.startId = node.id
        node.isStart = true
      }
      next.selected = node.id
    })
    setShowAddMenu(false)
    setInspectorOpen(true)
  }

  const setAsStart = (id, e) => {
    if (e) e.stopPropagation()
    update(next => {
      next.startId = id
      next.nodes.forEach(n => { n.isStart = n.id === id })
    })
  }

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

  // Periodic DSH Health Probe
  useEffect(() => {
    const checkConn = async () => {
      const ep = getStoredDshEndpoint()
      setDshEndpoint(ep)
      const res = await checkDshHealth(ep)
      setDshOnline(res.online)
    }
    checkConn()
    const timer = setInterval(checkConn, 10000)
    return () => clearInterval(timer)
  }, [])

  // Listen for incoming DSH scripts via postMessage
  useEffect(() => {
    const handleDshMessage = (event) => {
      if (event.data && event.data.type === 'ARG_EXECUTE_SCRIPT' && typeof event.data.script === 'string') {
        const out = executeBatchCli(event.data.script, state, update)
        console.log('[DSH Bridge] Executed script from DSH:', out)
      }
    }
    window.addEventListener('message', handleDshMessage)
    return () => window.removeEventListener('message', handleDshMessage)
  }, [state])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  useEffect(() => {
    const handleShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault()
        setTerminalOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  const handleImportFile = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const loadedState = await parseAndLoadProject(file)
      setHistory(h => ({ past: [...h.past.slice(-30), copy(state)], future: [] }))
      setState(loadedState)
      setCustomTemplates(loadedState.customTemplates)
      localStorage.setItem('arg-blueprint-react', JSON.stringify(loadedState))
      localStorage.setItem('arg_custom_templates', JSON.stringify(loadedState.customTemplates))
      if (loadedState.nodes.length) {
        const minX = Math.min(...loadedState.nodes.map(n => n.x))
        const minY = Math.min(...loadedState.nodes.map(n => n.y))
        setViewport({ x: -minX + 80, y: -minY + 60, zoom: 1 })
      }
      alert(`成功导入项目「${loadedState.title}」！\n已恢复 ${loadedState.nodes.length} 个页面节点、${loadedState.edges.length} 条连线关系。`)
    } catch (err) {
      console.error('Import failed:', err)
      alert('导入失败: ' + err.message)
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    const handleKeyDown = event => {
      const target = event.target
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || target.closest('.modal')
      
      // Ctrl+Z / Cmd+Z: Undo
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        if (!isInput) {
          event.preventDefault()
          undo()
        }
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y: Redo
      else if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z') || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y')) {
        if (!isInput) {
          event.preventDefault()
          redo()
        }
      }
      // Delete or Backspace to delete selected node
      else if ((event.key === 'Delete' || event.key === 'Backspace') && !isInput) {
        if (state.selected) {
          event.preventDefault()
          remove()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, history])

  useEffect(() => {
    localStorage.setItem('arg-blueprint-react', JSON.stringify(state))
    if (state.customTemplates) {
      localStorage.setItem('arg_custom_templates', JSON.stringify(state.customTemplates))
      setCustomTemplates(state.customTemplates)
    }
  }, [state])

  useEffect(() => {
    const move = event => {
      if (panning) {
        const dx = event.clientX - panning.mouseX
        const dy = event.clientY - panning.mouseY
        setViewport(v => ({ ...v, x: panning.startX + dx, y: panning.startY + dy }))
        return
      }
      if (drag && canvas.current) {
        const rect = canvas.current.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        const worldX = (mouseX - viewport.x) / viewport.zoom
        const worldY = (mouseY - viewport.y) / viewport.zoom
        update(next => {
          const node = next.nodes.find(item => item.id === drag.id)
          if (!node) return
          node.x = Math.round(worldX - drag.dx)
          node.y = Math.round(worldY - drag.dy)
        }, { recordHistory: false })
      }
    }
    const up = event => {
      if (panning) setPanning(null)
      if (connect) {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.map-node')?.dataset.id
        if (target && target !== connect) update(next => {
          next.edges = next.edges.filter(edge => !(edge.from === connect && edge.to === target))
          const targetNode = next.nodes.find(node => node.id === target)
          next.edges.push({ from: connect, to: target, port: targetNode?.name || target, label: targetNode?.name || '访问页面', desc: '' })
        })
        setConnect(null)
      }
      setDrag(null)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [drag, connect, panning, viewport])

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const handleWheel = event => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92
      setViewport(v => {
        const newZoom = Math.min(2.5, Math.max(0.4, Number((v.zoom * zoomFactor).toFixed(2))))
        const newX = Math.round(mouseX - (mouseX - v.x) * (newZoom / v.zoom))
        const newY = Math.round(mouseY - (mouseY - v.y) * (newZoom / v.zoom))
        return { x: newX, y: newY, zoom: newZoom }
      })
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  const workspaceClass = `workspace ${sidebarOpen && inspectorOpen ? 'with-both' : (sidebarOpen ? 'sidebar-only' : (inspectorOpen ? 'inspector-only' : 'zen-mode'))}`

  return <>
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="ghost icon-tiny"
          style={{ fontSize: 12, padding: '4px 8px' }}
          title={sidebarOpen ? '收起左侧页面列表' : '展开左侧页面列表'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '«' : '» 页面列表'}
        </button>
        <div className="brand">
          <span className="brand-mark">■</span>
          <div className="brand-title-wrap">
            <strong>ARG Blueprint</strong>
            <input
              className="project-title-input"
              value={state.title || '未命名 ARG 剧情'}
              onChange={e => update(next => { next.title = e.target.value })}
              title="点击重命名项目"
              placeholder="项目名称..."
            />
          </div>
        </div>
      </div>
      <div className="topbar-toolbar">
        <button className="ghost icon-tiny" style={{ padding: '5px 8px' }} disabled={!history.past.length} onClick={undo} title="撤销上一步操作 (Ctrl+Z)">
          撤销
        </button>
        <button className="ghost icon-tiny" style={{ padding: '5px 8px' }} disabled={!history.future.length} onClick={redo} title="重做操作 (Ctrl+Y 或 Ctrl+Shift+Z)">
          重做
        </button>
        <button
          className="ghost icon-tiny"
          style={{ color: terminalOpen ? 'var(--text-main)' : 'inherit', fontWeight: terminalOpen ? 600 : 'normal' }}
          onClick={() => setTerminalOpen(!terminalOpen)}
          title="打开/收起 Linux 命令行终端 (快捷键 Ctrl+`)"
        >
          终端
        </button>
        <input type="file" ref={importInputRef} accept=".zip,.json" style={{ display: 'none' }} onChange={handleImportFile} />
        <button className="ghost icon-tiny" onClick={() => importInputRef.current?.click()} title="导入 .zip 或 .json 蓝图文件">导入</button>
        <button
          className="ghost icon-tiny"
          style={{ padding: '5px 8px' }}
          onClick={() => setShowEventsModal(true)}
          title="全局自定义事件、线索收集与解锁前置条件中枢"
        >
          🔒 事件线索
        </button>
        <button
          className="ghost icon-tiny"
          style={{
            padding: '5px 8px',
            color: graphValidation.healthy ? 'inherit' : '#b45309',
            fontWeight: graphValidation.healthy ? 'normal' : 600,
            borderColor: graphValidation.healthy ? 'var(--border-color)' : '#fde68a',
            background: graphValidation.healthy ? 'transparent' : '#fefce8'
          }}
          onClick={() => setShowValidatorModal(true)}
          title="剧情死胡同、孤岛与断路结局自检"
        >
          自检 {graphValidation.healthy ? '✓' : `(${graphValidation.errorCount + graphValidation.warningCount})`}
        </button>
        <button
          className="ghost icon-tiny"
          style={{
            padding: '5px 8px',
            color: dshOnline ? '#166534' : 'inherit',
            fontWeight: dshOnline ? 600 : 'normal',
            borderColor: dshOnline ? '#bbf7d0' : 'var(--border-color)',
            background: dshOnline ? '#f0fdf4' : 'transparent'
          }}
          onClick={() => setShowDshPanel(true)}
          title={`DeepSeek Harness (dsh) 本地协同 - 端点: ${dshEndpoint}`}
        >
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: dshOnline ? '#16a34a' : '#a1a1aa', marginRight: 4 }} />
          DSH 联动 {dshOnline ? '3080' : ''}
        </button>
        <button className="ghost icon-tiny" onClick={() => setShowTemplateModal(true)}>自定义模板</button>
        <button className="ghost icon-tiny" onClick={() => confirm('确定清空并新建空白蓝图？') && update(next => { Object.assign(next, empty()) })}>新建</button>
        <button className="ghost icon-tiny" onClick={() => confirm('载入官方示例项目《灵异论坛调查模仿》？当前画布内容将被替换') && update(next => { Object.assign(next, getQiyuebanDemoProject()) })} title="载入官方完整 20 节点悬疑解谜范例">示例项目</button>
        <button className="secondary" onClick={() => openPreviewInNewTab(state)} title="在新的浏览器标签页中全屏运行并体验完整游戏（支持点击桌面图标、论坛、搜索与所有结局跳转）">
          预览运行
        </button>
        <button className="primary" onClick={() => exportZip(state)} title="打包所有 HTML 与蓝图数据导出为 ZIP 压缩包">导出 ZIP</button>
        <button className="ghost icon-tiny" style={{ padding: '5px 8px', fontSize: 12 }} onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏模式'}>
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
    </header>

    <main className={workspaceClass}>
      {sidebarOpen && (
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="panel-title">页面节点 ({state.nodes.length})</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="primary icon-tiny" onClick={() => setShowAddMenu(!showAddMenu)}>
                新建
              </button>
            </div>
            {showAddMenu && (
              <div className="add-menu-popover" style={{ position: 'absolute', top: 38, left: 130, background: '#fff', border: '1px solid var(--border-color)', borderRadius: 6, boxShadow: 'var(--shadow-lg)', zIndex: 30, padding: 4, minWidth: 130 }}>
                {Object.entries(TYPES).map(([k, v]) => (
                  <div key={k} className="add-menu-item" style={{ padding: '6px 8px', fontSize: 11.5, cursor: 'pointer', borderRadius: 4, color: 'var(--text-main)' }} onClick={() => add(k)} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {v.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="node-list">
            {state.nodes.map(node => (
              <div
                key={node.id}
                className={`node-item ${node.id === state.selected ? 'active' : ''}`}
                onClick={() => selectNode(node.id)}
              >
                <span className="node-dot"/>
                <div className="node-name">
                  {node.name}
                  <span className="node-type">{TYPES[node.type]?.label || node.type}{node.isStart ? ' · 起始' : ''}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="sidebar-tip">
            拖拽节点调整布局，从节点右侧圆点拖拽至目标卡片建立连线。
          </div>
        </aside>
      )}

      <section className="canvas-wrap">
        {!sidebarOpen && (
          <button className="floating-panel-toggle left" onClick={() => setSidebarOpen(true)} title="展开页面列表">
            页面列表 ({state.nodes.length})
          </button>
        )}
        {!inspectorOpen && (
          <button className="floating-panel-toggle right" onClick={() => setInspectorOpen(true)} title="展开属性配置面板">
            属性配置
          </button>
        )}

        <div
          className={`canvas ${panning ? 'panning' : ''}`}
          ref={canvas}
          style={{
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            backgroundSize: `${20 * viewport.zoom}px ${20 * viewport.zoom}px`,
            cursor: panning ? 'grabbing' : (drag ? 'move' : 'grab')
          }}
          onMouseDown={event => {
            if (event.target.closest('.map-node') || event.target.closest('.canvas-dock-controls') || event.target.closest('.floating-panel-toggle') || event.target.closest('.empty button')) return
            setPanning({
              startX: viewport.x,
              startY: viewport.y,
              mouseX: event.clientX,
              mouseY: event.clientY
            })
          }}
        >
          <div
            className="canvas-viewport"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          >
            <svg className="edges" style={{ pointerEvents: 'none' }}>
              <defs>
                <marker id="arrow-glow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#71717a" />
                </marker>
              </defs>
              {state.edges.map((edge, index) => {
                const from = state.nodes.find(node => node.id === edge.from)
                const to = state.nodes.find(node => node.id === edge.to)
                if (!from || !to) return null
                const x1 = from.x + 200
                const y1 = from.y + 40
                const x2 = to.x
                const y2 = to.y + 40
                const dx = Math.max(60, Math.abs(x2 - x1) * 0.5)
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${index}`}
                    className="edge"
                    markerEnd="url(#arrow-glow)"
                    d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                  />
                )
              })}
            </svg>

            {state.nodes.map(node => {
              const nodeHasIssue = graphValidation.issues.some(i => i.nodeId === node.id)
              return (
                <div
                  key={node.id}
                  data-id={node.id}
                  className={`map-node ${node.id === state.selected ? 'selected' : ''} ${node.isStart ? 'start-node' : ''} ${nodeHasIssue ? 'has-issue' : ''}`}
                  style={{ left: node.x, top: node.y, pointerEvents: 'auto' }}
                  onClick={() => selectNode(node.id)}
                  onDoubleClick={() => setPreviewNode(node)}
                onMouseDown={event => {
                  if (event.target.classList.contains('port') || event.target.closest('button')) return
                  event.stopPropagation()
                  const rect = canvas.current.getBoundingClientRect()
                  const mouseX = event.clientX - rect.left
                  const mouseY = event.clientY - rect.top
                  const worldX = (mouseX - viewport.x) / viewport.zoom
                  const worldY = (mouseY - viewport.y) / viewport.zoom
                  setDrag({
                    id: node.id,
                    dx: worldX - node.x,
                    dy: worldY - node.y
                  })
                }}
              >
                <div className="node-header-row">
                  <span className={`badge ${node.type}`}>{TYPES[node.type]?.label || node.type}</span>
                  <span className="node-template-tag">{node.template || '默认'}</span>
                </div>
                <h3 className="node-title" title={node.name}>{node.name}</h3>
                <div className="node-desc">{summary(node, state.edges)}</div>
                
                <div className="node-actions">
                  {!node.isStart && (
                    <button className="ghost icon-tiny" title="设为起始游戏页" onClick={e => setAsStart(node.id, e)}>
                      设为起始
                    </button>
                  )}
                  <button className="ghost icon-tiny" title="实时预览该页面" onClick={e => { e.stopPropagation(); setPreviewNode(node) }}>
                    预览
                  </button>
                </div>

                {node.type !== 'Ending' && (
                  <span
                    className="port"
                    title="拖拽到目标卡片连线"
                    onMouseDown={event => { event.stopPropagation(); setConnect(node.id) }}
                  />
                )}
              </div>
            )})}
          </div>

          {!state.nodes.length && (
            <div className="empty" style={{ zIndex: 4, maxWidth: 440, padding: '32px 36px', textAlign: 'center', background: 'rgba(255,255,255,0.96)', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                空白 ARG 游戏蓝图
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 18 }}>
                当前画布为空。你可以快速创建新页面节点开始构思，或一键载入官方完整范例进行体验：
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
                <button className="primary" style={{ padding: '6px 12px' }} onClick={() => add('Desktop')}>
                  ＋ 电脑桌面 (Desktop)
                </button>
                <button className="secondary" style={{ padding: '6px 12px' }} onClick={() => add('Browse')}>
                  ＋ 浏览文章 (Browse)
                </button>
                <button className="secondary" style={{ padding: '6px 12px' }} onClick={() => add('Chat')}>
                  ＋ 聊天通讯 (Chat)
                </button>
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 14 }}>
                <button className="ghost" style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #cbd5e1' }} onClick={() => update(next => { Object.assign(next, getQiyuebanDemoProject()) })}>
                  📦 载入《灵异论坛调查模仿》20 节点官方范例
                </button>
              </div>
            </div>
          )}

          <div className="canvas-hint-bar">
            Ctrl+Z 撤销 · Ctrl+Y 重做 · Del 删除 · 拖拽右侧圆点连线 · 双击卡片快速预览
          </div>

          <div className="canvas-dock-controls">
            <button className="ghost canvas-dock-btn" disabled={!history.past.length} onClick={undo} title="撤销 (Ctrl+Z)">撤销</button>
            <button className="ghost canvas-dock-btn" disabled={!history.future.length} onClick={redo} title="重做 (Ctrl+Y)">重做</button>
            <button className="ghost canvas-dock-btn" title="放大" onClick={() => setViewport(v => ({ ...v, zoom: Math.min(2.5, Number((v.zoom + 0.15).toFixed(2))) }))}>＋</button>
            <button className="ghost canvas-dock-btn" title="重置为 100%" onClick={() => setViewport(v => ({ ...v, zoom: 1 }))}>{Math.round(viewport.zoom * 100)}%</button>
            <button className="ghost canvas-dock-btn" title="缩小" onClick={() => setViewport(v => ({ ...v, zoom: Math.max(0.4, Number((v.zoom - 0.15).toFixed(2))) }))}>－</button>
            <button className="ghost canvas-dock-btn" title="居中聚焦所有节点" onClick={() => {
              if (!state.nodes.length) { setViewport({ x: 0, y: 0, zoom: 1 }); return }
              const minX = Math.min(...state.nodes.map(n => n.x))
              const minY = Math.min(...state.nodes.map(n => n.y))
              setViewport({ x: -minX + 80, y: -minY + 60, zoom: 1 })
            }}>居中</button>
            <button className="ghost canvas-dock-btn" title="打开 Linux 命令行终端 (Ctrl+`)" onClick={() => setTerminalOpen(!terminalOpen)}>
              终端
            </button>
            <button className="ghost canvas-dock-btn" title={isFullscreen ? '退出全屏' : '全屏模式'} onClick={toggleFullscreen}>
              {isFullscreen ? '退出全屏' : '全屏'}
            </button>
          </div>
        </div>
      </section>

      {inspectorOpen && (
        <Inspector
          selected={selected}
          nodes={state.nodes}
          edges={state.edges}
          customTemplates={state.customTemplates}
          openTemplateModal={() => setShowTemplateModal(true)}
          onClose={() => setInspectorOpen(false)}
          update={update}
          patch={patchSelected}
          remove={remove}
          addRule={() => patchSelected(node => { node.rules = node.rules || []; node.rules.push({ keyword: '新关键词', target: state.nodes.find(item => item.id !== node.id)?.id || '' }) })}
          addNode={add}
        />
      )}
    </main>

    <Terminal state={state} update={update} isOpen={terminalOpen} onClose={() => setTerminalOpen(false)} />
    {showValidatorModal && (
      <ValidatorModal
        validation={graphValidation}
        onFocusNode={focusNode}
        onClose={() => setShowValidatorModal(false)}
      />
    )}
    {showEventsModal && (
      <EventsModal
        state={state}
        onClose={() => setShowEventsModal(false)}
        onFocusNode={focusNode}
      />
    )}
    {showDshPanel && (
      <DshPanel
        state={state}
        update={update}
        isOpen={showDshPanel}
        onClose={() => setShowDshPanel(false)}
      />
    )}
    {previewNode && <Preview state={state} initialNode={previewNode} onEdit={editSlots} close={() => setPreviewNode(null)}/>} 
    {showTemplateModal && (
      <CustomTemplateModal
        state={state}
        update={update}
        close={() => setShowTemplateModal(false)}
        initialType={selected?.type || 'Browse'}
        onSelectTemplate={name => patchSelected(node => { node.template = name })}
      />
    )} 
  </>
}

function summary(node, edges = []) {
  if (node.type === 'Chat') {
    const count = (node.contacts || []).length
    return `联系人 ${count} 位 · 对话分支`
  }
  if (node.type === 'Desktop') {
    const count = edges.filter(e => e.from === node.id).length
    return `桌面图标 ${count} 个`
  }
  if (node.type === 'Search') {
    const rulesCount = (node.rules || []).length
    const btnCount = edges.filter(e => e.from === node.id).length
    return `规则 ${rulesCount} 条 · 按键 ${btnCount} 个`
  }
  if (node.type === 'Login') return `密码验证 · ${node.fields?.password ? '已设置' : '未设置'}`
  if (node.type === 'Index') {
    const count = edges.filter(e => e.from === node.id).length
    return `超链接按键 ${count} 个`
  }
  return node.fields?.title || node.fields?.siteName || node.fields?.path || node.fields?.message || '未填写内容'
}


const safeHex = (val, fallback = '#174a8b') => {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val)) return val
  if (typeof val === 'string' && /^#[0-9a-fA-F]{3}$/.test(val)) return val
  return fallback
}
