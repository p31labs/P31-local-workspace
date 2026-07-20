/**
 * @file layoutField.test.ts — Phase 4 morphogenetic layout engine.
 *
 * Validates the field→layout mapping is deterministic, bounded, identity-
 * sensitive, and time-evolving. Also exercises the transitive
 * @p31/design-core/math resolution (PHI) via computeMorphogeneticField.
 * ⚠️ Contested-science metaphor — asserts ENGINE behavior only.
 */
import { describe, it, expect } from 'vitest';
import { computeLayoutField, hashSeed } from '../engine/layoutField';

const base = { passportSeed: 'did:key:zAlice', spoons: 6, maxSpoons: 12, sessionSeconds: 0 };

describe('hashSeed', () => {
  it('is deterministic and in [0,1)', () => {
    const a = hashSeed('did:key:zAlice');
    const b = hashSeed('did:key:zAlice');
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('differs across identities', () => {
    expect(hashSeed('did:key:zAlice')).not.toBe(hashSeed('did:key:zBob'));
  });
});

describe('computeLayoutField', () => {
  it('is deterministic for the same input', () => {
    const a = computeLayoutField(base);
    const b = computeLayoutField(base);
    expect(a).toEqual(b);
  });

  it('produces all four panels with bounded properties', () => {
    const { panels } = computeLayoutField(base);
    (['status', 'larmor', 'whale', 'proof'] as const).forEach((id) => {
      const p = panels[id];
      expect(p.x).toBeGreaterThanOrEqual(-1);
      expect(p.x).toBeLessThanOrEqual(1);
      expect(p.y).toBeGreaterThanOrEqual(-1);
      expect(p.y).toBeLessThanOrEqual(1);
      expect(p.scale).toBeGreaterThanOrEqual(0.85);
      expect(p.scale).toBeLessThanOrEqual(1.15);
      expect(p.opacity).toBeGreaterThanOrEqual(0.4);
      expect(p.opacity).toBeLessThanOrEqual(1);
      expect(typeof p.visible).toBe('boolean');
      expect(Number.isFinite(p.x)).toBe(true);
    });
  });

  it('layers are finite and bounded to [-1,1]', () => {
    const { layers } = computeLayoutField(base);
    expect(layers.length).toBeGreaterThan(0);
    layers.forEach((l) => {
      expect(Number.isFinite(l)).toBe(true);
      expect(l).toBeGreaterThanOrEqual(-1);
      expect(l).toBeLessThanOrEqual(1);
    });
  });

  it('different identities yield different arrangements', () => {
    const alice = computeLayoutField(base);
    const bob = computeLayoutField({ ...base, passportSeed: 'did:key:zBob' });
    expect(alice.layers).not.toEqual(bob.layers);
  });

  it('evolves with session depth', () => {
    const t0 = computeLayoutField({ ...base, sessionSeconds: 0 });
    const t1 = computeLayoutField({ ...base, sessionSeconds: 900 });
    expect(t0.layers).not.toEqual(t1.layers);
  });

  it('handles zero maxSpoons without NaN', () => {
    const { panels } = computeLayoutField({ ...base, spoons: 0, maxSpoons: 0 });
    expect(Number.isFinite(panels.status.x)).toBe(true);
  });
});
