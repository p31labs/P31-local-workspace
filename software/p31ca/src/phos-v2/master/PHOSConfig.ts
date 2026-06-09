/**
 * PHOS v2.0 Configuration
 * Feature flags and phase settings for parallel development
 */

import type { PHOSConfig } from './PHOSMasterRuntime';

export const PHOS_V2_CONFIG: PHOSConfig = {
  version: '2.0.0-alpha.1',
  convergenceWeek: 1,
  
  phases: {
    voice: {
      enabled: true,
      version: '0.1.0',
      targetWeek: 1,
      mock: false
    },
    bros: {
      enabled: true,
      version: '0.1.0',
      targetWeek: 1,
      mock: false
    },
    router: {
      enabled: true,
      version: '0.1.0',
      targetWeek: 1,
      mock: false
    },
    visual: {
      enabled: true,
      version: '0.1.0',
      targetWeek: 4,
      mock: false
    },
    predictive: {
      enabled: false,
      version: '0.1.0',
      targetWeek: 6,
      mock: true
    },
    guardian: {
      enabled: false,
      version: '0.1.0',
      targetWeek: 7,
      mock: true
    },
    bridge: {
      enabled: false,
      version: '0.1.0',
      targetWeek: 8,
      mock: true
    },
    memory: {
      enabled: false,
      version: '0.1.0',
      targetWeek: 8,
      mock: true
    }
  },
  
  features: {
    voice: true,
    bros: true,
    router: true,
    visual: true,
    predictive: false,
    guardian: false,
    bridge: false,
    memory: false
  }
};

// Development override — enable all for testing
export const PHOS_DEV_CONFIG: PHOSConfig = {
  ...PHOS_V2_CONFIG,
  phases: {
    voice: { enabled: true, version: '0.1.0', targetWeek: 1 },
    bros: { enabled: true, version: '0.1.0', targetWeek: 1 },
    router: { enabled: true, version: '0.1.0', targetWeek: 1 },
    visual: { enabled: true, version: '0.1.0', targetWeek: 4 },
    predictive: { enabled: true, version: '0.1.0', targetWeek: 6, mock: true },
    guardian: { enabled: true, version: '0.1.0', targetWeek: 7, mock: true },
    bridge: { enabled: true, version: '0.1.0', targetWeek: 8, mock: true },
    memory: { enabled: true, version: '0.1.0', targetWeek: 8, mock: true }
  },
  features: {
    voice: true,
    bros: true,
    router: true,
    visual: true,
    predictive: true,
    guardian: true,
    bridge: true,
    memory: true
  }
};

// Production config — only stable phases
export const PHOS_PROD_CONFIG: PHOSConfig = {
  version: '2.0.0',
  convergenceWeek: 8,
  phases: {
    voice: { enabled: true, version: '1.0.0', targetWeek: 1 },
    bros: { enabled: true, version: '1.0.0', targetWeek: 2 },
    router: { enabled: true, version: '1.0.0', targetWeek: 3 },
    visual: { enabled: true, version: '1.0.0', targetWeek: 4 },
    predictive: { enabled: true, version: '1.0.0', targetWeek: 6 },
    guardian: { enabled: true, version: '1.0.0', targetWeek: 7 },
    bridge: { enabled: false, version: '0.9.0', targetWeek: 8 }, // Coming soon
    memory: { enabled: true, version: '1.0.0', targetWeek: 8 }
  },
  features: {
    voice: true,
    bros: true,
    router: true,
    visual: true,
    predictive: true,
    guardian: true,
    bridge: false, // Gradual rollout
    memory: true
  }
};
