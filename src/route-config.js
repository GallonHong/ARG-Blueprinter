export function pageFileName(state, id) {
  return `${(state.startId || state.nodes[0]?.id) === id ? 'index' : id}.html`
}

export function buildRouteConfig(node, state, { preview = false } = {}) {
  const files = Object.fromEntries(state.nodes.map(item => [item.id, pageFileName(state, item.id)]))
  const searchNode = node.type === 'Search' ? node : state.nodes.find(item => item.type === 'Search')
  const searchRules = Object.fromEntries((searchNode?.rules || []).map(rule => [String(rule.keyword || '').trim().toLowerCase(), rule.target]))
  const config = { preview, files, rules: { search: searchRules }, links: {}, password: node.fields?.password || '', loginTarget: state.edges.find(edge => edge.from === node.id)?.to || '' }
  state.edges.filter(edge => edge.from === node.id).forEach(edge => {
    const target = state.nodes.find(item => item.id === edge.to)
    const port = edge.port || target?.name || edge.to
    config.links[port] = edge.to
  })
  return config
}
