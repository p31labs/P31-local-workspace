// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Reaction Engine tests
//
// Pure unit tests. No React.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  canReact,
  findReactions,
  executeReaction,
  getReactionsFor,
  getReactionCount,
  REACTIONS,
} from './reactions';

describe('Reaction Engine', () => {
  it('canReact H2 + O2 → water_synthesis', () => {
    const reaction = canReact('H2', 'O2');
    expect(reaction).not.toBeNull();
    expect(reaction?.id).toBe('water_synthesis');
  });

  it('canReact CH4 + O2 → combustion_methane', () => {
    const reaction = canReact('CH4', 'O2');
    expect(reaction?.id).toBe('combustion_methane');
  });

  it('canReact H2 + H2 → null (no self-reaction in this db)', () => {
      // Note: canReact finds *any* reaction with both, so this test might fail if a reaction like H2 + H2 -> He was added.
      // Current db doesn't have this.
    const reaction = canReact('H2', 'H2');
    expect(reaction).toBeNull();
  });

  it('canReact unknown + unknown → null', () => {
    const reaction = canReact('Foo', 'Bar');
    expect(reaction).toBeNull();
  });
  
  it('findReactions [H2, O2, CH4] returns 2 reactions', () => {
    const reactions = findReactions(['H2', 'O2', 'CH4']);
    const ids = reactions.map(r => r.id);
    expect(ids).toContain('water_synthesis');
    expect(ids).toContain('combustion_methane');
    expect(reactions.length).toBe(2);
  });

  it('findReactions empty array returns empty', () => {
    expect(findReactions([])).toEqual([]);
  });

  it('executeReaction returns consumed and produced', () => {
    const reaction = REACTIONS.find(r => r.id === 'water_synthesis')!;
    const result = executeReaction(reaction, ['H2', 'O2']);
    expect(result?.consumed).toEqual(['H2', 'O2']);
    expect(result?.produced).toEqual(['H2O']);
  });

  it('executeReaction returns null if reactant missing', () => {
    const reaction = REACTIONS.find(r => r.id === 'water_synthesis')!;
    const result = executeReaction(reaction, ['H2']);
    expect(result).toBeNull();
  });

  it('getReactionsFor H2O returns photosynthesis + cellular respiration', () => {
    const reactions = getReactionsFor('H2O');
    const ids = reactions.map(r => r.id);
    expect(ids).toContain('photosynthesis');
    expect(ids).toContain('cellular_respiration');
  });
  
  it('getReactionsFor O2 returns multiple reactions', () => {
      const reactions = getReactionsFor('O2');
      expect(reactions.length).toBeGreaterThan(1);
  });

  it('getReactionsFor unknown returns empty array', () => {
      expect(getReactionsFor("FooBar")).toEqual([]);
  });

  it('getReactionCount returns total count', () => {
    expect(getReactionCount()).toBe(REACTIONS.length);
  });

  it('all reactions have required fields', () => {
    for (const r of REACTIONS) {
      expect(r.id).toBeDefined();
      expect(r.name).toBeDefined();
      expect(r.reactants).toBeDefined();
      expect(r.products).toBeDefined();
      expect(r.balanced).toBeDefined();
    }
  });

  it('all reactions have funFact', () => {
    for (const r of REACTIONS) {
      expect(r.funFact.length).toBeGreaterThan(0);
    }
  });

  it('all reactions have love > 0', () => {
    for (const r of REACTIONS) {
      expect(r.love).toBeGreaterThan(0);
    }
  });

  it('balanced equations use subscript notation', () => {
      // A simple check for any subscript character.
      const subscriptRegex = /[\u2080-\u2089]/;
      const reactionsWithSubscripts = REACTIONS.filter(r => subscriptRegex.test(r.balanced));
      expect(reactionsWithSubscripts.length).toBeGreaterThan(0);
  });
});
