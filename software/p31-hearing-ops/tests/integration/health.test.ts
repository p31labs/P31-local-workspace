import { describe, it, expect } from 'vitest';
import { healthCheck, VERSION, getVersion } from '../../src/health';

describe('hearing-ops integration', () => {
  it('health module works', () => {
    expect(VERSION).toBe('0.0.1');
    expect(getVersion()).toBe(VERSION);
    const result = healthCheck();
    expect(result.status).toBe('ok');
    expect(result.endpoint).toBe('/health');
  });
});
