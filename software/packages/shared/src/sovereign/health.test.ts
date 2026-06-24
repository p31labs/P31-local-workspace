import { describe, it, expect } from 'vitest';
import { createHealthResponse } from './health';

describe('createHealthResponse', () => {
  const VERSION = '1.0.0';

  it('returns ok status with no dependencies', () => {
    const result = createHealthResponse(VERSION);
    expect(result.status).toBe('ok');
    expect(result.version).toBe(VERSION);
    expect(result.timestamp).toBeDefined();
    expect(result.dependencies).toEqual({});
    expect(result.uptime).toBeUndefined();
  });

  it('includes uptime when startTime provided', () => {
    const startTime = Date.now() - 5000;
    const result = createHealthResponse(VERSION, { startTime });
    expect(result.uptime).toBeGreaterThanOrEqual(4);
  });

  it('reports degraded when a dependency is degraded', () => {
    const result = createHealthResponse(VERSION, {
      dependencies: {
        primary: { status: 'ok' },
        secondary: { status: 'degraded', message: 'high latency' },
      },
    });
    expect(result.status).toBe('degraded');
  });

  it('reports down when a dependency is down', () => {
    const result = createHealthResponse(VERSION, {
      dependencies: {
        primary: { status: 'ok' },
        db: { status: 'down', message: 'connection refused' },
      },
    });
    expect(result.status).toBe('down');
  });

  it('includes custom checks when provided', () => {
    const result = createHealthResponse(VERSION, {
      checks: {
        pqc: { status: 'pass' },
        d1: { status: 'pass', metric: 12 },
      },
    });
    expect(result.checks).toBeDefined();
    expect(result.checks!.pqc.status).toBe('pass');
    expect(result.checks!.d1.metric).toBe(12);
  });

  it('returns ok with all dependencies healthy', () => {
    const result = createHealthResponse(VERSION, {
      dependencies: {
        kv: { status: 'ok' },
        d1: { status: 'ok' },
      },
    });
    expect(result.status).toBe('ok');
  });
});
