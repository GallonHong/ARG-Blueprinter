/**
 * Lightweight HTTP/REST Bridge Server for DeepSeek Harness
 * Enables external DSH CLI / Agent processes to communicate with ARG Blueprint via HTTP (port 3088).
 */

import http from 'node:http';
import {
  arg_exec,
  arg_query,
  arg_validate,
  arg_get_blueprint,
  arg_get_presets,
  getBlueprintState,
  setBlueprintState,
  onBlueprintChange
} from './index.js';

export const BRIDGE_PORT = 3088;

export function createBridgeServer(port = BRIDGE_PORT) {
  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data, null, 2));
    };

    const readBody = () => new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          reject(new Error('Invalid JSON payload'));
        }
      });
      req.on('error', reject);
    });

    try {
      if (url.pathname === '/health' || url.pathname === '/') {
        sendJson(200, {
          status: 'ok',
          service: 'ARG Blueprint DSH Bridge Server',
          version: '1.0.0',
          dshPort: 3080,
          bridgePort: port
        });
      } else if (url.pathname === '/api/blueprint' && req.method === 'GET') {
        const focus = url.searchParams.get('focus') || '';
        const data = await arg_get_blueprint({ focus });
        sendJson(200, data);
      } else if (url.pathname === '/api/events' && req.method === 'GET') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        res.write(`data: ${JSON.stringify({ type: 'INIT', state: getBlueprintState() })}\n\n`);

        const unsubscribe = onBlueprintChange((newState) => {
          try {
            res.write(`data: ${JSON.stringify({ type: 'STATE_CHANGED', state: newState })}\n\n`);
          } catch (e) {}
        });

        req.on('close', () => {
          unsubscribe();
        });
        return;
      } else if (url.pathname === '/api/state' && req.method === 'GET') {
        sendJson(200, { success: true, state: getBlueprintState() });
      } else if (url.pathname === '/api/state' && req.method === 'POST') {
        const body = await readBody();
        if (body.state) setBlueprintState(body.state);
        sendJson(200, { success: true, message: 'State updated successfully' });
      } else if (url.pathname === '/api/exec' && req.method === 'POST') {
        const body = await readBody();
        const data = await arg_exec({ script: body.script });
        sendJson(200, data);
      } else if (url.pathname === '/api/query' && req.method === 'POST') {
        const body = await readBody();
        const data = await arg_query({ command: body.command });
        sendJson(200, data);
      } else if (url.pathname === '/api/validate' && req.method === 'GET') {
        const data = await arg_validate();
        sendJson(200, data);
      } else if (url.pathname === '/api/presets' && req.method === 'GET') {
        const type = url.searchParams.get('type') || '';
        const data = await arg_get_presets({ type });
        sendJson(200, data);
      } else {
        sendJson(404, { error: `Endpoint not found: ${url.pathname}` });
      }
    } catch (err) {
      sendJson(500, { error: err.message });
    }
  });

  return server;
}

// Start standalone server if executed directly
if (process.argv[1] && process.argv[1].endsWith('bridge-server.js')) {
  const srv = createBridgeServer(BRIDGE_PORT);
  srv.listen(BRIDGE_PORT, () => {
    console.log(`[DSH Bridge Server] Listening on http://127.0.0.1:${BRIDGE_PORT}`);
    console.log(`[DSH Bridge Server] Ready to receive commands from DeepSeek Harness.`);
  });
}
