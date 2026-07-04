// spaceship-earth/src/utils/bufferStorage.ts
// IndexedDB persistence for Buffer data via idb-keyval
// Replaces localStorage for held messages + calibration
//
// Types mirror BufferRoom.tsx interfaces — this module only handles
// async load/save to IndexedDB. No type duplication.

import { get, set } from 'idb-keyval';

const CAL_KEY = 'p31-buffer-cal';
const HELD_KEY = 'p31-buffer-held';
const CHAOS_KEY = 'p31-buffer-chaos';

/**
 * Load calibration data from IndexedDB.
 * Returns null if not found, so the caller can use its own defaults.
 */
export async function loadCalibration<T>(defaultVal: T): Promise<T> {
  try {
    const stored = await get<T>(CAL_KEY);
    if (stored) return { ...defaultVal, ...stored };
  } catch {
    // IndexedDB unavailable
  }
  return defaultVal;
}

/**
 * Save calibration data to IndexedDB.
 */
export async function saveCalibration<T>(cal: T): Promise<void> {
  try {
    await set(CAL_KEY, cal);
  } catch {
    // silently fail
  }
}

/**
 * Load held messages from IndexedDB.
 */
export async function loadHeldMessages<T>(): Promise<T[]> {
  try {
    const stored = await get<T[]>(HELD_KEY);
    if (stored && Array.isArray(stored)) return stored;
  } catch {
    // IndexedDB unavailable
  }
  return [];
}

/**
 * Save held messages to IndexedDB.
 */
export async function saveHeldMessages<T>(held: T[]): Promise<void> {
  try {
    await set(HELD_KEY, held);
  } catch {
    // silently fail
  }
}

/**
 * Load chaos ingestion history from IndexedDB.
 */
export async function loadChaosHistory<T>(): Promise<T[]> {
  try {
    const stored = await get<T[]>(CHAOS_KEY);
    if (stored && Array.isArray(stored)) return stored;
  } catch {
    // IndexedDB unavailable
  }
  return [];
}

/**
 * Save chaos ingestion item to IndexedDB.
 */
export async function saveChaosItem<T>(item: T): Promise<void> {
  try {
    const existing = await loadChaosHistory<T>();
    existing.unshift(item);
    await set(CHAOS_KEY, existing.slice(0, 200)); // Keep last 200
  } catch {
    // silently fail
  }
}

/**
 * Request persistent storage permission.
 * Returns true if granted, false otherwise.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const granted = await navigator.storage.persist();
      return granted;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Check if persistent storage is currently active.
 */
export async function isStoragePersistent(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }
  return false;
}
