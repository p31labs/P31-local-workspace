import { describe, it, expect } from 'vitest';
import { effectiveTier, resolveSurface, rejectReasonFor, approveLabel } from './surface';
import { resolveTier, presentationOverrides } from './profile';

describe('resolveSurface', () => {
  it('beginner shows the digest, hides overlay and scrubber', () => {
    const s = resolveSurface('beginner');
    expect(s.showOverlay).toBe(false);
    expect(s.showScrubber).toBe(false);
    expect(s.showSurvival).toBe(false);
  });

  it('intermediate shows the overlay, hides scrubber and survival', () => {
    const s = resolveSurface('intermediate');
    expect(s.showOverlay).toBe(true);
    expect(s.showScrubber).toBe(false);
    expect(s.showSurvival).toBe(false);
  });

  it('advanced shows everything', () => {
    const s = resolveSurface('advanced');
    expect(s.showOverlay).toBe(true);
    expect(s.showScrubber).toBe(true);
    expect(s.showSurvival).toBe(true);
  });
});

describe('effectiveTier', () => {
  it('show-more promotes beginner to advanced', () => {
    expect(effectiveTier('beginner', true)).toBe('advanced');
  });

  it('show-more does not change advanced', () => {
    expect(effectiveTier('advanced', true)).toBe('advanced');
  });

  it('no show-more leaves the tier alone', () => {
    expect(effectiveTier('beginner', false)).toBe('beginner');
    expect(effectiveTier('intermediate', false)).toBe('intermediate');
  });
});

describe('rejectReasonFor', () => {
  it('beginner defaults to a soft deferral', () => {
    expect(rejectReasonFor('beginner', '')).toBe('deferred by human');
    expect(rejectReasonFor('beginner', '   ')).toBe('deferred by human');
  });

  it('non-beginner defaults to neutral rejection', () => {
    expect(rejectReasonFor('advanced', '')).toBe('rejected by human');
    expect(rejectReasonFor('intermediate', '')).toBe('rejected by human');
  });

  it('a non-empty reason always wins', () => {
    expect(rejectReasonFor('beginner', 'wrong mass')).toBe('wrong mass');
    expect(rejectReasonFor('advanced', '  wrong mass  ')).toBe('wrong mass');
  });
});

describe('approveLabel', () => {
  it('beginner sees plain language', () => {
    expect(approveLabel('beginner')).toBe('Looks good');
  });

  it('advanced sees the precise verb', () => {
    expect(approveLabel('advanced')).toBe('Approve');
  });
});

describe('resolveTier', () => {
  it('defaults to advanced when no profile and no param', () => {
    expect(resolveTier(null, '')).toBe('advanced');
  });

  it('reads the profile tier when present', () => {
    expect(resolveTier({ id: 'h1', tier: 'beginner' }, '')).toBe('beginner');
  });

  it('?tier= param overrides the stored tier', () => {
    expect(resolveTier({ id: 'h1', tier: 'advanced' }, '?tier=beginner')).toBe('beginner');
    expect(resolveTier({ id: 'h1', tier: 'beginner' }, '?tier=intermediate')).toBe('intermediate');
  });

  it('?tier= works with no profile (anonymous demo)', () => {
    expect(resolveTier(null, '?tier=beginner')).toBe('beginner');
  });

  it('an invalid ?tier= is ignored', () => {
    expect(resolveTier(null, '?tier=nope')).toBe('advanced');
  });
});

describe('presentationOverrides', () => {
  it('maps dyslexia + ADHD prefs onto CSS custom properties', () => {
    const o = presentationOverrides({
      id: 'h1',
      presentation: { letterSpacing: 'extra-wide', lineSpacing: 'loose', density: 'spacious' },
    });
    expect(o['--loom-letter-spacing']).toBe('0.12em');
    expect(o['--loom-line-height']).toBe('1.8');
  });

  it('returns empty for no presentation block', () => {
    expect(presentationOverrides({ id: 'h1' })).toEqual({});
    expect(presentationOverrides(null)).toEqual({});
  });
});
