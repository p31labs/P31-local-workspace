import { describe, it, expect } from 'vitest';
import { parseMarkdownToBrainDump } from '../src/brain-dump/parser.js';

const sampleMd = `
# 🧠 Brain Dump – Test Project

### 1.1 The Core Problem / Opportunity
Build a sovereign AI orchestration system.

### 1.2 Current State (What exists today)

- software/packages/agent-engine: Agent Engine core (bloom)
- software/p31-cortex/src/do: 6 DO agents (fruit)
- scripts/jitterbug-daemon.py: Maturity oscillator

Known gaps / blockers:
- No structured brain-dump intake
- No decomposition algorithm
- No convergence gate in code

### 1.3 Constraints & Non-Negotiables
- Zero hardcoded identity
- TypeScript strict mode
- No military metaphors
- Children referenced by initials only

### 1.4 Desired End State (The "FRUIT" / Convergence Target)
All target artifacts at FRUIT stage.

### 1.5 Known Assets (What we already have)
- Cognitive Passport v4.1
- EIN 42-1888158
- Verified legal citations

### 1.6 Open Questions / Unknowns
- What is the exact ASAN grant amount?
- Does Chief Judge Scarlett preside over Camden County?
`;

describe('parser', () => {
  it('extracts project name from header', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.projectName).toBe('Test Project');
  });

  it('parses core problem', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.coreProblem).toContain('sovereign AI orchestration');
  });

  it('parses 3 artifacts', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.currentState.artifacts.length).toBeGreaterThanOrEqual(3);
  });

  it('parses 3 gaps', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.currentState.gaps.length).toBeGreaterThanOrEqual(3);
  });

  it('parses constraints with severity', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    const nonNegotiable = bd.constraints.filter(c => c.severity === 'non-negotiable');
    expect(nonNegotiable.length).toBeGreaterThan(0);
  });

  it('parses 2 known assets', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.knownAssets.length).toBe(3);
  });

  it('parses 2 open questions', () => {
    const bd = parseMarkdownToBrainDump(sampleMd, 'test-op');
    expect(bd.openQuestions.length).toBe(2);
  });
});
