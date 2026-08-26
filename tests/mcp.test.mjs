import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/server';
import { createBridgeServer, BRIDGE_HOST } from '../plugins/dsh-arg-plugin/bridge-server.js';
import { getBlueprintState, setBlueprintState } from '../plugins/dsh-arg-plugin/index.js';

function createMcpClient(bridgeUrl) {
  const child = spawn(process.execPath, ['plugins/dsh-arg-plugin/mcp-server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, ARG_BLUEPRINT_BRIDGE_URL: bridgeUrl },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  let buffer = '';
  const pending = new Map();

  child.stdout.on('data', chunk => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      const resolve = pending.get(message.id);
      if (resolve) {
        pending.delete(message.id);
        resolve(message);
      }
    }
  });

  const request = (id, method, params) => new Promise((resolve, reject) => {
    pending.set(id, resolve);
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    child.once('error', reject);
  });

  return {
    child,
    request,
    notify(method, params) {
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params })}\n`);
    },
    async close() {
      child.kill();
      await new Promise(resolve => child.once('exit', resolve));
    }
  };
}

test('MCP Server 发现五个工具，并经 Bridge 修改共享蓝图', async (t) => {
  const bridge = createBridgeServer(0);
  await new Promise(resolve => bridge.listen(0, BRIDGE_HOST, resolve));
  t.after(() => bridge.close());
  const { port } = bridge.address();

  setBlueprintState({
    title: 'MCP 集成测试',
    startId: 'desktop',
    nodes: [{ id: 'desktop', name: '桌面', type: 'Desktop', x: 0, y: 0, isStart: true }],
    edges: []
  });

  const client = createMcpClient(`http://${BRIDGE_HOST}:${port}`);
  t.after(() => client.close());

  const initialize = await client.request(1, 'initialize', {
    protocolVersion: LATEST_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'arg-blueprint-test', version: '1.0.0' }
  });
  assert.equal(initialize.result.serverInfo.name, 'arg-blueprint');
  client.notify('notifications/initialized');

  const toolList = await client.request(2, 'tools/list', {});
  const toolNames = toolList.result.tools.map(tool => tool.name);
  assert.deepEqual(toolNames.sort(), ['arg_exec', 'arg_get_blueprint', 'arg_get_presets', 'arg_query', 'arg_validate']);

  const execution = await client.request(3, 'tools/call', {
    name: 'arg_get_blueprint',
    arguments: { focus: '运行态验收' }
  });
  assert.equal(execution.result.isError, false);
  assert.match(execution.result.content[0].text, /runtimeQualityGate/);
  assert.match(execution.result.content[0].text, /干净进度/);

  const mutation = await client.request(4, 'tools/call', {
    name: 'arg_exec',
    arguments: { script: 'touch archive -t Browse -n "MCP 档案室"\nln desktop archive -p "档案室"' }
  });
  assert.equal(mutation.result.isError, false);
  assert.equal(getBlueprintState().nodes.some(node => node.id === 'archive'), true);
  assert.equal(getBlueprintState().edges.length, 1);
});
