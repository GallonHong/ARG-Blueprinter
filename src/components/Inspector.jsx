import React, { useState } from 'react';
import { TYPES } from '../types-config.js';
import { TYPE_THEME_PRESETS } from '../theme-presets.js';
import { ChatEditor } from './ChatEditor.jsx';
import { LinkEditor } from './LinkEditor.jsx';
import { ImageUpload } from './ImageUpload.jsx';

const Field = ({ label, children }) => <div className="field"><label>{label}</label>{children}</div>;
const safeHex = (c, fallback = '#ffffff') => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : fallback;

export function Inspector({ selected, nodes, edges, customTemplates = [], openTemplateModal, onClose, update, patch, remove, onSetStart, addRule, addNode }) {
  const [activeTab, setActiveTab] = useState('content') // 'content' | 'links' | 'style'
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false)

  if (!selected) return (
    <aside className="inspector">
      <div className="inspector-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>属性配置</h2>
        </div>
        {onClose && <button className="icon-btn" onClick={onClose} title="收起属性面板">»</button>}
      </div>
      <div className="inspector-empty">
        <p style={{ marginBottom: 16 }}>在流程图中选择节点开始编辑，<br/>或快速创建新页面：</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 6px' }}>
          {Object.entries(TYPES).map(([k, v]) => (
            <button key={k} className="ghost" style={{ textAlign: 'left', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => addNode && addNode(k)}>
              <span>＋ {v.label}</span>
              <span style={{ fontSize: 11, color: '#a0aec0' }}>{k}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )

  const isChat = selected.type === 'Chat'
  const isSearch = selected.type === 'Search'
  const isIndex = selected.type === 'Index'
  const isDesktop = selected.type === 'Desktop'

  const currentPresets = TYPE_THEME_PRESETS[selected.type] || []

  const applyPreset = preset => {
    patch(node => {
      if (preset.template) {
        node.template = preset.template
      }
      if (preset.fields) {
        Object.entries(preset.fields).forEach(([k, v]) => {
          node.fields[k] = v
        })
      }
    })
  }

  const customForThisType = (customTemplates || []).filter(t => t.type === selected.type || t.type === 'Custom')

  return <aside className="inspector">
    <div className="inspector-head">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>{selected.name}</h2>
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose} title="收起属性面板" style={{ fontSize: 14, padding: '2px 6px' }}>
            »
          </button>
        )}
      </div>
      <div className="inspector-tabs">
        <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
          {isChat ? '基础信息' : '内容与规则'}
        </button>
        <button className={`tab-btn ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
          {isChat ? '联系人与对话' : (isDesktop ? '桌面图标' : '连接出口')}
        </button>
        <button className={`tab-btn ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>
          样式定制
        </button>
      </div>
    </div>
    <div className="inspector-body">
      {activeTab === 'content' && <>
        <Field label="页面名称"><input value={selected.name} onChange={event => patch(node => { node.name = event.target.value })}/></Field>
        <Field label="页面类型">
          <select value={selected.type} onChange={event => patch(node => {
            node.type = event.target.value
            node.template = TYPES[node.type].templates[0]
            node.fields = {}
            TYPES[node.type].fields.forEach(field => { node.fields[field[0]] = field[2] })
            if (node.type === 'Chat' && !Array.isArray(node.contacts)) {
              node.contacts = []
            }
          })}>
            {Object.entries(TYPES).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select>
        </Field>
        <Field label="HTML 模板">
          <div style={{ display: 'flex', gap: 6 }}>
            <select style={{ flex: 1 }} value={selected.template} onChange={event => patch(node => { node.template = event.target.value })}>
              <optgroup label="内置官方预设">
                {TYPES[selected.type].templates.map(template => <option key={template} value={template}>{template}</option>)}
              </optgroup>
              {customForThisType.length > 0 && (
                <optgroup label="自定义导入模板">
                  {customForThisType.map(t => <option key={t.name} value={t.name}>{t.name} (自定义)</option>)}
                </optgroup>
              )}
            </select>
            <button className="ghost icon-tiny" style={{ fontSize: 11, padding: '3px 8px', whiteSpace: 'nowrap' }} title="上传/管理自定义模板" onClick={openTemplateModal}>
              导入
            </button>
          </div>
        </Field>

        {TYPES[selected.type].fields.filter(f => !['primaryColor','bgColor','cardBg','textColor','fontFamily','customCss'].includes(f[0])).map(field => {
          const fieldKey = field[0]
          const fieldLabel = field[1]

          // Specific element deletion for stickyNote in Desktop
          if (fieldKey === 'stickyNote') {
            const isNoteDeleted = selected.fields.showStickyNote === false || selected.fields.stickyNote === '__deleted__' || !selected.fields.stickyNote
            return (
              <div key="stickyNote" className="field" style={{ margin: '10px 0' }}>
                {!isNoteDeleted ? (
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 6, padding: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600 }}>桌面便签卡片 (Sticky Note)</label>
                      <button
                        className="rule-remove"
                        style={{ color: '#71717a', fontSize: 11, padding: '1px 5px', borderRadius: 3 }}
                        title="删除便签"
                        onClick={() => patch(node => { node.fields.showStickyNote = false; node.fields.stickyNote = '__deleted__' })}
                      >
                        删除
                      </button>
                    </div>
                    <textarea
                      style={{ background: '#fff', border: '1px solid var(--border-color)', fontSize: 11.5, minHeight: 60 }}
                      value={selected.fields.stickyNote === '__deleted__' ? '' : (selected.fields.stickyNote || '')}
                      onChange={event => patch(node => { node.fields.stickyNote = event.target.value; node.fields.showStickyNote = true; })}
                    />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 6, padding: '8px 10px', textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>桌面便签已隐藏</span>
                    <button
                      className="primary icon-tiny"
                      style={{ marginLeft: 8, fontSize: 10.5, padding: '2px 6px' }}
                      onClick={() => patch(node => { node.fields.showStickyNote = true; node.fields.stickyNote = '案件调查备忘：\n1. 查阅 0717 卷宗。\n2. 登录档案库后台核对嫌疑人名单。'; })}
                    >
                      恢复便签
                    </button>
                  </div>
                )}
              </div>
            )
          }

          // Specific element deletion for notice in Search
          if (fieldKey === 'notice') {
            const isNoticeDeleted = selected.fields.showNotice === false || selected.fields.notice === '__deleted__' || !selected.fields.notice
            return (
              <div key="notice" className="field" style={{ margin: '10px 0' }}>
                {!isNoticeDeleted ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label style={{ margin: 0 }}>顶部提示公告 (Notice)</label>
                      <button
                        className="rule-remove"
                        style={{ color: '#71717a', fontSize: 11, padding: '1px 5px' }}
                        title="删除公告"
                        onClick={() => patch(node => { node.fields.showNotice = false; node.fields.notice = '__deleted__' })}
                      >
                        删除
                      </button>
                    </div>
                    <textarea
                      value={selected.fields.notice === '__deleted__' ? '' : (selected.fields.notice || '')}
                      onChange={event => patch(node => { node.fields.notice = event.target.value; node.fields.showNotice = true; })}
                    />
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 6, padding: '8px 10px', textAlign: 'center', background: 'var(--bg-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>顶部公告已删除</span>
                    <button
                      className="primary icon-tiny"
                      style={{ marginLeft: 8, fontSize: 10.5, padding: '2px 6px' }}
                      onClick={() => patch(node => { node.fields.showNotice = true; node.fields.notice = '提示：输入案件编号、人物姓名或案由检索线索'; })}
                    >
                      恢复公告
                    </button>
                  </div>
                )}
              </div>
            )
          }

          return (
            <Field key={fieldKey} label={fieldLabel}>
              {fieldKey === 'body' || fieldKey === 'message' || fieldKey === 'replies' ? (
                <textarea value={selected.fields[fieldKey] || ''} onChange={event => patch(node => { node.fields[fieldKey] = event.target.value })}/>
              ) : (
                <input value={selected.fields[fieldKey] || ''} onChange={event => patch(node => { node.fields[fieldKey] = event.target.value })}/>
              )}
            </Field>
          )
        })}
        {isSearch && <div className="field">
          <label>关键词检索规则</label>
          {(selected.rules || []).map((rule, index) => <div className="rule" key={index}>
            <button className="rule-remove" onClick={() => patch(node => { node.rules.splice(index, 1) })}>×</button>
            <div className="rule-row">
              <input placeholder="搜索关键词" value={rule.keyword} onChange={event => patch(node => { node.rules[index].keyword = event.target.value })}/>
              <select value={rule.target} onChange={event => patch(node => { node.rules[index].target = event.target.value })}>
                {nodes.filter(node => node.id !== selected.id).map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
              </select>
            </div>
          </div>)}
          <button className="ghost" style={{ width: '100%' }} onClick={addRule}>添加关键词规则</button>
        </div>}
      </>}

      {activeTab === 'links' && (
        isChat ? (
          <ChatEditor selected={selected} nodes={nodes} edges={edges} update={update} patch={patch}/>
        ) : (
          <LinkEditor selected={selected} nodes={nodes} edges={edges} update={update}/>
        )
      )}

      {activeTab === 'style' && <>
        <div className="field" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ margin: 0, fontWeight: 'bold', color: 'var(--text-main)' }}>
              🎨 {TYPES[selected.type]?.label || selected.type} 专属 UI 主题预设
            </label>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>共 {currentPresets.length} 款预设</span>
          </div>

          {/* Trigger Card (Shows Active Theme) */}
          {(() => {
            const activePreset = currentPresets.find(p => p.template === selected.template) || currentPresets[0]
            return (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1.5px solid #2563eb',
                  background: '#f0f7ff',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
                title="点击展开/收起主题选择菜单"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: 12, color: '#1e40af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activePreset?.name || selected.template}
                    </strong>
                    <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 3, background: '#dbeafe', color: '#1e40af', fontWeight: 600, flexShrink: 0 }}>
                      当前使用
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activePreset?.desc || '点击展开切换其他预设版式'}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#2563eb', transform: presetDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}>
                  ▼
                </span>
              </div>
            )
          })()}

          {/* Collapsible Dropdown Cards List */}
          {presetDropdownOpen && (
            <div className="preset-dropdown-container">
              {currentPresets.map((preset) => {
                const isCurrent = selected.template === preset.template
                return (
                  <div
                    key={preset.id}
                    className={`preset-card-item ${isCurrent ? 'active' : ''}`}
                    onClick={() => {
                      applyPreset(preset)
                      setPresetDropdownOpen(false)
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, width: '100%' }}>
                      <strong style={{ fontSize: 12, color: isCurrent ? '#1e40af' : 'var(--text-main)' }}>
                        {preset.name} {isCurrent ? '✓' : ''}
                      </strong>
                      <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 3, background: isCurrent ? '#dbeafe' : '#f1f5f9', color: isCurrent ? '#1e40af' : '#64748b', fontWeight: 600, flexShrink: 0 }}>
                        {preset.template}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {preset.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="field">
          <label>{isChat ? '玩家气泡强调色 (Bubble Color)' : '主色调 / 强调色 (Primary Color)'}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={safeHex(selected.fields.primaryColor, isChat ? '#95ec69' : '#174a8b')} onChange={e => patch(node => { node.fields.primaryColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.primaryColor || (isChat ? '#95ec69' : '#174a8b')} onChange={e => patch(node => { node.fields.primaryColor = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>页面背景色 (Background Color)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={safeHex(selected.fields.bgColor, isChat ? '#f0f2f5' : '#008080')} onChange={e => patch(node => { node.fields.bgColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.bgColor || (isChat ? '#f0f2f5' : '#f4f6f9')} onChange={e => patch(node => { node.fields.bgColor = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>{isChat ? '聊天主窗口背景色' : '卡片容器背景色'}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={safeHex(selected.fields.cardBg, '#ffffff')} onChange={e => patch(node => { node.fields.cardBg = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.cardBg || '#ffffff'} onChange={e => patch(node => { node.fields.cardBg = e.target.value })}/>
          </div>
        </div>

        <div className="field">
          <label>文字主色 (Text Color)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" style={{ width: 42, height: 36, padding: 2, cursor: 'pointer' }} value={safeHex(selected.fields.textColor, '#222222')} onChange={e => patch(node => { node.fields.textColor = e.target.value })}/>
            <input style={{ flex: 1 }} value={selected.fields.textColor || '#222222'} onChange={e => patch(node => { node.fields.textColor = e.target.value })}/>
          </div>
        </div>

        <Field label="字体风格">
          <select value={selected.fields.fontFamily || (isChat ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif' : '"SimSun", "宋体", serif')} onChange={e => patch(node => { node.fields.fontFamily = e.target.value })}>
            <option value='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif'>微信现代界面 (System UI / YaHei)</option>
            <option value='"SimSun", "宋体", serif'>宋体 / 报刊复古 (SimSun)</option>
            <option value='"KaiTi", "楷体", serif'>楷体 / 严肃公文 (KaiTi)</option>
            <option value='"Courier New", "Consolas", monospace'>黑客终端 / 等宽打字机 (Monospace)</option>
          </select>
        </Field>

        <Field label="氛围多媒体滤镜 (Atmosphere Filter)">
          <select value={selected.fields.atmosphere || ''} onChange={e => patch(node => { node.fields.atmosphere = e.target.value })}>
            <option value="">默认 (无滤镜)</option>
            <option value="crt">CRT 复古显像管扫描线</option>
            <option value="vignette">暗角暗影 (悬疑/绝密档案)</option>
            <option value="glitch">画面微弱故障闪烁 (Glitch)</option>
          </select>
        </Field>

        <div className="field" style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11.5 }}>
            <input
              type="checkbox"
              style={{ width: 'auto', cursor: 'pointer' }}
              checked={Boolean(selected.fields.typewriter)}
              onChange={e => patch(node => { node.fields.typewriter = e.target.checked })}
            />
            <span>启用打字机逐字排字动效 (支持点击/空格瞬间跳过)</span>
          </label>
        </div>

        <ImageUpload
          label="自定义壁纸 / 页面背景图 (覆盖默认纯色背景)"
          value={selected.fields.bgImage}
          onChange={val => patch(node => { node.fields.bgImage = val })}
          size={44}
          placeholder="上传本地壁纸图片文件或粘贴 URL..."
        />

        <Field label="自定义 CSS (WordPress 级样式注入)">
          <textarea
            placeholder={`/* 可直接书写 CSS 覆写样式，例如：*/\n.msg-bubble { border-radius: 12px; }\n.chat-sidebar { background: #e0e7ff; }`}
            style={{ minHeight: 110, fontFamily: 'monospace', fontSize: 12 }}
            value={selected.fields.customCss || ''}
            onChange={e => patch(node => { node.fields.customCss = e.target.value })}
          />
        </Field>
      </>}

      <button
        className={selected.isStart ? 'ghost' : 'secondary'}
        style={{ width: '100%', marginTop: 24, fontSize: 11.5 }}
        onClick={onSetStart}
        disabled={selected.isStart}
        title={selected.isStart ? '当前页面已经是起始页' : '将当前页面设为玩家进入游戏时首先打开的页面'}
      >
        {selected.isStart ? '✓ 当前已是起始页' : '设为起始页'}
      </button>

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="secondary"
          style={{ flex: 1, fontSize: 11.5 }}
          onClick={() => {
            update(draft => {
              const newId = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
              const clonedNode = JSON.parse(JSON.stringify(selected))
              clonedNode.id = newId
              clonedNode.name = `${selected.name} (副本)`
              clonedNode.isStart = false
              clonedNode.x = (selected.x || 80) + 40
              clonedNode.y = (selected.y || 80) + 40
              draft.nodes.push(clonedNode)
              draft.selected = newId
            })
          }}
          title="复制当前页面的所有内容、HTML模板与定制样式为新节点"
        >
          📋 复制/克隆此页面
        </button>
        <button className="danger" style={{ fontSize: 11.5 }} onClick={remove}>删除页面</button>
      </div>
    </div>
  </aside>
}
