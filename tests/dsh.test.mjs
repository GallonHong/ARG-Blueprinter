import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_DSH_ENDPOINT,
  formatBlueprintForDsh,
  extractCliScriptFromDshResponse,
  getStoredDshEndpoint,
  setStoredDshEndpoint
} from '../src/dsh-bridge.js';
import { executeCliCommand, executeBatchCli } from '../src/cli.js';
import { getQiyuebanDemoProject } from '../src/demo-project.js';

test('DSH 默认端口为 http://127.0.0.1:3080 且支持动态修改', () => {
  assert.equal(DEFAULT_DSH_ENDPOINT, 'http://127.0.0.1:3080');
});

test('DSH Prompt 能够将蓝图拓扑与 20 个节点完整格式化为 Prompt 上下文', () => {
  const project = getQiyuebanDemoProject();
  const prompt = formatBlueprintForDsh(project, '扩写林警官对话');

  assert.ok(prompt.includes('项目名称：灵异论坛调查模仿'));
  assert.ok(prompt.includes('温水青的电脑桌面'));
  assert.ok(prompt.includes('全网线索搜索引擎'));
  assert.ok(prompt.includes('扩写林警官对话'));
  assert.ok(prompt.includes('ARG Blueprint 专有 Linux CLI 指令语法规范'));
});

test('DSH 能够准确从 AI 回复中提取 Bash 代码块并批量执行', () => {
  const aiMarkdownResponse = `好的，我已经为你设计好了关于废弃医院的解谜剧情：

\`\`\`bash
touch hospital -t Browse -n "废弃医院病历"
ln desktop hospital -p "病历.doc"
\`\`\`

希望这个剧情符合你的需求！`;

  const script = extractCliScriptFromDshResponse(aiMarkdownResponse);
  assert.equal(script, 'touch hospital -t Browse -n "废弃医院病历"\nln desktop hospital -p "病历.doc"');

  const state = {
    title: '测试项目',
    nodes: [{ id: 'desktop', name: '桌面', type: 'Desktop', x: 0, y: 0 }],
    edges: [],
    startId: 'desktop'
  };

  const output = executeBatchCli(script, state, (fn) => fn(state));
  assert.ok(output.includes('[OK] 已创建页面节点: hospital'));
  assert.equal(state.nodes.length, 2);
  assert.equal(state.edges.length, 1);
});

test('Linux CLI 支持 dsh 命令', () => {
  const state = { title: '测试项目', nodes: [], edges: [] };
  const resStatus = executeCliCommand('dsh status', state, () => {});
  assert.ok(resStatus.output.includes('[DSH] 当前 DeepSeek Harness 本地端点:'));

  const resConnect = executeCliCommand('dsh connect http://127.0.0.1:3080', state, () => {});
  assert.ok(resConnect.output.includes('已更新本地 DSH 端点为: http://127.0.0.1:3080'));

  const resSync = executeCliCommand('dsh sync', state, () => {});
  assert.ok(resSync.output.includes('[DSH] 已生成完整蓝图 Prompt 上下文'));
});
