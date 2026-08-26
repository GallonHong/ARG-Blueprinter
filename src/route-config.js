const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function pageFileName(state, id) {
  return `${(state.startId || state.nodes[0]?.id) === id ? 'index' : id}.html`
}

export function generateLinksHtml(node, state) {
  const outgoing = (state.edges || []).filter(edge => edge.from === node.id)
  if (!outgoing.length) return '<div class="empty-links" style="color:#888;font-size:13px;padding:8px 0;">（暂未配置超链接出口，请在右侧属性面板添加超链接按键）</div>'
  return outgoing.map(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    const title = edge.label || port
    const desc = edge.desc || (target?.fields?.title ? target.fields.title : (target ? `前往：${target.name}` : ''))
    return `<a href="javascript:void(0)" class="arg-link-item" data-arg-link="${esc(port)}"><span class="arg-link-title">${esc(title)}</span>${desc ? `<span class="arg-link-desc">${esc(desc)}</span>` : ''}</a>`
  }).join('\n')
}

export function generateNavLinksHtml(node, state) {
  const outgoing = (state.edges || []).filter(edge => edge.from === node.id && edge.placement === 'nav')
  if (!outgoing.length) return ''
  return outgoing.map(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    const title = edge.label || port
    return `<a href="javascript:void(0)" class="arg-link-item nav-link-btn" data-arg-link="${esc(port)}">${esc(title)}</a>`
  }).join('\n')
}

export function generateHotLinksHtml(node, state) {
  const outgoing = (state.edges || []).filter(edge => edge.from === node.id && edge.placement !== 'nav')
  if (!outgoing.length) return '<span style="color:#888;font-size:12px;">（暂无推荐按键）</span>'
  return outgoing.map(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    const title = edge.label || port
    const desc = edge.desc || (target?.fields?.title ? target.fields.title : '')
    return `<a href="javascript:void(0)" class="arg-link-item hot-link-btn" data-arg-link="${esc(port)}"><span class="arg-link-title">${esc(title)}</span>${desc ? `<span class="arg-link-desc">${esc(desc)}</span>` : ''}</a>`
  }).join('\n')
}

export function isImg(src) {
  if (typeof src !== 'string') return false
  const s = src.split('?')[0].toLowerCase()
  return s.startsWith('data:image/') || s.startsWith('blob:') || s.endsWith('.png') || s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.gif') || s.endsWith('.webp') || s.endsWith('.svg') || s.endsWith('.ico')
}

export function generateDesktopIconsHtml(node, state) {
  const outgoing = (state.edges || []).filter(edge => edge.from === node.id)
  if (!outgoing.length) return '<div class="empty-desktop-icons" style="color:rgba(255,255,255,0.8);font-size:12px;padding:12px;background:rgba(0,0,0,0.3);border-radius:4px;">（暂无桌面图标，请在右侧属性面板添加桌面图标）</div>'
  return outgoing.map(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    const title = edge.label || port
    const symbol = edge.icon || '📁'
    const symbolHtml = isImg(symbol)
      ? `<img src="${esc(symbol)}" class="desktop-icon-img" alt="${esc(title)}">`
      : `<div class="icon-symbol">${esc(symbol)}</div>`
    return `<a href="javascript:void(0)" role="button" tabindex="0" class="desktop-icon arg-link-item" data-arg-link="${esc(port)}" title="${esc(title)}">${symbolHtml}<div class="icon-title">${esc(title)}</div></a>`
  }).join('\n')
}



export function defaultContacts() {
  return [
    {
      id: 'c_lin',
      name: '林默 警官',
      avatar: '👮',
      bio: '临江市刑侦支队 · 0717专案组',
      lastMsg: '收到请回复，今晚城西仓库有情况',
      unread: true,
      dialogue: [
        { id: 'm1', sender: 'npc', text: '你终于上线了。0717 案有最新线索突破。' },
        { id: 'm2', sender: 'npc', text: '嫌疑人留下的加密笔记本里，提取出了两组核心关键词。' },
        {
          id: 'm3',
          sender: 'choice',
          options: [
            { text: '笔记本里的关键词是什么？', reply: '关键词是【陈远】和【0717】。你可以去内网搜索引擎里检索这两个词！', target: '' },
            { text: '昨晚城西仓库发现了什么？', reply: '现场发现了一部录音机，相关记录已经上传至档案库后台。', target: '' }
          ]
        }
      ]
    },
    {
      id: 'c_anon',
      name: '匿名爆料人',
      avatar: '👤',
      bio: 'IP: 192.168.1.104 [已加密]',
      lastMsg: '别相信官方的通告！',
      unread: true,
      dialogue: [
        { id: 'm1', sender: 'npc', text: '别相信官方通报！真相全被封存在档案库后台了。' },
        {
          id: 'm2',
          sender: 'choice',
          options: [
            { text: '档案库密码是多少？', reply: '密码是案发日期【0717】。快去登录后台查证！', target: '' },
            { text: '你是谁？', reply: '我是当年唯一的目击者。有危险，我先下了。', target: '' }
          ]
        }
      ]
    }
  ]
}

export function buildRouteConfig(node, state, { preview = false } = {}) {
  const files = Object.fromEntries(state.nodes.map(item => [item.id, pageFileName(state, item.id)]))
  const searchNode = node.type === 'Search' ? node : state.nodes.find(item => item.type === 'Search')
  const searchRules = Object.fromEntries((searchNode?.rules || []).map(rule => [String(rule.keyword || '').trim().toLowerCase(), rule.target]))
  const contacts = node.type === 'Chat' ? (node.contacts && node.contacts.length ? node.contacts : defaultContacts()) : []
  const config = {
    nodeId: node.id,
    preview,
    files,
    rules: { search: searchRules },
    links: {},
    password: node.fields?.password || '',
    loginTarget: state.edges.find(edge => edge.from === node.id)?.to || '',
    notFoundText: node.fields?.notFoundText || '没有找到相关结果',
    typewriter: !!(node.fields?.typewriter ?? false),
    atmosphere: node.fields?.atmosphere || '',
    contacts
  }

  // Register all outgoing routes
  state.edges.filter(edge => edge.from === node.id).forEach(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    config.links[port] = edge.to
    if (edge.label) config.links[edge.label] = edge.to
    if (target?.name) config.links[target.name] = edge.to
    config.links[edge.to] = edge.to
    const fileName = pageFileName(state, edge.to)
    if (fileName) config.links[fileName] = edge.to
  })

  // Register choices from contacts
  contacts.forEach(c => {
    (c.choices || []).forEach(opt => {
      if (opt.target) {
        config.links[opt.target] = opt.target
        const targetNode = state.nodes.find(n => n.id === opt.target)
        if (targetNode?.name) config.links[targetNode.name] = opt.target
      }
      if (opt.text && opt.target) config.links[opt.text] = opt.target
    });
    (c.dialogue || []).forEach(d => {
      if (d.sender === 'choice' && d.options) {
        d.options.forEach(opt => {
          if (opt.target) {
            config.links[opt.target] = opt.target
            const targetNode = state.nodes.find(n => n.id === opt.target)
            if (targetNode?.name) config.links[targetNode.name] = opt.target
          }
          if (opt.text && opt.target) config.links[opt.text] = opt.target
        })
      }
    })
  })
  return config
}



