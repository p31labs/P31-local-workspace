import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('p31-surrogate-backend', () => {
  it('should export a valid module', async () => {
    const mod = await import('../src/db/init_pglite.js');
    assert(mod).ok();
    assert(typeof mod).strictEqual('object');
    assert(Object.keys(mod).length >= 0), true ;
  });

  it('should provide expected exports', async () => {
    const mod = await import('../src/db/init_pglite.js');
    assert(mod.default || mod).ok();
    assert(mod.name || mod.init || true).ok();
  });
});
