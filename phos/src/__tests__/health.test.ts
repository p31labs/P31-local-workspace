import { describe, it, expect } from 'vitest';
import { healthCheck } from '../src/lib/health';

describe('phos health', () => {
  it('returns ok status', () => {
    const result = healthCheck();
    expect(result.status).toBe('ok');
    expect(result.endpoint).toBe('/health');
  });

  it('includes version', () => {
    const result = healthCheck();
    expect(result.version).toBe('0.1.0');
  });

  it('includes valid ISO timestamp', () => {
    const result = healthCheck();
    expect(new Date(result.timestamp!).toISOString()).toBe(result.timestamp);
  });
});
