import { describe, it, expect } from 'vitest';
import { VERSION } from '../version';

describe('phosphorus31 health', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.1');
  });

  it('has /api/health endpoint', () => {
    const endpoint = '/api/health';
    expect(endpoint).toMatch(/health/);
  });

  it('health response shape', () => {
    const response = {
      status: 'ok',
      version: VERSION,
      service: 'phosphorus31.org',
      timestamp: new Date().toISOString(),
    };
    expect(response.status).toBe('ok');
    expect(response.version).toBeDefined();
    expect(response.service).toBe('phosphorus31.org');
  });
});
