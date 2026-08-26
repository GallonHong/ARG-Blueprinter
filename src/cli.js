import { defaultContacts } from './route-config.js';
import { formatBlueprintForDsh, getStoredDshEndpoint, setStoredDshEndpoint } from './dsh-bridge.js';
import { TYPE_THEME_PRESETS } from './theme-presets.js';
import { validateStoryGraph } from './validator.js';

/**
 * Linux CLI Command Engine for ARG Blueprint
 * Supported commands:
 *  - touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start] [-x <n>] [-y <n>]
 *  - cp / clone <src_id> <new_id> [-n <name>]
 *  - rm <id> [-f]
 *  - ln <from> <to> [-p <port>] [--icon <icon>] [--label <label>] [--desc <desc>]
 *  - unlink / rmlink <from> <to> [port]
 *  - set <id> <key_or_path>=<val> [key=val...]
 *  - preset <id> <preset_id_or_name>
 *  - rule <search_id> <keyword> <target_id>
 *  - rmrule <search_id> <keyword>
 *  - contact <chat_id> <name> [--avatar <av>] [--bio <bio>]
 *  - rmcontact <chat_id> <name>
 *  - msg <chat_id> <contact_name> <npc|player> <text>
 *  - rmmsg <chat_id> <contact_name> <index_or_keyword>
 *  - choice <chat_id> <contact_name> <text> [target_id] [--reply <reply>] [--requires <req_id>] [--nolink]
 *  - rmchoice <chat_id> <contact_name> <text_or_index>
 *  - start <id>
 *  - ls [-l]
 *  - cat / stat <id>
 *  - mv / rename <old_id> <new_id>
 *  - goto / focus <id>
 *  - layout / autolayout
 *  - validate / check
 *  - search <keyword>
 *  - simulate / walk
 *  - note <id> <text>
 *  - tag <id> <tag1,tag2...>
 *  - export
 *  - import <json_str>
 *  - dsh <status|connect|sync>
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
        if (!args.length) throw new Error('用法: touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start] [-x <n>] [-y <n>]');
        const id = args[0];
        let type = 'Browse';
        let name = id;
        let template = '';
        let isStart = false;
        let posX = null;
        let posY = null;

        for (let i = 1; i < args.length; i++) {
          if (args[i] === '-t' || args[i] === '--type') type = args[++i] || 'Browse';
          else if (args[i] === '-n' || args[i] === '--name') name = args[++i] || id;
          else if (args[i] === '--template' || args[i] === '-tpl') template = args[++i] || '';
          else if (args[i] === '--start' || args[i] === '-s') isStart = true;
          else if (args[i] === '-x' || args[i] === '--x') posX = parseInt(args[++i], 10);
          else if (args[i] === '-y' || args[i] === '--y') posY = parseInt(args[++i], 10);
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
            contacts: matchedType === 'Chat' ? [] : undefined,
            x: posX !== null && !isNaN(posX) ? posX : (80 + col * 260),
            y: posY !== null && !isNaN(posY) ? posY : (80 + row * 200),
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

      case 'cp':
      case 'clone':
      case 'copy': {
        if (args.length < 2) throw new Error('用法: cp <src_id> <new_id> [-n <新名称>]');
        const srcId = args[0];
        const newId = args[1];
        let newName = '';
        for (let i = 2; i < args.length; i++) {
          if (args[i] === '-n' || args[i] === '--name') newName = args[++i] || '';
        }
        updateState(draft => {
          const srcNode = draft.nodes.find(n => n.id === srcId);
          if (!srcNode) throw new Error(`找不到源页面节点: '${srcId}'`);
          if (draft.nodes.some(n => n.id === newId)) throw new Error(`目标节点 ID '${newId}' 已存在`);
          const clonedNode = JSON.parse(JSON.stringify(srcNode));
          clonedNode.id = newId;
          clonedNode.name = newName || `${srcNode.name} (副本)`;
          clonedNode.isStart = false;
          clonedNode.x = (srcNode.x || 80) + 40;
          clonedNode.y = (srcNode.y || 80) + 40;
          draft.nodes.push(clonedNode);
        });
        return { output: `[OK] 已成功克隆页面节点 '${srcId}' -> '${newId}'`, error: null };
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

      case 'preset': {
        if (args.length < 2) throw new Error('用法: preset <node_id> <preset_id_或_名称>');
        const nodeId = args[0];
        const presetQuery = args.slice(1).join(' ').toLowerCase();
        let appliedName = '';
        updateState(draft => {
          const node = draft.nodes.find(n => n.id === nodeId);
          if (!node) throw new Error(`找不到页面节点: '${nodeId}'`);
          const list = TYPE_THEME_PRESETS[node.type] || [];
          const found = list.find(p => p.id.toLowerCase() === presetQuery || p.name.toLowerCase().includes(presetQuery));
          if (!found) throw new Error(`页面类型 '${node.type}' 下未找到匹配的主题预设: '${presetQuery}'`);
          node.template = found.template;
          node.fields = { ...(node.fields || {}), ...(found.fields || {}) };
          appliedName = found.name;
        });
        return { output: `[OK] 已将主题预设【${appliedName}】应用至节点 '${nodeId}'`, error: null };
      }

      case 'ln':
      case 'link': {
        if (args.length < 2) throw new Error('用法: ln <from_id> <to_id> [-p <port/按键名>] [--icon <icon>] [--label <label>]');
        const from = args[0];
        const to = args[1];
        let port = '';
        let icon = '';
        let label = '';
        let desc = '';

        for (let i = 2; i < args.length; i++) {
          if (args[i] === '-p' || args[i] === '--port') port = args[++i] || '';
          else if (args[i] === '--icon' || args[i] === '-i') icon = args[++i] || '';
          else if (args[i] === '--label' || args[i] === '-l') label = args[++i] || '';
          else if (args[i] === '--desc' || args[i] === '-d') desc = args[++i] || '';
        }

        updateState(draft => {
          const fromNode = draft.nodes.find(n => n.id === from);
          const toNode = draft.nodes.find(n => n.id === to);
          if (!fromNode) throw new Error(`源页面节点 '${from}' 不存在`);
          if (!toNode) throw new Error(`目标页面节点 '${to}' 不存在`);

          const existing = draft.edges.find(e => e.from === from && e.to === to && (port ? e.port === port : true));
          if (existing) {
            if (port) existing.port = port;
            if (icon) existing.icon = icon;
            if (label) existing.label = label;
            if (desc) existing.desc = desc;
          } else {
            draft.edges.push({
              from,
              to,
              port: port || toNode.name || to,
              icon: icon || (fromNode.type === 'Desktop' ? '📁' : ''),
              label: label || port || toNode.name || to,
              desc: desc || ''
            });
          }
        });
        return { output: `[OK] 已建立连线: ${from} -> ${to} ${port ? `[出口: "${port}"]` : ''}`, error: null };
      }

      case 'unlink':
      case 'rmlink': {
        if (args.length < 2) throw new Error('用法: unlink <from_id> <to_id> [port]');
        const from = args[0];
        const to = args[1];
        const port = args[2] || '';

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
        if (args.length < 2) throw new Error('用法: set <id> <key_or_path>=<val> [key=val...]');
        const id = args[0];
        const pairs = args.slice(1);

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === id);
          if (!node) throw new Error(`找不到页面节点: '${id}'`);

          pairs.forEach(pair => {
            const eqIdx = pair.indexOf('=');
            if (eqIdx === -1) return;
            const key = pair.slice(0, eqIdx);
            const rawVal = pair.slice(eqIdx + 1);
            const val = rawVal.replace(/^["']|["']$/g, '');

            if (key.includes('.')) {
              setDeepValue(node, key, val);
            } else if (key === 'name') {
              node.name = val;
            } else if (key === 'template') {
              node.template = val;
            } else if (key === 'type') {
              node.type = val;
            } else if (key === 'note') {
              node.note = val;
            } else {
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
              choices: [],
              dialogue: []
            };
            node.contacts.push(contact);
          } else {
            contact.avatar = avatar;
            contact.bio = bio;
          }
        });
        return { output: `[OK] 聊天节点 '${chatId}' 已添加联系人: ${avatar} ${name}`, error: null };
      }

      case 'rmcontact': {
        if (args.length < 2) throw new Error('用法: rmcontact <chat_id> <contact_name>');
        const chatId = args[0];
        const contactName = args[1];

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          const before = (node.contacts || []).length;
          node.contacts = (node.contacts || []).filter(c => c.name !== contactName);
          if (node.contacts.length === before) throw new Error(`未找到联系人: '${contactName}'`);
        });
        return { output: `[OK] 已从聊天节点 '${chatId}' 删除联系人「${contactName}」`, error: null };
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
              choices: [],
              dialogue: []
            };
            node.contacts.push(contact);
          }
          contact.messages = contact.messages || [];
          contact.messages.push({ sender, text });
          contact.dialogue = contact.dialogue || [];
          contact.dialogue.push({
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sender,
            text
          });
        });
        return { output: `[OK] 已追加对话: [${sender.toUpperCase()}] "${text}"`, error: null };
      }

      case 'rmmsg': {
        if (args.length < 3) throw new Error('用法: rmmsg <chat_id> <contact_name> <消息序号或匹配文案>');
        const chatId = args[0];
        const contactName = args[1];
        const query = args.slice(2).join(' ');

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          const contact = (node.contacts || []).find(c => c.name === contactName);
          if (!contact) throw new Error(`未找到联系人: '${contactName}'`);

          if (/^\d+$/.test(query)) {
            const idx = parseInt(query, 10);
            if (contact.messages && contact.messages[idx]) contact.messages.splice(idx, 1);
            if (contact.dialogue && contact.dialogue[idx]) contact.dialogue.splice(idx, 1);
          } else {
            contact.messages = (contact.messages || []).filter(m => !m.text.includes(query));
            contact.dialogue = (contact.dialogue || []).filter(d => d.sender !== 'npc' || !d.text.includes(query));
          }
        });
        return { output: `[OK] 已删除联系人「${contactName}」的消息: "${query}"`, error: null };
      }

      case 'choice': {
        if (args.length < 3) throw new Error('用法: choice <chat_id> <contact_name> <text> [target_id] [--reply <reply>] [--requires <req_id>] [--nolink]');
        const chatId = args[0];
        const contactName = args[1];
        const text = args[2];
        let target = args[3] && !args[3].startsWith('-') ? args[3] : '';
        let reply = '';
        let requires = '';
        let noLink = false;

        const startIdx = target ? 4 : 3;
        for (let i = startIdx; i < args.length; i++) {
          if (args[i] === '--reply' || args[i] === '-r') reply = args[++i] || '';
          else if (args[i] === '--requires' || args[i] === '-req') requires = args[++i] || '';
          else if (args[i] === '--nolink') noLink = true;
        }

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
              choices: [],
              dialogue: []
            };
            node.contacts.push(contact);
          }

          contact.choices = contact.choices || [];
          contact.choices.push({ text, target, reply, requires });

          contact.dialogue = contact.dialogue || [];
          let lastStep = contact.dialogue[contact.dialogue.length - 1];
          if (lastStep && lastStep.sender === 'choice') {
            lastStep.options = lastStep.options || [];
            lastStep.options.push({ text, reply, target, requires });
          } else {
            contact.dialogue.push({
              id: `m_${Date.now()}_choice`,
              sender: 'choice',
              options: [{ text, reply, target, requires }]
            });
          }

          // Auto create visual routing edge if target exists and --nolink is not set
          if (target && !noLink) {
            if (!draft.edges.some(e => e.from === chatId && e.to === target && e.port === text)) {
              draft.edges.push({
                from: chatId,
                to: target,
                port: text,
                label: text,
                desc: `聊天对话「${contactName}」触发`
              });
            }
          }
        });
        return { output: `[OK] 已添加选项分支: "${text}" -> ${target || '(不跳转)'}${requires ? ` (需先解锁: ${requires})` : ''}`, error: null };
      }

      case 'rmchoice': {
        if (args.length < 3) throw new Error('用法: rmchoice <chat_id> <contact_name> <选项文案或索引>');
        const chatId = args[0];
        const contactName = args[1];
        const query = args.slice(2).join(' ');

        updateState(draft => {
          const node = draft.nodes.find(n => n.id === chatId);
          if (!node) throw new Error(`找不到聊天节点: '${chatId}'`);
          const contact = (node.contacts || []).find(c => c.name === contactName);
          if (!contact) throw new Error(`未找到联系人: '${contactName}'`);

          if (/^\d+$/.test(query)) {
            const idx = parseInt(query, 10);
            if (contact.choices && contact.choices[idx]) contact.choices.splice(idx, 1);
          } else {
            contact.choices = (contact.choices || []).filter(c => c.text !== query);
            (contact.dialogue || []).forEach(d => {
              if (d.sender === 'choice' && d.options) {
                d.options = d.options.filter(o => o.text !== query);
              }
            });
          }
        });
        return { output: `[OK] 已删除联系人「${contactName}」的选项: "${query}"`, error: null };
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

      case 'goto':
      case 'focus':
      case 'select': {
        if (!args.length) throw new Error('用法: goto <id>');
        const id = args[0];
        const node = state.nodes.find(n => n.id === id);
        if (!node) throw new Error(`找不到页面节点: '${id}'`);
        updateState(draft => {
          draft.selected = id;
        });
        return { output: `[OK] 已聚焦并选中页面节点: '${id}'「${node.name}」`, error: null };
      }

      case 'layout':
      case 'autolayout': {
        updateState(draft => {
          computeAutoLayout(draft.nodes, draft.edges, draft.startId);
        });
        return { output: `[OK] 已根据有向拓扑深度完成全图自动排版 (${state.nodes.length} 个节点)`, error: null };
      }

      case 'validate':
      case 'check': {
        const report = validateStoryGraph(state);
        const lines = [];
        lines.push('============================================================');
        lines.push(`  ARG 故事网健康度自检报告 (${report.totalCount} 个节点, ${(state.edges || []).length} 条连线)`);
        lines.push('============================================================');
        lines.push(`• 探索连通度: ${report.reachableCount} / ${report.totalCount} 节点可达 (起始页: ${state.startId || '未设置'})`);
        lines.push(`• 终局页面 (Ending): ${report.endingCount} 个`);
        if (report.issues.length === 0) {
          lines.push('✔ 全量自检 100% 通过：无孤岛、无死胡同、所有线索闭环！');
        } else {
          lines.push(`• 发现问题: 错误 ${report.errorCount} 个, 警告 ${report.warningCount} 个:`);
          report.issues.forEach((iss, i) => {
            const icon = iss.type === 'error' ? '❌' : '⚠️';
            lines.push(`  ${i + 1}. ${icon} [${iss.code}] ${iss.message}${iss.nodeId ? ` (节点: ${iss.nodeId})` : ''}`);
          });
        }
        return { output: lines.join('\n'), error: null };
      }

      case 'search': {
        if (!args.length) throw new Error('用法: search <关键词>');
        const kw = args.join(' ');
        return simulateSearch(state, kw);
      }

      case 'simulate':
      case 'walk': {
        return simulateGraphWalk(state);
      }

      case 'note': {
        if (args.length < 2) throw new Error('用法: note <id> <策划备注>');
        const id = args[0];
        const text = args.slice(1).join(' ');
        updateState(draft => {
          const node = draft.nodes.find(n => n.id === id);
          if (!node) throw new Error(`找不到页面节点: '${id}'`);
          node.note = text;
        });
        return { output: `[OK] 已为节点 '${id}' 添加策划备注: "${text}"`, error: null };
      }

      case 'tag': {
        if (args.length < 2) throw new Error('用法: tag <id> <标签1,标签2...>');
        const id = args[0];
        const tags = args.slice(1).join(' ').split(/[,，\s]+/).filter(Boolean);
        updateState(draft => {
          const node = draft.nodes.find(n => n.id === id);
          if (!node) throw new Error(`找不到页面节点: '${id}'`);
          node.tags = tags;
        });
        return { output: `[OK] 已更新节点 '${id}' 标签: [${tags.join(', ')}]`, error: null };
      }

      case 'export': {
        const jsonStr = JSON.stringify({
          title: state.title || '未命名 ARG',
          startId: state.startId,
          nodes: state.nodes || [],
          edges: state.edges || []
        }, null, 2);
        return { output: jsonStr, error: null };
      }

      case 'import': {
        const payload = line.trim().slice(cmd.length).trim();
        if (!payload) throw new Error('用法: import <json_字符串>');
        let parsed;
        try {
          parsed = JSON.parse(payload);
        } catch (e) {
          throw new Error(`JSON 解析失败: ${e.message}`);
        }
        if (!parsed || !Array.isArray(parsed.nodes)) throw new Error('无效的蓝图 JSON 数据（需包含 nodes 数组）');

        updateState(draft => {
          draft.title = parsed.title || draft.title;
          draft.startId = parsed.startId || (parsed.nodes[0]?.id || null);
          draft.nodes = parsed.nodes;
          draft.edges = parsed.edges || [];
          draft.selected = parsed.startId || (parsed.nodes[0]?.id || null);
        });
        return { output: `[OK] 已成功导入蓝图 (${parsed.nodes.length} 个页面节点, ${(parsed.edges || []).length} 条连线)`, error: null };
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
        if (node.note) lines.push(`策划备注: ${node.note}`);
        if (node.tags?.length) lines.push(`标签: [${node.tags.join(', ')}]`);
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
 * Nested path parser and setter for objects & arrays
 */
function setDeepValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextArray = /^\d+$/.test(nextPart);
    if (current[part] === undefined || current[part] === null) {
      current[part] = isNextArray ? [] : {};
    }
    current = current[part];
  }
  const lastPart = parts[parts.length - 1];
  let parsedVal = value;
  if (value === 'true') parsedVal = true;
  else if (value === 'false') parsedVal = false;
  else if (/^\d+$/.test(value) && !isNaN(Number(value)) && lastPart !== 'password') parsedVal = Number(value);
  current[lastPart] = parsedVal;
}

/**
 * Topological layout for arranging nodes automatically
 */
function computeAutoLayout(nodes, edges, startId) {
  if (!nodes || !nodes.length) return;
  const start = startId || nodes[0]?.id;
  const levels = new Map();
  nodes.forEach(n => levels.set(n.id, -1));

  if (start && levels.has(start)) {
    levels.set(start, 0);
    const queue = [start];
    while (queue.length > 0) {
      const curr = queue.shift();
      const currLevel = levels.get(curr);
      const outEdges = (edges || []).filter(e => e.from === curr);
      outEdges.forEach(e => {
        if (levels.get(e.to) === -1) {
          levels.set(e.to, currLevel + 1);
          queue.push(e.to);
        }
      });
    }
  }

  const maxReachedLevel = Math.max(...Array.from(levels.values()), 0);
  let unreachedCount = 0;
  nodes.forEach(n => {
    if (levels.get(n.id) === -1) {
      levels.set(n.id, maxReachedLevel + 1 + Math.floor(unreachedCount / 3));
      unreachedCount++;
    }
  });

  const levelGroups = new Map();
  nodes.forEach(n => {
    const lvl = levels.get(n.id);
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl).push(n);
  });

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  sortedLevels.forEach((lvl, colIdx) => {
    const group = levelGroups.get(lvl);
    group.forEach((node, rowIdx) => {
      node.x = 60 + colIdx * 280;
      node.y = 80 + rowIdx * 180;
    });
  });
}

/**
 * Simulate search keywords
 */
function simulateSearch(state, keyword) {
  const searchNodes = (state.nodes || []).filter(n => n.type === 'Search');
  if (!searchNodes.length) return { output: '[WARN] 当前蓝图中未包含 Search 类型的搜索页节点', error: null };

  const cleanKw = String(keyword || '').trim().toLowerCase();
  const results = [];

  searchNodes.forEach(sn => {
    const match = (sn.rules || []).find(r => String(r.keyword || '').trim().toLowerCase() === cleanKw);
    if (match) {
      const targetNode = (state.nodes || []).find(n => n.id === match.target);
      results.push(`[${sn.name || sn.id}] 匹配关键词「${match.keyword}」-> 跳转至: ${match.target} (${targetNode?.name || '未知'})`);
    } else {
      results.push(`[${sn.name || sn.id}] 未匹配到「${cleanKw}」 (将显示: "${sn.fields?.notFoundText || '没有找到相关结果'}")`);
    }
  });

  return { output: results.join('\n'), error: null };
}

/**
 * Simulate playthrough walk
 */
function simulateGraphWalk(state) {
  const start = state.startId || state.nodes[0]?.id;
  if (!start) return { output: '[WARN] 蓝图为空，无可遍历节点', error: null };

  const visited = new Set();
  const queue = [start];
  visited.add(start);
  const endingsReached = [];
  const deadEnds = [];
  const logLines = [];

  logLines.push(`[SIMULATION] 开始全图路径探索走查 (起始节点: ${start})`);

  while (queue.length > 0) {
    const currId = queue.shift();
    const currNode = (state.nodes || []).find(n => n.id === currId);
    if (!currNode) continue;

    if (currNode.type === 'Ending') {
      endingsReached.push(currNode);
      continue;
    }

    const outEdges = (state.edges || []).filter(e => e.from === currId);
    const searchTargets = (currNode.rules || []).map(r => r.target).filter(Boolean);
    const chatTargets = [];
    (currNode.contacts || []).forEach(c => {
      (c.choices || []).forEach(ch => { if (ch.target) chatTargets.push(ch.target); });
      (c.dialogue || []).forEach(d => {
        (d.options || []).forEach(o => { if (o.target) chatTargets.push(o.target); });
      });
    });

    const allNextTargets = Array.from(new Set([...outEdges.map(e => e.to), ...searchTargets, ...chatTargets]));

    if (allNextTargets.length === 0) {
      deadEnds.push(currNode);
    }

    allNextTargets.forEach(targetId => {
      if (!visited.has(targetId)) {
        visited.add(targetId);
        queue.push(targetId);
      }
    });
  }

  const unreachedNodes = (state.nodes || []).filter(n => !visited.has(n.id));

  logLines.push(`• 已探索可达节点: ${visited.size} / ${state.nodes.length}`);
  logLines.push(`• 到达终局 (Ending): ${endingsReached.length} 个 (${endingsReached.map(e => e.name || e.id).join(', ') || '无'})`);
  if (deadEnds.length > 0) {
    logLines.push(`• 发现死胡同页面: ${deadEnds.length} 个 (${deadEnds.map(d => `${d.id}「${d.name}」`).join(', ')})`);
  }
  if (unreachedNodes.length > 0) {
    logLines.push(`• 发现孤岛未达节点: ${unreachedNodes.length} 个 (${unreachedNodes.map(u => `${u.id}「${u.name}」`).join(', ')})`);
  }
  if (deadEnds.length === 0 && unreachedNodes.length === 0 && endingsReached.length > 0) {
    logLines.push('✔ 模拟走查全绿：全图路径连通，所有分支均有始有终！');
  }

  return { output: logLines.join('\n'), error: null };
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
    } else if (/\s/.test(char) && !inQuote) {
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

  touch <id> [-t <type>] [-n <name>] [--template <tpl>] [--start] [-x <n>] [-y <n>]
      新建页面节点 (Type: Desktop, Chat, Search, Login, Files, Browse, Ending)
      例: touch desktop -t Desktop -n "🖥️ 电脑桌面" --start -x 100 -y 100
      例: touch chat -t Chat -n "💬 微信聊天" --template "微信 UI 风格"

  cp / clone <src_id> <new_id> [-n <新名称>]
      克隆已有页面（继承所有属性、模板与定制样式）
      例: cp rules_v4 rules_v5 -n "守则·第5版"

  rm <id> [-f]
      删除页面节点及与其关联的所有连线
      例: rm chat

  ln <from> <to> [-p <port>] [--icon <icon>] [--label <label>]
      建立页面间路由跳转连线与桌面图标/按键
      例: ln desktop chat -p "微信.exe" --icon "💬"

  unlink <from> <to> [port]
      断开两页面间的跳转路由

  set <id> <key_or_path>=<val> [key=val...]
      设置节点属性或深层嵌套路径
      例: set login password="0717"
      例: set chat contacts.0.choices.0.requires="doc_a"

  preset <id> <preset_id_或_名称>
      为指定节点应用 UI 主题预设
      例: preset news "SCP 绝密卷宗"

  rule <search_id> <keyword> <target_id> / rmrule <search_id> <keyword>
      配置或删除搜索引擎关键词跳转规则

  contact <chat_id> <name> [--avatar <icon>] [--bio <bio>] / rmcontact <chat_id> <name>
      在聊天页添加或删除联系人

  msg <chat_id> <contact_name> <npc|player> <text> / rmmsg <chat_id> <contact_name> <kw>
      向联系人追加或删除对话内容

  choice <chat_id> <contact_name> <text> [target_id] [--reply <reply>] [--requires <req_id>] [--nolink]
      向联系人添加选项分支（默认自动在画布生成连线）
      例: choice chat "林警官" "出示病历" ending --reply "这是关键证据！" --requires doc_a

  rmchoice <chat_id> <contact_name> <text_or_idx>
      删除联系人的指定选项分支

  start <id>
      指定起始游戏页面（导出为 index.html）

  goto <id> / focus <id>
      在画布上定位并选中指定节点

  layout / autolayout
      根据有向图拓扑深度对全图节点进行自动排版

  validate / check
      调用图论自检器，检测全图死胡同、孤岛与断路

  search <关键词>
      模拟搜索关键词，测试搜索引擎路由

  simulate / walk
      从起始页模拟走查全图路径，报告可达终局与卡死点

  note <id> <text> / tag <id> <tags>
      为节点添加策划备注便签与分类标签

  export / import <json_str>
      导出或导入全局剧情蓝图 JSON 数据

  ls [-l] / cat <id> / stat <id> / mv <old> <new> / clear
      查看列表、节点详情、重命名与清屏

💡 提示：按 ⬆ / ⬇ 方向键可切换历史命令，支持多行批量脚本一键粘贴执行！
======================================================================
`;
}
