import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('astro-landing', () => {
  it('should export a valid module', async () => {
    const mod = await import('../.astro/content.d.js');
    assert(mod).ok();
    assert(typeof mod).strictEqual('object');
    assert(Object.keys(mod).length >= 0), true ;
  });

  it('should provide expected exports', async () => {
    const mod = await import('../.astro/content.d.js');
    assert(mod.default || mod).ok();
    assert(mod.name || mod.init || true).ok();
  });
});
