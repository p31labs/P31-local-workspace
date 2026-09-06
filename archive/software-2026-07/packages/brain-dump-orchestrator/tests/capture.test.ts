import { describe, it, expect } from 'vitest';
import { createDefaultBrainDump, validateBrainDump } from '../src/brain-dump/schema.js';

describe('capture schema', () => {
  it('createDefaultBrainDump returns valid structure', () => {
    const bd = createDefaultBrainDump('will');
    expect(bd.projectName).toBe('');
    expect(bd.constraints).toEqual([]);
    expect(bd.metadata.operator).toBe('will');
  });

  it('accepts valid minimal brain dump', () => {
    const bd = createDefaultBrainDump('will');
    bd.projectName = 'My Project';
    bd.coreProblem = 'Build stuff';
    bd.constraints.push({ id: 'C1', rule: 'No hardcoded identity', severity: 'non-negotiable' });
    bd.desiredEndState = { description: 'FRUIT', targetStage: 'fruit', measurableCriteria: ['Criterion 1'], convergenceTarget: 'Deploy' };
    bd.knownAssets.push({ name: 'Asset', description: 'Desc' });
    bd.openQuestions.push({ id: 'Q1', question: 'Why?', priority: 'medium' });
    const validated = validateBrainDump(bd);
    expect(validated.projectName).toBe('My Project');
    expect(validated.constraints[0].rule).toBe('No hardcoded identity');
  });
});
