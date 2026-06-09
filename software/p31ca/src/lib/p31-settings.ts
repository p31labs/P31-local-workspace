/**
 * p31.settings/1.0.0 — Unified ephemeral settings registry
 *
 * Single source of truth for all P31 app settings.
 * All apps derive from this one source — no more scattered localStorage.
 *
 * Schema: p31.settings/1.0.0
 * Storage: localStorage key = 'p31:settings:v1'
 * Migration: Auto-migrates from legacy keys on first load
 */

export const SETTINGS_KEY = 'p31:settings:v1';
export const SETTINGS_SCHEMA = 'p31.settings/1.0.0';

// Unified settings schema — all app settings consolidated
export interface P31Settings {
  schema: typeof SETTINGS_SCHEMA;
  version: number;
  lastModified: number;

  // ─── Core Identity ───
  identity: {
    did: string | null;           // Decentralized identifier
    publicKey: string | null;   // Ed25519 public key
    cogpass: object | null;     // Cognitive passport v1
    keypair: { pub: object; priv: object } | null;
  };

  // ─── Accessibility & Safety ───
  accessibility: {
    safeMode: boolean;           // Global safe mode toggle
    reducedMotion: boolean;      // Respect prefers-reduced-motion
    highContrast: boolean;       // High contrast mode
    fontSize: 'small' | 'normal' | 'large';
    hapticFeedback: boolean;
  };

  // ─── Audio ───
  audio: {
    masterVolume: number;        // 0-100
    muted: boolean;
    soundEffects: boolean;
    musicVolume: number;
  };

  // ─── Notifications ───
  notifications: {
    starfieldEnabled: boolean;
    starfieldFilters: {
      messages: boolean;
      alerts: boolean;
      meshEvents: boolean;
      activity: boolean;
    };
    starfieldDuration: number;     // ms
    starfieldIntensity: number;    // 0-1
    soundEnabled: boolean;
    soundVolume: number;          // 0-1
    websocketUrl: string;
  };

  // ─── Display ───
  display: {
    theme: 'dark' | 'light' | 'auto';
    accentColor: string;         // hex
    showMissionTrio: boolean;    // EBC footer visibility
    compactMode: boolean;        // Minimal UI
  };

  // ─── Mesh & Connectivity ───
  mesh: {
    autoConnect: boolean;
    preferredRelay: string | null;
    lastConnectedRoom: string | null;
  };

  // ─── App-Specific ───
  apps: {
    dome: {
      perfMode: 'full' | 'lite';
      cameraPosition: { x: number; y: number; z: number } | null;
    };
    bonding: {
      lastRoom: string | null;
      soundEnabled: boolean;
    };
    arcade: {
      lastGame: string | null;
      highScores: Record<string, number>;
    };
    qfactor: {
      lastCalciumReading: number | null;
      lastSpoonCount: number | null;
    };
  };

  // ─── Privacy ───
  privacy: {
    telemetryEnabled: boolean;
    shareMeshStatus: boolean;
    localLogsEnabled: boolean;
  };
}

// Default settings — Fortune 500 enterprise defaults
export const DEFAULT_SETTINGS: P31Settings = {
  schema: SETTINGS_SCHEMA,
  version: 1,
  lastModified: Date.now(),

  identity: {
    did: null,
    publicKey: null,
    cogpass: null,
    keypair: null,
  },

  accessibility: {
    safeMode: false,
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    hapticFeedback: true,
  },

  audio: {
    masterVolume: 70,
    muted: false,
    soundEffects: true,
    musicVolume: 50,
  },

  notifications: {
    starfieldEnabled: true,
    starfieldFilters: {
      messages: true,
      alerts: true,
      meshEvents: true,
      activity: false,
    },
    starfieldDuration: 3000,
    starfieldIntensity: 0.8,
    soundEnabled: false,
    soundVolume: 0.3,
    websocketUrl: 'wss://k4-cage.trimtab-signal.workers.dev/ws',
  },

  display: {
    theme: 'dark',
    accentColor: '#4db8a8',
    showMissionTrio: true,
    compactMode: false,
  },

  mesh: {
    autoConnect: true,
    preferredRelay: null,
    lastConnectedRoom: null,
  },

  apps: {
    dome: {
      perfMode: 'full',
      cameraPosition: null,
    },
    bonding: {
      lastRoom: null,
      soundEnabled: true,
    },
    arcade: {
      lastGame: null,
      highScores: {},
    },
    qfactor: {
      lastCalciumReading: null,
      lastSpoonCount: null,
    },
  },

  privacy: {
    telemetryEnabled: false,  // Privacy-first default
    shareMeshStatus: true,
    localLogsEnabled: true,
  },
};

// Legacy key mappings for migration
const LEGACY_KEYS: Record<string, (val: unknown, settings: P31Settings) => void> = {
  'p31-did': (v, s) => { s.identity.did = v as string; },
  'p31-public-key': (v, s) => { s.identity.publicKey = v as string; },
  'p31-cogpass-v1': (v, s) => { s.identity.cogpass = v as object; },
  'p31-cogpass-keypair': (v, s) => { s.identity.keypair = v as { pub: object; priv: object }; },
  'p31_safe_mode': (v, s) => { s.accessibility.safeMode = v === '1' || v === 'true'; },
  'p31:dome:volume': (v, s) => { s.audio.masterVolume = parseInt(v as string) || 70; },
  'p31:dome:muted': (v, s) => { s.audio.muted = v === 'true'; },
  'p31:dome:perf': (v, s) => { s.apps.dome.perfMode = v === 'lite' ? 'lite' : 'full'; },
  'p31_cache_simplex_q': (v, s) => { /* migrate to apps.qfactor */ },
};

// Get settings — migrates from legacy on first run
export function getSettings(): P31Settings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    console.warn('[P31 Settings] Failed to parse stored settings, using defaults');
  }

  // First run — migrate from legacy keys
  return migrateFromLegacy();
}

// Save settings
export function saveSettings(settings: Partial<P31Settings>): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const current = getSettings();
    const updated = {
      ...current,
      ...settings,
      lastModified: Date.now(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Notify other apps of change
    window.dispatchEvent(new CustomEvent('p31:settings-changed', {
      detail: { changes: Object.keys(settings) }
    }));
  } catch (err) {
    console.error('[P31 Settings] Failed to save:', err);
  }
}

// Migrate legacy localStorage keys to unified settings
function migrateFromLegacy(): P31Settings {
  const settings = { ...DEFAULT_SETTINGS };

  for (const [legacyKey, migrator] of Object.entries(LEGACY_KEYS)) {
    try {
      const value = localStorage.getItem(legacyKey);
      if (value !== null) {
        migrator(value, settings);
        // Optionally: remove legacy key after migration
        // localStorage.removeItem(legacyKey);
      }
    } catch {
      // Ignore migration errors
    }
  }

  // Save migrated settings
  settings.lastModified = Date.now();
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('[P31 Settings] Migrated from legacy keys');
  } catch {
    console.warn('[P31 Settings] Failed to save migrated settings');
  }

  return settings;
}

// Get specific setting path
export function getSetting<T>(path: string): T | undefined {
  const settings = getSettings();
  const parts = path.split('.');
  let value: unknown = settings;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value as T;
}

// Set specific setting path
export function setSetting(path: string, value: unknown): void {
  const settings = getSettings();
  const parts = path.split('.');
  let current: Record<string, unknown> = settings;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  saveSettings(settings);
}

// Reset all settings to defaults
export function resetSettings(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SETTINGS_KEY);
  window.dispatchEvent(new CustomEvent('p31:settings-reset'));
}

// Export health check for monitoring
export function getSettingsHealth() {
  const settings = getSettings();
  return {
    schema: settings.schema,
    version: settings.version,
    lastModified: settings.lastModified,
    age: Date.now() - settings.lastModified,
    hasIdentity: !!settings.identity.did,
    safeMode: settings.accessibility.safeMode,
    telemetry: settings.privacy.telemetryEnabled,
  };
}

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).__p31Settings = {
    get: getSettings,
    save: saveSettings,
    getPath: getSetting,
    setPath: setSetting,
    reset: resetSettings,
    health: getSettingsHealth,
  };
}
