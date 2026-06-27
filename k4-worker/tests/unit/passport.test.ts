import { describe, it, expect } from 'vitest';
import { getContext, buildSystemPrompt, buildModerationPrompt } from '../../src/cognitive/passport';

describe('K4 Passport — Context Factory', () => {
  it('returns canonical context for PARENT_A', () => {
    const ctx = getContext('PARENT_A');
    expect(ctx.system.nodeType).toBe('PARENT_A');
    expect(ctx.system.topology).toBe('K4-Delta-Mesh');
    expect(ctx.operator.name).toBe('Will Johnson');
  });

  it('returns canonical context for PARENT_B', () => {
    const ctx = getContext('PARENT_B');
    expect(ctx.system.nodeType).toBe('PARENT_B');
    expect(ctx.operator.nspEnabled).toBe(true);
  });

  it('returns canonical context for CHILD', () => {
    const ctx = getContext('CHILD');
    expect(ctx.system.nodeType).toBe('CHILD');
    expect(ctx.system.fawnResponseRisk).toBe(true);
  });

  it('preserves operator fields across all node types', () => {
    for (const type of ['PARENT_A', 'PARENT_B', 'CHILD', 'SYSTEM_CORE']) {
      const ctx = getContext(type);
      expect(ctx.operator.diagnosis).toContain('AuDHD');
      expect(ctx.operator.forbiddenMetaphors).toContain('submarine');
      expect(ctx.operator.executiveDysfunctionProtocol).toBe('parking_lot_first');
    }
  });

  it('includes both children in family block', () => {
    const ctx = getContext('PARENT_A');
    expect(ctx.family.children).toHaveLength(2);
    expect(ctx.family.children[0].id).toBe('node-bash-001');
    expect(ctx.family.children[1].id).toBe('node-willow-001');
  });

  it('carries legal statute', () => {
    const ctx = getContext('PARENT_A');
    expect(ctx.legal.statute).toBe('O.C.G.A._24-9-901(b)(9)');
    expect(ctx.legal.case).toBe('Johnson_v_Johnson_2025CV936');
  });
});

describe('K4 Passport — Prompt Builders', () => {
  it('buildSystemPrompt injects forbidden-metaphor warning', () => {
    const ctx = getContext('PARENT_A');
    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('FORBIDDEN METAPHORS');
    expect(prompt).toContain('submarine');
  });

  it('buildSystemPrompt includes NSP directive', () => {
    const ctx = getContext('PARENT_A');
    const prompt = buildSystemPrompt(ctx);
    expect(prompt).toContain('NSP');
    expect(prompt).toContain('flat affect as neutral');
  });

  it('buildModerationPrompt includes operator context', () => {
    const ctx = getContext('CHILD');
    const prompt = buildModerationPrompt(ctx);
    expect(prompt).toContain('MODERATION TASK');
    expect(prompt).toContain('CONTENT TO ANALYZE');
    expect(prompt).toContain('{{CONTENT}}');
  });

  it('buildModerationPrompt reflects NSP state', () => {
    const ctx = getContext('PARENT_A');
    const prompt = buildModerationPrompt(ctx);
    expect(prompt).toContain('NSP Mode: YES');
  });
});
