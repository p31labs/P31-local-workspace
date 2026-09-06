import { COLORS } from './tokens/index';

export type BrandColor =
  | 'cyan' | 'violet' | 'gold' | 'green' | 'red' | 'iris';

export interface BrandColorInfo {
  hex: string;
  name: string;
  meaning: string;
  usage: string;
  deprecated?: boolean;
  migrationPath?: string;
}

export const BRAND_COLORS: Record<BrandColor, BrandColorInfo> = {
  cyan: {
    hex: COLORS.accent,
    name: 'Quantum-cyan',
    meaning: 'Care, presence, coordination',
    usage: 'Primary accent, primary CTAs, mesh highlights',
  },
  violet: {
    hex: COLORS.violet,
    name: 'Sovereign violet',
    meaning: 'Identity, dignity, sovereignty',
    usage: 'Secondary actions, federated identity',
  },
  gold: {
    hex: COLORS.gold,
    name: 'Trust gold',
    meaning: 'Earned reputation, spark',
    usage: 'Donor elements, achievements',
  },
  green: {
    hex: COLORS.green,
    name: 'Verdigris',
    meaning: 'Success, verification',
    usage: 'Confirmed states, verified badges',
  },
  red: {
    hex: COLORS.red,
    name: 'Rose',
    meaning: 'Alert, crisis, pause',
    usage: 'Errors, crisis mode indicators',
  },
  iris: {
    hex: COLORS.iris,
    name: 'Iris',
    meaning: 'Bridge, federation',
    usage: 'Inter-app connections, link highlights',
  },
};

export function getBrandColor(key: BrandColor): BrandColorInfo {
  return BRAND_COLORS[key];
}

export const DEPRECATED_COLORS: Record<string, { path: string; migration: string }> = {
  'red': { path: 'quantum-red', migration: 'Use quantum-red — red is deprecated' },
  'iris': { path: 'quantum-iris', migration: 'Use quantum-iris — iris is deprecated' },
};

export const BRAND_PALETTE = [
  COLORS.accent,
  COLORS.violet,
  COLORS.gold,
  COLORS.green,
  COLORS.red,
  COLORS.iris,
] as const;
