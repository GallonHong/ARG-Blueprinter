import React, { useState, useRef } from 'react';
import { TYPES } from '../types-config.js';
import { setCustomTemplates } from '../templates.js';

export function buildAIPrompt({
  pageType = 'Browse 浏览页 / 档案页',
  style = '泛黄绝密档案卷宗 / 红色印章 / 打印机打字机排版',
  era = '1998年临江市刑侦专案组',
  purpose = '受害者加密日记 / 警方通报 / 案件线索记录',
  content = '案发时间、目击证词、嫌疑人画像与密码线索',
  specialEffect = '档案泛黄折痕、红色绝密印章、涂黑机密打码',
  reference = 'SCP基金会、临江仙、模拟犯罪档案'
} = {}) {
  return `你是 ARG Blueprint 的网页模板设计助手。

你的任务：
根据创作者的想法，生成一个可以导入 ARG Blueprint 的网页模板。

用户需求：

页面类型：
${pageType || '{PAGE_TYPE}'}

页面风格：
${style || '{STYLE}'}

时代背景：
${era || '{ERA}'}

页面用途：
${purpose || '{PURPOSE}'}

页面内容：
${content || '{CONTENT}'}

特殊效果：
${specialEffect || '{SPECIAL_EFFECT}'}

参考作品：
${reference || '{REFERENCE}'}


---

请注意：

你不是在制作完整网站。

你是在制作 ARG Blueprint 的一个页面模板。

这个模板只负责：

- 页面视觉效果
- 内容展示
- 用户交互入口


所有以下功能由 ARG Blueprint Runtime 控制：

- 页面跳转
- 剧情条件
- 密码验证
- 搜索判断
- 玩家状态
- 存档


---

必须遵守 ARG Blueprint 模板规范。


## HTML要求

允许：

模板变量：

{{title}}
{{body}}
{{image}}
{{date}}
{{siteName}}


ARG接口：

链接：

<a data-arg-link="节点名称">

按钮：

<button data-arg-port="出口名称">

输入：

<input data-arg-input="参数名称">


插槽：

{{ARG_LINKS}}

{{ARG_CONTENT}}



禁止：

禁止：

onclick=""
onsubmit=""
onchange=""

禁止：

window.location

location.href

自己的 JavaScript 跳转逻辑


禁止：

<a href="xxx.html">


禁止：

写死其他页面名称。


---

## CSS要求

CSS可以自由设计：

允许：

- 字体
- 颜色
- 布局
- 动画
- 背景
- 图片效果

目标：

符合 ARG 氛围。

例如：

- 2000年代网站
- 老电脑界面
- 档案系统
- VHS录像
- 政府网页
- 医院系统
- 学校网站
- BBS论坛


---

## 输出内容：

请生成：

1.
template.html


2.
style.css


3.
template.json


其中：

template.json：

必须包含：

{
"id":"",
"name":"",
"type":"",
"description":"",
"fields":[],
"ports":[]
}


fields表示：
用户可以修改的内容。

ports表示：
页面可以连接到其他 ARG 节点的位置。


---

生成前，请先说明：

1. 这个页面适合什么 ARG 场景

2. 页面有哪些可连接出口

3. 需要哪些用户填写字段


然后生成文件。`
}

export function CustomTemplateModal({ state, update, close, initialType = 'Browse', onSelectTemplate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(initialType)
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [js, setJs] = useState('')
  const [activeTab, setActiveTab] = useState('prompt') // 'prompt' | 'html' | 'css' | 'js'
  const [showSkill, setShowSkill] = useState(true)
  const [copied, setCopied] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const fileInputRef = useRef(null)

  // Prompt Builder Parameters
  const [promptParams, setPromptParams] = useState({
    pageType: `${TYPES[initialType]?.label || '浏览页'} (${initialType})`,
    style: '泛黄绝密档案卷宗 / 红色印章 / 打印机打字机排版',
    era: '1998年临江市刑侦专案组',
    purpose: '受害者加密日记 / 警方通报 / 案件线索记录',
    content: '案发时间、目击证词、嫌疑人画像与密码线索',
    specialEffect: '档案泛黄折痕、红色绝密印章、涂黑机密打码',
    reference: 'SCP基金会、临江仙、模拟犯罪档案'
  })

  const generatedPrompt = buildAIPrompt(promptParams)

  const customTemplates = state.customTemplates || []

  const detectedSlots = Array.from(new Set(Array.from(html.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(m => m[1])))
  const hasHardcodedLinks = /<a\s+[^>]*href=["'](?!#)(?!javascript:)[^"']+["']/i.test(html) || /onclick\s*=/i.test(html)
  const hasComponentTag = html.includes('data-arg-component')
  const hasDataLinks = html.includes('data-arg-link') || html.includes('data-arg-port')

  const handleFiles = files => {
    let loaded = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const content = e.target.result
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          setHtml(content)
          loaded.push(file.name)
          if (!name) setName(file.name.replace(/\.(html|htm)$/i, ''))
          setActiveTab('html')
        } else if (file.name.endsWith('.css')) {
          setCss(content)
          loaded.push(file.name)
        } else if (file.name.endsWith('.js')) {
          setJs(content)
          loaded.push(file.name)
        } else if (file.name.endsWith('.json')) {
          try {
            const meta = JSON.parse(content)
            if (meta.name) setName(meta.name)
            if (meta.type && TYPES[meta.type]) setType(meta.type)
            if (meta.html) setHtml(meta.html)
            if (meta.css) setCss(meta.css)
            if (meta.js) setJs(meta.js)
            loaded.push(file.name + ' (已解析元数据)')
          } catch (_) {
            loaded.push(file.name)
          }
        }
        setUploadMsg(`已成功载入文件：${loaded.join(', ')}`)
      }
      reader.readAsText(file)
    })
  }

  const saveTemplate = () => {
    if (!name.trim()) return alert('请输入模板名称')
    if (!html.trim()) return alert('HTML 内容不能为空 (template.html)')

    update(next => {
      if (!next.customTemplates) next.customTemplates = []
      const existingIdx = next.customTemplates.findIndex(t => t.name === name.trim())
      const tplData = {
        id: existingIdx >= 0 ? next.customTemplates[existingIdx].id : 'tpl_' + Date.now(),
        name: name.trim(),
        type,
        html,
        css,
        js,
        updatedAt: new Date().toISOString()
      }
      if (existingIdx >= 0) {
        next.customTemplates[existingIdx] = tplData
      } else {
        next.customTemplates.push(tplData)
      }
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    })

    if (onSelectTemplate) {
      onSelectTemplate(name.trim())
    }
    alert(`模板「${name}」已成功注册并可在属性面板中选用！`)
  }

  const loadForEdit = tpl => {
    setName(tpl.name)
    setType(tpl.type || 'Custom')
    setHtml(tpl.html || '')
    setCss(tpl.css || '')
    setJs(tpl.js || '')
    setActiveTab('html')
    setUploadMsg(`正在编辑模板：${tpl.name}`)
  }

  const deleteTemplate = tplName => {
    if (!confirm(`确定删除自定义模板「${tplName}」吗？`)) return
    update(next => {
      next.customTemplates = (next.customTemplates || []).filter(t => t.name !== tplName)
      setCustomTemplates(next.customTemplates)
      localStorage.setItem('arg_custom_templates', JSON.stringify(next.customTemplates))
    })
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="modal">
      <div className="modal-card" style={{ maxWidth: 880, width: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div>
            <span className="eyebrow">CUSTOM TEMPLATE STUDIO</span>
            <h2>📤 模板导入与 AI 专业提示词生成器</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="ghost" style={{ fontSize: 12, color: '#2563eb', fontWeight: 'bold' }} onClick={() => setShowSkill(!showSkill)}>
              {showSkill ? '✕ 收起 AI 提示词生成器' : '🤖 AI 提示词生成器'}
            </button>
            <button className="icon-btn" onClick={close}>×</button>
          </div>
        </div>

        {showSkill && (
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: 14, fontSize: 12, maxHeight: 310, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <strong style={{ color: '#1e293b', fontSize: 13 }}>🤖 我的需求定制（填入参数实时生成专业 AI 提示词）：</strong>
                <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>发给 ChatGPT / Claude / DeepSeek 获取 template.html / style.css / template.json</span>
              </div>
              <button className="primary" style={{ padding: '5px 12px', fontSize: 12, fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={copyPrompt}>
                {copied ? '✓ 已复制完整提示词！' : '📋 一键复制完整 AI 提示词'}
              </button>
            </div>

            {/* Parameter Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 10 }}>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面类型 (PAGE_TYPE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.pageType}
                  onChange={e => setPromptParams({ ...promptParams, pageType: e.target.value })}
                  placeholder="例如：Desktop 桌面页 / Chat 聊天页 / Browse 浏览页"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面风格 (STYLE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.style}
                  onChange={e => setPromptParams({ ...promptParams, style: e.target.value })}
                  placeholder="例如：2000年代网站、老电脑界面、档案系统、BBS论坛"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>时代背景 (ERA)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.era}
                  onChange={e => setPromptParams({ ...promptParams, era: e.target.value })}
                  placeholder="例如：1998年、2000年代初、未来暗网"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面用途 (PURPOSE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.purpose}
                  onChange={e => setPromptParams({ ...promptParams, purpose: e.target.value })}
                  placeholder="例如：嫌疑人日记、警方调查台、加密档案库"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>页面内容 (CONTENT)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.content}
                  onChange={e => setPromptParams({ ...promptParams, content: e.target.value })}
                  placeholder="例如：案发时间、目击证词、嫌疑人画像与密码线索"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>特殊效果 (SPECIAL_EFFECT)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.specialEffect}
                  onChange={e => setPromptParams({ ...promptParams, specialEffect: e.target.value })}
                  placeholder="例如：CRT扫描线、打字机光标、红色印章、机密打码"
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 10, fontWeight: 'bold', color: '#475569' }}>参考作品 (REFERENCE)</label>
                <input
                  style={{ fontSize: 11, padding: '4px 8px' }}
                  value={promptParams.reference}
                  onChange={e => setPromptParams({ ...promptParams, reference: e.target.value })}
                  placeholder="例如：SCP基金会、临江仙、模拟犯罪档案"
                />
              </div>
            </div>

            <pre style={{ margin: 0, padding: 10, background: '#0f172a', color: '#38bdf8', borderRadius: 6, fontSize: 11, lineHeight: 1.5, maxHeight: 110, overflowY: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {generatedPrompt}
            </pre>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* File Upload Drop Area */}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: 8,
              padding: '14px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".html,.htm,.css,.js,.json,.txt"
              style={{ display: 'none' }}
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <div style={{ fontSize: 22, marginBottom: 2 }}>📂</div>
            <strong style={{ fontSize: 13, color: '#1e293b' }}>点击或拖拽上传 template.html, style.css, template.json / script.js</strong>
            <p style={{ margin: '3px 0 0 0', fontSize: 11, color: '#64748b' }}>支持解析 template.json 元数据及 HTML/CSS 样式，亦可在下方直接粘贴代码。</p>
            {uploadMsg && <div style={{ marginTop: 6, fontSize: 12, color: '#059669', fontWeight: 'bold' }}>✓ {uploadMsg}</div>}
          </div>

          {/* Form Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 'bold' }}>模板名称</label>
              <input placeholder="例如：1998绝密档案、赛博黑客终端" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: 11, fontWeight: 'bold' }}>适用页面类型</label>
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="Custom">🌐 通用（所有页面类型可用）</option>
                {Object.entries(TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}（{k}）</option>
                ))}
              </select>
            </div>
          </div>

          {/* Code Tabs */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`tab-btn ${activeTab === 'html' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('html')}>
                  📄 template.html {html ? '✓' : ''}
                </button>
                <button className={`tab-btn ${activeTab === 'css' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('css')}>
                  🎨 style.css {css ? '✓' : ''}
                </button>
                <button className={`tab-btn ${activeTab === 'js' ? 'active' : 'ghost'}`} onClick={() => setActiveTab('js')}>
                  ⚡ script.js (可选) {js ? '✓' : ''}
                </button>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {activeTab === 'html' ? `${html.length} 字符` : (activeTab === 'css' ? `${css.length} 字符` : `${js.length} 字符`)}
              </span>
            </div>

            {activeTab === 'html' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="<!DOCTYPE html>&#10;<html>&#10;...&#10;<h1>{{title}}</h1>&#10;<div class='content'>{{body}}</div>&#10;{{ARG_LINKS}}&#10;...&#10;</html>"
                value={html}
                onChange={e => setHtml(e.target.value)}
              />
            )}
            {activeTab === 'css' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="body { background: var(--arg-bg-color, #fff); font-family: var(--arg-font-family, sans-serif); color: var(--arg-text-color, #222); }"
                value={css}
                onChange={e => setCss(e.target.value)}
              />
            )}
            {activeTab === 'js' && (
              <textarea
                style={{ width: '100%', minHeight: 180, fontFamily: 'Consolas, monospace', fontSize: 12, background: '#0f172a', color: '#e2e8f0', borderRadius: 6, padding: 10 }}
                placeholder="// 可选自定义专属动效代码，如打字机、声效等&#10;console.log('Custom template script loaded');"
                value={js}
                onChange={e => setJs(e.target.value)}
              />
            )}
          </div>

          {/* Live Contract Inspector */}
          <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: 10, fontSize: 11 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#334155' }}>🔍 模板契约与插槽智能检测（Live Validator）：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {detectedSlots.length > 0 ? (
                detectedSlots.map(s => (
                  <span key={s} style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>
                    ✓ 插槽 {"{{" + s + "}}"}
                  </span>
                ))
              ) : (
                <span style={{ color: '#94a3b8' }}>尚未检测到任何 {"{{slot}}"} 插槽</span>
              )}
              {hasComponentTag && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>✓ 交互组件</span>}
              {hasDataLinks && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: 3, fontWeight: 'bold' }}>✓ 路由出口标记</span>}
            </div>
            {hasHardcodedLinks && (
              <div style={{ marginTop: 6, color: '#b91c1c', fontWeight: 'bold' }}>
                ⚠️ 警告：检测到静态 href 链接或 onclick 事件。请改用 <code>data-arg-link="出口名"</code> 以保证 ARG 路由内核能正常拦截与跳转。
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="primary" style={{ flex: 1 }} onClick={saveTemplate}>
              💾 保存并注册该模板
            </button>
            <button className="ghost" onClick={() => { setName(''); setHtml(''); setCss(''); setJs(''); setUploadMsg(''); }}>
              清空重填
            </button>
          </div>

          {/* Registered Custom Templates List */}
          {customTemplates.length > 0 && (
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#334155' }}>
                📚 已注册的自定义模板库 ({customTemplates.length} 个)：
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {customTemplates.map(tpl => (
                  <div key={tpl.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
                    <div>
                      <strong style={{ fontSize: 12, color: '#1e293b' }}>{tpl.name}</strong>
                      <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>[{tpl.type === 'Custom' ? '通用' : (TYPES[tpl.type]?.label || tpl.type)}]</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {onSelectTemplate && (
                        <button className="primary icon-tiny" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { onSelectTemplate(tpl.name); close(); }}>
                          应用到当前节点
                        </button>
                      )}
                      <button className="ghost icon-tiny" style={{ fontSize: 11 }} onClick={() => loadForEdit(tpl)}>
                        编辑
                      </button>
                      <button className="rule-remove" style={{ fontSize: 12 }} onClick={() => deleteTemplate(tpl.name)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
