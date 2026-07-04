// spaceship-earth/src/types/rooms.types.ts

export type RoomId = 'bonding' | 'observatory' | 'collider' | 'geodesic' | 'vault' | 'bridge' | 'buffer' | 'sovereign' | 'k4market' | 'forge' | 'glassbox' | 'resonance' | 'landing';

export interface RoomDefinition {
  id: RoomId;
  label: string;
  icon: string;
  url?: string;
  hash?: string;
}

const BONDING_URL = import.meta.env.DEV
  ? 'http://localhost:5188'
  : 'https://bonding.p31ca.org';

// Legacy ROOMS array - kept for backward compatibility
export const ROOMS: RoomDefinition[] = [
  { id: 'bonding',     label: 'BONDING',     icon: '⚛️', url: BONDING_URL, hash: '#bonding' },
  { id: 'observatory', label: 'Observatory',  icon: '🔺', hash: '#observatory' },
  { id: 'collider',    label: 'Collider',     icon: '⚛️', hash: '#collider' },
  { id: 'geodesic',    label: 'Geodesic',     icon: '🔷', hash: '#geodesic' },
  { id: 'vault',       label: 'Vault',        icon: '🔐', hash: '#vault' },
  { id: 'bridge',      label: 'Bridge',       icon: '🌐', hash: '#bridge' },
  { id: 'buffer',      label: 'Buffer',        icon: '🛡️', hash: '#buffer' },
  { id: 'sovereign',   label: 'Sovereign',    icon: '🔑', hash: '#sovereign' },
  { id: 'k4market',    label: 'K4 Market',    icon: '📐', hash: '#k4market' },
  { id: 'forge',       label: 'Content Forge', icon: '✍️', hash: '#forge' },
  { id: 'glassbox',    label: 'Glass Box',    icon: '🌀', hash: '#glassbox' },
  { id: 'resonance',   label: 'Resonance',    icon: '🎵', hash: '#resonance' },
  { id: 'landing',     label: 'QG-IDE',       icon: '💻', hash: '#landing' },
];
