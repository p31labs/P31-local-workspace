import { describe, it, expect, vi } from 'vitest';
import { K4LLMVerifier } from '../../../brain-dump-orchestrator/dist/recursive/k4-verifier.js';

describe('K4LLMVerifier timeout', () => {
  it('times out after 30 seconds and returns failed edges', async () => {
    const verifier = new K4LLMVerifier();
    const mockAxis = {
      id: 'test',
      focusArea: 'Test',
      deliverable: [],
      convergenceGate: { overallCriteria: 'Pass' },
    };

    // Mock a slow runner that takes 40 seconds
    const slowRunner = {
      run: () => new Promise((resolve) => setTimeout(resolve, 40000)),
    };

    // Access private runner via any cast
    const verifierAny = verifier as any;
    const originalRunner = verifierAny['runner'];
    verifierAny['runner'] = slowRunner;

    const result = await verifier.verify('critic', 'content', mockAxis, ['factuality']);

    // Restore
    verifierAny['runner'] = originalRunner;

    expect(result.overall).toBe(false);
    expect(result.edges.length).toBeGreaterThan(0);
    expect(result.edges[0].error).toBeDefined();
    expect(result.latencyMs).toBeLessThan(31000);
  });
});
