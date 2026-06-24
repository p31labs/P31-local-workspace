/**
 * PHOS v2.0 Configuration
 * Single source of truth for versioning.
 *
 * Canonical version: import from packages/shared/src/schema-versions or define here.
 * Phase versions never use 0.1.0. Engine version and phase versions are aligned.
 */

export const PHOS_ENGINE_VERSION = '2.0.0';

interface PhaseSetting {
  enabled: boolean;
  version: string;
  targetWeek: number;
  mock?: boolean;
}

interface FeatureFlags {
  voice: boolean;
  bros: boolean;
  router: boolean;
  visual: boolean;
  predictive: boolean;
  guardian: boolean;
  bridge: boolean;
  memory: boolean;
}

export interface PHOSConfig {
  version: string;
  convergenceWeek: number;
  phases: Record<string, PhaseSetting>;
  features: FeatureFlags;
  personas?: unknown[];
  masterStates?: Record<string, { status: string; errorCount: number }>;
  environment?: 'development' | 'staging' | 'production';
}

const ALL_PHASES: Record<string, PhaseSetting> = {
  voice:     { enabled: true,  version: '1.0.0-beta.1', targetWeek: 1, mock: false },
  bros:      { enabled: true,  version: '1.0.0-beta.1', targetWeek: 1, mock: false },
  router:    { enabled: true,  version: '1.0.0-beta.1', targetWeek: 1, mock: false },
  visual:    { enabled: true,  version: '1.0.0-beta.1', targetWeek: 4, mock: false },
  predictive:{ enabled: true,  version: '1.0.0-beta.1', targetWeek: 6, mock: true },
  guardian:  { enabled: true,  version: '1.0.0-beta.1', targetWeek: 7, mock: true },
  bridge:    { enabled: true,  version: '1.0.0-beta.1', targetWeek: 8, mock: true },
  memory:    { enabled: true,  version: '1.0.0-beta.1', targetWeek: 8, mock: true }
};

const ALL_FEATURES: FeatureFlags = {
  voice: true,
  bros: true,
  router: true,
  visual: true,
  predictive: true,
  guardian: true,
  bridge: true,
  memory: true
};

function withOverrides(
  base: Record<string, PhaseSetting>,
  overrides: Record<string, Partial<PhaseSetting>> = {}
): Record<string, PhaseSetting> {
  const result: Record<string, PhaseSetting> = {};
  for (const [key, val] of Object.entries(base)) {
    result[key] = { ...val, ...overrides[key] };
  }
  return result;
}

export const PHOS_V2_CONFIG: PHOSConfig = {
  version: PHOS_ENGINE_VERSION,
  convergenceWeek: 1,
  phases: ALL_PHASES,
  features: ALL_FEATURES,
  environment: 'development'
};

export function getPHOSConfig(env?: 'development' | 'staging' | 'production'): PHOSConfig {
  const environment = env || (process as any).env?.PHOS_ENV || 'development';

  if (environment === 'production') {
    return {
      version: PHOS_ENGINE_VERSION,
      convergenceWeek: 8,
      phases: withOverrides(ALL_PHASES, {
        bridge: { enabled: false, version: '1.0.0-beta.1' },
        predictive: { enabled: true, mock: false },
        guardian: { enabled: true, mock: false },
        memory: { enabled: true, mock: false }
      }),
      features: { ...ALL_FEATURES, bridge: false },
      environment: 'production'
    };
  }

  if (environment === 'staging') {
    return {
      version: PHOS_ENGINE_VERSION,
      convergenceWeek: 4,
      phases: withOverrides(ALL_PHASES, {
        predictive: { enabled: true, mock: true },
        guardian: { enabled: true, mock: true },
        bridge: { enabled: false, mock: true },
        memory: { enabled: true, mock: true }
      }),
      features: { ...ALL_FEATURES, bridge: false },
      environment: 'staging'
    };
  }

  return PHOS_V2_CONFIG;
}
