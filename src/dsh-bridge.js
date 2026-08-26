/**
 * DeepSeek Harness (dsh) Local Bridge & AI Agent Coordinator
 * Connects ARG Blueprint to locally running DeepSeek Harness server (via localhost port).
 * Handles bidirectional postMessage IPC, Prompt Context Generation, and Batch Script Execution.
 */

export const DEFAULT_DSH_ENDPOINT = 'http://127.0.0.1:3080';

export function getStoredDshEndpoint() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('arg_dsh_endpoint') || DEFAULT_DSH_ENDPOINT;
  }
  return DEFAULT_DSH_ENDPOINT;
}

export function setStoredDshEndpoint(endpoint) {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('arg_dsh_endpoint', endpoint);
  }
}

/**
 * Checks connectivity to local DeepSeek Harness server
 */
export async function checkDshHealth(endpoint = DEFAULT_DSH_ENDPOINT) {
  try {
    const cleanUrl = endpoint.replace(/\/+$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    // Try fetching root or health endpoint (no-cors or standard fetch)
    const resp = await fetch(cleanUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return { online: true, endpoint: cleanUrl };
  } catch (e) {
    return { online: false, endpoint, error: e.message };
  }
}

/**
 * Formats the current ARG Blueprint state into a structured prompt context for DSH
 */
export function formatBlueprintForDsh(state, requestPrompt = '') {
  const nodes = state.nodes || [];
  const edges = state.edges || [];
  const startNode = nodes.find(n => n.id === state.startId || n.isStart) || nodes[0];

  const nodeSummaries = nodes.map(n => {
    const outEdges = edges.filter(e => e.from === n.id).map(e => `-> ${e.to} ("${e.label || e.port}")`);
    let extra = '';
    if (n.type === 'Search' && n.rules?.length) {
      extra = ` [搜索词: ${n.rules.map(r => `"${r.keyword}"=>${r.target}`).join(', ')}]`;
    } else if (n.type === 'Login' && n.fields?.password) {
      extra = ` [密码: "${n.fields.password}"]`;
    } else if (n.type === 'Chat' && n.contacts?.length) {
      extra = ` [联系人: ${n.contacts.map(c => c.name).join(', ')}]`;
    }
    return `- [${n.type}] id: ${n.id} | 名称: "${n.name}" | 模板: ${n.template}${extra} | 出口: ${outEdges.join(', ') || '无'}`;
  }).join('\n');

  const systemContext = `# ARG Blueprint 游戏蓝图结构上下文 & 叙事设计副驾驶 (ARG Narrative Copilot)
项目名称：${state.title || '未命名 ARG'}
总页面数：${nodes.length} 个
起始页面：${startNode ? `[${startNode.type}] ${startNode.name} (${startNode.id})` : '未设置'}

## 当前已有页面与拓扑连线列表：
${nodeSummaries || '（当前画布为空）'}

## 🤖 你的核心职责 (Narrative Copilot Role):
1. **剧情头脑风暴 (由用户做决断)**：
   - 围绕用户的构思目标，主动提供 2~3 个不同基调的剧情走向方案（如：社会派反转、民俗怪谈、黑客科技阴谋），阐述悬念点，由用户做最终选择。
2. **玩家驱动力与行动抓手自检 (Player Motivation Check)**：
   - 检查每个页面是否给予玩家明确的下一步动机与线索指引，杜绝“读完不知去哪”的信息死胡同。
3. **ARG 解密机制选型 (Puzzle Selection)**：
   - 推荐巧妙的解密手法：搜索词溯源、拼音/藏头密码锁、证人证言矛盾戳破、事件线索依赖（requires 前置门槛）等。
4. **页面功能模板与 UI 选型**：
   - 根据氛围推荐：时代新闻、复古BBS、SCP绝密卷宗、遇害者手写日记、极简现代杂志、黑客数据流、电脑桌面、即时通讯等。

## ARG Blueprint 专有 Linux CLI 指令语法规范：
- 创建页面：touch <id> -t <Type> -n "<名称>" [--template "<模板>"] [--start]
  (Type: Desktop, Chat, Search, Browse, Login, Files, Ending)
- 建立连线：ln <from_id> <to_id> [-p "<按键名>"] [--icon "<图标/emoji>"]
- 设置属性：set <id> <key>="<value>" (例如 set admin_lock password="0717")
- 搜索规则：rule <search_id> "<关键词>" <target_id>
- 聊天人物：contact <chat_id> "<姓名>" [--avatar "<头像>"] [--bio "<简介>"]
- 聊天消息：msg <chat_id> "<姓名>" <npc|user> "<对话内容>"
- 对话选项：choice <chat_id> "<姓名>" "<玩家选项文案>" <target_id> [--requires "<前置线索节点ID>"] [--reply "<NPC回复>"]

## 用户任务与扩写要求：
${requestPrompt || '请作为 ARG 剧情副驾驶，基于现有线索为用户提出 2~3 个精彩的剧情分支方案供用户抉择，并输出可执行的 ARG CLI 脚本（放在 ```bash 代码块中）。'}
`;

  return systemContext;
}

/**
 * Parses markdown bash script blocks from DSH response
 */
export function extractCliScriptFromDshResponse(responseContent) {
  if (!responseContent || typeof responseContent !== 'string') return '';
  const blockMatch = responseContent.match(/```(?:bash|sh|shell|arg)?\n([\s\S]*?)```/i);
  if (blockMatch) {
    return blockMatch[1].trim();
  }
  // If no code block, check if lines look like CLI commands
  const lines = responseContent.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('touch ') || trimmed.startsWith('ln ') || trimmed.startsWith('set ') || trimmed.startsWith('rule ') || trimmed.startsWith('contact ') || trimmed.startsWith('msg ') || trimmed.startsWith('choice ') || trimmed.startsWith('#');
  });
  if (lines.length > 0) {
    return lines.join('\n').trim();
  }
  return responseContent.trim();
}

/**
 * Dispatches a postMessage to DSH if running in parent / iframe / opener
 */
export function sendPostMessageToDsh(messageType, payload, targetWindow = null) {
  const win = targetWindow || (window.opener || (window.parent !== window ? window.parent : null));
  if (win) {
    win.postMessage({
      source: 'ARG_BLUEPRINT',
      type: messageType,
      payload,
      timestamp: Date.now()
    }, '*');
    return true;
  }
  return false;
}

/**
 * Shared State Real-time Sync Client (SSE + Auto Background Sync)
 * Connects browser to 3088 bridge for Unified Shared State between UI, DSH Agent, and CLI.
 */
export function createSharedStateClient({ onRemoteUpdate, onConnectionChange }) {
  let eventSource = null;
  let retryTimer = null;
  let isConnected = false;
  let lastSyncTimestamp = 0;
  const clientId = 'ui_' + Math.random().toString(36).slice(2, 9);

  function connect() {
    try {
      eventSource = new EventSource('http://127.0.0.1:3088/api/events');

      eventSource.onopen = () => {
        isConnected = true;
        onConnectionChange?.({ connected: true, endpoint: 'http://127.0.0.1:3088' });
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && (payload.type === 'INIT' || payload.type === 'STATE_CHANGED') && payload.state) {
            onRemoteUpdate?.(payload.state, payload.type);
          }
        } catch (e) {
          console.warn('[SharedState SSE parse error]', e);
        }
      };

      eventSource.onerror = () => {
        isConnected = false;
        onConnectionChange?.({ connected: false, endpoint: 'http://127.0.0.1:3088' });
        eventSource?.close();
        clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, 3000);
      };
    } catch (e) {
      isConnected = false;
      onConnectionChange?.({ connected: false, error: e.message });
      clearTimeout(retryTimer);
      retryTimer = setTimeout(connect, 3000);
    }
  }

  connect();

  return {
    clientId,
    isConnected: () => isConnected,
    disconnect: () => {
      clearTimeout(retryTimer);
      if (eventSource) eventSource.close();
    },
    syncState: async (state) => {
      try {
        lastSyncTimestamp = Date.now();
        const res = await fetch('http://127.0.0.1:3088/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state, clientId, timestamp: lastSyncTimestamp })
        });
        return await res.json();
      } catch (e) {
        // graceful offline fallback
        return { success: false, error: e.message };
      }
    }
  };
}

