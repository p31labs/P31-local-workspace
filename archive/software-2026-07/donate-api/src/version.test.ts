import { describe, it, expect } from 'vitest';

describe('donate-api version', () => {
  it('has a hardcoded version string', () => {
    const version = '1.2.0';
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
