import React, { useState } from 'react';
import { TYPES } from '../types-config.js';
import { ImageUpload } from './ImageUpload.jsx';

export function ChatEditor({ selected, nodes, edges, update, patch }) {
  const contacts = selected.contacts || []
  const [activeContactId, setActiveContactId] = useState(contacts[0]?.id || '')
  const activeContact = contacts.find(c => c.id === activeContactId) || contacts[0]
  const contactIdx = Math.max(0, contacts.findIndex(c => c.id === activeContact?.id))

  const AVATARS = ['👮', '🕵️', '👤', '👩', '👨', '👴', '🤖', '🐱', '🕶️', '📁', '💻', '🔐']

  const updateContacts = (newContacts) => {
    patch(node => {
      node.contacts = newContacts
    })
  }

  const addContact = () => {
    const newId = `c_${Date.now()}`
    const newC = {
      id: newId,
      name: `新联系人 ${contacts.length + 1}`,
      avatar: '👤',
      bio: '新身份简介',
      lastMsg: '',
      unread: false,
      dialogue: []
    }
    const next = [...contacts, newC]
    updateContacts(next)
    setActiveContactId(newId)
  }

  const removeContact = (id) => {
    const next = contacts.filter(c => c.id !== id)
    updateContacts(next)
    setActiveContactId(next[0]?.id || '')
  }

  const updateActiveContact = (fn) => {
    const next = JSON.parse(JSON.stringify(contacts))
    fn(next[contactIdx])
    updateContacts(next)
  }

  const addDialogueItem = (sender) => {
    updateActiveContact(c => {
      c.dialogue = c.dialogue || []
      if (sender === 'npc') {
        c.dialogue.push({ id: `m_${Date.now()}`, sender: 'npc', text: '请输入 NPC 回复内容...' })
      } else if (sender === 'choice') {
        c.dialogue.push({
          id: `m_${Date.now()}`,
          sender: 'choice',
          options: [
            { text: '选项 A：查问线索', reply: 'NPC：这是相关档案线索。', target: '' }
          ]
        })
      }
    })
  }

  const moveDialogueItem = (dIdx, delta) => {
    updateActiveContact(c => {
      const targetIdx = dIdx + delta
      if (targetIdx < 0 || targetIdx >= c.dialogue.length) return
      const temp = c.dialogue[dIdx]
      c.dialogue[dIdx] = c.dialogue[targetIdx]
      c.dialogue[targetIdx] = temp
    })
  }

  const removeDialogueItem = (dIdx) => {
    updateActiveContact(c => {
      c.dialogue.splice(dIdx, 1)
    })
  }

  const addChoiceOption = (dIdx) => {
    updateActiveContact(c => {
      const step = c.dialogue[dIdx]
      if (step && step.options) {
        step.options.push({ text: `新选项 ${step.options.length + 1}`, reply: 'NPC 的回应内容...', target: '' })
      }
    })
  }

  const removeChoiceOption = (dIdx, optIdx) => {
    updateActiveContact(c => {
      const step = c.dialogue[dIdx]
      if (step && step.options && step.options.length > 1) {
        step.options.splice(optIdx, 1)
      } else {
        alert('每个分支至少保留 1 个选项')
      }
    })
  }

  const targets = nodes.filter(n => n.id !== selected.id)

  return (
    <div className="chat-editor-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ margin: 0, fontWeight: 'bold' }}>联系人列表 ({contacts.length})</label>
        <button className="ghost icon-tiny" style={{ fontSize: 12, padding: '4px 8px' }} onClick={addContact}>＋ 添加联系人</button>
      </div>

      {contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💬</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>当前暂无联系人</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>聊天页默认空白，点击下方按钮添加联系人与自定义对话剧本</div>
          <button type="button" className="primary icon-tiny" onClick={addContact}>＋ 添加第一个联系人</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
            {contacts.map((c) => (
              <button
                key={c.id}
                type="button"
                className="ghost"
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: (c.id === (activeContact?.id || '')) ? '2px solid #07c160' : '1px solid #dfe5ec',
                  background: (c.id === (activeContact?.id || '')) ? '#e8f7ed' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap'
                }}
                onClick={() => setActiveContactId(c.id)}
              >
                <span>{c.avatar || '👤'}</span>
                <strong>{c.name}</strong>
              </button>
            ))}
          </div>

          {activeContact && (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#07c160' }}>👤 当前编辑联系人：{activeContact.name}</span>
                <button className="rule-remove" title="删除此联系人" onClick={() => removeContact(activeContact.id)}>×</button>
              </div>

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>联系人姓名</label>
            <input
              value={activeContact.name}
              onChange={e => updateActiveContact(c => { c.name = e.target.value })}
            />
          </div>

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>选择头像 Emoji</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
              {AVATARS.map(em => (
                <button
                  key={em}
                  type="button"
                  className="ghost"
                  style={{
                    fontSize: 14,
                    padding: '3px 6px',
                    border: (activeContact.avatar || '👤') === em ? '1px solid #07c160' : '1px solid #dfe5ec',
                    background: (activeContact.avatar || '👤') === em ? '#e8f7ed' : '#fff'
                  }}
                  onClick={() => updateActiveContact(c => { c.avatar = em })}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <ImageUpload
            label="或上传自定义联系人头像图片 (PNG/JPG/GIF/WebP)"
            value={activeContact.avatar}
            onChange={val => updateActiveContact(c => { c.avatar = val || '👤' })}
            shape="circle"
            size={38}
            placeholder="上传头像图片或输入 URL..."
          />

          <div className="field" style={{ margin: '4px 0 6px 0' }}>
            <label style={{ fontSize: 10 }}>身份头衔 / 个性签名</label>
            <input
              placeholder="例如：临江市刑侦支队 0717专案组"
              value={activeContact.bio || ''}
              onChange={e => updateActiveContact(c => { c.bio = e.target.value })}
            />
          </div>

          <div style={{ marginTop: 14, borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ margin: 0, fontSize: 11, fontWeight: 'bold' }}>💬 对话脚本与选项序列</label>
            </div>

            {(activeContact.dialogue || []).map((step, dIdx) => (
              <div className="rule link-card" key={step.id || dIdx} style={{ marginBottom: 10, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <button className="ghost icon-tiny" disabled={dIdx === 0} onClick={() => moveDialogueItem(dIdx, -1)}>↑</button>
                    <button className="ghost icon-tiny" disabled={dIdx === (activeContact.dialogue.length - 1)} onClick={() => moveDialogueItem(dIdx, 1)}>↓</button>
                    <strong style={{ fontSize: 11, color: step.sender === 'npc' ? '#2563eb' : '#059669', marginLeft: 4 }}>
                      {step.sender === 'npc' ? `NPC 消息 #${dIdx + 1}` : `玩家选项分支 #${dIdx + 1}`}
                    </strong>
                  </div>
                  <button className="rule-remove" onClick={() => removeDialogueItem(dIdx)}>×</button>
                </div>

                {step.sender === 'npc' ? (
                  <div className="field" style={{ margin: '4px 0 0 0' }}>
                    <label style={{ fontSize: 10 }}>NPC 消息内容</label>
                    <textarea
                      placeholder="输入 NPC 发送的内容..."
                      style={{ minHeight: 48, fontSize: 12 }}
                      value={step.text || ''}
                      onChange={e => updateActiveContact(c => { c.dialogue[dIdx].text = e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: 10, color: '#059669', fontWeight: 'bold' }}>玩家在聊天框可点击的回复选项：</label>
                    {(step.options || []).map((opt, optIdx) => (
                      <div key={optIdx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, padding: 6, margin: '6px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 'bold', color: '#166534' }}>选项 {String.fromCharCode(65 + optIdx)}</span>
                          {step.options.length > 1 && (
                            <button className="rule-remove" style={{ fontSize: 11 }} onClick={() => removeChoiceOption(dIdx, optIdx)}>×</button>
                          )}
                        </div>
                        <div className="field" style={{ margin: '2px 0 4px 0' }}>
                          <label style={{ fontSize: 9 }}>玩家选项文字 (点击发送)</label>
                          <input
                            placeholder="例如：0717 案卷在你手上吗？"
                            value={opt.text}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].text = e.target.value })}
                          />
                        </div>
                        <div className="field" style={{ margin: '2px 0 4px 0' }}>
                          <label style={{ fontSize: 9 }}>NPC 紧接着的回应内容</label>
                          <input
                            placeholder="例如：在城西仓库，快去查看！"
                            value={opt.reply || ''}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].reply = e.target.value })}
                          />
                        </div>
                        <div className="field" style={{ margin: '2px 0 0 0' }}>
                          <label style={{ fontSize: 9 }}>关联跳转页面 (可选)</label>
                          <select
                            value={opt.target || ''}
                            onChange={e => {
                              const targetVal = e.target.value
                              updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].target = targetVal })
                              if (targetVal) {
                                update(next => {
                                  if (!next.edges.some(edge => edge.from === selected.id && edge.to === targetVal)) {
                                    const targetNode = next.nodes.find(n => n.id === targetVal)
                                    next.edges.push({
                                      from: selected.id,
                                      to: targetVal,
                                      port: targetVal,
                                      label: opt.text || targetNode?.name || '聊天分支',
                                      desc: '聊天对话触发'
                                    })
                                  }
                                })
                              }
                            }}
                          >
                            <option value="">（不跳转，仅对话）</option>
                            {targets.map(n => <option key={n.id} value={n.id}>{n.name}（{TYPES[n.type]?.label || n.type}）</option>)}
                          </select>
                        </div>
                        <div className="field" style={{ margin: '4px 0 0 0' }}>
                          <label style={{ fontSize: 9, color: opt.requires ? '#b45309' : 'inherit', fontWeight: opt.requires ? 600 : 'normal' }}>
                            🔒 解锁前置线索/页面 (可选)
                          </label>
                          <select
                            value={opt.requires || ''}
                            onChange={e => updateActiveContact(c => { c.dialogue[dIdx].options[optIdx].requires = e.target.value })}
                          >
                            <option value="">（无前置条件 · 开局即可见）</option>
                            {nodes.filter(n => n.id !== selected.id).map(n => (
                              <option key={n.id} value={n.id}>需先探索：{n.name} ({n.id})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button className="ghost icon-tiny" style={{ width: '100%', fontSize: 11, marginTop: 4 }} onClick={() => addChoiceOption(dIdx)}>＋ 增加选项分支</button>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button className="ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => addDialogueItem('npc')}>添加 NPC 消息</button>
              <button className="ghost" style={{ flex: 1, fontSize: 11 }} onClick={() => addDialogueItem('choice')}>添加玩家选项分支</button>
            </div>
          </div>
        </div>
      )}
    </>
  )}
</div>
  )
}
