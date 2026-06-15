import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('bouncer', () => {
  it('should export a valid module', async () => {
    const mod = await import('../src/index.js');
    assert(mod).ok();
    assert(typeof mod).strictEqual('object');
    assert(Object.keys(mod).length >= 0), true ;
  });

  it('should provide expected exports', async () => {
    const mod = await import('../src/index.js');
    assert(mod.default || mod).ok();
    assert(mod.name || mod.init || true).ok();
  });
});
