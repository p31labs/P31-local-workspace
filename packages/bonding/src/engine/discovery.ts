// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Discovery system: detect unknown formulas and let player name them
//
// Pure TypeScript module. No React. No game imports.
// Uses localStorage key 'bonding_discoveries'. Max 100 entries.
// ═══════════════════════════════════════════════════════

// Known molecules in Hill system (internal canonical keys)
const KNOWN_FORMULAS: Set<string> = new Set([
  'H2',       // Hydrogen Gas
  'O2',       // Oxygen Gas
  'N2',       // Nitrogen Gas
  'H2O',      // Water
  'H2O2',     // Hydrogen Peroxide
  'CO2',      // Carbon Dioxide
  'CH4',      // Methane
  'H3N',      // Ammonia
  'C2H6',     // Ethane
  'CaO',      // Calcium Oxide
  'HNO3',     // Nitric Acid
  'Ca3O8P2',  // Calcium Phosphate
  'Ca9O24P6', // Posner Molecule
  'CHN',      // Hydrogen Cyanide
  'CO',       // Carbon Monoxide
  'NO',       // Nitric Oxide
  'NO2',      // Nitrogen Dioxide
  'CH2O',     // Formaldehyde
  'C2H6O',    // Ethanol
  'CH2O2',    // Formic Acid
]);

const STORAGE_KEY = 'bonding_discoveries';
const MAX_ENTRIES = 100;

function loadDiscoveries(): Array<{
  formula: string;
  name: string;
  discoveredBy: string;
  discoveredAt: string;
}> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDiscoveries(discoveries: Array<{
  formula: string;
  name: string;
  discoveredBy: string;
  discoveredAt: string;
}>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discoveries));
  } catch {
    // Storage unavailable — swallow
  }
}

/**
 * Normalize Unicode subscripts (₀-₉) to ASCII digits (0-9).
 * Allows the game's Unicode formulas (H₂O) to match the
 * ASCII keys in KNOWN_FORMULAS (H2O).
 */
function normalizeFormula(formula: string): string {
  return formula.replace(/[\u2080-\u2089]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0x2080 + 48),
  );
}

/**
 * Check if a formula is a known molecule.
 * Accepts both Unicode (H₂O) and ASCII (H2O) formulas.
 */
export function isKnownMolecule(formula: string): boolean {
  return KNOWN_FORMULAS.has(normalizeFormula(formula));
}

/**
 * Check if a formula is a discovery (not known).
 */
export function isDiscovery(formula: string): boolean {
  return !isKnownMolecule(formula);
}

/**
 * Validate a discovery name (2-30 chars, alphanumeric + spaces).
 */
export function validateDiscoveryName(name: string): {
  valid: boolean;
  reason?: string;
} {
  if (typeof name !== 'string') {
    return { valid: false, reason: 'Name must be a string' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, reason: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 30) {
    return { valid: false, reason: 'Name must be at most 30 characters' };
  }
  if (!/^[a-zA-Z0-9\s']+$/.test(trimmed)) {
    return { valid: false, reason: 'Name must contain only letters, numbers, spaces, and apostrophes' };
  }
  return { valid: true };
}

/**
 * Get saved discoveries from localStorage.
 */
export function getSavedDiscoveries(): Array<{
  formula: string;
  name: string;
  discoveredBy: string;
  discoveredAt: string;
}> {
  return loadDiscoveries();
}

/**
 * Save a new discovery.
 * If the formula already exists, it is replaced with the new entry.
 */
export function saveDiscovery(
  formula: string,
  name: string,
  discoveredBy: string
): void {
  const discoveries = loadDiscoveries();
  const existingIndex = discoveries.findIndex(d => d.formula === formula);
  const entry = {
    formula,
    name: name.trim(),
    discoveredBy,
    discoveredAt: new Date().toISOString(),
  };
  if (existingIndex !== -1) {
    discoveries[existingIndex] = entry;
  } else {
    discoveries.push(entry);
  }
  // Trim oldest if exceeded
  if (discoveries.length > MAX_ENTRIES) {
    discoveries.splice(0, discoveries.length - MAX_ENTRIES);
  }
  saveDiscoveries(discoveries);
}

/**
 * Look up if a formula was previously discovered and named.
 * Returns the custom name if found, null otherwise.
 */
export function lookupDiscovery(formula: string): string | null {
  const discoveries = loadDiscoveries();
  const found = discoveries.find(d => d.formula === formula);
  return found ? found.name : null;
}