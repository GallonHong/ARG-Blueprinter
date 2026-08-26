import { useEffect, useMemo, useRef, useState } from 'react';
import { pageFileName, defaultContacts, getSmartIcon } from './route-config.js';
import { runtimeSource } from './runtime.js';
import { setCustomTemplates } from './templates.js';
import { getQiyuebanDemoProject } from './demo-project.js';
import { Terminal } from './Terminal.jsx';
import { validateStoryGraph } from './validator.js';
import { DshPanel } from './DshPanel.jsx';
import { EventsModal } from './EventsModal.jsx';
import { getStoredDshEndpoint, checkDshHealth, createSharedStateClient } from './dsh-bridge.js';
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
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('arg-blueprint-react') || 'null');
    } catch (e) {
      saved = null;
    }
    if (!saved || !Array.isArray(saved.nodes)) {
      saved = empty();
    }
    if (!saved.customTemplates) {
      try {
        saved.customTemplates = JSON.parse(localStorage.getItem('arg_custom_templates') || '[]');
      } catch (e) {
        saved.customTemplates = [];
      }
    }
    setCustomTemplates(saved.customTemplates);
    saved.nodes = (saved.nodes || []).filter(Boolean);
    saved.edges = (saved.edges || []).filter(Boolean);
    saved.nodes.forEach((node, index) => {
      if (typeof node.x !== 'number' || isNaN(node.x)) node.x = 60 + (index % 3) * 230;
      if (typeof node.y !== 'number' || isNaN(node.y)) node.y = 60 + Math.floor(index / 3) * 150;
      if (!node.type || !TYPES[node.type]) node.type = 'Browse';
      if (!node.fields) node.fields = {};
    });
    saved.edges.forEach(edge => {
      const fromNode = saved.nodes.find(n => n.id === edge.from);
      const toNode = saved.nodes.find(n => n.id === edge.to);
      if (fromNode && (fromNode.type === 'Desktop' || fromNode.type === 'Files')) {
        if (!edge.icon || edge.icon === '📁') {
          edge.icon = getSmartIcon(edge, toNode);
        }
      }
    });
    if (saved.nodes.length && !saved.startId) saved.startId = saved.nodes[0].id;
    if (saved.nodes.length && !saved.nodes.some(node => node.isStart)) saved.nodes[0].isStart = true;
    return saved;
  });

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [panning, setPanning] = useState(null);
  const [drag, setDrag] = useState(null);
  const [connect, setConnect] = useState(null);
  const [previewNode, setPreviewNode] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showValidatorModal, setShowValidatorModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showDshPanel, setShowDshPanel] = useState(false);
  const [dshOnline, setDshOnline] = useState(false);
  const [dshEndpoint, setDshEndpoint] = useState(getStoredDshEndpoint());
  const [sharedStateConnected, setSharedStateConnected] = useState(false);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [terminalOpen, setTerminalOpen] = useState(false);

  const canvas = useRef(null);
  const importInputRef = useRef(null);
  const sharedClientRef = useRef(null);
  const isApplyingRemoteRef = useRef(false);

  const selected = state.nodes.find(node => node.id === state.selected);
  const graphValidation = useMemo(() => validateStoryGraph(state), [state]);

  // 1. Connect Unified Shared State (SSE from 3088 Bridge)
  useEffect(() => {
    const client = createSharedStateClient({
      onRemoteUpdate: (remoteState, type) => {
        if (!remoteState || !Array.isArray(remoteState.nodes)) return;
        isApplyingRemoteRef.current = true;
        setState(current => {
          const currentStr = JSON.stringify({ nodes: current.nodes, edges: current.edges, startId: current.startId });
          const remoteStr = JSON.stringify({ nodes: remoteState.nodes, edges: remoteState.edges, startId: remoteState.startId });
          if (currentStr === remoteStr) return current;

          const merged = {
            ...current,
            title: remoteState.title || current.title,
            startId: remoteState.startId || current.startId,
            nodes: remoteState.nodes,
            edges: remoteState.edges || [],
            customTemplates: remoteState.customTemplates || current.customTemplates
          };
          localStorage.setItem('arg-blueprint-react', JSON.stringify(merged));
          return merged;
        });
        setTimeout(() => { isApplyingRemoteRef.current = false; }, 150);
      },
      onConnectionChange: (status) => {
        setSharedStateConnected(status.connected);
      }
    });

    sharedClientRef.current = client;
    return () => {
      client.disconnect();
    };
  }, []);

  // 2. Debounced auto-sync to Shared State bridge
  useEffect(() => {
    if (isApplyingRemoteRef.current) return;
    const timer = setTimeout(() => {
      if (sharedClientRef.current?.isConnected()) {
        sharedClientRef.current.syncState(state);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const update = (fn, { recordHistory = true } = {}) => {
    setState(current => {
      const next = copy(current);
      fn(next);
      if (recordHistory) {
        setHistory(h => ({
          past: [...h.past.slice(-30), copy(current)],
          future: []
        }));
      }
      localStorage.setItem('arg-blueprint-react', JSON.stringify(next));
      if (next.customTemplates) {
        localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates));
        setCustomTemplates(next.customTemplates);
      }
      return next;
    });
  };

  const undo = () => {
    if (!history.past.length) return;
    const prev = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    setHistory(h => ({
      past: newPast,
      future: [copy(state), ...h.future.slice(0, 30)]
    }));
    setState(prev);
    localStorage.setItem('arg-blueprint-react', JSON.stringify(prev));
    if (prev.customTemplates) {
      setCustomTemplates(prev.customTemplates);
      localStorage.setItem('arg_custom_templates', JSON.stringify(prev.customTemplates));
    }
  };

  const redo = () => {
    if (!history.future.length) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    setHistory(h => ({
      past: [...h.past.slice(-30), copy(state)],
      future: newFuture
    }));
    setState(next);
    localStorage.setItem('arg-blueprint-react', JSON.stringify(next));
    if (next.customTemplates) {
      setCustomTemplates(next.customTemplates);
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates));
    }
  };

  const selectNode = id => {
    update(next => { next.selected = id; }, { recordHistory: false });
    setInspectorOpen(true);
  };

  const focusNode = (nodeId) => {
    const node = state.nodes.find(n => n.id === nodeId);
    if (node) {
      selectNode(node.id);
      setViewport({ x: -node.x + 200, y: -node.y + 150, zoom: 1 });
      setShowValidatorModal(false);
    }
  };

  const patchSelected = fn => {
    update(next => {
      const node = next.nodes.find(item => item.id === next.selected);
      if (node) fn(node);
    });
  };

  const removeNode = id => {
    update(next => {
      next.nodes = next.nodes.filter(item => item.id !== id);
      next.edges = next.edges.filter(edge => edge.from !== id && edge.to !== id);
      if (next.selected === id) next.selected = next.nodes[0]?.id || null;
      if (next.startId === id) {
        next.startId = next.nodes[0]?.id || null;
        if (next.nodes[0]) next.nodes[0].isStart = true;
      }
    });
  };

  const add = type => {
    const node = newNode(type, state.nodes.length + 1);
    update(next => {
      next.nodes.push(node);
      next.selected = node.id;
      if (!next.startId) {
        next.startId = node.id;
        node.isStart = true;
      }
    });
    setShowAddMenu(false);
    setInspectorOpen(true);
  };

  const addRule = () => {
    patchSelected(node => {
      node.rules = node.rules || [];
      const target = state.nodes.find(item => item.id !== node.id)?.id || '';
      node.rules.push({ keyword: `线索 ${node.rules.length + 1}`, target });
    });
  };

  const setAsStart = id => {
    update(next => {
      next.startId = id;
      next.nodes.forEach(node => {
        node.isStart = node.id === id;
      });
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => alert(`全屏失败: ${err.message}`));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => alert(`退出全屏失败: ${err.message}`));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setTerminalOpen(prev => !prev);
        return;
      }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target?.tagName) || event.target?.isContentEditable) return;
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selected) {
          event.preventDefault();
          removeNode(state.selected);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selected, history]);

  useEffect(() => {
    const pollDsh = async () => {
      const res = await checkDshHealth(dshEndpoint);
      setDshOnline(res.online);
    };
    pollDsh();
    const interval = setInterval(pollDsh, 10000);
    return () => clearInterval(interval);
  }, [dshEndpoint]);

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const projectData = await parseAndLoadProject(file);
      if (projectData && Array.isArray(projectData.nodes)) {
        update(next => {
          Object.assign(next, projectData);
        });
        alert(`✓ 成功导入蓝图项目「${projectData.title || file.name}」（共 ${projectData.nodes.length} 个页面，${projectData.edges.length} 条连线）`);
      } else {
        alert('导入失败：未找到有效的 ARG 蓝图数据');
      }
    } catch (err) {
      alert(`导入失败: ${err.message}`);
    } finally {
      e.target.value = '';
    }
  };

  const workspaceClass = `workspace ${sidebarOpen ? '' : 'no-sidebar'} ${inspectorOpen ? '' : 'no-inspector'}`;

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <span className="brand-badge">ARG Blueprint</span>
          <input
            className="project-title-input"
            value={state.title || ''}
            onChange={e => update(next => { next.title = e.target.value }, { recordHistory: false })}
            placeholder="未命名 ARG 项目"
          />
          <span className="version-tag">Unified Shared State</span>
        </div>

        <div className="topbar-actions">
          <input
            type="file"
            ref={importInputRef}
            style={{ display: 'none' }}
            accept=".zip,.json"
            onChange={handleImportFile}
          />
          <button className="ghost icon-tiny" onClick={() => importInputRef.current?.click()} title="导入 .zip 游戏包或 .json 蓝图文件">
            导入项目
          </button>
          <button
            className="ghost icon-tiny"
            onClick={() => setTerminalOpen(!terminalOpen)}
            title="快捷键: Ctrl + ` (唤出类 Linux 命令行终端)"
          >
            终端 `
          </button>
          <button
            className="ghost icon-tiny"
            style={{
              padding: '5px 8px',
              color: sharedStateConnected ? '#166534' : (dshOnline ? '#166534' : 'inherit'),
              fontWeight: (sharedStateConnected || dshOnline) ? 600 : 'normal',
              borderColor: (sharedStateConnected || dshOnline) ? '#bbf7d0' : 'var(--border-color)',
              background: (sharedStateConnected || dshOnline) ? '#f0fdf4' : 'transparent'
            }}
            onClick={() => setShowDshPanel(true)}
            title="Shared State 统一共享状态 (UI ↔ DSH Agent ↔ CLI) - 桥接端口: 3088"
          >
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: sharedStateConnected ? '#16a34a' : (dshOnline ? '#16a34a' : '#a1a1aa'), marginRight: 4 }} />
            {sharedStateConnected ? '🟢 统一共享状态 (Live)' : (dshOnline ? 'DSH 3080' : 'DSH 联动')}
          </button>
          <button
            className="ghost icon-tiny"
            style={{
              padding: '5px 8px',
              color: graphValidation.healthy ? '#166534' : '#991b1b',
              fontWeight: 600,
              borderColor: graphValidation.healthy ? '#bbf7d0' : '#fecaca',
              background: graphValidation.healthy ? '#f0fdf4' : '#fef2f2'
            }}
            onClick={() => setShowValidatorModal(true)}
            title="剧情死胡同、孤岛与断路结局自检"
          >
            自检 {graphValidation.healthy ? '✓' : `(${graphValidation.errorCount + graphValidation.warningCount})`}
          </button>
          <button className="ghost icon-tiny" onClick={() => setShowTemplateModal(true)}>自定义模板</button>
          <button className="ghost icon-tiny" onClick={() => confirm('确定清空并新建空白蓝图？') && update(next => { Object.assign(next, empty()) })}>新建</button>
          <button className="ghost icon-tiny" onClick={() => confirm('载入官方示例项目《灵异论坛调查模仿》？当前画布内容将被替换') && update(next => { Object.assign(next, getQiyuebanDemoProject()) })} title="载入官方完整 20 节点悬疑解谜范例">示例项目</button>
          <button className="secondary" onClick={() => openPreviewInNewTab(state)} title="在新的浏览器标签页中全屏运行并体验完整游戏">
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
              if (event.target.closest('.map-node') || event.target.closest('.canvas-dock-controls') || event.target.closest('.floating-panel-toggle') || event.target.closest('.empty button')) return;
              setPanning({
                startX: viewport.x,
                startY: viewport.y,
                mouseX: event.clientX,
                mouseY: event.clientY
              });
            }}
            onMouseMove={event => {
              if (panning) {
                setViewport(v => ({
                  ...v,
                  x: panning.startX + (event.clientX - panning.mouseX),
                  y: panning.startY + (event.clientY - panning.mouseY)
                }));
              } else if (drag) {
                const rect = canvas.current?.getBoundingClientRect();
                if (!rect) return;
                const newX = Math.round((event.clientX - rect.left - viewport.x) / viewport.zoom - drag.offsetX);
                const newY = Math.round((event.clientY - rect.top - viewport.y) / viewport.zoom - drag.offsetY);
                update(next => {
                  const node = next.nodes.find(item => item.id === drag.id);
                  if (node) {
                    node.x = newX;
                    node.y = newY;
                  }
                }, { recordHistory: false });
              } else if (connect) {
                const rect = canvas.current?.getBoundingClientRect();
                if (!rect) return;
                setConnect(c => ({
                  ...c,
                  curX: (event.clientX - rect.left - viewport.x) / viewport.zoom,
                  curY: (event.clientY - rect.top - viewport.y) / viewport.zoom
                }));
              }
            }}
            onMouseUp={event => {
              if (panning) setPanning(null);
              if (drag) setDrag(null);
              if (connect) {
                const targetEl = document.elementFromPoint(event.clientX, event.clientY)?.closest('.map-node');
                const targetId = targetEl?.getAttribute('data-id');
                if (targetId && targetId !== connect.from) {
                  const fromNode = state.nodes.find(n => n.id === connect.from);
                  const toNode = state.nodes.find(n => n.id === targetId);
                  const defaultPort = toNode?.name || targetId;
                  const defaultIcon = (fromNode?.type === 'Desktop' || fromNode?.type === 'Files')
                    ? getSmartIcon({ label: defaultPort, port: defaultPort }, toNode)
                    : '';
                  update(next => {
                    const existing = next.edges.find(e => e.from === connect.from && e.to === targetId);
                    if (!existing) {
                      next.edges.push({
                        from: connect.from,
                        to: targetId,
                        port: defaultPort,
                        label: defaultPort,
                        icon: defaultIcon
                      });
                    }
                  });
                }
                setConnect(null);
              }
            }}
            onWheel={event => {
              event.preventDefault();
              const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
              const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.3), 2.5);
              const rect = canvas.current?.getBoundingClientRect();
              if (!rect) return;
              const mouseX = event.clientX - rect.left;
              const mouseY = event.clientY - rect.top;
              setViewport(v => ({
                zoom: newZoom,
                x: mouseX - (mouseX - v.x) * (newZoom / v.zoom),
                y: mouseY - (mouseY - v.y) * (newZoom / v.zoom)
              }));
            }}
          >
            <div
              className="canvas-content"
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                transformOrigin: '0 0'
              }}
            >
              <svg className="edges-layer" style={{ width: '5000px', height: '5000px', pointerEvents: 'none' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#3b82f6" />
                  </marker>
                </defs>
                {state.edges.map((edge, idx) => {
                  const fromNode = state.nodes.find(n => n.id === edge.from);
                  const toNode = state.nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const x1 = fromNode.x + 200;
                  const y1 = fromNode.y + 45;
                  const x2 = toNode.x;
                  const y2 = toNode.y + 45;
                  const dx = Math.abs(x2 - x1) * 0.5;
                  const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                  return (
                    <g key={`edge-${idx}`}>
                      <path d={pathData} fill="none" stroke="#93c5fd" strokeWidth="2.5" markerEnd="url(#arrow)" />
                      {edge.port && (
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 6}
                          fill="#1e40af"
                          fontSize="10"
                          textAnchor="middle"
                          className="edge-label"
                        >
                          {edge.icon ? `${edge.icon} ${edge.port}` : edge.port}
                        </text>
                      )}
                    </g>
                  );
                })}
                {connect && (
                  <path
                    d={`M ${connect.startX} ${connect.startY} C ${connect.startX + 60} ${connect.startY}, ${connect.curX - 60} ${connect.curY}, ${connect.curX} ${connect.curY}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                )}
              </svg>

              {state.nodes.map(node => (
                <div
                  key={node.id}
                  data-id={node.id}
                  className={`map-node ${node.id === state.selected ? 'selected' : ''} ${node.isStart ? 'start-node' : ''}`}
                  style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                  onMouseDown={event => {
                    if (event.target.classList.contains('connect-handle')) return;
                    event.stopPropagation();
                    selectNode(node.id);
                    const rect = canvas.current?.getBoundingClientRect();
                    if (!rect) return;
                    setDrag({
                      id: node.id,
                      offsetX: (event.clientX - rect.left - viewport.x) / viewport.zoom - node.x,
                      offsetY: (event.clientY - rect.top - viewport.y) / viewport.zoom - node.y
                    });
                  }}
                >
                  <div className="node-card-header">
                    <span className="node-icon">{TYPES[node.type]?.label.slice(0, 2) || '📄'}</span>
                    <span className="node-title" title={node.name}>{node.name}</span>
                    {node.isStart && <span className="badge-start">起点</span>}
                  </div>
                  <div className="node-card-body">
                    <div className="node-meta">{node.template}</div>
                    <div className="node-desc">{summary(node, state.edges)}</div>
                  </div>
                  <div
                    className="connect-handle"
                    title="按住拖拽至目标页面创建出口"
                    onMouseDown={event => {
                      event.stopPropagation();
                      setConnect({
                        from: node.id,
                        startX: node.x + 200,
                        startY: node.y + 45,
                        curX: node.x + 200,
                        curY: node.y + 45
                      });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="canvas-dock-controls">
              <button className="dock-btn" onClick={() => setViewport(v => ({ ...v, zoom: Math.min(v.zoom * 1.2, 2.5) }))} title="放大">＋</button>
              <button className="dock-btn" onClick={() => setViewport(v => ({ ...v, zoom: Math.max(v.zoom * 0.8, 0.3) }))} title="缩小">－</button>
              <button className="dock-btn" onClick={() => setViewport({ x: 40, y: 40, zoom: 1 })} title="重置视图">⊙</button>
            </div>
          </div>
        </section>

        {inspectorOpen && (
          <Inspector
            selected={selected}
            nodes={state.nodes}
            edges={state.edges}
            customTemplates={state.customTemplates || []}
            openTemplateModal={() => setShowTemplateModal(true)}
            onClose={() => setInspectorOpen(false)}
            update={update}
            patch={patchSelected}
            remove={() => removeNode(state.selected)}
            addRule={addRule}
            addNode={add}
          />
        )}
      </main>

      {terminalOpen && (
        <Terminal
          state={state}
          updateState={update}
          onClose={() => setTerminalOpen(false)}
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

      {showValidatorModal && (
        <ValidatorModal
          validation={graphValidation}
          onFocusNode={focusNode}
          onClose={() => setShowValidatorModal(false)}
        />
      )}

      {showTemplateModal && (
        <CustomTemplateModal
          state={state}
          update={update}
          close={() => setShowTemplateModal(false)}
          initialType={selected?.type || 'Browse'}
          onSelectTemplate={name => patchSelected(node => { node.template = name; })}
        />
      )}
    </>
  );
}

function summary(node, edges = []) {
  if (node.type === 'Chat') {
    const count = (node.contacts || []).length;
    return `联系人 ${count} 位 · 对话分支`;
  }
  if (node.type === 'Desktop') {
    const count = edges.filter(e => e.from === node.id).length;
    return `桌面图标 ${count} 个`;
  }
  if (node.type === 'Search') {
    const rulesCount = (node.rules || []).length;
    const btnCount = edges.filter(e => e.from === node.id).length;
    return `规则 ${rulesCount} 条 · 按键 ${btnCount} 个`;
  }
  if (node.type === 'Login') return `密码验证 · ${node.fields?.password ? '已设置' : '未设置'}`;
  if (node.type === 'Index') {
    const count = edges.filter(e => e.from === node.id).length;
    return `超链接按键 ${count} 个`;
  }
  return node.fields?.title || node.fields?.siteName || node.fields?.path || node.fields?.message || '未填写内容';
}
