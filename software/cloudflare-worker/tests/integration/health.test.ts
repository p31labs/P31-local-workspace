import { describe, it, expect } from 'vitest';
import { healthHandler, buildHealthResponse } from '../src/health.ts';
import { VERSION } from '../src/version.ts';

describe('orchestrator integration', () => {
  it('VERSION is defined', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  it('buildHealthResponse returns correct shape', () => {
    const health = buildHealthResponse('p31-orchestrator');
    expect(health.service).toBe('p31-orchestrator');
    expect(health.status).toBe('ok');
    expect(health.version).toBe(VERSION);
  });

  it('healthHandler returns 200 for GET /health', async () => {
    const request = new Request('https://example.com/health', {
      method: 'GET',
    });
    const response = healthHandler(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.service).toContain('orchestrator');
  });

  it('healthHandler returns 405 for non-GET', async () => {
    const request = new Request('https://example.com/health', {
      method: 'POST',
    });
    const response = healthHandler(request);
    expect(response.status).toBe(405);
  });
});
