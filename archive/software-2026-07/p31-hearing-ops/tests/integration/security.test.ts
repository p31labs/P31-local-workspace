import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateHealthRequest } from '../../src/security';

describe('security', () => {
  it('sanitizeInput strips control characters', () => {
    expect(sanitizeInput('hello\x00\x1fworld', 20)).toBe('helloworld');
  });

  it('sanitizeInput handles non-strings', () => {
    expect(sanitizeInput(12345)).toBe('');
  });

  it('validateHealthRequest allows /health path', () => {
    const req = new Request('https://test/health');
    expect(validateHealthRequest(req)).toBe(true);
  });

  it('validateHealthRequest blocks unknown paths', () => {
    const req = new Request('https://test/unknown');
    expect(validateHealthRequest(req)).toBe(false);
  });
});
