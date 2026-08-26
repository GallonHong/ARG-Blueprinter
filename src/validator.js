/**
 * ARG Story Graph Health & Dead-End Validator
 * Analyzes reachability, orphans, dead-ends, unreachable endings, and broken targets.
 */

export function validateStoryGraph(state) {
  if (!state || typeof state !== 'object') {
    return { healthy: true, errorCount: 0, warningCount: 0, issues: [], reachableCount: 0, totalCount: 0, endingCount: 0, summary: '' };
  }
  const issues = [];
  const rawNodes = Array.isArray(state.nodes) ? state.nodes : [];
  const nodes = rawNodes.filter(n => n && typeof n === 'object' && n.id);
  const rawEdges = Array.isArray(state.edges) ? state.edges : [];
  const edges = rawEdges.filter(e => e && e.from && e.to);
  const startId = state.startId || (nodes.find(n => n.isStart)?.id) || nodes[0]?.id;

  if (!nodes.length) {
    return {
      healthy: false,
      summary: '项目中暂无任何页面节点',
      issues: [{ type: 'error', code: 'EMPTY_GRAPH', message: '蓝图画布为空，请至少添加一个起始页面节点。' }],
      reachableCount: 0,
      totalCount: 0,
      endingCount: 0,
      errorCount: 1,
      warningCount: 0
    };
  }

  if (!startId) {
    issues.push({
      type: 'error',
      code: 'NO_START_NODE',
      message: '未设置游戏起始页，运行器将无法确定首个载入页面。',
      nodeId: nodes[0]?.id
    });
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build adjacency list for outgoing routes
  // Takes into account: edges, search rules, chat choices, login targets
  const outgoingMap = new Map();
  nodes.forEach(n => outgoingMap.set(n.id, new Set()));

  // 1. Direct edges
  edges.forEach(e => {
    if (e.from && e.to && outgoingMap.has(e.from)) {
      outgoingMap.get(e.from).add(e.to);
    }
  });

  // 2. Search rules
  nodes.forEach(n => {
    if (n.type === 'Search' && Array.isArray(n.rules)) {
      n.rules.forEach(r => {
        if (r.target) {
          outgoingMap.get(n.id)?.add(r.target);
          if (!nodeMap.has(r.target)) {
            issues.push({
              type: 'error',
              code: 'BROKEN_RULE_TARGET',
              message: `搜索规则关键词「${r.keyword || ''}」指向了不存在的节点 ID: ${r.target}`,
              nodeId: n.id,
              nodeName: n.name
            });
          }
        }
      });
    }
  });

  // 3. Chat choices
  nodes.forEach(n => {
    if (n.type === 'Chat' && Array.isArray(n.contacts)) {
      n.contacts.forEach(c => {
        (c.choices || []).forEach(opt => {
          if (opt.target) {
            outgoingMap.get(n.id)?.add(opt.target);
            if (!nodeMap.has(opt.target)) {
              issues.push({
                type: 'error',
                code: 'BROKEN_CHAT_TARGET',
                message: `联系人「${c.name}」的选项「${opt.text}」指向了不存在的节点 ID: ${opt.target}`,
                nodeId: n.id,
                nodeName: n.name
              });
            }
          }
        });
      });
    }
  });

  // 4. Login targets
  nodes.forEach(n => {
    if (n.type === 'Login') {
      const edge = edges.find(e => e.from === n.id);
      const target = n.fields?.loginTarget || n.fields?.target || edge?.to;
      if (target) {
        outgoingMap.get(n.id)?.add(target);
        if (!nodeMap.has(target)) {
          issues.push({
            type: 'error',
            code: 'BROKEN_LOGIN_TARGET',
            message: `密码锁解锁目标指向了不存在的节点 ID: ${target}`,
            nodeId: n.id,
            nodeName: n.name
          });
        }
      } else {
        issues.push({
          type: 'warning',
          code: 'LOGIN_NO_TARGET',
          message: `密码锁未配置解锁后前往的目标页面（请通过连线或属性设置目标）。`,
          nodeId: n.id,
          nodeName: n.name
        });
      }
    }
  });

  // BFS Reachability from startId
  const visited = new Set();
  if (startId && nodeMap.has(startId)) {
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = outgoingMap.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (nodeMap.has(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  // Detect Unreachable / Orphan nodes
  nodes.forEach(n => {
    if (n.id !== startId && !visited.has(n.id)) {
      issues.push({
        type: 'warning',
        code: 'UNREACHABLE_NODE',
        message: `孤岛卡片：从起始页出发无法到达「${n.name}」，玩家将无法体验该页面。`,
        nodeId: n.id,
        nodeName: n.name
      });
    }
  });

  // Detect Dead-End nodes (non-Ending nodes with 0 outgoing routes)
  nodes.forEach(n => {
    if (n.type !== 'Ending') {
      const out = outgoingMap.get(n.id);
      if (!out || out.size === 0) {
        issues.push({
          type: 'warning',
          code: 'DEAD_END_NODE',
          message: `死胡同页面：「${n.name}」非结局页，但没有任何出口连线/规则，玩家进入后将卡死无法返回或前进。`,
          nodeId: n.id,
          nodeName: n.name
        });
      }
    }
  });

  // Detect Unreachable Ending nodes
  const endingNodes = nodes.filter(n => n.type === 'Ending');
  endingNodes.forEach(n => {
    if (!visited.has(n.id)) {
      issues.push({
        type: 'error',
        code: 'UNREACHABLE_ENDING',
        message: `断路结局：结局「${n.name}」无法从任何有效路径通关到达。`,
        nodeId: n.id,
        nodeName: n.name
      });
    }
  });

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const healthy = errorCount === 0 && warningCount === 0;

  return {
    healthy,
    errorCount,
    warningCount,
    issues,
    reachableCount: visited.size,
    totalCount: nodes.length,
    endingCount: endingNodes.length,
    summary: healthy
      ? `全部 ${nodes.length} 个页面节点链路完整，全部分支与 ${endingNodes.length} 个结局均可顺畅通关。`
      : `发现 ${errorCount} 处严重问题与 ${warningCount} 处潜在隐患，建议及时修复。`
  };
}
