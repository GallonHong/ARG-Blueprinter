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
import { arg_get_blueprint, arg_validate } from '../plugins/dsh-arg-plugin/index.js';

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
  assert.ok(prompt.includes('ARG Blueprint 专有命令语法规范'));
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

test('DSH 纯文本 CLI 不会丢失预设、备注、标签与排版指令', () => {
  const script = extractCliScriptFromDshResponse(`
触发如下：
touch desktop -t Desktop -n "调查桌面" --start
preset desktop "调查员暗房"
note desktop "示例起始页"
tag desktop "起始,调查"
layout
`);

  assert.ok(script.includes('preset desktop'));
  assert.ok(script.includes('note desktop'));
  assert.ok(script.includes('tag desktop'));
  assert.ok(script.includes('layout'));

  const state = { title: '测试项目', nodes: [], edges: [], startId: null };
  executeBatchCli(script, state, (fn) => fn(state));
  assert.equal(state.nodes[0].template, '调查员工作台');
  assert.equal(state.nodes[0].note, '示例起始页');
  assert.deepEqual(state.nodes[0].tags, ['起始', '调查']);
});

test('ARG 命令支持 dsh 命令', () => {
  const state = { title: '测试项目', nodes: [], edges: [] };
  const resStatus = executeCliCommand('dsh status', state, () => {});
  assert.ok(resStatus.output.includes('[DSH] 当前 DeepSeek Harness 本地端点:'));

  const resConnect = executeCliCommand('dsh connect http://127.0.0.1:3080', state, () => {});
  assert.ok(resConnect.output.includes('已更新本地 DSH 端点为: http://127.0.0.1:3080'));

  const resSync = executeCliCommand('dsh sync', state, () => {});
  assert.ok(resSync.output.includes('[DSH] 已生成完整蓝图 Prompt 上下文'));
});

test('DSH 插件返回运行态质量门槛，且自检明确标注结构边界', async () => {
  const blueprint = await arg_get_blueprint({ focus: '验证动态事件' });
  assert.equal(blueprint.success, true);
  assert.ok(blueprint.runtimeQualityGate.some(item => item.includes('干净进度')));
  assert.ok(blueprint.runtimeQualityGate.some(item => item.includes('论坛首页')));

  const validation = await arg_validate();
  assert.equal(validation.success, true);
  assert.match(validation.runtimeValidationNote, /仅覆盖画布拓扑/);
});
