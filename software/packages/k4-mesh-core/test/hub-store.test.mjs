import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteHubCompletely,
  dockbackKeyForRef,
  getDockbackList,
  hubManifestKey,
  isValidDockId,
  isValidHubEdge,
  putBinding,
  putManifest,
  upsertDockbackEntry,
} from '../hub-store.js';

/** In-memory KV namespace (Workers KV API shape) for unit tests only. */
class MemoryKvNamespace {
  constructor() {
    this.m = new Map();
  }
  async get(k) {
    return this.m.has(k) ? this.m.get(k) : null;
  }
  async put(k, v) {
    this.m.set(k, v);
  }
  async delete(k) {
    this.m.delete(k);
  }
}

describe('hub-store', () => {
  it('dockbackKeyForRef is stable', () => {
    assert.equal(dockbackKeyForRef('personal:default'), 'idx:dockback:personal:default');
  });

  it('validates docks and edges', () => {
    assert.ok(isValidDockId('a'));
    assert.ok(!isValidDockId('x'));
    assert.ok(isValidHubEdge('a', 'b'));
    assert.ok(!isValidHubEdge('a', 'a'));
  });

  describe('deleteHubCompletely', () => {
    /** @type {MemoryKvNamespace} */
    let kv;
    /** @type {{ K4_HUBS: MemoryKvNamespace }} */
    let env;
    const hubId = '11111111-1111-1111-1111-111111111111';

    beforeEach(() => {
      kv = new MemoryKvNamespace();
      env = { K4_HUBS: kv };
    });

    it('removes manifest, bindings, dockback, registry', async () => {
      await putManifest(env, hubId, { hubId, kind: 'test', title: 't', created: new Date().toISOString(), dockLabels: { a: 'a', b: 'b', c: 'c', d: 'd' }, policyVersion: 1 });
      await putBinding(env, hubId, 'a', {
        personalRef: 'personal:default',
        mode: 'mirror',
        boundAt: new Date().toISOString(),
      });
      await upsertDockbackEntry(env, 'personal:default', {
        hubId,
        dockId: 'a',
        mode: 'mirror',
        boundAt: new Date().toISOString(),
      });

      assert.ok(kv.m.has(hubManifestKey(hubId)));
      assert.ok(kv.m.has('idx:dockback:personal:default'));

      await deleteHubCompletely(env, hubId);

      assert.equal(await kv.get(hubManifestKey(hubId)), null);
      assert.equal(await getDockbackList(env, 'personal:default').then((x) => x.length), 0);
      const reg = JSON.parse(/** @type {string} */ (await kv.get('meta:hubs')));
      assert.ok(!reg.includes(hubId));
    });
  });
});
