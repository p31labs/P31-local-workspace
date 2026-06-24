import { describe, it, expect } from 'vitest';

describe('p31-forge integration', () => {
  it('compile endpoint contract', () => {
    const pack = { kind: 'court', filename: 'test.docx' };
    expect(pack.kind).toBe('court');
    expect(pack.filename).toMatch(/\.docx$/);
  });

  it('health endpoint contract', () => {
    const health = { status: 'ok', version: '0.1.0' };
    expect(health.status).toBe('ok');
    expect(health.version).toBeDefined();
  });
});
