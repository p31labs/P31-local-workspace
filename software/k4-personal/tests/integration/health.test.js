import { describe, it, expect } from 'vitest';

const health = {
  status: 'ok',
  service: 'k4-personal',
  version: '1.0.0',
};

describe('k4-personal health contract', () => {
  it('health payload has required fields', () => {
    expect(health.status).toBe('ok');
    expect(health.service).toBe('k4-personal');
    expect(health.version).toBeDefined();
  });

  it('version follows semver', () => {
    expect(health.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
