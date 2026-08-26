import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import { createBridgeServer, BRIDGE_HOST } from '../plugins/dsh-arg-plugin/bridge-server.js';
import { apply, setBlueprintState } from '../plugins/dsh-arg-plugin/index.js';

function waitForSseEvent(port, expectedType) {
  return new Promise((resolve, reject) => {
    const request = http.get(`http://${BRIDGE_HOST}:${port}/api/events`, response => {
      let buffer = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        buffer += chunk;
        const messages = buffer.split('\n\n');
        buffer = messages.pop();
        for (const message of messages) {
          const line = message.split('\n').find(item => item.startsWith('data: '));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === expectedType) {
            request.destroy();
            resolve(payload);
            return;
          }
        }
      });
    });
    request.on('error', reject);
  });
}

test('DSH Agent 工具通过 3088 Bridge 修改共享状态并广播 SSE', async (t) => {
  const server = createBridgeServer(0);
  await new Promise(resolve => server.listen(0, BRIDGE_HOST, resolve));
  t.after(() => server.close());

  const { port } = server.address();
  const previousBridgeUrl = process.env.ARG_BLUEPRINT_BRIDGE_URL;
  process.env.ARG_BLUEPRINT_BRIDGE_URL = `http://${BRIDGE_HOST}:${port}`;
  t.after(() => {
    if (previousBridgeUrl === undefined) delete process.env.ARG_BLUEPRINT_BRIDGE_URL;
    else process.env.ARG_BLUEPRINT_BRIDGE_URL = previousBridgeUrl;
  });

  setBlueprintState({
    title: '共享状态测试',
    startId: 'desktop',
    nodes: [{ id: 'desktop', name: '桌面', type: 'Desktop', x: 0, y: 0, isStart: true }],
    edges: []
  });

  const registeredTools = new Map();
  apply({ tools: { register: tool => registeredTools.set(tool.name, tool) } });
  const init = await waitForSseEvent(port, 'INIT');
  assert.equal(init.state.nodes.length, 1);

  const stateChanged = waitForSseEvent(port, 'STATE_CHANGED');
  const result = await registeredTools.get('arg_exec').execute({
    script: 'touch archive -t Browse -n "档案室"\nln desktop archive -p "档案室"'
  });
  assert.equal(result.success, true);

  const event = await stateChanged;
  assert.equal(event.state.nodes.some(node => node.id === 'archive'), true);
  assert.equal(event.state.edges.length, 1);
});
