import { describe, it, expect, beforeEach } from 'vitest';
import { SkillTreeEngine } from './skills';

describe('SkillTreeEngine', () => {
  let engine: SkillTreeEngine;

  beforeEach(() => {
    engine = new SkillTreeEngine();
  });

  it('initializes with default skills', () => {
    const tree = engine.getSkillTree();
    expect(tree.totalSkillPoints).toBe(0);
    expect(tree.unlockedSkills.length).toBe(0);
  });

  it('reports total skill count', () => {
    const stats = engine.getSkillStatistics();
    expect(stats.totalSkills).toBeGreaterThan(0);
    expect(stats.totalSkills).toBe(stats.lockedSkills);
  });

  it('finds a known skill definition', () => {
    const def = engine.getSkillDefinition('communication_basic');
    expect(def).toBeDefined();
    expect(def!.name).toBe('Basic Communication');
  });

  it('returns undefined for unknown skill', () => {
    expect(engine.getSkillDefinition('does-not-exist')).toBeUndefined();
  });

  it('surfaces available skills when prerequisites are met', () => {
    const available = engine.getAvailableSkills();
    expect(available.length).toBeGreaterThan(0);
    expect(available.some(s => s.id === 'communication_basic')).toBe(true);
  });

  it('unlocks a root skill', async () => {
    const res = await engine.unlockSkill('communication_basic');
    expect(res.success).toBe(true);
    expect(res.skill).toBeDefined();
    expect(res.effects!.length).toBeGreaterThan(0);
    expect(engine.getSkillTree().unlockedSkills).toContain('communication_basic');
  });

  it('refuses to unlock a missing skill', async () => {
    const res = await engine.unlockSkill('unknown_skill');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('refuses to unlock an already unlocked skill', async () => {
    await engine.unlockSkill('communication_basic');
    const res = await engine.unlockSkill('communication_basic');
    expect(res.success).toBe(false);
  });

  it('unlocks prerequisite chain', async () => {
    await engine.addSkillPoints(10);
    await engine.unlockSkill('communication_basic');
    const available = engine.getAvailableSkills();
    expect(available.some(s => s.id === 'communication_empathy')).toBe(true);
  });

  it('trains an unlocked skill', async () => {
    await engine.unlockSkill('communication_basic');
    const res = engine.trainSkill('communication_basic', 60000);
    expect(res.success).toBe(true);
    expect(res.currentProgress).toBeGreaterThan(0);
  });

  it('refuses training for locked skill', async () => {
    const res = engine.trainSkill('communication_empathy', 1000);
    expect(res.success).toBe(false);
  });

  it('uses an unlocked skill', async () => {
    await engine.unlockSkill('communication_basic');
    const res = engine.useSkill('communication_basic');
    expect(res.success).toBe(true);
    expect(res.skillId).toBe('communication_basic');
  });

  it('refuses use for locked skill', async () => {
    const res = engine.useSkill('communication_empathy');
    expect(res.success).toBe(false);
  });

  it('reports progress for a known skill', () => {
    expect(engine.getSkillProgress('communication_basic')).toBe(0);
  });

  it('returns unlocked skills as nodes', () => {
    const list = engine.getUnlockedSkills();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  it('adds skill points', () => {
    engine.addSkillPoints(5);
    const stats = engine.getSkillStatistics();
    expect(stats.availableSkillPoints).toBe(5);
  });

  it('resets clears skill tree', () => {
    engine.addSkillPoints(5);
    engine.reset();
    const stats = engine.getSkillStatistics();
    expect(stats.availableSkillPoints).toBe(0);
    expect(stats.unlockedSkills).toBe(0);
  });

  it('clamps unlocked skill count to total skills', () => {
    const stats = engine.getSkillStatistics();
    expect(stats.unlockedSkills + stats.lockedSkills).toBe(stats.totalSkills);
  });
});
