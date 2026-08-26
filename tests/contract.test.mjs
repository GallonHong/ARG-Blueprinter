import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { buildRouteConfig, pageFileName, generateLinksHtml, generateNavLinksHtml, generateHotLinksHtml, generateDesktopIconsHtml } from '../src/route-config.js'
import { runtimeSource } from '../src/runtime.js'

const root = fileURLToPath(new URL('..', import.meta.url))

function fixture() {
  const search = { id: 'search', type: 'Search', fields: { password: '' }, rules: [{ keyword: ' view ', target: 'case' }] }
  const casePage = { id: 'case', type: 'Browse', name: '案件详情', fields: {} }
  const ending = { id: 'ending', type: 'Ending', name: '结局', fields: {} }
  return { startId: 'search', nodes: [search, casePage, ending], edges: [{ from: 'search', to: 'case', port: '案件详情' }, { from: 'search', to: 'ending', port: '通关' }] }
}

test('起始页固定导出为 index.html', () => {
  const state = fixture()
  assert.equal(pageFileName(state, 'search'), 'index.html')
  assert.equal(pageFileName(state, 'case'), 'case.html')
})

test('搜索规则按规范归一化并指向目标节点', () => {
  const state = fixture()
  const config = buildRouteConfig(state.nodes[0], state)
  assert.equal(config.rules.search.view, 'case')
  assert.equal(config.files.case, 'case.html')
})

test('卡片编辑预览不写入玩家进度，运行与导出游戏会记录进度', () => {
  const state = fixture()
  assert.equal(buildRouteConfig(state.nodes[0], state, { preview: true }).trackProgress, false)
  assert.equal(buildRouteConfig(state.nodes[0], state, { preview: true, trackProgress: true }).trackProgress, true)
  assert.equal(buildRouteConfig(state.nodes[0], state).trackProgress, true)
  assert.match(runtimeSource, /config\.trackProgress !== false/)
})

test('一个页面可以拥有多个命名出口', () => {
  const state = fixture()
  const config = buildRouteConfig(state.nodes[0], state)
  assert.equal(config.links['案件详情'], 'case')
  assert.equal(config.links['通关'], 'ending')
})

test('登录页配置密码和首条出口', () => {
  const state = fixture()
  const login = { id: 'login', type: 'Login', fields: { password: '0717' } }
  state.nodes.push(login)
  state.edges.push({ from: 'login', to: 'ending', port: '登录后进入' })
  const config = buildRouteConfig(login, state)
  assert.equal(config.password, '0717')
  assert.equal(config.loginTarget, 'ending')
})

test('索引页支持生成多个超链接按键及路由映射', () => {
  const indexNode = { id: 'index_portal', type: 'Index', name: '临江门户', template: '2001 门户', fields: { siteName: '临江热线', categoryTitle: '快捷入口' } }
  const newsNode = { id: 'news_1', type: 'Browse', name: '717案件通报', fields: { title: '717专报' } }
  const filesNode = { id: 'files_1', type: 'Files', name: '绝密档案库', fields: {} }
  const state = {
    startId: 'index_portal',
    nodes: [indexNode, newsNode, filesNode],
    edges: [
      { from: 'index_portal', to: 'news_1', port: '案件通报', label: '717案件通报', desc: '临江晚报专栏' },
      { from: 'index_portal', to: 'files_1', port: '档案库', label: '绝密档案室', desc: '限特权访问' }
    ]
  }
  const config = buildRouteConfig(indexNode, state)
  assert.equal(config.links['案件通报'], 'news_1')
  assert.equal(config.links['档案库'], 'files_1')

  const linksHtml = generateLinksHtml(indexNode, state)
  assert.match(linksHtml, /data-arg-link="案件通报"/)
  assert.match(linksHtml, /717案件通报/)
  assert.match(linksHtml, /临江晚报专栏/)
  assert.match(linksHtml, /data-arg-link="档案库"/)
})

test('搜索页支持自定义超链接按键（导航栏与热搜推荐）及自定义未找到提示', () => {
  const searchNode = {
    id: 'search_main',
    type: 'Search',
    name: '百度搜索',
    fields: {
      siteName: '临江搜索',
      notFoundText: '未检索到指定案件档案'
    },
    rules: [{ keyword: '陈远', target: 'case_page' }]
  }
  const caseNode = { id: 'case_page', type: 'Browse', name: '案件专页' }
  const forumNode = { id: 'forum_page', type: 'Browse', name: '临江论坛' }
  const archiveNode = { id: 'archive_page', type: 'Files', name: '档案室' }

  const state = {
    startId: 'search_main',
    nodes: [searchNode, caseNode, forumNode, archiveNode],
    edges: [
      { from: 'search_main', to: 'forum_page', port: '论坛', label: '论坛专区', placement: 'nav' },
      { from: 'search_main', to: 'archive_page', port: '档案室', label: '绝密档案室', desc: 'HOT', placement: 'hot' }
    ]
  }

  const config = buildRouteConfig(searchNode, state)
  assert.equal(config.notFoundText, '未检索到指定案件档案')
  assert.equal(config.links['论坛'], 'forum_page')
  assert.equal(config.links['档案室'], 'archive_page')

  const navHtml = generateNavLinksHtml(searchNode, state)
  assert.match(navHtml, /data-arg-link="论坛"/)
  assert.match(navHtml, /论坛专区/)

  const hotHtml = generateHotLinksHtml(searchNode, state)
  assert.match(hotHtml, /data-arg-link="档案室"/)
  assert.match(hotHtml, /绝密档案室/)
})

test('桌面页支持生成仿 Windows 桌面图标并关联路由出口', () => {
  const desktopNode = {
    id: 'desktop_main',
    type: 'Desktop',
    name: '我的电脑桌面',
    template: 'Windows 98 桌面',
    fields: {
      systemName: 'Windows 98',
      stickyNote: '案情备忘：查看 0717 卷宗',
      startTitle: '开始'
    }
  }
  const caseDocNode = { id: 'case_doc', type: 'Browse', name: '案件卷宗' }
  const searchNode = { id: 'search_app', type: 'Search', name: '网络搜索' }
  const archiveNode = { id: 'archive_folder', type: 'Files', name: '回收站档案' }

  const state = {
    startId: 'desktop_main',
    nodes: [desktopNode, caseDocNode, searchNode, archiveNode],
    edges: [
      { from: 'desktop_main', to: 'case_doc', port: '案件卷宗_0717.txt', label: '案件卷宗_0717.txt', icon: '📄' },
      { from: 'desktop_main', to: 'search_app', port: '网络浏览器', label: '网络浏览器', icon: '🌐' },
      { from: 'desktop_main', to: 'archive_folder', port: '回收站', label: '回收站', icon: '🗑️' }
    ]
  }

  const config = buildRouteConfig(desktopNode, state)
  assert.equal(config.links['案件卷宗_0717.txt'], 'case_doc')
  assert.equal(config.links['网络浏览器'], 'search_app')
  assert.equal(config.links['回收站'], 'archive_folder')

  const iconsHtml = generateDesktopIconsHtml(desktopNode, state)
  assert.match(iconsHtml, /data-arg-link="案件卷宗_0717\.txt"/)
  assert.match(iconsHtml, /📄/)
  assert.match(iconsHtml, /data-arg-link="网络浏览器"/)
  assert.match(iconsHtml, /🌐/)
  assert.match(iconsHtml, /data-arg-link="回收站"/)
  assert.match(iconsHtml, /🗑️/)

  // Test custom image icon
  state.edges[0].icon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const customImgIconsHtml = generateDesktopIconsHtml(desktopNode, state)
  assert.match(customImgIconsHtml, /<img src="data:image\/png;base64,[^"]+" class="desktop-icon-img"/)
})

test('雾港示例在桌面提供论坛和聊天入口，论坛首页可进入置顶帖', () => {
  const example = JSON.parse(fs.readFileSync(path.join(root, 'examples', '雾港2004-第七码头失踪记录.arg-blueprint.json'), 'utf8'))
  const desktopTargets = example.edges.filter(edge => edge.from === 'desktop_main').map(edge => edge.to)
  assert.equal(['forum_home', 'chat_dispatch', 'chat_signal'].every(target => desktopTargets.includes(target)), true)
  assert.equal(example.nodes.some(node => node.id === 'forum_home' && node.name === '雾港夜航论坛首页'), true)
  assert.equal(example.edges.some(edge => edge.from === 'forum_home' && edge.to === 'bbs_forum'), true)
})

test('聊天页支持多联系人、对话顺序与玩家选项分支及路由绑定', () => {
  const chatNode = {
    id: 'chat_main',
    type: 'Chat',
    name: '微信聊天',
    template: '微信 UI 风格',
    fields: { siteName: '微信聊天' },
    contacts: [
      {
        id: 'c_lin',
        name: '林默 警官',
        avatar: '👮',
        bio: '临江刑侦支队',
        dialogue: [
          { id: 'm1', sender: 'npc', text: '0717案有重大进展。' },
          {
            id: 'm2',
            sender: 'choice',
            options: [
              { text: '查看现场日记', reply: '日记在档案库后台。', target: 'archive_page' }
            ]
          }
        ]
      }
    ]
  }
  const archiveNode = { id: 'archive_page', type: 'Files', name: '档案库' }
  const state = {
    startId: 'chat_main',
    nodes: [chatNode, archiveNode],
    edges: [{ from: 'chat_main', to: 'archive_page', port: 'archive_page' }]
  }

  const config = buildRouteConfig(chatNode, state)
  assert.equal(config.contacts.length, 1)
  assert.equal(config.contacts[0].name, '林默 警官')
  assert.equal(config.contacts[0].dialogue[1].options[0].target, 'archive_page')
  assert.equal(config.links['archive_page'], 'archive_page')
})

test('模板不包含硬编码链接或事件', () => {
  const templateFiles = []
  for (const typeDir of fs.readdirSync(path.join(root, 'templates'))) {
    const typePath = path.join(root, 'templates', typeDir)
    if (!fs.statSync(typePath).isDirectory()) continue
    for (const templateDir of fs.readdirSync(typePath)) {
      const file = path.join(typePath, templateDir, 'template.html')
      if (fs.existsSync(file)) templateFiles.push(file)
    }
  }
  for (const file of templateFiles) {
    const html = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(html, /\b(?:onclick|onsubmit)\s*=/i, file)
    assert.doesNotMatch(html, /\bhref\s*=/i, file)
  }
})

test('支持玩家上传的自定义模板（HTML / CSS / JS）及路由契约解析', () => {
  const customNode = {
    id: 'n_custom',
    type: 'Search',
    name: '自定义黑客搜索',
    template: '黑客终端V2',
    fields: {
      siteName: '暗网检索',
      notFoundText: 'ACCESS DENIED.'
    },
    rules: [{ keyword: '0717', target: 'target_node' }]
  }
  const state = {
    startId: 'n_custom',
    nodes: [customNode, { id: 'target_node', type: 'Browse', name: '绝密卷宗', fields: {} }],
    edges: [{ from: 'n_custom', to: 'target_node', port: '绝密卷宗' }],
    customTemplates: [
      {
        id: 'tpl_1',
        name: '黑客终端V2',
        type: 'Search',
        html: '<!DOCTYPE html><html><body><form data-arg-component="search"><input data-arg-input="keyword"><button data-arg-submit>SEARCH</button></form></body></html>',
        css: 'body { background: #000; color: #0f0; }',
        js: 'console.log("Terminal V2 initialized");'
      }
    ]
  }

  const config = buildRouteConfig(customNode, state)
  assert.equal(config.rules.search['0717'], 'target_node')
  assert.equal(config.links['绝密卷宗'], 'target_node')
  assert.equal(config.notFoundText, 'ACCESS DENIED.')
})

import { getQiyuebanDemoProject } from '../src/demo-project.js'

test('《七月半：灵异论坛调查记录》完整复刻项目契约与路由验证', () => {
  const project = getQiyuebanDemoProject()
  assert.equal(project.nodes.length, 20)
  assert.equal(project.startId, 'node_desktop')
  assert.ok(project.edges.length >= 25)

  // Verify desktop routes and icons
  const desktopNode = project.nodes.find(n => n.id === 'node_desktop')
  const desktopConfig = buildRouteConfig(desktopNode, project)
  assert.equal(desktopConfig.links['聊天通讯.exe'], 'node_chat')
  assert.equal(desktopConfig.links['七月半论坛.exe'], 'node_forum')
  assert.equal(desktopConfig.links['全盘搜索.exe'], 'node_search')
  assert.equal(desktopConfig.links['机密文件夹'], 'node_login')

  const desktopIconsHtml = generateDesktopIconsHtml(desktopNode, project)
  assert.match(desktopIconsHtml, /data-arg-link="聊天通讯\.exe"/)
  assert.match(desktopIconsHtml, /data-arg-link="七月半论坛\.exe"/)
  assert.match(desktopIconsHtml, /data-arg-link="全盘搜索\.exe"/)
  assert.match(desktopIconsHtml, /data-arg-link="机密文件夹"/)

  // Verify search rules
  const searchNode = project.nodes.find(n => n.id === 'node_search')
  const searchConfig = buildRouteConfig(searchNode, project)
  assert.equal(searchConfig.rules.search['失踪'], 'node_news_shizong')
  assert.equal(searchConfig.rules.search['南鄣'], 'node_news_nanzhang')
  assert.equal(searchConfig.rules.search['泰永集团'], 'node_news_taiyong')
  assert.equal(searchConfig.rules.search['渡生大醮'], 'node_doc_dusheng')

  // Verify login password and target
  const loginNode = project.nodes.find(n => n.id === 'node_login')
  const loginConfig = buildRouteConfig(loginNode, project)
  assert.equal(loginConfig.password, 'yxzyddx')
  assert.equal(loginConfig.loginTarget, 'node_files')

  // Verify chat contacts and branch targets
  const chatNode = project.nodes.find(n => n.id === 'node_chat')
  const chatConfig = buildRouteConfig(chatNode, project)
  assert.equal(chatConfig.contacts.length, 4)
  const mingyueye = chatConfig.contacts.find(c => c.id === 'mingyueye')
  assert.ok(mingyueye)
  assert.equal(mingyueye.choices.length, 5)
  assert.equal(mingyueye.choices[0].target, 'node_end1')
  assert.equal(mingyueye.choices[4].target, 'node_end5')
})

test('登录页 Runtime 严格鉴权与错误文案解耦', () => {
  const loginNode = {
    id: 'login_custom',
    type: 'Login',
    name: '特权口令验证',
    fields: {
      password: 'vault_pass_999',
      errorMessage: '❌ 密钥口令无效，系统已记录本次尝试！'
    }
  }
  const targetNode = { id: 'vault_inner', type: 'Files', name: '地下保险库' }
  const state = {
    startId: 'login_custom',
    nodes: [loginNode, targetNode],
    edges: [{ from: 'login_custom', to: 'vault_inner', port: '验证进入' }]
  }

  const config = buildRouteConfig(loginNode, state)
  assert.equal(config.password, 'vault_pass_999')
  assert.equal(config.errorMessage, '❌ 密钥口令无效，系统已记录本次尝试！')
  assert.equal(config.loginTarget, 'vault_inner')

  // Verify runtimeSource does NOT contain universal hardcoded passwords
  assert.ok(!runtimeSource.includes('一切自愿的大学'))
  assert.ok(!runtimeSource.includes('yxzyddx'))
  assert.ok(!runtimeSource.includes('0717'))
})

test('通用 Runtime 暴露标准沙箱 API (window.ARG_RUNTIME)', () => {
  assert.ok(runtimeSource.includes('window.ARG_RUNTIME'))
  assert.ok(runtimeSource.includes('playSynthSound'))
  assert.ok(runtimeSource.includes('triggerClue'))
})
