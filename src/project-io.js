import JSZip from 'jszip';
import { runtimeSource } from './runtime.js';
import { pageFileName } from './route-config.js';
import { buildPageHtml } from './generator.js';

export async function exportZip(state) {
  try {
    const zip = new JSZip()
    
    // 1. Add arg-runtime.js
    zip.file('arg-runtime.js', runtimeSource)

    // 2. Add all HTML pages
    state.nodes.forEach(node => {
      const filename = pageFileName(state, node.id)
      const htmlContent = buildPageHtml(node, state)
      zip.file(filename, htmlContent)
    })

    // 3. Add arg-blueprint.json (so full graph, coordinates, rules, contacts, and custom templates can be restored)
    const projectData = {
      version: '1.0.0',
      title: state.title || '未命名 ARG',
      startId: state.startId,
      nodes: state.nodes,
      edges: state.edges,
      customTemplates: state.customTemplates || [],
      exportedAt: new Date().toISOString()
    }
    zip.file('arg-blueprint.json', JSON.stringify(projectData, null, 2))

    // 4. Generate zip blob and trigger download
    const blob = await zip.generateAsync({ type: 'blob' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const safeTitle = (state.title || 'arg-game').replace(/[\\/:*?"<>|]/g, '_')
    link.download = `${safeTitle}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  } catch (err) {
    console.error('Export ZIP error:', err)
    alert('导出 ZIP 失败: ' + err.message)
  }
}

export async function parseAndLoadProject(file) {
  let projectData = null

  if (file.name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file)
    const jsonFile = zip.file('arg-blueprint.json') || zip.file('blueprint.json') || Object.values(zip.files).find(f => f.name.endsWith('.json'))
    if (jsonFile) {
      const text = await jsonFile.async('text')
      projectData = JSON.parse(text)
    } else {
      throw new Error('未在 ZIP 压缩包中找到 arg-blueprint.json 蓝图元数据文件')
    }
  } else if (file.name.endsWith('.json')) {
    const text = await file.text()
    projectData = JSON.parse(text)
  } else {
    throw new Error('仅支持导入 .zip 压缩包或 .json 蓝图文件')
  }

  if (!projectData || !Array.isArray(projectData.nodes)) {
    throw new Error('蓝图数据格式不正确：缺少 nodes 页面节点列表')
  }

  const sanitizedNodes = projectData.nodes.map((node, index) => {
    const type = TYPES[node.type] ? node.type : 'Browse'
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      id: node.id || `n_${Date.now()}_${index}`,
      name: node.name || `${TYPES[type]?.label || type} ${index + 1}`,
      type,
      template: node.template || TYPES[type].templates[0],
      x: (typeof node.x === 'number' && !isNaN(node.x)) ? node.x : (60 + col * 230),
      y: (typeof node.y === 'number' && !isNaN(node.y)) ? node.y : (60 + row * 150),
      fields: node.fields || {},
      rules: Array.isArray(node.rules) ? node.rules : (type === 'Search' ? [{ keyword: '线索', target: '' }] : []),
      contacts: Array.isArray(node.contacts) ? node.contacts : (type === 'Chat' ? defaultContacts() : []),
      isStart: Boolean(node.isStart)
    }
  })

  const sanitizedEdges = Array.isArray(projectData.edges) ? projectData.edges : []
  const customTemplates = Array.isArray(projectData.customTemplates) ? projectData.customTemplates : []

  let startId = projectData.startId
  if (!startId || !sanitizedNodes.some(n => n.id === startId)) {
    startId = sanitizedNodes[0]?.id || null
  }
  sanitizedNodes.forEach((node, idx) => {
    node.isStart = node.id === startId || (!startId && idx === 0)
  })

  return {
    title: projectData.title || '已导入 ARG 蓝图',
    startId,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
    customTemplates,
    selected: sanitizedNodes[0]?.id || null
  }
}
