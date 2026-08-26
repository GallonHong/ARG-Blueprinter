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

  const systemContext = `# ARG Blueprint 游戏蓝图结构上下文 (供 DeepSeek Harness Agent 推理参考)
项目名称：${state.title || '未命名 ARG'}
总页面数：${nodes.length} 个
起始页面：${startNode ? `[${startNode.type}] ${startNode.name} (${startNode.id})` : '未设置'}

## 当前已有页面与拓扑连线列表：
${nodeSummaries || '（当前画布为空）'}

## ARG Blueprint 专有 Linux CLI 指令语法规范：
- 创建页面：touch <id> -t <Type> -n "<名称>" [--template "<模板>"] [--start]
  (Type 可选: Desktop, Chat, Search, Browse, Login, Files, Ending)
- 建立连线：ln <from_id> <to_id> [-p "<按键名>"] [--icon "<图标/emoji>"]
- 设置属性：set <id> <key>="<value>" (例如 set login password="0717")
- 搜索规则：rule <search_id> "<关键词>" <target_id>
- 聊天人物：contact <chat_id> "<姓名>" [--avatar "<头像>"] [--bio "<简介>"]
- 聊天消息：msg <chat_id> "<姓名>" <npc|user> "<对话内容>"
- 对话选项：choice <chat_id> "<姓名>" "<玩家选项文案>" <target_id> [--reply "<NPC回复>"]

## 用户任务与扩写要求：
${requestPrompt || '请基于现有剧情线索，构思新的解谜支线或丰富 NPC 对话，并直接输出可执行的 ARG CLI 脚本（放在 ```bash 代码块中）。'}
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
