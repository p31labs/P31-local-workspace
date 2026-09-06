import { describe, it, expect } from 'vitest';
import { VERSION, getVersion, healthCheck } from './health';

describe('health', () => {
  it('exports VERSION', () => {
    expect(VERSION).toBe('0.0.1');
  });
  it('getVersion returns VERSION', () => {
    expect(getVersion()).toBe(VERSION);
  });
  it('healthCheck returns ok status', () => {
    const result = healthCheck();
    expect(result.status).toBe('ok');
    expect(result.version).toBe(VERSION);
  });
  it('healthCheck includes endpoint /health', () => {
    const result = healthCheck();
    expect(result.endpoint).toBe('/health');
  });
});
