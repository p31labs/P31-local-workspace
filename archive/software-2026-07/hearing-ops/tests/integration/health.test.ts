import { describe, it, expect } from 'vitest';
import { healthCheck, VERSION, getVersion } from '../src/health';

describe('hearing-ops health', () => {
  it('VERSION is defined', () => {
    expect(VERSION).toBe('0.0.1');
  });

  it('getVersion returns VERSION', () => {
    expect(getVersion()).toBe(VERSION);
  });

  it('healthCheck returns ok', () => {
    const result = healthCheck();
    expect(result.status).toBe('ok');
    expect(result.version).toBe(VERSION);
  });

  it('healthCheck includes endpoint', () => {
    const result = healthCheck();
    expect(result.endpoint).toBe('/health');
  });

  it('healthCheck includes valid timestamp', () => {
    const result = healthCheck();
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp!).getTime()).not.toBeNaN();
  });
});
