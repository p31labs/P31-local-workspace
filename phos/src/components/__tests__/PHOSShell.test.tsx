import { describe, it, expect } from 'vitest';
import { getBiologicalTheme } from '../../lib/themeEngine';

describe('getBiologicalTheme', () => {
  it('should return CRISIS theme at 0 spoons', () => {
    const theme = getBiologicalTheme(0, false);
    expect(theme.name).toBe('CRISIS');
    expect(theme.wrapper).toContain('bg-black');
    expect(theme.orb).toContain('bg-gray-800');
  });

  it('should return CRISIS theme when grayRock is true regardless of spoons', () => {
    expect(getBiologicalTheme(5, true).name).toBe('CRISIS');
    expect(getBiologicalTheme(3, true).name).toBe('CRISIS');
    expect(getBiologicalTheme(0, true).name).toBe('CRISIS');
  });

  it('should return SANCTUARY theme at 1 spoon', () => {
    const theme = getBiologicalTheme(1, false);
    expect(theme.name).toBe('SANCTUARY');
    expect(theme.wrapper).toContain('bg-slate-950');
  });

  it('should return SANCTUARY theme at 2 spoons', () => {
    expect(getBiologicalTheme(2, false).name).toBe('SANCTUARY');
  });

  it('should return BRIDGE theme at 3 spoons', () => {
    const theme = getBiologicalTheme(3, false);
    expect(theme.name).toBe('BRIDGE');
    expect(theme.wrapper).toContain('font-serif');
    expect(theme.orb).toContain('bg-indigo-500');
  });

  it('should return QUANTUM theme at 4 spoons', () => {
    const theme = getBiologicalTheme(4, false);
    expect(theme.name).toBe('QUANTUM');
    expect(theme.wrapper).toContain('font-mono');
    expect(theme.orb).toContain('bg-emerald-400');
  });

  it('should return QUANTUM theme at 5 spoons', () => {
    expect(getBiologicalTheme(5, false).name).toBe('QUANTUM');
  });

  it('should return all six required theme properties', () => {
    const theme = getBiologicalTheme(3, false);
    expect(typeof theme.wrapper).toBe('string');
    expect(typeof theme.orb).toBe('string');
    expect(typeof theme.button).toBe('string');
    expect(typeof theme.hud).toBe('string');
    expect(typeof theme.input).toBe('string');
    expect(typeof theme.container).toBe('string');
  });

  it('should disable animations and effects in CRISIS theme', () => {
    const theme = getBiologicalTheme(0, false);
    expect(theme.button).toContain('transition-none');
    expect(theme.button).toContain('backdrop-blur-none');
    expect(theme.input).toContain('pointer-events-none');
  });

  it('should use biomimetic-breath animation in SANCTUARY theme', () => {
    expect(getBiologicalTheme(1, false).orb).toContain('animate-biomimetic-breath');
  });

  it('should use rounded-full buttons in SANCTUARY theme', () => {
    expect(getBiologicalTheme(2, false).button).toContain('rounded-full');
    expect(getBiologicalTheme(2, false).hud).toContain('rounded-3xl');
  });

  it('should use mono font throughout QUANTUM theme', () => {
    const theme = getBiologicalTheme(5, false);
    expect(theme.wrapper).toContain('font-mono');
    expect(theme.input).toContain('font-mono');
    expect(theme.container).toContain('font-mono');
  });

  it('should use no border radius in QUANTUM theme', () => {
    const theme = getBiologicalTheme(4, false);
    expect(theme.button).toContain('rounded-none');
    expect(theme.hud).toContain('rounded-none');
  });
});
