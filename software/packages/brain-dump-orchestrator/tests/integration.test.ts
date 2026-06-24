import { describe, it, expect } from 'vitest';
import { parseMarkdownToBrainDump } from '../src/brain-dump/parser.js';
import { decomposeBrainDump } from '../src/decomposition/axis-decomposer.js';
import { GateChecker, ConvergenceReporter } from '../src/convergence/gate-check.js';
import { SignalEmitter, MaturityScorer } from '../src/jitterbug/maturity-scorer.js';
import { FileSystemAdapter } from '../src/integrations/file-system-adapter.js';

describe('integration: full brain-dump pipeline', () => {
  const md = `
# 🧠 Brain Dump – Integration Test

### 1.1 The Core Problem / Opportunity
End-to-end verification of the brain dump pipeline.

### 1.2 Current State (What exists today)

- src/packages/agent-engine: Agent engine core (bloom)
- tests/eigentrust.test.ts: Trust tests (sapling)

Known gaps / blockers:
- Parser needs to handle markdown list variations
- Brain dump schema must be strict

### 1.3 Constraints & Non-Negotiables
- Zero hardcoded identity
- TypeScript strict mode

### 1.4 Desired End State (The "FRUIT" / Convergence Target)
All pipelines at FRUIT.

### 1.5 Known Assets (What we already have)
- Zod schemas
- Vitest config

### 1.6 Open Questions / Unknowns
- What test coverage target?
`;

  it('parses → decomposes → scores → checks gates', () => {
    const bd = parseMarkdownToBrainDump(md, 'integration-test');
    expect(bd.projectName).toBe('Integration Test');

    const axes = decomposeBrainDump(bd);
    expect(axes.length).toBeGreaterThanOrEqual(2);
    expect(axes.length).toBeLessThanOrEqual(8);

    const scorer = new MaturityScorer();
    for (const axis of axes) {
      const dimensions = scorer.scoreAxis(axis);
      expect(dimensions.length).toBeGreaterThan(0);
    }

    const checker = new GateChecker();
    const fakeResult = {
      batchId: 'integration-batch',
      startedAt: new Date().toISOString(),
      axes: Object.fromEntries(axes.map(a => [a.id, { success: true, filesWritten: a.deliverable.map(d => d.filePath), statusLine: 'ok', startedAt: '' }])),
      overallStatus: 'completed' as const,
    };
    const convergence = checker.checkAll(axes, fakeResult);
    expect(['PASS', 'FAIL']).toContain(convergence.overall);
    const report = new ConvergenceReporter().formatReport(convergence, 'integration-batch');
    expect(report).toContain('Convergence Gate');
  });

  it('emits jitterbug signals from completed axes', () => {
    const bd = parseMarkdownToBrainDump(md, 'integration-test');
    const axes = decomposeBrainDump(bd);
    const emitter = new SignalEmitter();
    for (const axis of axes) emitter.emitFromAxis(axis);
    const signals = emitter.getSignals();
    const formatted = emitter.toJitterbugSignalsFormat();
    expect(formatted._schema).toBe('PMM_JITTERBUG=1.0');
    expect(Object.keys(signals).length).toBe(axes.length);
  });

  it('writes deliverables with FileSystemAdapter', async () => {
    const adapter = new FileSystemAdapter();
    const axes = [{ id: 'int-axis', name: 'Integration', focusArea: '', agentRole: '', deliverable: [{ description: 'Doc', filePath: 'tmp-integration-doc.md', acceptanceCriteria: [] }], convergenceGate: { checks: [], overallCriteria: '' }, complexity: 'medium', dependencies: [], status: 'pending' } as any];
    const result = await adapter.writeDeliverables(axes[0], { 'tmp-integration-doc.md': '# Integration Test' });
    expect(result.success).toBe(true);
    expect(result.filesWritten).toContain('tmp-integration-doc.md');
    const content = await adapter.readDeliverable('tmp-integration-doc.md');
    expect(content).toContain('Integration Test');
  });
});
