import { useState, useMemo } from 'react';

export function EventsModal({ state, onClose, onFocusNode }) {
  const nodes = useMemo(() => state.nodes || [], [state.nodes]);
  const edges = useMemo(() => state.edges || [], [state.edges]);

  // Extract all conditioned choices and links in the story
  const conditionedItems = useMemo(() => {
    const items = [];

    // 1. Chat choices with requirements
    nodes.filter(n => n.type === 'Chat').forEach(chatNode => {
      (chatNode.contacts || []).forEach(contact => {
        // Flat choices
        (contact.choices || []).forEach((c, cIdx) => {
          items.push({
            sourceNodeId: chatNode.id,
            sourceNodeName: chatNode.name,
            contactName: contact.name,
            type: 'chat_choice',
            text: c.text,
            targetId: c.target,
            requires: c.requires || c.req || '',
            id: `c_${chatNode.id}_${contact.id}_${cIdx}`
          });
        });
        // Dialogue options
        (contact.dialogue || []).forEach((step, sIdx) => {
          if (step.sender === 'choice') {
            (step.options || []).forEach((opt, optIdx) => {
              items.push({
                sourceNodeId: chatNode.id,
                sourceNodeName: chatNode.name,
                contactName: contact.name,
                type: 'chat_option',
                text: opt.text,
                targetId: opt.target,
                requires: opt.requires || opt.req || '',
                id: `d_${chatNode.id}_${contact.id}_${sIdx}_${optIdx}`
              });
            });
          }
        });
      });
    });

    // 2. Edge links with requirements
    edges.forEach((edge, eIdx) => {
      if (edge.requires) {
        const fromNode = nodes.find(n => n.id === edge.from);
        items.push({
          sourceNodeId: edge.from,
          sourceNodeName: fromNode?.name || edge.from,
          type: 'edge_link',
          text: edge.label || edge.port || '跳转链接',
          targetId: edge.to,
          requires: edge.requires,
          id: `e_${eIdx}`
        });
      }
    });

    return items;
  }, [nodes, edges]);

  // All clue/event provider nodes (articles, archives, safe, posts)
  const clueSourceNodes = useMemo(() => {
    return nodes.filter(n => n.type === 'Browse' || n.type === 'Files' || n.type === 'Login');
  }, [nodes]);

  // Live Testbed State (Simulated visited nodes)
  const [simulatedVisited, setSimulatedVisited] = useState(() => {
    return new Set(['node_desktop', 'node_forum']);
  });

  const toggleSimulatedNode = (nodeId) => {
    setSimulatedVisited(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const selectAllClues = () => {
    setSimulatedVisited(new Set(nodes.map(n => n.id)));
  };

  const clearAllClues = () => {
    setSimulatedVisited(new Set());
  };

  const isUnlocked = (req) => {
    if (!req) return true;
    const reqList = String(req).split(',').map(s => s.trim().toLowerCase());
    return reqList.every(r => Array.from(simulatedVisited).some(v => v.toLowerCase() === r));
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="events-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <h2>自定义事件与剧情线索中枢 (Events & Clues Manager)</h2>
            <span className="terminal-badge" style={{ fontSize: 10 }}>
              条件分支: {conditionedItems.filter(i => i.requires).length} 处
            </span>
          </div>
          <button className="ghost icon-tiny" onClick={onClose}>✕</button>
        </div>

        {/* Overview Bar */}
        <div className="validator-summary-bar">
          <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 600 }}>
            全景线索追踪：控制选项与出口按剧情进度动态解锁，防止玩家开局剧透。
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            线索产出源: {clueSourceNodes.length} 处 · 全局节点: {nodes.length} 个
          </span>
        </div>

        {/* Body Split View: Left is Testbed, Right is Condition Graph */}
        <div className="events-body-container">
          {/* Left: Clue Checklist Testbed */}
          <div className="events-left-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong style={{ fontSize: 12, color: 'var(--text-main)' }}>🎮 剧情事件模拟器 (Live Testbed)</strong>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="ghost icon-tiny" style={{ fontSize: 10 }} onClick={selectAllClues}>全选</button>
                <button className="ghost icon-tiny" style={{ fontSize: 10 }} onClick={clearAllClues}>清空</button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              勾选或取消玩家“已获得的线索/已访问的页面”，右侧将实时模拟哪些对话选项和出口被成功解锁：
            </p>

            <div className="events-clue-list">
              {nodes.map(node => {
                const isChecked = simulatedVisited.has(node.id);
                const isProvider = clueSourceNodes.some(n => n.id === node.id);
                return (
                  <label
                    key={node.id}
                    className={`events-clue-item ${isChecked ? 'active' : ''}`}
                    style={{ borderLeftColor: isProvider ? '#0284c7' : '#cbd5e1' }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSimulatedNode(node.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: isChecked ? 600 : 'normal', color: isChecked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                        id: {node.id} ({node.type})
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Right: Conditioned Choices & Routes Status */}
          <div className="events-right-pane">
            <strong style={{ fontSize: 12, color: 'var(--text-main)', marginBottom: 8, display: 'block' }}>
              📋 条件分支实时触发状态
            </strong>

            <div className="events-conditioned-list">
              {conditionedItems.map((item) => {
                const unlocked = isUnlocked(item.requires);
                const targetNode = nodes.find(n => n.id === item.targetId);
                const reqNode = nodes.find(n => n.id === item.requires);

                return (
                  <div key={item.id} className={`events-condition-card ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`events-status-pill ${unlocked ? 'unlocked' : 'locked'}`}>
                          {unlocked ? '✓ 已解锁' : '🔒 锁定中'}
                        </span>
                        <strong style={{ fontSize: 12, color: 'var(--text-main)' }}>
                          {item.text}
                        </strong>
                      </div>
                      <button
                        className="ghost icon-tiny"
                        style={{ fontSize: 10, padding: '2px 6px' }}
                        onClick={() => onFocusNode(item.sourceNodeId)}
                      >
                        定位节点
                      </button>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      <span>所属: <strong>{item.sourceNodeName}</strong> {item.contactName ? `(联系人: ${item.contactName})` : ''}</span>
                      {targetNode && (
                        <span> ➔ 前往目标: <strong style={{ color: '#2563eb' }}>{targetNode.name}</strong></span>
                      )}
                    </div>

                    <div style={{ marginTop: 4, fontSize: 11, background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                      <span style={{ color: item.requires ? '#b45309' : '#166534', fontWeight: 500 }}>
                        {item.requires ? `前置条件：需先探索「${reqNode?.name || item.requires}」` : '前置条件：无（开局立即可见）'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
