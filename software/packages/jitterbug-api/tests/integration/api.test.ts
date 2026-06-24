import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

const PSK = 'test-psk-123';

const validBrainDumpPayload = {
  projectName: 'Test Project',
  coreProblem: 'Test problem',
  currentState: { artifacts: [], gaps: [], blockers: [] },
  constraints: [],
  knownAssets: [],
  openQuestions: [],
  desiredEndState: {
    description: 'Test end state',
    targetStage: 'fruit',
    measurableCriteria: [],
    convergenceTarget: 'Test',
  },
  metadata: {
    capturedAt: '2026-01-01T00:00:00Z',
    operator: 'test',
    source: 'api',
    tags: [],
  },
};

describe('API Integration', () => {
  it('GET /health returns 200 OK', async () => {
    const response = await SELF.fetch('https://jitterbug-api/health', {
      headers: { Authorization: `Bearer ${PSK}` },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  it('POST /brain-dump without auth returns 401', async () => {
    const response = await SELF.fetch('https://jitterbug-api/brain-dump', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBrainDumpPayload),
    });
    expect(response.status).toBe(401);
  });

  it('POST /brain-dump with valid payload returns 202 and ID', async () => {
    const response = await SELF.fetch('https://jitterbug-api/brain-dump', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PSK}`,
      },
      body: JSON.stringify(validBrainDumpPayload),
    });
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('POST /brain-dump with invalid schema returns 400', async () => {
    const response = await SELF.fetch('https://jitterbug-api/brain-dump', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PSK}`,
      },
      body: JSON.stringify({ projectName: 'Only project name' }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('GET /brain-dump/:id returns 404 for missing record', async () => {
    const response = await SELF.fetch('https://jitterbug-api/brain-dump/nonexistent-id', {
      headers: { Authorization: `Bearer ${PSK}` },
    });
    expect(response.status).toBe(404);
  });
});
