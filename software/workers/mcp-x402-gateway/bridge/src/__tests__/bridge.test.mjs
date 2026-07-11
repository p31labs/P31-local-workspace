import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BACKENDS } from '../backends.mjs';
import { BridgeRouter } from '../router.mjs';

let router;

test.before(async () => {
  router = new BridgeRouter(BACKENDS);
  await router.start();
});

test.after(() => {
  router?.stop();
});

test('probe brings up the 3 streaming backends (oasis/registry/love)', () => {
  const healthy = router.backends.filter((b) => b.healthy).map((b) => b.id);
  assert.ok(healthy.includes('oasis'));
  assert.ok(healthy.includes('registry'));
  assert.ok(healthy.includes('love'));
});

test('unified catalog aggregates >=19 tools from healthy backends', () => {
  assert.ok(router.catalog.length >= 19, `got ${router.catalog.length} tools`);
});

test('route table maps tool names to backends', () => {
  assert.ok(router.routeTable.has('oasis_status'), 'oasis_status should be routable');
});

test('initialize returns MCP capabilities', async () => {
  const r = await router.handle({ jsonrpc: '2.0', id: 2, method: 'initialize', params: {} });
  assert.ok(r.result.capabilities);
  assert.equal(r.result.serverInfo.name, 'p31-mcp-x402-bridge');
});

test('tools/list returns the unified catalog', async () => {
  const r = await router.handle({ jsonrpc: '2.0', id: 3, method: 'tools/list', params: {} });
  assert.ok(Array.isArray(r.result.tools));
  assert.ok(r.result.tools.length >= 19);
});

test('tools/call routes to the backend and returns a result', async () => {
  const r = await router.handle({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'oasis_status', arguments: {} } });
  assert.ok(r.result, 'expected a result from oasis_status');
});

test('unknown tool returns -32601', async () => {
  const r = await router.handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'does_not_exist', arguments: {} } });
  assert.equal(r.error.code, -32601);
});
