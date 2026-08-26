import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStoryGraph } from '../src/validator.js';
import { getQiyuebanDemoProject } from '../src/demo-project.js';

test('自检器能够准确检测出孤岛节点与死胡同页面', () => {
  const invalidState = {
    startId: 'node_start',
    nodes: [
      { id: 'node_start', name: '起始页', type: 'Desktop' },
      { id: 'node_case', name: '案发现场', type: 'Browse' }, // 死胡同（无出口）
      { id: 'node_orphan', name: '孤立密室', type: 'Browse' }, // 孤岛节点（无法到达）
      { id: 'node_end_bad', name: '结局二', type: 'Ending' } // 断路结局
    ],
    edges: [
      { from: 'node_start', to: 'node_case', port: '去案发现场' }
    ]
  };

  const result = validateStoryGraph(invalidState);
  assert.equal(result.healthy, false);
  assert.ok(result.issues.some(i => i.code === 'DEAD_END_NODE' && i.nodeId === 'node_case'));
  assert.ok(result.issues.some(i => i.code === 'UNREACHABLE_NODE' && i.nodeId === 'node_orphan'));
  assert.ok(result.issues.some(i => i.code === 'UNREACHABLE_ENDING' && i.nodeId === 'node_end_bad'));
});

test('自检器能够校验搜索规则与聊天选项的损坏目标', () => {
  const brokenState = {
    startId: 'node_search',
    nodes: [
      {
        id: 'node_search',
        name: '搜索系统',
        type: 'Search',
        rules: [{ keyword: '线索', target: 'non_existent_node' }]
      }
    ],
    edges: []
  };

  const result = validateStoryGraph(brokenState);
  assert.equal(result.healthy, false);
  assert.ok(result.issues.some(i => i.code === 'BROKEN_RULE_TARGET'));
});

test('完整官方范例《灵异论坛调查模仿》20个节点通过全量自检 (100% 健康)', () => {
  const project = getQiyuebanDemoProject();
  const result = validateStoryGraph(project);

  assert.equal(result.healthy, true, `自检未通过: ${JSON.stringify(result.issues)}`);
  assert.equal(result.reachableCount, 20);
  assert.equal(result.endingCount, 5);
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
});
