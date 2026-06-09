import { describe, it, expect } from 'vitest';
import { getBiologicalTheme } from '../PHOSShell';

describe('Biological Token Recalculation Core Matrix', () => {
  it('should swap tokens correctly across mapped limits', () => {
    const crisis = getBiologicalTheme(0, false);
    expect(crisis.name).toBe('CRISIS');
    expect(crisis.wrapper).toContain('bg-black');
    expect(crisis.orb).toContain('animate-none');

    const sanctuary = getBiologicalTheme(2, false);
    expect(sanctuary.name).toBe('SANCTUARY');
    expect(sanctuary.wrapper).toContain('bg-gradient-to-b');
    expect(sanctuary.orb).toContain('animate-biomimetic-breath');

    const bridge = getBiologicalTheme(3, false);
    expect(bridge.name).toBe('BRIDGE');
    expect(bridge.wrapper).toContain('font-serif');

    const quantum = getBiologicalTheme(5, false);
    expect(quantum.name).toBe('QUANTUM');
    expect(quantum.wrapper).toContain('text-emerald-400');
  });

  it('should trigger forced grayRock override regardless of quantitative input counters', () => {
    const theme = getBiologicalTheme(5, true);
    expect(theme.name).toBe('CRISIS');
    expect(theme.wrapper).toContain('bg-black');
  });
});
