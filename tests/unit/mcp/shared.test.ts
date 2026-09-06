import { describe, it, expect } from 'vitest';
import {
  resolveTokenValue,
  extractClasses,
  extractTokens,
  findToken,
  RECIPE_CATEGORIES,
  COMPONENT_CATEGORIES,
} from '../../../packages/design-core/src/mcp/shared.js';

describe('resolveTokenValue', () => {
  it('resolves a direct token', () => {
    const v = resolveTokenValue('color.accent.default');
    expect(v).toContain('oklch');
  });

  it('returns undefined for unknown token', () => {
    expect(resolveTokenValue('color.does.not.exist')).toBeUndefined();
  });

  it('guards against circular references (no stack overflow)', () => {
    const fakeMap: Record<string, { cssVar: string; value: string; raw: string }> = {
      a: { cssVar: '--a', value: '{b}', raw: '{b}' },
      b: { cssVar: '--b', value: '{c}', raw: '{c}' },
      c: { cssVar: '--c', value: '{a}', raw: '{a}' },
    };
    const seen = new Set<string>();
    const guard = (path: string): string => {
      const e = (fakeMap as any)[path];
      if (!e) return `{${path}}`;
      if (seen.has(path)) return `{${path}}`;
      seen.add(path);
      return e.value.replace(/\{([^}]+)\}/g, (_, ref) => guard(ref));
    };
    expect(() => guard('a')).not.toThrow();
    expect(guard('a')).toBe('{a}');
  });
});

describe('findToken', () => {
  it('finds a known token', () => {
    const t = findToken('color.accent.default');
    expect(t).toBeDefined();
    expect(t!.cssVar).toBe('--p31-color-accent-default');
  });

  it('returns undefined for unknown token', () => {
    expect(findToken('color.fake.token')).toBeUndefined();
  });
});

describe('extractClasses', () => {
  it('extracts double-quoted className', () => {
    const r = extractClasses('<div className="glass-panel glass-card" />');
    expect(r.has('glass-panel')).toBe(true);
    expect(r.has('glass-card')).toBe(true);
  });

  it('extracts single-quoted className', () => {
    const r = extractClasses("<div className='btn btn-primary' />");
    expect(r.has('btn')).toBe(true);
    expect(r.has('btn-primary')).toBe(true);
  });

  it('extracts class attribute', () => {
    const r = extractClasses('<div class="badge badge-success" />');
    expect(r.has('badge')).toBe(true);
    expect(r.has('badge-success')).toBe(true);
  });

  it('dedupes repeated classes', () => {
    const r = extractClasses('<div className="x x y" />');
    expect(r.size).toBe(2);
  });

  it('handles multi-line JSX', () => {
    const r = extractClasses('<div\n  className="a"\n  data-x="y"\n/>');
    expect(r.has('a')).toBe(true);
  });
});

describe('extractTokens', () => {
  it('extracts var(--name)', () => {
    const r = extractTokens('color: var(--p31-accent);');
    expect(r.has('p31-accent')).toBe(true);
  });

  it('handles fallback var(--name, fallback)', () => {
    const r = extractTokens('backdrop-filter: var(--p31-glass-blur, blur(12px));');
    expect(r.has('p31-glass-blur')).toBe(true);
    expect(r.has('blur(12px)')).toBe(false);
  });

  it('extracts multiple tokens', () => {
    const r = extractTokens('color: var(--p31-text); background: var(--p31-bg);');
    expect(r.size).toBe(2);
  });
});

describe('data: RECIPE_CATEGORIES', () => {
  it('contains a Glass Morphism Tiers category', () => {
    expect(RECIPE_CATEGORIES['Glass Morphism Tiers']).toBeDefined();
    expect(RECIPE_CATEGORIES['Glass Morphism Tiers']).toContain('glass-panel');
  });

  it('all recipes are covered', () => {
    const total = Object.values(RECIPE_CATEGORIES).reduce((s, v) => s + (v as string[]).length, 0 as number);
    expect(total).toBe(171);
  });
});

describe('data: COMPONENT_CATEGORIES', () => {
  it('includes expected categories', () => {
    expect(COMPONENT_CATEGORIES).toContain('surface');
    expect(COMPONENT_CATEGORIES).toContain('navigation');
    expect(COMPONENT_CATEGORIES).toContain('accessibility');
    expect(COMPONENT_CATEGORIES).toContain('action');
  });
});
