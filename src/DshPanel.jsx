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

const DEFAULT_COPILOT_PROMPT = '请作为 ARG 剧情副驾驶，基于现有蓝图设定，为我构思 2~3 个不同风格（如现实社会派揭黑、民俗怪谈、黑客反转）的后续剧情走向方案。请深入分析各方案的悬念亮点与玩家情感共鸣，由我做最终决断，并附带可落地的 ARG CLI 脚本。';

export function DshPanel({ state, update, isOpen, onClose }) {
  const [endpoint, setEndpoint] = useState(getStoredDshEndpoint());
  const [isOnline, setIsOnline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot' | 'webview'
  const [promptInput, setPromptInput] = useState(DEFAULT_COPILOT_PROMPT);
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
      if (!promptInput) {
        setPromptInput(DEFAULT_COPILOT_PROMPT);
      }
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
    if (presetType === 'story_brainstorm') {
      setPromptInput('请作为 ARG 剧情副驾驶，基于现有蓝图设定，为我构思 2~3 个不同风格（如现实社会派揭黑、民俗怪谈、黑客反转）的后续剧情走向方案。请深入分析各方案的悬念亮点与玩家情感共鸣，由我做最终决断，并附带可落地的 ARG CLI 脚本。');
    } else if (presetType === 'drive_check') {
      setPromptInput('请对当前已有页面的【玩家行动驱动力】进行全面自检：检查玩家在每个页面阅读后，是否明确知道下一步去哪？是否存在无指引的“信息死胡同”？并提出线索指引的补强方案与 CLI 脚本。');
    } else if (presetType === 'puzzle_mechanics') {
      setPromptInput('请为当前剧情设计 2 组精巧的【ARG 解密机制】：包括关键词反向检索、密码暗号（拼音缩写/藏头诗）、证言矛盾戳破以及事件线索依赖（requires 前置门槛），并输出完整的 Bash CLI 脚本。');
    } else if (presetType === 'template_ui') {
      setPromptInput('请根据当前故事氛围，为我推荐最适合的【功能页面类型与 UI 主题预设】（如 SCP绝密卷宗、遇害者手写日记、黑客数据流、复古BBS、BIOS开机、案件裁决书等），并给出对应的 touch 与 set 指令。');
    } else if (presetType === 'npc_dialogue') {
      setPromptInput('请为核心 NPC 扩写 3 轮富有张力的调查对话，增加 2 个玩家关键抉择分支，配置 requires 线索前置依赖与结局跳转，并输出 CLI 脚本。');
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
                <button className="ghost icon-tiny" onClick={() => applyPreset('story_brainstorm')} title="提供 2~3 个不同风格剧情走向由您决断">
                  💡 剧情头脑风暴 (用户决断)
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('drive_check')} title="检查每个节点是否有明确的玩家下一步行动指引与抓手">
                  🔍 玩家驱动力与卡关检查
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('puzzle_mechanics')} title="设计关键词检索、密码暗号、证言矛盾与线索前置门槛">
                  🧩 解密机制与暗号设计
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('template_ui')} title="推荐最契合故事氛围的页面功能与 UI 主题预设">
                  🎨 功能模板与 UI 选型
                </button>
                <button className="ghost icon-tiny" onClick={() => applyPreset('npc_dialogue')} title="扩写核心人物对话与选项">
                  💬 NPC 对话与线索依赖
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
