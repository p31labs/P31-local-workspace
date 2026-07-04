import { describe, it, expect } from 'vitest';
import { resolveAtmospherePreset, detectGrayRock } from '../atmosphere';

describe('Atmosphere Configuration Verification', () => {
  it('should successfully resolve predefined tokens for core boundaries', () => {
    const quantumPreset = resolveAtmospherePreset('NODE_ZERO');
    expect(quantumPreset.palette.primary).toBe('#34d399');

    const sanctuaryPreset = resolveAtmospherePreset('THE_BUFFER');
    expect(sanctuaryPreset.palette.text).toBe('#fff7ed');
  });

  it('should flag grayRock conditions via strict string verification keys', () => {
    expect(detectGrayRock('?mode=crisis')).toBe(true);
    expect(detectGrayRock('?mode=urgent')).toBe(true);
    expect(detectGrayRock('?mode=nominal')).toBe(false);
  });
});
