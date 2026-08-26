import React from 'react';

export function ValidatorModal({ validation, onFocusNode, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="validator-card" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>剧情健康度与死胡同自检 (Story Graph Validator)</h2>
          <button className="ghost icon-tiny" onClick={onClose}>✕</button>
        </div>
        <div className="validator-summary-bar">
          <span className={`validator-status-badge ${validation.healthy ? 'healthy' : 'warning'}`}>
            {validation.healthy ? '✓ 蓝图链路 100% 完整' : `! 发现 ${validation.errorCount} 处严重问题 · ${validation.warningCount} 处潜在隐患`}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
            可达节点: {validation.reachableCount}/{validation.totalCount} · 结局数: {validation.endingCount}
          </span>
        </div>
        <div className="validator-issues-list">
          {validation.healthy ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8, color: '#16a34a' }}>✓</div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>太棒了！所有页面均可正常到达并通关。</p>
              <p style={{ fontSize: 11.5, marginTop: 4, color: 'var(--text-muted)' }}>不存在任何孤岛卡片、死胡同页面或损坏的关键词跳转。</p>
            </div>
          ) : (
            validation.issues.map((issue, idx) => (
              <div key={idx} className={`validator-issue-item ${issue.type}`}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: issue.type === 'error' ? '#dc2626' : '#d97706', marginBottom: 2 }}>
                    {issue.type === 'error' ? '[严重缺陷]' : '[逻辑隐患]'} {issue.nodeName ? `卡片：${issue.nodeName}` : '全局'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{issue.message}</div>
                </div>
                {issue.nodeId && (
                  <button className="ghost icon-tiny" style={{ fontSize: 11, padding: '3px 8px', alignSelf: 'center' }} onClick={() => onFocusNode(issue.nodeId)}>
                    定位卡片
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
