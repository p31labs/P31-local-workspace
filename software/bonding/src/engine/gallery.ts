// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Gallery module: persist completed molecules as trophies
//
// Pure TypeScript module. No React. No game imports.
// Stores GalleryEntry objects in localStorage under key
// 'bonding_gallery'. Max 500 entries, oldest trimmed.
// ═══════════════════════════════════════════════════════

export interface GalleryEntry {
  id: string;              // crypto.randomUUID()
  formula: string;         // Hill system: "H2O"
  displayFormula: string;  // Conventional: "H₂O"
  name: string;            // "Water" or custom discovery name
  atoms: number;           // atom count
  love: number;            // LOVE earned
  achievements: string[];  // achievement IDs unlocked during build
  mode: string;            // "seed" | "sprout" | "sapling"
  playerName: string;      // who built it
  completedAt: string;     // ISO timestamp
  isDiscovery: boolean;    // true if player named it
}

const STORAGE_KEY = 'bonding_gallery';
const MAX_ENTRIES = 500;

function loadGallery(): GalleryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGallery(entries: GalleryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable — swallow
  }
}

/**
 * Save a completed molecule to gallery.
 * If a formula already exists, it is replaced with the new entry.
 */
export function saveToGallery(entry: GalleryEntry): void {
  const entries = loadGallery();
  const existingIndex = entries.findIndex(e => e.formula === entry.formula);
  if (existingIndex !== -1) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  // Trim oldest if exceeded
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  saveGallery(entries);
}

/**
 * Get all gallery entries, newest first.
 */
export function getGallery(): GalleryEntry[] {
  const entries = loadGallery();
  return entries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

/**
 * Get gallery entries by mode.
 */
export function getGalleryByMode(mode: string): GalleryEntry[] {
  return getGallery().filter(e => e.mode === mode);
}

/**
 * Get total molecules built.
 */
export function getGalleryCount(): number {
  return getGallery().length;
}

/**
 * Get total LOVE earned across all molecules.
 */
export function getTotalLove(): number {
  return getGallery().reduce((sum, e) => sum + e.love, 0);
}

/**
 * Check if a formula has been built before.
 */
export function hasBuiltFormula(formula: string): boolean {
  return getGallery().some(e => e.formula === formula);
}

/**
 * Get unique formulas built.
 */
export function getUniqueFormulas(): string[] {
  const seen = new Set<string>();
  for (const e of getGallery()) {
    seen.add(e.formula);
  }
  return Array.from(seen);
}

/**
 * Clear gallery (for testing).
 */
export function clearGallery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — swallow
  }
}