import { describe, it, expect } from 'vitest';
import { classifyAxis } from '../../../brain-dump-orchestrator/src/recursive/classify.js';
import type { Axis } from '../../../brain-dump-orchestrator/src/types/axis.js';

function makeAxis(overrides: Partial<Axis> = {}): Axis {
  return {
    id: 'test-axis',
    letter: 'T',
    name: 'Test',
    focusArea: 'Test focus',
    agentRole: 'Tester',
    deliverable: [],
    convergenceGate: { checks: [], overallCriteria: 'All checks pass' },
    complexity: 'low',
    dependencies: [],
    status: 'pending',
    ...overrides,
  };
}

describe('classifyAxis', () => {
  const defaultConfig = {
    maxDepth: 3,
    branchingFactor: 3,
    batchStrategy: 'depth-first' as const,
    atomicThreshold: 1,
  };

  it('returns atomic when maxDepth reached', () => {
    const axis = makeAxis();
    const result = classifyAxis(axis, defaultConfig, 3);
    expect(result).toBe('atomic');
  });

  it('returns atomic when maxDepth exceeded', () => {
    const axis = makeAxis();
    const result = classifyAxis(axis, { ...defaultConfig, maxDepth: 2 }, 5);
    expect(result).toBe('atomic');
  });

  it('returns composite for high complexity axis', () => {
    const axis = makeAxis({ complexity: 'high' });
    const result = classifyAxis(axis, defaultConfig, 0);
    expect(result).toBe('composite');
  });

  it('returns composite when convergence gate checks exceed threshold', () => {
    const axis = makeAxis({
      convergenceGate: {
        checks: Array.from({ length: 5 }, (_, i) => ({ id: `gate-${i}`, description: `Check ${i}` })),
        overallCriteria: 'All checks pass',
      },
    });
    const result = classifyAxis(axis, { ...defaultConfig, atomicThreshold: 3 }, 0);
    expect(result).toBe('composite');
  });

  it('returns composite when deliverables exceed threshold', () => {
    const axis = makeAxis({
      deliverable: Array.from({ length: 5 }, (_, i) => ({
        id: `del-${i}`,
        filePath: `docs/test-${i}.md`,
        description: `Deliverable ${i}`,
        acceptanceCriteria: [`Criteria ${i}`],
      })),
    });
    const result = classifyAxis(axis, { ...defaultConfig, atomicThreshold: 2 }, 0);
    expect(result).toBe('composite');
  });

  it('returns atomic for simple low-complexity axis', () => {
    const axis = makeAxis({
      complexity: 'low',
      convergenceGate: { checks: [{ id: 'g1', description: 'One check' }], overallCriteria: 'Pass' },
      deliverable: [{ id: 'd1', filePath: 'docs/test.md', description: 'One deliverable', acceptanceCriteria: ['Done'] }],
    });
    const result = classifyAxis(axis, { ...defaultConfig, atomicThreshold: 3 }, 0);
    expect(result).toBe('atomic');
  });
});
