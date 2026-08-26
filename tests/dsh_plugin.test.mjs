import assert from 'node:assert/strict';
import test from 'node:test';
import {
  arg_exec,
  arg_query,
  arg_validate,
  arg_get_blueprint,
  setBlueprintState,
  getBlueprintState
} from '../plugins/dsh-arg-plugin/index.js';
import { getQiyuebanDemoProject } from '../src/demo-project.js';

test('DSH 插件工具 arg_get_blueprint 能够提取完整蓝图上下文', async () => {
  setBlueprintState(getQiyuebanDemoProject());
  const res = await arg_get_blueprint({ focus: '测试扩写' });

  assert.equal(res.success, true);
  assert.ok(res.context.includes('项目名称：灵异论坛调查模仿'));
  assert.equal(res.nodesCount, 20);
});

test('DSH 插件工具 arg_exec 能够通过 ARG 命令动态扩充画布', async () => {
  const customState = {
    title: 'DSH 联动测试',
    nodes: [
      { id: 'desktop', name: '桌面', type: 'Desktop', x: 0, y: 0, isStart: true }
    ],
    edges: [],
    startId: 'desktop'
  };
  setBlueprintState(customState);

  const script = `
touch hospital -t Browse -n "废弃医院病历"
ln desktop hospital -p "病历.doc"
touch chat_police -t Chat -n "刑警对话"
contact chat_police "林警官" --bio "重案组"
msg chat_police "林警官" npc "水青，医院现场提取出了重要加密线索。"
choice chat_police "林警官" "询问详情" hospital --reply "你看看这份病历。"
`;

  const res = await arg_exec({ script });
  assert.equal(res.success, true);
  assert.ok(res.output.includes('[OK] 已创建页面节点: hospital'));
  assert.ok(res.output.includes('[OK] 已创建页面节点: chat_police'));
  assert.equal(getBlueprintState().nodes.length, 3);
  assert.equal(getBlueprintState().edges.length, 2);
});

test('DSH 插件工具 arg_query 支持只读指令查询 (ls -l / cat / stat)', async () => {
  const resLs = await arg_query({ command: 'ls -l' });
  assert.equal(resLs.success, true);
  assert.ok(resLs.output.includes('desktop'));
  assert.ok(resLs.output.includes('hospital'));

  const resCat = await arg_query({ command: 'cat hospital' });
  assert.equal(resCat.success, true);
  assert.ok(resCat.output.includes('废弃医院病历'));
});

test('DSH 插件工具 arg_validate 能够执行自检并返回诊断报告', async () => {
  const res = await arg_validate();
  assert.equal(res.success, true);
  assert.ok(typeof res.healthy === 'boolean');
  assert.ok(res.issues.length >= 0);
});
