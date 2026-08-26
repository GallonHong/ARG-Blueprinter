import React from 'react';
import { TYPES, DESKTOP_ICON_SYMBOLS } from '../types-config.js';
import { getSmartIcon } from '../route-config.js';
import { ImageUpload } from './ImageUpload.jsx';

export function LinkEditor({ selected, nodes, edges, update }) {
  const outgoing = edges.filter(edge => edge.from === selected.id)
  const targets = nodes.filter(node => node.id !== selected.id)
  const isSearch = selected.type === 'Search'
  const isIndex = selected.type === 'Index'
  const isDesktop = selected.type === 'Desktop'

  const addLink = (placement = 'hot', defaultIcon = '') => {
    const target = targets.find(node => !outgoing.some(edge => edge.to === node.id)) || targets[0]
    if (target) {
      const icon = defaultIcon || (isDesktop ? getSmartIcon({ label: target.name, port: target.name }, target) : '')
      update(next => next.edges.push({
        from: selected.id,
        to: target.id,
        port: target.name,
        label: target.name,
        desc: isSearch ? '热搜推荐' : (target.fields?.title || ''),
        placement: isSearch ? placement : 'default',
        icon
      }))
    } else {
      alert('请先创建其他页面节点作为超链接目标')
    }
  }

  const moveLink = (index, delta) => {
    const targetIndex = index + delta
    if (targetIndex < 0 || targetIndex >= outgoing.length) return
    update(next => {
      const edgeA = outgoing[index]
      const edgeB = outgoing[targetIndex]
      const realIndexA = next.edges.indexOf(edgeA)
      const realIndexB = next.edges.indexOf(edgeB)
      if (realIndexA !== -1 && realIndexB !== -1) {
        const temp = next.edges[realIndexA]
        next.edges[realIndexA] = next.edges[realIndexB]
        next.edges[realIndexB] = temp
      }
    })
  }

  return (
    <div className="field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ margin: 0 }}>{isDesktop ? '桌面图标列表 / 快捷方式' : '超链接按键列表 / 页面出口'}</label>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{outgoing.length} 个{isDesktop ? '图标' : '出口'}</span>
      </div>
      <button className="ghost start-toggle" style={{ marginBottom: 10, width: '100%' }} onClick={() => update(next => { next.startId = selected.id; next.nodes.forEach(node => { node.isStart = node.id === selected.id }) })}>
        {selected.isStart ? '当前为游戏起始页' : '设为游戏起始页'}
      </button>
      
      {isDesktop && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          桌面图标设定：所有图标将以网格形式呈现在 Windows 桌面上，点击即可打开对应页面。
        </div>
      )}

      {isSearch && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          搜索页按键设定：可自由添加顶部导航按键或热门检索通道。
        </div>
      )}

      {isIndex && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '6px 8px', borderRadius: 5 }}>
          索引页将自动把下列按键渲染在页面的超链接列表中，点击即可跳转。
        </div>
      )}

      {outgoing.map((edge, index) => {
        const target = nodes.find(node => node.id === edge.to)
        const realIdx = edges.indexOf(edge)
        const isIconImg = typeof edge.icon === 'string' && (edge.icon.startsWith('data:image/') || edge.icon.startsWith('http://') || edge.icon.startsWith('https://') || edge.icon.startsWith('/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico'].some(ext => edge.icon.split('?')[0].toLowerCase().endsWith(ext)))
        return (
          <div className="rule link-card" key={`${edge.from}-${edge.to}-${index}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button className="ghost icon-tiny" title="上移" disabled={index === 0} onClick={() => moveLink(index, -1)}>↑</button>
                <button className="ghost icon-tiny" title="下移" disabled={index === outgoing.length - 1} onClick={() => moveLink(index, 1)}>↓</button>
                {isDesktop && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'var(--bg-subtle)', borderRadius: 3, border: '1px solid var(--border-color)' }}>
                    {isIconImg ? <img src={edge.icon} alt="ico" style={{ width: 16, height: 16, objectFit: 'contain' }} /> : (edge.icon || '📁')}
                  </span>
                )}
                <strong style={{ fontSize: 11.5, color: 'var(--text-main)', alignSelf: 'center' }}>
                  {isDesktop ? `桌面图标 #${index + 1}` : `按键 #${index + 1}`}
                </strong>
              </div>
              <button className="rule-remove" title="删除该项目" onClick={() => update(next => { next.edges.splice(realIdx, 1) })}>×</button>
            </div>
            
            {isDesktop && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>选择预设图标图案 (或在下方上传自定义图片)</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                  {DESKTOP_ICON_SYMBOLS.map(item => (
                    <button
                      key={item.symbol}
                      type="button"
                      className="ghost"
                      style={{
                        fontSize: 11,
                        padding: '3px 6px',
                        border: (edge.icon || '📁') === item.symbol ? '1px solid #356ae6' : '1px solid #dfe5ec',
                        background: (edge.icon || '📁') === item.symbol ? '#eef3ff' : '#fff',
                        fontWeight: (edge.icon || '📁') === item.symbol ? 'bold' : 'normal'
                      }}
                      title={item.name}
                      onClick={() => update(next => {
                        const itemEdge = next.edges[realIdx]
                        if (itemEdge) {
                          itemEdge.icon = item.symbol
                          if (!itemEdge.port || itemEdge.port === target?.name || itemEdge.port === '我的电脑' || itemEdge.port === '文件夹') {
                            itemEdge.port = item.name
                            itemEdge.label = item.name
                          }
                        }
                      })}
                    >
                      {item.symbol} {item.name}
                    </button>
                  ))}
                </div>

                <ImageUpload
                  label="或上传自定义桌面图标图片 (.ico/.png/.jpg/WebP)"
                  value={edge.icon}
                  onChange={val => update(next => {
                    const itemEdge = next.edges[realIdx]
                    if (itemEdge) itemEdge.icon = val || '📁'
                  })}
                  size={34}
                  placeholder="上传本地图标图片或输入 URL..."
                />
              </div>
            )}

            <div className="field" style={{ margin: '4px 0 6px 0' }}>
              <label style={{ fontSize: 10, fontWeight: 'bold' }}>{isDesktop ? '🖥️ 自定义软件名称 / 桌面文件名' : '按键显示文字 / 链接名称'}</label>
              <input
                placeholder={isDesktop ? '例如：我的电脑、案件卷宗_0717.txt、网际快车.exe' : '例如：新闻、贴吧 或 🔥 7·17案'}
                value={edge.port || target?.name || edge.to}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) {
                    item.port = event.target.value
                    item.label = event.target.value
                  }
                })}
              />
            </div>

            {isSearch && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>按键显示位置</label>
                <select
                  value={edge.placement || 'hot'}
                  onChange={event => update(next => {
                    const item = next.edges[realIdx]
                    if (item) item.placement = event.target.value
                  })}
                >
                  <option value="hot">🔥 搜索框下方 · 热门检索 / 快捷推荐</option>
                  <option value="nav">🧭 页面右上角 · 顶部导航按键</option>
                </select>
              </div>
            )}

            {isIndex && (
              <div className="field" style={{ margin: '4px 0 6px 0' }}>
                <label style={{ fontSize: 10 }}>副标题 / 补充描述（可选）</label>
                <input
                  placeholder="例如：HOT 或 2001-07-17"
                  value={edge.desc || ''}
                  onChange={event => update(next => {
                    const item = next.edges[realIdx]
                    if (item) item.desc = event.target.value
                  })}
                />
              </div>
            )}

            <div className="field" style={{ margin: '4px 0 0 0' }}>
              <label style={{ fontSize: 10 }}>双击/点击打开的目标页面</label>
              <select
                value={edge.to}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) item.to = event.target.value
                })}
              >
                {targets.map(node => <option key={node.id} value={node.id}>{node.name}（{TYPES[node.type]?.label || node.type}）</option>)}
              </select>
            </div>

            <div className="field" style={{ margin: '4px 0 0 0' }}>
              <label style={{ fontSize: 10, color: edge.requires ? '#b45309' : 'inherit', fontWeight: edge.requires ? 600 : 'normal' }}>
                🔒 解锁前置线索/页面 (可选)
              </label>
              <select
                value={edge.requires || ''}
                onChange={event => update(next => {
                  const item = next.edges[realIdx]
                  if (item) item.requires = event.target.value
                })}
              >
                <option value="">（无前置条件 · 开局即可见）</option>
                {nodes.filter(node => node.id !== selected.id).map(node => (
                  <option key={node.id} value={node.id}>需先探索：{node.name} ({node.id})</option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {isDesktop ? (
          <button className="ghost" style={{ width: '100%', fontSize: 12 }} onClick={() => addLink('default', '📁')}>＋ 添加桌面图标</button>
        ) : isSearch ? (
          <>
            <button className="ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => addLink('hot')}>＋ 热门推荐按键</button>
            <button className="ghost" style={{ flex: 1, fontSize: 12 }} onClick={() => addLink('nav')}>＋ 顶部导航按键</button>
          </>
        ) : (
          <button className="ghost" style={{ width: '100%' }} onClick={() => addLink('default')}>＋ 添加超链接按键</button>
        )}
      </div>
    </div>
  )
}
