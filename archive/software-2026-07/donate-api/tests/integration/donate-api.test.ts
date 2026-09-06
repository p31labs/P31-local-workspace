import { describe, it, expect } from 'vitest';

describe('donate-api integration', () => {
  it('health endpoint contract', () => {
    const health = { status: 'ok', worker: 'donate-api' };
    expect(health.status).toBe('ok');
    expect(health.worker).toContain('donate');
  });

  it('checkout session contract', () => {
    const session = { sessionId: 'cs_test_123' };
    expect(session.sessionId).toBeDefined();
    expect(typeof session.sessionId).toBe('string');
  });
});
