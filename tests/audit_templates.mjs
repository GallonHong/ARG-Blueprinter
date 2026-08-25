import assert from 'node:assert/strict';
import test from 'node:test';
import { getQiyuebanDemoProject } from '../src/demo-project.js';
import { buildRouteConfig, pageFileName, generateDesktopIconsHtml, generateLinksHtml, generateNavLinksHtml, generateHotLinksHtml } from '../src/route-config.js';

test('所有七月半官方示例节点的连线与路由映射完整性校验', () => {
  const state = getQiyuebanDemoProject();
  assert.equal(state.startId, 'node_desktop');
  assert.equal(state.nodes.length, 20);

  // Check every node's route config
  state.nodes.forEach(node => {
    const cfg = buildRouteConfig(node, state, { preview: true });
    assert.equal(cfg.preview, true);
    assert.ok(cfg.files);

    // If node has outgoing edges, ensure config.links contains all ports
    const outgoing = state.edges.filter(e => e.from === node.id);
    outgoing.forEach(edge => {
      const port = edge.port || state.nodes.find(n => n.id === edge.to)?.name || edge.to;
      assert.ok(cfg.links[port], `Node ${node.id} missing link for port: ${port}`);
      assert.equal(cfg.links[port], edge.to);
    });

    // Check desktop icon generation
    if (node.type === 'Desktop') {
      const html = generateDesktopIconsHtml(node, state);
      outgoing.forEach(edge => {
        const port = edge.port || state.nodes.find(n => n.id === edge.to)?.name || edge.to;
        assert.ok(html.includes(`data-arg-link="${port}"`), `Desktop HTML missing data-arg-link for port: ${port}`);
      });
    }

    // Check index links generation
    if (node.type === 'Index') {
      const html = generateLinksHtml(node, state);
      outgoing.forEach(edge => {
        const port = edge.port || state.nodes.find(n => n.id === edge.to)?.name || edge.to;
        assert.ok(html.includes(`data-arg-link="${port}"`), `Index HTML missing data-arg-link for port: ${port}`);
      });
    }
  });
});
