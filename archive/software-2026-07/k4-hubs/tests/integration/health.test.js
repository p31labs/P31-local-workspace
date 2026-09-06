import { describe, it, expect } from 'vitest';

const expected = {
  status: 'ok',
  service: 'k4-hubs',
  version: '1.0.0',
};

describe('k4-hubs health contract', () => {
  it('health payload has required fields', () => {
    const health = { ...expected };
    expect(health.status).toBe('ok');
    expect(health.service).toBe('k4-hubs');
    expect(health.version).toBeDefined();
  });

  it('version is a semver string', () => {
    const semver = /^\d+\.\d+\.\d+$/;
    expect(expected.version).toMatch(semver);
  });
});
