import { persistentAtom } from '@nanostores/persistent';

export type DensityLevel = 'minimal' | 'moderate' | 'detailed' | 'exhaustive';

export const DENSITY_LEVELS: DensityLevel[] = ['minimal', 'moderate', 'detailed', 'exhaustive'];

// Map 0-100 passport density to named levels
export function densityFromNumeric(n: number): DensityLevel {
  if (n <= 25) return 'minimal';
  if (n <= 50) return 'moderate';
  if (n <= 75) return 'detailed';
  return 'exhaustive';
}

// Map named level back to midpoint numeric (for passport sync)
export function densityToNumeric(level: DensityLevel): number {
  switch (level) {
    case 'minimal': return 12;
    case 'moderate': return 37;
    case 'detailed': return 62;
    case 'exhaustive': return 87;
  }
}

export const densityStore = persistentAtom<DensityLevel>('phos:density', 'moderate', {
  encode: JSON.stringify,
  decode: JSON.parse,
});
