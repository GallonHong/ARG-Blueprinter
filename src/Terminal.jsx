import { useState, useRef, useEffect } from 'react';
import { executeCliCommand, executeBatchCli } from './cli.js';

export function Terminal({ state, update, isOpen, onClose }) {
  const [history, setHistory] = useState([
    { type: 'info', text: 'ARG Blueprint Linux Terminal v1.0.0 (x86_64-arg-blueprint)' },
    { type: 'info', text: '输入 "help" 查看所有 Linux 命令，或输入 "ls -l" 查看当前页面节点。' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchScript, setBatchScript] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const rawCmd = inputVal;
      if (!rawCmd.trim()) return;

      const trimmed = rawCmd.trim();
      setCmdHistory(prev => [...prev, trimmed]);
      setHistoryIdx(-1);

      // Execute command
      const res = executeCliCommand(trimmed, state, update);

      if (res.output === '__CLEAR__') {
        setHistory([]);
      } else {
        setHistory(prev => [
          ...prev,
          { type: 'cmd', text: `arg-blueprint:~$ ${rawCmd}` },
          ...(res.error ? [{ type: 'error', text: `❌ ${res.error}` }] : []),
          ...(res.output ? [{ type: 'output', text: res.output }] : [])
        ]);
      }
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!cmdHistory.length) return;
      const nextIdx = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(cmdHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInputVal('');
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(cmdHistory[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      autoComplete();
    }
  };

  const autoComplete = () => {
    const commands = ['touch', 'rm', 'ln', 'unlink', 'set', 'rule', 'rmrule', 'contact', 'msg', 'choice', 'start', 'ls', 'cat', 'stat', 'mv', 'help', 'clear'];
    const parts = inputVal.split(' ');
    if (parts.length === 1) {
      const match = commands.find(c => c.startsWith(parts[0]));
      if (match) setInputVal(match + ' ');
    } else {
      const nodeIds = state.nodes.map(n => n.id);
      const last = parts[parts.length - 1];
      const match = nodeIds.find(id => id.startsWith(last));
      if (match) {
        parts[parts.length - 1] = match;
        setInputVal(parts.join(' ') + ' ');
      }
    }
  };

  const handleRunBatch = () => {
    if (!batchScript.trim()) return;
    const result = executeBatchCli(batchScript, state, update);
    setHistory(prev => [
      ...prev,
      { type: 'cmd', text: `arg-blueprint:~$ [执行多行 Shell 批处理脚本]` },
      { type: 'output', text: result || '[OK] 批处理脚本执行完毕' }
    ]);
    setIsBatchOpen(false);
    setBatchScript('');
  };

  const insertSampleScript = () => {
    const script = `# ==========================================
# 完整悬疑游戏快速构建脚本 (Bash Shell 风格)
# ==========================================
touch desktop -t Desktop -n "🖥️ 调查员电脑桌面" --start
touch chat -t Chat -n "💬 微信聊天软件" --template "微信 UI 风格"
touch search -t Search -n "🔍 全网搜索引擎" --template "经典搜索"
touch login -t Login -n "🔐 机密档案密码锁" --template "后台登录"
touch files -t Files -n "📁 机密卷宗文件夹"
touch doc_case -t Browse -n "📰 新闻：0717 特大案"
touch ending_true -t Ending -n "🎬 结局 · 真相大白"

# 建立桌面图标与路由
ln desktop chat -p "微信.exe" --icon "💬"
ln desktop search -p "全盘搜索.exe" --icon "🔍"
ln desktop login -p "机密文件夹" --icon "🔐"

# 设置密码与搜索规则
set login password="0717"
rule search "0717" doc_case

# 设置聊天对话与分支
contact chat "林警官" --avatar "👮" --bio "刑侦支队"
msg chat "林警官" npc "水青，我们在现场找到了一组加密日记。"
choice chat "林警官" "询问密码" login --reply "密码是【0717】"

# 归档流转
ln login files
ln files ending_true -p "提交结案报告.doc" --icon "📄"
`;
    setBatchScript(script);
  };

  return (
    <div className={`terminal-drawer ${isMaximized ? 'maximized' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-header-title">
          <span className="terminal-icon">❯_</span>
          <strong>Linux 终端控制台 (CLI)</strong>
          <span className="terminal-badge">bash · UTF-8</span>
        </div>
        <div className="terminal-header-actions">
          <button className="term-btn" onClick={() => executeCliCommand('ls -l', state, update).output && setHistory(prev => [...prev, { type: 'cmd', text: 'arg-blueprint:~$ ls -l' }, { type: 'output', text: executeCliCommand('ls -l', state, update).output }])}>
            ls -l
          </button>
          <button className="term-btn" onClick={() => executeCliCommand('help', state, update).output && setHistory(prev => [...prev, { type: 'cmd', text: 'arg-blueprint:~$ help' }, { type: 'output', text: executeCliCommand('help', state, update).output }])}>
            help
          </button>
          <button className="term-btn" onClick={() => setIsBatchOpen(!isBatchOpen)}>
            📜 批量脚本
          </button>
          <button className="term-btn" onClick={() => setHistory([])}>
            clear
          </button>
          <button className="term-btn" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? '还原高度' : '放大全屏'}>
            {isMaximized ? '🗗' : '⛶'}
          </button>
          <button className="term-btn close" onClick={onClose} title="关闭终端 (Ctrl+`)">
            ✕
          </button>
        </div>
      </div>

      {isBatchOpen ? (
        <div className="terminal-batch-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#93c5fd' }}>📝 批量执行 Shell 脚本指令 (支持一键粘贴数十行 touch / ln / set 命令)：</span>
            <button className="term-btn" onClick={insertSampleScript}>
              ⚡ 填入完整示例脚本
            </button>
          </div>
          <textarea
            className="terminal-batch-textarea"
            value={batchScript}
            onChange={e => setBatchScript(e.target.value)}
            placeholder={`# 在此粘贴多行 Linux 指令，例如：\ntouch desktop -t Desktop -n "🖥️ 电脑桌面" --start\ntouch chat -t Chat -n "💬 微信聊天"\nln desktop chat -p "微信.exe" --icon "💬"`}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="term-btn" onClick={() => setIsBatchOpen(false)}>取消</button>
            <button className="term-btn primary" onClick={handleRunBatch}>⚡ 立即执行全部指令</button>
          </div>
        </div>
      ) : (
        <div className="terminal-body" onClick={() => inputRef.current?.focus()}>
          {history.map((item, idx) => (
            <div key={idx} className={`terminal-line ${item.type}`}>
              {item.type === 'cmd' && <span className="term-prompt">❯ </span>}
              <pre className="term-text">{item.text}</pre>
            </div>
          ))}
          <div className="terminal-input-row">
            <span className="term-prompt">arg-blueprint:~$</span>
            <input
              ref={inputRef}
              className="terminal-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              autoFocus
              placeholder="输入 touch / ln / set / rm / ls / help..."
            />
          </div>
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
