import { describe, it, expect } from 'vitest';
import { VERSION } from '../../src/version.js';
import { validateHubRequest } from '../../src/router.js';

describe('router and middleware contract', () => {
  it('VERSION is defined', () => {
    expect(VERSION).toBe('1.0.0');
  });

  it('validateHubRequest is exported', () => {
    expect(typeof validateHubRequest).toBe('function');
  });

  it('validateHubRequest rejects null in prod mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = validateHubRequest(null);
    process.env.NODE_ENV = originalEnv;
    expect(typeof result).toBe('string');
  });
});
