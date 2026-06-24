import { describe, it, expect } from 'vitest';
import { SELF, env } from 'cloudflare:test';

const PSK = 'test-psk-123';

describe('Durable Object Integration', () => {
  it('can create a brain dump and trigger DO orchestration', async () => {
    const payload = {
      projectName: 'DO Test Project',
      coreProblem: 'Test DO orchestration',
      currentState: { artifacts: [], gaps: [], blockers: [] },
      constraints: [],
      knownAssets: [],
      openQuestions: [],
      desiredEndState: {
        description: 'Test',
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

    const response = await SELF.fetch('https://jitterbug-api/brain-dump', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PSK}`,
      },
      body: JSON.stringify(payload),
    });

    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.id).toBeDefined();

    // Wait for DO to process (alarm fires after 1 second)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check that the record was updated
    const statusResponse = await SELF.fetch(`https://jitterbug-api/brain-dump/${data.id}/status`, {
      headers: { Authorization: `Bearer ${PSK}` },
    });
    expect(statusResponse.status).toBe(200);
    const statusData = await statusResponse.json();
    expect(statusData.status).toBeDefined();
  });
});
