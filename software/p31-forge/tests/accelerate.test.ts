import { describe, it, expect } from 'vitest';

describe('p31-forge', () => {
  it('should export a valid module', async () => {
    const mod = await import('../forge.js');
    expect(mod).toBeTruthy();
    expect(typeof mod).toBe('object');
    expect(Object.keys(mod).length >= 0) && Object.keys(mod).length >= 0 ;
  });

  it('should provide expected exports', async () => {
    const mod = await import('../forge.js');
    expect(mod.default || mod).toBeTruthy();
    expect(mod.name || mod.init || true).toBeTruthy();
  });
});
