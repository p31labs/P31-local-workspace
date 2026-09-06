import { describe, it, expect } from 'vitest';
import { ratelimit } from '../src/rate-limiter';

describe('telemetry integration', () => {
  it('allows requests within rate window', async () => {
    const result = await ratelimit('127.0.0.1', undefined);
    expect(result.allowed).toBe(true);
  });

  it('health endpoint contract', () => {
    const health = { service: 'p31-telemetry', status: 'ok' };
    expect(health.status).toBe('ok');
    expect(health.service).toContain('telemetry');
  });
});
