import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { buildRouteConfig, pageFileName } from '../src/route-config.js'

const root = path.resolve(new URL('..', import.meta.url).pathname)

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
