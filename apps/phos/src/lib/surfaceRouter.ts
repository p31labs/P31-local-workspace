import { SURFACE_IDS } from '../config/surfaces';

const SURFACE_PATH_MAP: Record<string, string> = {
  '': 'CHAT',
  'chat': 'CHAT',
  'dashboard': 'DASHBOARD',
  'brain-dump': 'QUANTUM_BRAIN_DUMP',
  'buffer': 'THE_BUFFER',
  'archive': 'ARCHIVE',
  'hearth': 'HEARTH',
  'vault': 'VAULT',
  'ledger': 'LEDGER',
  'open-ledger': 'OPEN_LEDGER',
  'barter': 'BARTER',
  'governance': 'GOVERNANCE',
  'passport': 'PASSPORT',
  'feedback': 'FEEDBACK',
  'sanctuary': 'SANCTUARY',
  'attest': 'ATTEST',
  'settings': 'SETTINGS',
  'arcade': 'ARCADE',
  'bonding': 'BONDING',
  'grid': 'GRID',
  'compass': 'COMPASS',
  'node-zero': 'NODE_ZERO',
  'warehouse': 'WAREHOUSE',
  'dispute': 'DISPUTE',
  'love': 'LOVE',
  'ignition': 'IGNITION',
};

const SURFACE_TO_PATH: Record<string, string> = {};
for (const [path, surface] of Object.entries(SURFACE_PATH_MAP)) {
  if (surface !== '' && !SURFACE_TO_PATH[surface]) {
    SURFACE_TO_PATH[surface] = path;
  }
}

export function pathToSurface(path: string): string | null {
  const clean = path.replace(/^\/+|\/+$/g, '').toLowerCase();
  return SURFACE_PATH_MAP[clean] || null;
}

export function surfaceToPath(surface: string): string {
  const key = SURFACE_TO_PATH[surface];
  return '/' + (key || '');
}

export function pathToInitialSurface(path: string, search: string): string {
  const params = new URLSearchParams(search);
  const legacySurface = params.get('surface');
  if (legacySurface && SURFACE_IDS.includes(legacySurface.toUpperCase())) {
    return legacySurface.toUpperCase();
  }
  const surface = pathToSurface(path);
  if (surface) return surface;
  return 'CHAT';
}
