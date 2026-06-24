import { describe, it, expect } from 'vitest';
import { FileSystemAdapter } from '../src/integrations/file-system-adapter.js';
import { GateChecker, ConvergenceReporter } from '../src/convergence/gate-check.js';
import { MaturityScorer, SignalEmitter } from '../src/jitterbug/maturity-scorer.js';
import { createStatusTracker } from '../src/orchestration/status-tracker.js';

describe('FileSystemAdapter', () => {
  it('writes deliverables to disk', async () => {
    const adapter = new FileSystemAdapter();
    const result = await adapter.writeDeliverables(
      { id: 'test', name: 'Test', focusArea: '', agentRole: '', deliverable: [], convergenceGate: { checks: [], overallCriteria: '' }, complexity: 'medium', dependencies: [], status: 'pending' },
      { 'test-output.md': '# Test Output\n\nContent.' }
    );
    expect(result.success).toBe(true);
    expect(result.filesWritten).toContain('test-output.md');
    const content = await adapter.readDeliverable('test-output.md');
    expect(content).toContain('Test Output');
  });

  it('checks file existence', async () => {
    const adapter = new FileSystemAdapter();
    await adapter.writeDeliverables({} as any, { 'exists-check.md': 'data' });
    expect(await adapter.fileExists('exists-check.md')).toBe(true);
    expect(await adapter.fileExists('does-not-exist.md')).toBe(false);
  });
});

describe('GateChecker', () => {
  const checker = new GateChecker();

  it('returns PASS for successful axes', () => {
    const result = checker.checkAll(
      [{ id: 'a1', name: 'A', deliverable: [], convergenceGate: { checks: [{ id: 'g1', description: 'test', type: 'custom' }], overallCriteria: '' }, complexity: 'medium', dependencies: [], status: 'pending' }],
      { batchId: 'b1', startedAt: '', axes: { a1: { success: true, filesWritten: ['a.md'], statusLine: 'ok', startedAt: '' } }, overallStatus: 'completed' }
    );
    expect(result.overall).toBe('PASS');
    expect(result.axes[0].status).toBe('PASS');
  });

  it('returns FAIL with blockers for failed axes', () => {
    const result = checker.checkAll(
      [{ id: 'a1', name: 'A', deliverable: [], convergenceGate: { checks: [{ id: 'g1', description: 'test', type: 'custom' }], overallCriteria: '' }, complexity: 'medium', dependencies: [], status: 'pending' }],
      { batchId: 'b1', startedAt: '', axes: { a1: { success: false, filesWritten: [], statusLine: 'failed', startedAt: '', error: 'timeout' } }, overallStatus: 'failed' }
    );
    expect(result.overall).toBe('FAIL');
    expect(result.blockers.length).toBeGreaterThan(0);
    expect(result.blockers[0].type).toBe('quality');
  });
});

describe('MaturityScorer', () => {
  const scorer = new MaturityScorer();

  it('scores test files with high TEST dimension', () => {
    const dims = scorer.scoreDeliverable({ filePath: 'eigentrust.test.ts', description: 'Trust tests' });
    const testDim = dims.find(d => d.dimension === 'TEST');
    expect(testDim).toBeDefined();
    expect(testDim!.score).toBeGreaterThan(0.5);
  });

  it('scores documentation with DOCS', () => {
    const dims = scorer.scoreDeliverable({ filePath: 'README.md', description: 'Project readme' });
    const docsDim = dims.find(d => d.dimension === 'DOCS');
    expect(docsDim).toBeDefined();
    expect(docsDim!.score).toBe(1.0);
  });

  it('scores security deliverables with SEC', () => {
    const dims = scorer.scoreDeliverable({ filePath: 'security/trust.ts', description: 'EigenTrust implementation' });
    const secDim = dims.find(d => d.dimension === 'SEC');
    expect(secDim).toBeDefined();
    expect(secDim!.score).toBe(1.0);
  });

  it('merges dimensions across multiple deliverables', () => {
    const axis = {
      id: 't1', name: 'T', focusArea: '', agentRole: '', deliverable: [
        { description: 'Tests', filePath: 'test.ts', acceptanceCriteria: [] },
        { description: 'Docs', filePath: 'README.md', acceptanceCriteria: [] },
      ],
      convergenceGate: { checks: [], overallCriteria: '' },
      complexity: 'medium', dependencies: [], status: 'pending',
    };
    const merged = scorer.scoreAxis(axis);
    const hasTest = merged.some(d => d.dimension === 'TEST');
    const hasDocs = merged.some(d => d.dimension === 'DOCS');
    expect(hasTest).toBe(true);
    expect(hasDocs).toBe(true);
  });
});

describe('SignalEmitter', () => {
  it('emits signals for completed axes', () => {
    const emitter = new SignalEmitter();
    emitter.emitFromAxis({
      id: 'axis-a', name: 'A', focusArea: '', agentRole: '',
      deliverable: [{ description: 'Spec', filePath: 'spec.md', acceptanceCriteria: [] }],
      convergenceGate: { checks: [], overallCriteria: '' },
      complexity: 'medium', dependencies: [], status: 'pending',
    });
    const signals = emitter.getSignals();
    expect(Object.keys(signals).length).toBeGreaterThan(0);
  });

  it('formats signals for jitterbug compatibility', () => {
    const emitter = new SignalEmitter();
    emitter.emitFromAxis({
      id: 'axis-a', name: 'A', focusArea: '', agentRole: '',
      deliverable: [{ description: 'Spec', filePath: 'spec.md', acceptanceCriteria: [] }],
      convergenceGate: { checks: [], overallCriteria: '' },
      complexity: 'medium', dependencies: [], status: 'pending',
    });
    const formatted = emitter.toJitterbugSignalsFormat();
    expect(formatted._schema).toBe('PMM_JITTERBUG=1.0');
    expect(formatted._comment).toBeTruthy();
  });
});

describe('StatusTracker', () => {
  it('in-memory tracker reads/writes entries', async () => {
    const tracker = createStatusTracker('in-memory');
    await tracker.write('batch-1', [{ axisId: 'a1', status: 'running', updatedAt: new Date().toISOString(), message: 'started' }]);
    const entries = await tracker.read('batch-1');
    expect(entries.length).toBe(1);
    expect(entries[0].axisId).toBe('a1');
  });
});
