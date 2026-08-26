import { defaultContacts } from './route-config.js';
import { formatBlueprintForDsh, getStoredDshEndpoint, setStoredDshEndpoint } from './dsh-bridge.js';

/**
 * Linux CLI Command Engine for ARG Blueprint
 * Supported commands:
 *  - touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start]
 *  - mkpage <id> [-t <type>] [-n <name>]
 *  - rm <id> [-f]
 *  - ln <from> <to> [-p <port>] [--icon <icon>] [--label <label>] [--desc <desc>]
 *  - unlink <from> <to>
 *  - rmlink <from> <to>
 *  - set <id> <key>=<val> [key=val...]
 *  - rule <search_id> <keyword> <target_id>
 *  - rmrule <search_id> <keyword>
 *  - contact <chat_id> <name> [--avatar <av>] [--bio <bio>]
 *  - msg <chat_id> <contact_name> <npc|player> <text>
 *  - choice <chat_id> <contact_name> <text> <target_id> [--reply <reply>]
 *  - start <id>
 *  - ls [-l]
 *  - cat <id>
 *  - stat <id>
 *  - mv <old_id> <new_id>
 *  - help [cmd]
 *  - clear
 */

export function executeCliCommand(line, state, updateState) {
  const trimmed = line.trim();
  if (!trimmed) return { output: '', error: null };
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) return { output: '', error: null };

  const tokens = parseCommandLine(trimmed);
  if (!tokens.length) return { output: '', error: null };

  const cmd = tokens[0].toLowerCase();
  const args = tokens.slice(1);

  try {
    switch (cmd) {
      case 'help':
      case 'man':
        return { output: getHelpText(args[0]), error: null };

      case 'touch':
      case 'mkpage':
      case 'new': {
        if (!args.length) throw new Error('用法: touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start]');
        const id = args[0];
        let type = 'Browse';
        let name = id;
        let template = '';
        let isStart = false;

        for (let i = 1; i < args.length; i++) {
          if (args[i] === '-t' || args[i] === '--type') type = args[++i] || 'Browse';
          else if (args[i] === '-n' || args[i] === '--name') name = args[++i] || id;
          else if (args[i] === '--template' || args[i] === '-tpl') template = args[++i] || '';
          else if (args[i] === '--start' || args[i] === '-s') isStart = true;
        }

        const validTypes = ['Chat', 'Desktop', 'Search', 'Index', 'Browse', 'Login', 'Files', 'Ending'];
        const matchedType = validTypes.find(t => t.toLowerCase() === type.toLowerCase()) || 'Browse';

        let createdNode = null;
        updateState(draft => {
          if (draft.nodes.some(n => n.id === id)) {
            throw new Error(`页面节点 '${id}' 已存在`);
          }
          const col = draft.nodes.length % 5;
          const row = Math.floor(draft.nodes.length / 5);
          createdNode = {
            id,
            name,
            type: matchedType,
            template,
            fields: { title: name, siteName: name, body: '' },
            rules: matchedType === 'Search' ? [] : undefined,
            contacts: matchedType === 'Chat' ? defaultContacts() : undefined,
            x: 80 + col * 260,
            y: 80 + row * 200,
            isStart
          };
          draft.nodes.push(createdNode);
          if (isStart || draft.nodes.length === 1) {
            draft.startId = id;
            createdNode.isStart = true;
          }
        });
        return { output: `[OK] 已创建页面节点: ${id} (${matchedType}) - "${name}"`, error: null };
      }

      case 'rm':
      case 'del': {
        if (!args.length) throw new Error('用法: rm <id> [-f]');
        const id = args[0];
        updateState(draft => {
          const idx = draft.nodes.findIndex(n => n.id === id);
          if (idx === -1) throw new Error(`找不到页面节点: '${id}'`);
          draft.nodes.splice(idx, 1);
          draft.edges = draft.edges.filter(e => e.from !== id && e.to !== id);
          if (draft.startId === id) {
            draft.startId = draft.nodes[0]?.id || null;
            if (draft.nodes[0]) draft.nodes[0].isStart = true;
          }
        });
        return { output: `[OK] 已删除页面节点 '${id}' 及关联路由连线`, error: null };
      }

      case 'ln':
      case 'link': {
        if (args.length < 2) throw new Error('用法: ln <from_id> <to_id> [-p <port/按键名>] [--icon <icon>] [--label <label>]');
        const from = args[0];
        const to = args[1];
        let port = '';
        let icon = '📁';
        let label = '';
        let placement = 'nav';

        for (let i = 2; i < args.length; i++) {
          if (args[i] === '-p' || args[i] === '--port') port = args[++i] || '';
          else if (args[i] === '--icon' || args[i] === '-i') icon = args[++i] || '📁';
          else if (args[i] === '--label' || args[i] === '-l') label = args[++i] || '';
          else if (args[i] === '--placement') placement = args[++i] || 'nav';
        }

        updateState(draft => {
          const fromNode = draft.nodes.find(n => n.id === from);
          const toNode = draft.nodes.find(n => n.id === to);
          if (!fromNode) throw new Error(`起始节点 '${from}' 不存在`);
          if (!toNode) throw new Error(`目标节点 '${to}' 不存在`);

          const portName = port || label || toNode.name;
          const exists = draft.edges.some(e => e.from === from && e.to === to && (e.port || '') === portName);
          if (exists) throw new Error(`连线 '${from}' -> '${to}' [${portName}] 已存在`);

          draft.edges.push({
            from,
            to,
            port: portName,
            label: label || portName,
            icon: icon || (portName.includes('.exe') ? '🖥️' : '📁'),
            placement
          });
        });
        return { output: `[OK] 已建立连线: ${from} --[${port || to}]--> ${to}`, error: null };
      }

      case 'unlink':
      case 'rmlink': {
        if (args.length < 2) throw new Error('用法: unlink <from_id> <to_id> [port]');
        const from = args[0];
        const to = args[1];
        const port = args[2];

        let removedCount = 0;
        updateState(draft => {
          const before = draft.edges.length;
          draft.edges = draft.edges.filter(e => {
            if (e.from === from && e.to === to) {
              if (port && e.port !== port) return true;
              return false;
            }
            return true;
          });
          removedCount = before - draft.edges.length;
        });
        if (removedCount === 0) throw new Error(`未找到匹配的连线: ${from} -> ${to}`);
        return { output: `[OK] 已移除 ${removedCount} 条连线关系 (${from} -> ${to})`, error: null };
      }

      case 'set':
      case 'config': {
        if (args.length < 2) throw new Error('用法: set <id> <key>=<val> [key=val...]');
        const id = args[0];
        const pairs = args.slice(1);

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === id);
          if (!node) throw new Error(`找不到页面节点: '${id}'`);

          pairs.forEach(pair => {
            const eqIdx = pair.indexOf('=');
            if (eqIdx === -1) return;
            const key = pair.slice(0, eqIdx);
            const val = pair.slice(eqIdx + 1);
            if (key === 'name') node.name = val;
            else if (key === 'template') node.template = val;
            else if (key === 'type') node.type = val;
            else {
              node.fields = node.fields || {};
              node.fields[key] = val;
            }
          });
        });
        return { output: `[OK] 已更新节点 '${id}' 属性`, error: null };
      }

      case 'rule': {
        if (args.length < 3) throw new Error('用法: rule <search_id> <keyword> <target_id>');
        const searchId = args[0];
        const keyword = args[1];
        const targetId = args[2];

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === searchId);
          if (!node) throw new Error(`找不到搜索引擎节点: '${searchId}'`);
          if (node.type !== 'Search') throw new Error(`节点 '${searchId}' 不是 Search 类型`);
          const targetNode = draft.nodes.find(n => n.id === targetId);
          if (!targetNode) throw new Error(`目标节点 '${targetId}' 不存在`);

          node.rules = node.rules || [];
          const existing = node.rules.find(r => r.keyword === keyword);
          if (existing) {
            existing.target = targetId;
          } else {
            node.rules.push({ keyword, target: targetId });
          }
        });
        return { output: `[OK] 搜索引擎 '${searchId}' 规则生效: 关键词「${keyword}」-> ${targetId}`, error: null };
      }

      case 'rmrule': {
        if (args.length < 2) throw new Error('用法: rmrule <search_id> <keyword>');
        const searchId = args[0];
        const keyword = args[1];

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === searchId);
          if (!node) throw new Error(`找不到搜索引擎节点: '${searchId}'`);
          node.rules = (node.rules || []).filter(r => r.keyword !== keyword);
        });
        return { output: `[OK] 已删除搜索引擎 '${searchId}' 关键词「${keyword}」`, error: null };
      }

      case 'contact': {
        if (args.length < 2) throw new Error('用法: contact <chat_id> <name> [--avatar <icon>] [--bio <bio>]');
        const chatId = args[0];
        const name = args[1];
        let avatar = '👤';
        let bio = '';

        for (let i = 2; i < args.length; i++) {
          if (args[i] === '--avatar' || args[i] === '-a') avatar = args[++i] || '👤';
          else if (args[i] === '--bio' || args[i] === '-b') bio = args[++i] || '';
        }

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          if (node.type !== 'Chat') throw new Error(`节点 '${chatId}' 不是 Chat 类型`);

          node.contacts = node.contacts || [];
          let contact = node.contacts.find(c => c.name === name);
          if (!contact) {
            contact = {
              id: `c_${Math.random().toString(36).slice(2, 7)}`,
              name,
              avatar,
              bio,
              messages: [],
              choices: []
            };
            node.contacts.push(contact);
          } else {
            contact.avatar = avatar;
            contact.bio = bio;
          }
        });
        return { output: `[OK] 聊天节点 '${chatId}' 已添加联系人: ${avatar} ${name}`, error: null };
      }

      case 'msg': {
        if (args.length < 4) throw new Error('用法: msg <chat_id> <contact_name> <npc|player> <text>');
        const chatId = args[0];
        const contactName = args[1];
        const sender = args[2].toLowerCase() === 'player' ? 'player' : 'npc';
        const text = args.slice(3).join(' ');

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          node.contacts = node.contacts || [];
          let contact = node.contacts.find(c => c.name === contactName);
          if (!contact) {
            contact = {
              id: `c_${Math.random().toString(36).slice(2, 7)}`,
              name: contactName,
              avatar: '👤',
              bio: '',
              messages: [],
              choices: []
            };
            node.contacts.push(contact);
          }
          contact.messages = contact.messages || [];
          contact.messages.push({ sender, text });
        });
        return { output: `[OK] 已追加对话: [${sender.toUpperCase()}] "${text}"`, error: null };
      }

      case 'choice': {
        if (args.length < 4) throw new Error('用法: choice <chat_id> <contact_name> <text> <target_id> [--reply <reply>]');
        const chatId = args[0];
        const contactName = args[1];
        const text = args[2];
        const target = args[3];
        let reply = '';

        for (let i = 4; i < args.length; i++) {
          if (args[i] === '--reply' || args[i] === '-r') reply = args[++i] || '';
        }

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          node.contacts = node.contacts || [];
          let contact = node.contacts.find(c => c.name === contactName);
          if (!contact) throw new Error(`找不到联系人: '${contactName}'`);
          contact.choices = contact.choices || [];
          contact.choices.push({ text, target, reply });
        });
        return { output: `[OK] 已添加选项分支: "${text}" -> ${target}`, error: null };
      }

      case 'start': {
        if (!args.length) throw new Error('用法: start <id>');
        const id = args[0];
        updateState(draft => {
          const node = draft.nodes.find(n => n.id === id);
          if (!node) throw new Error(`找不到页面节点: '${id}'`);
          draft.startId = id;
          draft.nodes.forEach(n => { n.isStart = n.id === id; });
        });
        return { output: `[OK] 已将起始页面设定为: '${id}' (导出为 index.html)`, error: null };
      }

      case 'ls': {
        const isLong = args.includes('-l');
        const lines = [];
        lines.push(`总页面节点数: ${state.nodes.length} | 起始页: ${state.startId || '未设置'}`);
        lines.push('------------------------------------------------------------');
        if (isLong) {
          lines.push('TYPE       ID             NAME                 LINKS');
          lines.push('------------------------------------------------------------');
          state.nodes.forEach(n => {
            const outgoing = state.edges.filter(e => e.from === n.id).map(e => `${e.port || e.to} -> ${e.to}`).join(', ') || '(无)';
            const typeStr = n.type.padEnd(10, ' ');
            const idStr = n.id.padEnd(14, ' ');
            const nameStr = (n.name || n.id).slice(0, 18).padEnd(20, ' ');
            const startMark = n.id === state.startId ? '★ ' : '  ';
            lines.push(`${startMark}${typeStr} ${idStr} ${nameStr} ${outgoing}`);
          });
        } else {
          lines.push(state.nodes.map(n => (n.id === state.startId ? `*${n.id}` : n.id)).join('   '));
        }
        return { output: lines.join('\n'), error: null };
      }

      case 'cat':
      case 'stat': {
        if (!args.length) throw new Error('用法: cat <id>');
        const id = args[0];
        const node = state.nodes.find(n => n.id === id);
        if (!node) throw new Error(`找不到页面节点: '${id}'`);

        const outgoing = state.edges.filter(e => e.from === id);
        const incoming = state.edges.filter(e => e.to === id);

        const lines = [];
        lines.push(`节点 ID: ${node.id} ${node.id === state.startId ? '(★ 起始页)' : ''}`);
        lines.push(`页面名称: ${node.name}`);
        lines.push(`页面类型: ${node.type}`);
        lines.push(`模板风格: ${node.template || '(默认模板)'}`);
        lines.push(`坐标位置: (${node.x}, ${node.y})`);
        lines.push('字段详情:');
        for (const [k, v] of Object.entries(node.fields || {})) {
          lines.push(`  ${k}: ${String(v).slice(0, 80)}`);
        }
        if (node.type === 'Search' && node.rules?.length) {
          lines.push('搜索规则:');
          node.rules.forEach(r => lines.push(`  - "${r.keyword}" -> ${r.target}`));
        }
        if (node.type === 'Chat' && node.contacts?.length) {
          lines.push('联系人列表:');
          node.contacts.forEach(c => {
            lines.push(`  - ${c.avatar || '👤'} ${c.name} (${c.messages?.length || 0} 条消息, ${c.choices?.length || 0} 个选项)`);
          });
        }
        lines.push(`出度连线 (${outgoing.length}): ${outgoing.map(e => `${e.port || e.to} -> ${e.to}`).join(', ') || '无'}`);
        lines.push(`入度连线 (${incoming.length}): ${incoming.map(e => `${e.from} -> ${e.port || e.to}`).join(', ') || '无'}`);
        return { output: lines.join('\n'), error: null };
      }

      case 'mv':
      case 'rename': {
        if (args.length < 2) throw new Error('用法: mv <old_id> <new_id>');
        const oldId = args[0];
        const newId = args[1];

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === oldId);
          if (!node) throw new Error(`找不到页面节点: '${oldId}'`);
          if (draft.nodes.some(n => n.id === newId)) throw new Error(`目标 ID '${newId}' 已被占用`);

          node.id = newId;
          if (draft.startId === oldId) draft.startId = newId;
          draft.edges.forEach(e => {
            if (e.from === oldId) e.from = newId;
            if (e.to === oldId) e.to = newId;
          });
          draft.nodes.forEach(n => {
            (n.rules || []).forEach(r => { if (r.target === oldId) r.target = newId; });
            (n.contacts || []).forEach(c => {
              (c.choices || []).forEach(opt => { if (opt.target === oldId) opt.target = newId; });
            });
          });
        });
        return { output: `[OK] 已将节点 '${oldId}' 重命名为 '${newId}'`, error: null };
      }

      case 'dsh': {
        const sub = (args[0] || '').toLowerCase();
        if (!sub || sub === 'status') {
          const endpoint = getStoredDshEndpoint();
          return { output: `[DSH] 当前 DeepSeek Harness 本地端点: ${endpoint}\n使用 'dsh connect <url>' 修改端点，使用 'dsh sync' 导出当前蓝图为 Prompt 上下文。`, error: null };
        } else if (sub === 'connect') {
          if (!args[1]) throw new Error('用法: dsh connect <url> (例如: dsh connect http://127.0.0.1:3080)');
          const newUrl = args[1];
          setStoredDshEndpoint(newUrl);
          return { output: `[DSH] 已更新本地 DSH 端点为: ${newUrl}`, error: null };
        } else if (sub === 'sync' || sub === 'prompt') {
          const prompt = formatBlueprintForDsh(state, args.slice(1).join(' '));
          return { output: `[DSH] 已生成完整蓝图 Prompt 上下文 (${prompt.length} 字符)：\n\n${prompt.slice(0, 350)}...\n[提示：可在 DSH 工作台中一键复制全文]`, error: null };
        } else {
          throw new Error(`未知 dsh 子命令 '${sub}'。支持: dsh status, dsh connect <url>, dsh sync [需求]`);
        }
      }

      case 'clear':
        return { output: '__CLEAR__', error: null };

      default:
        throw new Error(`未知指令 '${cmd}'。输入 'help' 查看所有可用 Linux 命令。`);
    }
  } catch (err) {
    return { output: '', error: err.message };
  }
}

/**
 * Execute multiple commands sequentially (batch script)
 */
export function executeBatchCli(script, state, updateState) {
  const lines = script.split('\n');
  const results = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
    const res = executeCliCommand(trimmed, state, updateState);
    if (res.error) {
      results.push(`❌ [ERROR] ${trimmed} -> ${res.error}`);
    } else if (res.output && res.output !== '__CLEAR__') {
      results.push(res.output);
    }
  }
  return results.join('\n');
}

function parseCommandLine(text) {
  const tokens = [];
  let curr = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if ((char === '"' || char === "'") && (!inQuote || quoteChar === char)) {
      if (inQuote) {
        inQuote = false;
        quoteChar = '';
      } else {
        inQuote = true;
        quoteChar = char;
      }
    } else if (char === ' ' && !inQuote) {
      if (curr) {
        tokens.push(curr);
        curr = '';
      }
    } else {
      curr += char;
    }
  }
  if (curr) tokens.push(curr);
  return tokens;
}

function getHelpText(sub) {
  return `
======================================================================
  ARG Blueprint Linux 终端控制台 (CLI Manual)
======================================================================
可用指令列表：

  touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start]
      新建页面节点 (Type: Desktop, Chat, Search, Login, Files, Browse, Ending)
      例: touch desktop -t Desktop -n "🖥️ 电脑桌面" --start
      例: touch chat -t Chat -n "💬 微信聊天" --template "微信 UI 风格"

  rm <id> [-f]
      删除页面节点及与其关联的所有连线
      例: rm chat

  ln <from> <to> [-p <port>] [--icon <icon>] [--label <label>]
      建立页面间路由跳转连线与桌面图标/按键
      例: ln desktop chat -p "微信.exe" --icon "💬"
      例: ln desktop search -p "全网搜索.exe" --icon "🔍"

  unlink <from> <to> [port]
      断开两页面间的跳转路由
      例: unlink desktop chat

  set <id> <key>=<val> [key=val...]
      设置节点属性（如标题、密码、备忘录等）
      例: set login password="0717"
      例: set search notice="尝试输入线索关键词"

  rule <search_id> <keyword> <target_id>
      为搜索引擎节点配置关键词跳转规则
      例: rule search "0717" news_shizong

  rmrule <search_id> <keyword>
      删除搜索引擎的某个关键词规则
      例: rmrule search "0717"

  contact <chat_id> <name> [--avatar <icon>] [--bio <bio>]
      在聊天页添加联系人
      例: contact chat "林警官" --avatar "👮" --bio "刑侦支队"

  msg <chat_id> <contact_name> <npc|player> <text>
      向联系人添加 NPC 或玩家对话
      例: msg chat "林警官" npc "水青，案情有新突破"

  choice <chat_id> <contact_name> <text> <target_id> [--reply <reply>]
      向联系人添加玩家分支选项及跳转
      例: choice chat "林警官" "询问密码" login --reply "密码是1998"

  start <id>
      指定起始游戏页面（导出为 index.html）
      例: start desktop

  ls [-l]
      列出所有页面节点及连线概况

  cat <id> / stat <id>
      查看指定页面的完整属性、字段与连线详情

  mv <old_id> <new_id>
      重命名页面节点 ID

  clear
      清空终端屏幕

💡 提示：按 ⬆ / ⬇ 方向键可切换历史命令，支持多行批量脚本一键执行！
======================================================================
`;
}
