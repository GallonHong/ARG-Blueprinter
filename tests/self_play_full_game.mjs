import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { getQiyuebanDemoProject } from '../src/demo-project.js';
import { buildRouteConfig, pageFileName, generateLinksHtml, generateDesktopIconsHtml } from '../src/route-config.js';

const root = fileURLToPath(new URL('..', import.meta.url));

test('全游戏20个页面渲染、CSS挂载与路由链条无死角自检 (Self-Play Full Game Test)', () => {
  const state = getQiyuebanDemoProject();
  assert.equal(state.nodes.length, 20);
  assert.ok(state.edges.length >= 20);

  // 1. 验证所有20个节点对应的模板与样式均真实存在
  state.nodes.forEach(node => {
    const config = buildRouteConfig(node, state, { preview: true });
    assert.ok(config, `节点 ${node.id} config 生成失败`);
    assert.ok(config.files, `节点 ${node.id} 缺少 files 映射`);
  });

  // 2. 模拟从【🖥️ 温水青的电脑桌面】开始游玩
  const desktopNode = state.nodes.find(n => n.id === 'node_desktop');
  const desktopIcons = generateDesktopIconsHtml(desktopNode, state);
  assert.ok(desktopIcons.includes('聊天通讯.exe'));
  assert.ok(desktopIcons.includes('七月半论坛.exe'));
  assert.ok(desktopIcons.includes('全盘搜索.exe'));
  assert.ok(desktopIcons.includes('机密文件夹'));

  // 3. 模拟进入【🌐 七月半灵异论坛】
  const forumNode = state.nodes.find(n => n.id === 'node_forum');
  const forumLinks = generateLinksHtml(forumNode, state);
  assert.ok(forumLinks.includes('AI恐怖谷讨论'));
  assert.ok(forumLinks.includes('公寓遇鬼'));
  assert.ok(forumLinks.includes('全网搜索引擎'));
  assert.ok(forumLinks.includes('返回电脑桌面'));

  // 4. 模拟在论坛点击进入帖子的路由映射
  const forumCfg = buildRouteConfig(forumNode, state, { preview: true });
  assert.equal(forumCfg.links['AI恐怖谷讨论'], 'node_post_ai');
  assert.equal(forumCfg.links['公寓遇鬼'], 'node_post_gyg');
  assert.equal(forumCfg.links['全网搜索引擎'], 'node_search');
  assert.equal(forumCfg.links['返回电脑桌面'], 'node_desktop');

  // 5. 模拟【🔍 全网线索搜索引擎】关键词路由
  const searchNode = state.nodes.find(n => n.id === 'node_search');
  const searchCfg = buildRouteConfig(searchNode, state, { preview: true });
  const rules = searchCfg.rules.search;
  assert.equal(rules['失踪'], 'node_news_shizong');
  assert.equal(rules['南鄣'], 'node_news_nanzhang');
  assert.equal(rules['泰永集团'], 'node_news_taiyong');
  assert.equal(rules['运契'], 'node_news_yunqi');
  assert.equal(rules['渡生大醮'], 'node_doc_dusheng');
  assert.equal(rules['ai'], 'node_post_ai');
  assert.equal(rules['公寓'], 'node_post_gyg');

  // 6. 模拟【🔐 机密文件夹】密码核验
  const loginNode = state.nodes.find(n => n.id === 'node_login');
  const loginCfg = buildRouteConfig(loginNode, state, { preview: true });
  assert.equal(loginCfg.password, 'yxzyddx');
  assert.equal(loginCfg.loginTarget, 'node_files');

  // 7. 模拟【📁 机密档案库文件夹】3篇绝密文档跳转
  const filesNode = state.nodes.find(n => n.id === 'node_files');
  const filesCfg = buildRouteConfig(filesNode, state, { preview: true });
  assert.equal(filesCfg.links['温岩考察日记.doc'], 'node_doc_wenyan');
  assert.equal(filesCfg.links['渡生大醮仪.pdf'], 'node_doc_dusheng');
  assert.equal(filesCfg.links['杨威口供记录.txt'], 'node_doc_yangwei');
  assert.equal(filesCfg.links['返回桌面'], 'node_desktop');

  // 8. 模拟【💬 加密聊天软件】5个分支通向五大结局
  const chatNode = state.nodes.find(n => n.id === 'node_chat');
  const chatCfg = buildRouteConfig(chatNode, state, { preview: true });
  const mingyueye = chatCfg.contacts.find(c => c.id === 'mingyueye');
  assert.ok(mingyueye);
  assert.equal(mingyueye.choices.length, 5);
  assert.equal(mingyueye.choices[0].target, 'node_end1');
  assert.equal(mingyueye.choices[1].target, 'node_end2');
  assert.equal(mingyueye.choices[2].target, 'node_end3');
  assert.equal(mingyueye.choices[3].target, 'node_end4');
  assert.equal(mingyueye.choices[4].target, 'node_end5');

  console.log('✅ 全局20个节点、全部路线分支、密码验证、搜索规则、聊天选项与五大结局全链条自检全部通过！');
});
