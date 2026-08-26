import assert from 'node:assert/strict';
import test from 'node:test';
import { executeCliCommand, executeBatchCli } from '../src/cli.js';

function createMockState() {
  return {
    title: 'CLI测试项目',
    startId: null,
    nodes: [],
    edges: []
  };
}

test('CLI touch 指令创建节点与设置起始页', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  const res1 = executeCliCommand('touch desktop -t Desktop -n "🖥️ 电脑桌面" --start', state, updateState);
  assert.equal(res1.error, null);
  assert.equal(state.nodes.length, 1);
  assert.equal(state.nodes[0].id, 'desktop');
  assert.equal(state.nodes[0].type, 'Desktop');
  assert.equal(state.startId, 'desktop');

  const res2 = executeCliCommand('touch chat -t Chat -n "💬 微信聊天" --template "微信 UI 风格"', state, updateState);
  assert.equal(res2.error, null);
  assert.equal(state.nodes.length, 2);
  assert.equal(state.nodes[1].template, '微信 UI 风格');
});

test('CLI ln 与 unlink 建立和断开连线', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch desktop -t Desktop -n "桌面"', state, updateState);
  executeCliCommand('touch chat -t Chat -n "聊天"', state, updateState);

  const resLn = executeCliCommand('ln desktop chat -p "微信.exe" --icon "💬"', state, updateState);
  assert.equal(resLn.error, null);
  assert.equal(state.edges.length, 1);
  assert.equal(state.edges[0].from, 'desktop');
  assert.equal(state.edges[0].to, 'chat');
  assert.equal(state.edges[0].port, '微信.exe');
  assert.equal(state.edges[0].icon, '💬');

  const resUnlink = executeCliCommand('unlink desktop chat', state, updateState);
  assert.equal(resUnlink.error, null);
  assert.equal(state.edges.length, 0);
});

test('CLI set 属性配置与 rule 关键词规则', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch login -t Login', state, updateState);
  executeCliCommand('set login password="0717" systemName="机密终端"', state, updateState);
  assert.equal(state.nodes[0].fields.password, '0717');
  assert.equal(state.nodes[0].fields.systemName, '机密终端');

  executeCliCommand('touch search -t Search', state, updateState);
  executeCliCommand('rule search "0717" login', state, updateState);
  assert.equal(state.nodes[1].rules.length, 1);
  assert.equal(state.nodes[1].rules[0].keyword, '0717');
  assert.equal(state.nodes[1].rules[0].target, 'login');
});

test('CLI contact, msg, choice 聊天对话配置', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch chat -t Chat', state, updateState);
  executeCliCommand('touch ending -t Ending', state, updateState);
  executeCliCommand('contact chat "林警官" --avatar "👮" --bio "刑侦支队"', state, updateState);
  executeCliCommand('msg chat "林警官" npc "案情有重大突破"', state, updateState);
  executeCliCommand('choice chat "林警官" "前往调查" ending --reply "收到"', state, updateState);

  const chatNode = state.nodes.find(n => n.id === 'chat');
  const contact = chatNode.contacts.find(c => c.name === '林警官');
  assert.ok(contact);
  assert.equal(contact.avatar, '👮');
  assert.equal(contact.messages[0].text, '案情有重大突破');
  assert.equal(contact.choices[0].target, 'ending');
});

test('CLI rm 删除节点与 mv 重命名', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch page1', state, updateState);
  executeCliCommand('touch page2', state, updateState);
  executeCliCommand('ln page1 page2 -p "Next"', state, updateState);

  executeCliCommand('mv page1 intro', state, updateState);
  assert.equal(state.nodes[0].id, 'intro');
  assert.equal(state.edges[0].from, 'intro');

  executeCliCommand('rm intro', state, updateState);
  assert.equal(state.nodes.length, 1);
  assert.equal(state.edges.length, 0);
});

test('CLI batch script 批量脚本一键执行', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  const script = `
    touch desktop -t Desktop -n "🖥️ 电脑桌面" --start
    touch chat -t Chat -n "💬 微信聊天"
    touch search -t Search -n "🔍 搜索引擎"
    touch login -t Login -n "🔐 密码终端"
    touch doc -t Browse -n "📑 案情日记"
    touch ending -t Ending -n "🎬 真相大白"

    ln desktop chat -p "微信.exe" --icon "💬"
    ln desktop search -p "搜索.exe" --icon "🔍"
    ln desktop login -p "机密文件夹" --icon "🔐"

    set login password="0717"
    rule search "0717" doc
    ln login doc
    ln doc ending -p "结案汇报"
  `;

  executeBatchCli(script, state, updateState);
  assert.equal(state.nodes.length, 6);
  assert.equal(state.edges.length, 5);
  assert.equal(state.startId, 'desktop');
  assert.equal(state.nodes.find(n => n.id === 'login').fields.password, '0717');
});

test('CLI choice --requires 前置门槛与自动建线', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch chat -t Chat', state, updateState);
  executeCliCommand('touch ending -t Ending', state, updateState);
  executeCliCommand('choice chat "林警官" "出示病历" ending --reply "这是关键证据！" --requires doc_hospital', state, updateState);

  const chatNode = state.nodes.find(n => n.id === 'chat');
  const contact = chatNode.contacts.find(c => c.name === '林警官');
  assert.equal(contact.choices[0].requires, 'doc_hospital');
  assert.equal(contact.choices[0].target, 'ending');

  // Verify auto edge creation
  const edge = state.edges.find(e => e.from === 'chat' && e.to === 'ending');
  assert.ok(edge);
  assert.equal(edge.port, '出示病历');
});

test('CLI rmcontact, rmchoice, rmmsg 颗粒度删除', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch chat -t Chat', state, updateState);
  executeCliCommand('contact chat "林警官"', state, updateState);
  executeCliCommand('contact chat "嫌疑人"', state, updateState);
  executeCliCommand('msg chat "林警官" npc "这是第一句"', state, updateState);
  executeCliCommand('msg chat "林警官" npc "这是第二句"', state, updateState);
  executeCliCommand('choice chat "林警官" "选项A" ending', state, updateState);

  executeCliCommand('rmmsg chat "林警官" "第一句"', state, updateState);
  const contact = state.nodes[0].contacts.find(c => c.name === '林警官');
  assert.equal(contact.messages.length, 1);
  assert.equal(contact.messages[0].text, '这是第二句');

  executeCliCommand('rmchoice chat "林警官" "选项A"', state, updateState);
  assert.equal(contact.choices.length, 0);

  executeCliCommand('rmcontact chat "嫌疑人"', state, updateState);
  assert.equal(state.nodes[0].contacts.length, 1);
});

test('CLI set 深度嵌套路径赋值', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch chat -t Chat', state, updateState);
  executeCliCommand('choice chat "林警官" "旧选项" ending', state, updateState);
  executeCliCommand('set chat contacts.0.choices.0.requires="vault_key" contacts.0.avatar="🕵️"', state, updateState);

  const contact = state.nodes[0].contacts[0];
  assert.equal(contact.choices[0].requires, 'vault_key');
  assert.equal(contact.avatar, '🕵️');
});

test('CLI validate, search, simulate, export, import 诊断与数据通道', () => {
  const state = createMockState();
  const updateState = fn => fn(state);

  executeCliCommand('touch search -t Search --start', state, updateState);
  executeCliCommand('touch secret -t Browse -n "绝密档案"', state, updateState);
  executeCliCommand('rule search "0717" secret', state, updateState);

  // Test search simulation
  const searchRes = executeCliCommand('search 0717', state, updateState);
  assert.match(searchRes.output, /跳转至: secret/);

  // Test graph walk simulation
  const simRes = executeCliCommand('simulate', state, updateState);
  assert.match(simRes.output, /已探索可达节点: 2/);

  // Test validate
  const valRes = executeCliCommand('validate', state, updateState);
  assert.match(valRes.output, /ARG 故事网健康度自检报告/);

  // Test export & import
  const expRes = executeCliCommand('export', state, updateState);
  assert.ok(expRes.output.includes('"startId": "search"'));

  const emptyState = createMockState();
  executeCliCommand(`import ${expRes.output}`, emptyState, fn => fn(emptyState));
  assert.equal(emptyState.nodes.length, 2);
  assert.equal(emptyState.startId, 'search');
});
