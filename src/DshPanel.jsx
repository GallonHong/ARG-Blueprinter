import { useState, useEffect, useRef } from 'react';
import {
  DEFAULT_DSH_ENDPOINT,
  getStoredDshEndpoint,
  setStoredDshEndpoint,
  checkDshHealth,
  formatBlueprintForDsh,
  extractCliScriptFromDshResponse
} from './dsh-bridge.js';
import { executeBatchCli } from './cli.js';

export function DshPanel({ state, update, isOpen, onClose }) {
  const [endpoint, setEndpoint] = useState(getStoredDshEndpoint());
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'webview'
  const [promptInput, setPromptInput] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [copiedTip, setCopiedTip] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const iframeRef = useRef(null);

  const testConnection = async (targetEndpoint = endpoint) => {
    setIsChecking(true);
    const res = await checkDshHealth(targetEndpoint);
    setIsOnline(res.online);
    setIsChecking(false);
    setStatusMessage(res.online ? `已连接到本地 DSH 服务: ${res.endpoint}` : `未能连接到 ${targetEndpoint}，请确认本地 dsh 进程已启动`);
  };

  useEffect(() => {
    if (isOpen) {
      testConnection(endpoint);
    }
  }, [isOpen]);

  const handleEndpointChange = (val) => {
    setEndpoint(val);
    setStoredDshEndpoint(val);
  };

  const handleCopyPrompt = () => {
    const fullPrompt = formatBlueprintForDsh(state, promptInput);
    navigator.clipboard.writeText(fullPrompt);
    setCopiedTip(true);
    setTimeout(() => setCopiedTip(false), 2000);
  };

  const handleApplyScript = () => {
    const script = extractCliScriptFromDshResponse(generatedScript);
    if (!script) {
      alert('请先输入或粘贴待执行的 Bash CLI 脚本！');
      return;
    }
    const result = executeBatchCli(script, state, update);
    alert(`DSH 脚本已成功应用到画布！\n${result}`);
    setGeneratedScript('');
  };

  const applyPreset = (presetType) => {
    if (presetType === 'puzzle_chain') {
      setPromptInput('请为本项目设计一条完整的【暗网悬疑解谜链】：包含 1 个暗网入口页面、3 个关联搜索关键词、1 份绝密密码箱档案（密码设为 secret99），以及通往【真相大白】的真结局。');
    } else if (presetType === 'npc_dialogue') {
      setPromptInput('请为联系人【林警官】扩写 3 组富有张力的审讯与调查对话，增加 2 个玩家抉择分支，并在其中一个分支中透露档案库的密码线索。');
    } else if (presetType === 'search_clues') {
      setPromptInput('请为全网搜索引擎扩充 4 个新的检索关键词（例如：【渡生大醮】、【延盛岛】、【泰永集团】、【失踪档案】），并自动生成对应的 4 篇新闻与档案页面内容。');
    } else if (presetType === 'safe_cipher') {
      setPromptInput('请设计一个绝密的【密码暗号推理关卡】：在论坛帖子的藏头诗或日记日期中隐藏暗号，并在密码锁页面配置正确的验证密码与通关出口。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal" onClick={onClose}>
      <div className="dsh-panel-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`dsh-indicator ${isOnline ? 'online' : 'offline'}`} />
            <strong>DeepSeek Harness (dsh) 本地协同工作台</strong>
            <span className="terminal-badge" style={{ fontSize: 10 }}>Cordis Agent Bridge</span>
          </div>
          <button className="ghost icon-tiny" onClick={onClose}>✕</button>
        </div>

        {/* Endpoint Control Bar */}
        <div className="dsh-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>本地 DSH 端口:</span>
            <input
              className="dsh-port-input"
              value={endpoint}
              onChange={e => handleEndpointChange(e.target.value)}
              placeholder="http://127.0.0.1:3080"
            />
            <button className="ghost icon-tiny" onClick={() => testConnection(endpoint)} disabled={isChecking}>
              {isChecking ? '探测中...' : '测试连接'}
            </button>
            <button className="ghost icon-tiny" onClick={() => window.open(endpoint, '_blank')} title="在独立浏览器标签页打开 DSH 界面">
              在新标签页打开
            </button>
          </div>
          <div className="inspector-tabs" style={{ margin: 0, padding: 2 }}>
            <button className={`tab-btn ${activeTab === 'copilot' ? 'active' : ''}`} onClick={() => setActiveTab('copilot')}>
              AI 剧情协同
            </button>
            <button className={`tab-btn ${activeTab === 'webview' ? 'active' : ''}`} onClick={() => setActiveTab('webview')}>
              DSH 浏览器视图
            </button>
          </div>
        </div>

        {/* Body content */}
        {activeTab === 'copilot' ? (
          <div className="dsh-body-pane">
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)' }}>
                  1. 选择协同构思预设（或自定义需求）：
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  已自动装载当前 {state.nodes?.length || 0} 个页面的完整拓扑上下文
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <button className="ghost icon-tiny" onClick={() => applyPreset('puzzle_chain')}>
                  🧩 完整谜题链生成
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('npc_dialogue')}>
                  💬 NPC 审讯对话扩写
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('search_clues')}>
                  🔍 搜索引擎线索扩充
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('safe_cipher')}>
                  🔐 密码锁暗号链设计
                </button>
              </div>
              <textarea
                className="dsh-textarea"
                rows={3}
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="输入希望 DSH Agent 扩写或生成的剧情目标，例如：为【林警官】增加 3 轮关于城西仓库的暗访对话，并输出 ARG CLI 脚本..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="secondary icon-tiny" onClick={handleCopyPrompt}>
                  {copiedTip ? '✓ 已复制完整 Prompt 上下文到剪贴板！' : '📋 一键复制完整蓝图上下文 Prompt 发给 DSH'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-main)' }}>
                  2. 接收并执行 DSH Agent 生成的 Bash CLI 脚本：
                </span>
                <button className="ghost icon-tiny" onClick={() => setGeneratedScript('')}>清空</button>
              </div>
              <textarea
                className="dsh-textarea"
                rows={6}
                value={generatedScript}
                onChange={e => setGeneratedScript(e.target.value)}
                placeholder={`# 在此粘贴 DSH 输出的代码块，或直接输入指令，例如：\ntouch hospital -t Browse -n "废弃医院病历档案"\nln desktop hospital -p "病历记录.doc"\nrule search "病历" hospital`}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: isOnline ? '#166534' : 'var(--text-muted)' }}>
                  {statusMessage}
                </span>
                <button className="primary" onClick={handleApplyScript}>
                  ⚡ 立即执行并在画布上生成页面
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="dsh-webview-container">
            <iframe
              ref={iframeRef}
              src={endpoint}
              className="dsh-iframe"
              title="DeepSeek Harness Local Webview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
