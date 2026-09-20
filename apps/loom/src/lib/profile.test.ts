import { describe, it, expect } from 'vitest';
import { resolvePresentation, presentationOverrides, resolveTier } from './profile';
import type { HumanProfile } from '@p31/canon/loom/profiles';

describe('resolvePresentation', () => {
  it('returns neutral defaults for a null profile with no params', () => {
    expect(resolvePresentation(null, '')).toEqual({
      density: 'comfortable',
      motion: 'full',
      saturation: 'normal',
      literalLabels: false,
      letterSpacing: 'normal',
      lineSpacing: 'normal',
    });
  });

  it('maps profile presentation prefs', () => {
    const p: HumanProfile = {
      id: 'h1',
      presentation: {
        letterSpacing: 'extra-wide',
        lineSpacing: 'loose',
        density: 'compact',
        motion: 'none',
        colorSaturation: 'muted',
        literalLabels: true,
      },
    };
    const prefs = resolvePresentation(p, '');
    expect(prefs.letterSpacing).toBe('extra-wide');
    expect(prefs.lineSpacing).toBe('loose');
    expect(prefs.density).toBe('compact');
    expect(prefs.motion).toBe('none');
    expect(prefs.saturation).toBe('muted');
    expect(prefs.literalLabels).toBe(true);
  });

  it('URL params override the profile', () => {
    const p: HumanProfile = { id: 'h2', presentation: { density: 'compact', motion: 'full' } };
    const prefs = resolvePresentation(p, '?density=spacious&motion=none&literal=1');
    expect(prefs.density).toBe('spacious');
    expect(prefs.motion).toBe('none');
    expect(prefs.literalLabels).toBe(true);
  });

  it('ignores invalid URL params', () => {
    const prefs = resolvePresentation(null, '?density=banana&motion=warp');
    expect(prefs.density).toBe('comfortable');
    expect(prefs.motion).toBe('full');
  });
});

describe('presentationOverrides', () => {
  it('returns empty for neutral prefs', () => {
    expect(presentationOverrides(null, '')).toEqual({});
  });

  it('emits only the CSS-consumed vars (letter-spacing, line-height)', () => {
    const p: HumanProfile = {
      id: 'h1',
      presentation: {
        letterSpacing: 'extra-wide',
        lineSpacing: 'loose',
        density: 'compact',
        motion: 'none',
        literalLabels: true,
      },
    };
    const o = presentationOverrides(p, '');
    expect(o['--loom-letter-spacing']).toBe('0.12em');
    expect(o['--loom-line-height']).toBe('1.8');
    // The discrete tiers do NOT leak into CSS vars — they flow via data-* attrs.
    expect(o['--loom-density']).toBeUndefined();
    expect(o['--loom-motion']).toBeUndefined();
    expect(o['--loom-literal-labels']).toBeUndefined();
  });
});

describe('resolveTier', () => {
  it('defaults to advanced with no profile and no param', () => {
    expect(resolveTier(null, '')).toBe('advanced');
  });

  it('uses the profile tier', () => {
    expect(resolveTier({ id: 'h1', tier: 'beginner' }, '')).toBe('beginner');
  });

  it('URL param overrides the profile tier', () => {
    expect(resolveTier({ id: 'h1', tier: 'beginner' }, '?tier=intermediate')).toBe('intermediate');
  });
});
