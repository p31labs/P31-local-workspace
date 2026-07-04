// ═══════════════════════════════════════════════════════════════
// WCD-KC-02: Zustand Preferences Store
// P31 Labs — Spaceship Earth
//
// Global React state toggle for [Engineer Mode] vs [Sanctuary Mode].
// Offline-first persistence via idb-keyval (WCD-KC-03).
// Maps uiMode to top-level CSS data-theme attribute for Tailwind v4.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export type UIMode = 'ENGINEER' | 'SANCTUARY';

export interface PreferencesState {
  energyLevel: number;
  uiMode: UIMode;
  reducedMotion: boolean;
  persistRequested: boolean;
}

export interface PreferencesActions {
  setEnergyLevel: (level: number) => void;
  setUIMode: (mode: UIMode) => void;
  setReducedMotion: (enabled: boolean) => void;
  toggleUIMode: () => void;
  requestStoragePersistence: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

export type PreferencesStore = PreferencesState & PreferencesActions;

// ─────────────────────────────────────────────────────────────────
// IDB Storage Adapter for Zustand persist middleware
// ─────────────────────────────────────────────────────────────────

const IDB_KEY = 'p31-preferences';

function createIDBStorage() {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const value = await idbGet<string>(name);
        return value ?? null;
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await idbSet(name, value);
      } catch {
        // Silent fail — offline-first, data will persist on next write
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await idbDel(name);
      } catch {
        // Silent fail
      }
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// CSS Data-Attribute Sync
// ─────────────────────────────────────────────────────────────────

function applyThemeAttribute(mode: UIMode): void {
  if (typeof document === 'undefined') return;
  const attr = mode === 'SANCTUARY' ? 'sanctuary' : 'engineer';
  document.documentElement.setAttribute('data-theme', attr);
}

function applyReducedMotion(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(
    'data-reduced-motion',
    enabled ? 'true' : 'false'
  );
}

// ─────────────────────────────────────────────────────────────────
// Storage Persistence Request
// ─────────────────────────────────────────────────────────────────

async function requestPersistedStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false;
  }
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'p31-preferences';

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      // State
      energyLevel: 12,
      uiMode: 'ENGINEER',
      reducedMotion: false,
      persistRequested: false,

      // Actions
      setEnergyLevel: (level) => {
        const clamped = Math.max(0, Math.min(12, Math.round(level)));
        set({ energyLevel: clamped });
      },

      setUIMode: (mode) => {
        set({ uiMode: mode });
        applyThemeAttribute(mode);
      },

      setReducedMotion: (enabled) => {
        set({ reducedMotion: enabled });
        applyReducedMotion(enabled);
      },

      toggleUIMode: () => {
        const current = get().uiMode;
        const next: UIMode = current === 'ENGINEER' ? 'SANCTUARY' : 'ENGINEER';
        set({ uiMode: next });
        applyThemeAttribute(next);
      },

      requestStoragePersistence: async () => {
        const granted = await requestPersistedStorage();
        set({ persistRequested: true });
        return granted;
      },

      hydrate: async () => {
        try {
          const raw = await idbGet<string>(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<PreferencesState>;
            if (parsed.uiMode) applyThemeAttribute(parsed.uiMode);
            if (parsed.reducedMotion !== undefined) applyReducedMotion(parsed.reducedMotion);
          }
        } catch {
          // No persisted state — use defaults
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => createIDBStorage()),
      partialize: (state) => ({
        energyLevel: state.energyLevel,
        uiMode: state.uiMode,
        reducedMotion: state.reducedMotion,
        persistRequested: state.persistRequested,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeAttribute(state.uiMode);
          applyReducedMotion(state.reducedMotion);
        }
      },
    }
  )
);

// ─────────────────────────────────────────────────────────────────
// Selector Hooks
// ─────────────────────────────────────────────────────────────────

export const useEnergyLevel = () =>
  usePreferencesStore((s) => s.energyLevel);

export const useUIMode = () =>
  usePreferencesStore((s) => s.uiMode);

export const useReducedMotion = () =>
  usePreferencesStore((s) => s.reducedMotion);

export const useIsSanctuary = () =>
  usePreferencesStore((s) => s.uiMode === 'SANCTUARY');

export const useIsEngineer = () =>
  usePreferencesStore((s) => s.uiMode === 'ENGINEER');

// ─────────────────────────────────────────────────────────────────
// Export store type
// ─────────────────────────────────────────────────────────────────

export type { PreferencesStore as PreferencesStoreType };
