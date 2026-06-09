/**
 * P31 Digital Consciousness Surrogate — TypeScript Data Contracts
 * 
 * Vertex 3 (Interface Node) — Data contracts binding UI to Vertex 2's output
 * These interfaces bind the Cockpit UI to the backend's async data streams.
 */

// ═══════════════════════════════════════════════════════════════════
// Voltage & Entropy Contracts
// ═══════════════════════════════════════════════════════════════════

/**
 * Voltage log payload pushed by Catcher's Mitt backend
 * Contains deterministic voltage score with entropy hash
 */
export interface VoltageLogPayload {
  id: number;
  timestamp: string;
  voltage_level: number; // 0-100
  entropy_hash: string;
}

/**
 * Catcher's Mitt signal tier levels
 */
export type VoltageTier = 'LOW' | 'MODERATE' | 'HIGH';

/**
 * Complete Catcher's Mitt signal from backend
 */
export interface CatchersMittSignal {
  message_id: string;
  bluf_summary: string; // Bottom Line Up Front
  voltage_score: number;
  tier: VoltageTier;
  raw_sequestered: boolean;
}

/**
 * Voltage threshold configuration
 */
export const VOLTAGE_THRESHOLDS = {
  LOW_MAX: 30,
  MODERATE_MAX: 70,
  HIGH_MAX: 100,
} as const;

/**
 * Determine voltage tier from score
 */
export function getVoltageTier(score: number): VoltageTier {
  if (score <= VOLTAGE_THRESHOLDS.LOW_MAX) return 'LOW';
  if (score <= VOLTAGE_THRESHOLDS.MODERATE_MAX) return 'MODERATE';
  return 'HIGH';
}

// ═══════════════════════════════════════════════════════════════════
// Metabolic Economics Contracts
// ═══════════════════════════════════════════════════════════════════

/**
 * Metabolic state including spoon economy
 */
export interface MetabolicState {
  current_spoons: number;
  max_spoons: number;
  heartbeat_lockout_active: boolean;
}

/**
 * Spoon economy configuration
 */
export const SPOON_CONFIG = {
  BASELINE: 12,
  LOW_THRESHOLD: 0.25, // 25% triggers Heartbeat Lockout
  CLICK_RESTORE: 0.5,
} as const;

/**
 * Get spoon percentage
 */
export function getSpoonPercentage(current: number, max: number): number {
  return Math.max(0, Math.min(100, (current / max) * 100));
}

/**
 * Check if heartbeat lockout should be active
 */
export function isHeartbeatLockoutActive(currentSpoons: number, maxSpoons: number): boolean {
  const percentage = getSpoonPercentage(currentSpoons, maxSpoons);
  return percentage < (SPOON_CONFIG.LOW_THRESHOLD * 100);
}

// ═══════════════════════════════════════════════════════════════════
// Z-Index Cockpit Doctrine
// ═══════════════════════════════════════════════════════════════════

/**
 * Z-index layer values — digital equivalent of OS kernel ring privileges
 * Higher numbers always supersede lower numbers
 */
export const Z_LAYERS = {
  VOID: 0,           // Void starfield, background
  CANVAS: 1,         // WebGL context, core logic
  ROOM_HUD: 10,      // Application-specific 2D overlays
  ROUTER_NAV: 11,    // Room switcher bar
  TOAST: 50,         // System toasts (non-blocking alerts)
  MODAL: 60,         // System settings, LOVE Wallet
  HANDSHAKE: 60,     // Same as modal for consistency
  CENTAUR: 80,       // Persistent AI chat window
  BOOT: 100,         // Cryptographic authentication walls
  ONBOARDING: 200,   // 5-phase initialization sequence
} as const;

/**
 * Z-layer display names
 */
export const Z_LAYER_NAMES: Record<keyof typeof Z_LAYERS, string> = {
  VOID: 'Void Starfield',
  CANVAS: 'Canvas',
  ROOM_HUD: 'Room HUD',
  ROUTER_NAV: 'Navigation',
  TOAST: 'System Toast',
  MODAL: 'System Modal',
  HANDSHAKE: 'Handshake',
  CENTAUR: 'Centaur Terminal',
  BOOT: 'Boot Screen',
  ONBOARDING: 'Onboarding',
};

// ═══════════════════════════════════════════════════════════════════
// Fawn Guard Contracts
// ═══════════════════════════════════════════════════════════════════

/**
 * Fawn Guard detection result
 */
export interface FawnGuardResult {
  flagged: boolean;
  markers: FawnMarker[];
  confidence: number;
}

/**
 * Submissive linguistic markers
 */
export type FawnMarker = 
  | 'apologetic_language'
  | 'self_deprecation'
  | 'passive_voice'
  | 'excessive_pleasing'
  | 'hedging'
  | 'diminished_agency';

/**
 * Fawn Guard configuration
 */
export const FAWN_GUARD_CONFIG = {
  MIN_CONFIDENCE: 0.6,
  MARKERS: [
    'apologetic_language',
    'self_deprecation', 
    'passive_voice',
    'excessive_pleasing',
    'hedging',
    'diminished_agency',
  ] as FawnMarker[],
} as const;

/**
 * Regex patterns for fawn detection (expanded set)
 */
export const FAWN_PATTERNS: Record<FawnMarker, RegExp> = {
  apologetic_language: /sorry|apologize|i'm sorry|my fault|forgive|excuse me/i,
  self_deprecation: /i'm stupid|i'm dumb|i'm useless|i'm worthless|i can't|i never|i always|my mistake/i,
  passive_voice: /(?:is|are|was|were|been|being) (?:being )?(?:done|hurt|ignored| dismissed|overlooked)/i,
  excessive_pleasing: /please|i hope it's okay|i don't mean to|i was wondering|would you mind|i hate to ask/i,
  hedging: /maybe|i think|i guess|i suppose|i feel like|perhaps|possibly|might|could be/i,
  diminished_agency: /i don't know|i have no idea|i'm not sure|i can't decide/i,
};

// ═══════════════════════════════════════════════════════════════════
// Room Router Contracts
// ═══════════════════════════════════════════════════════════════════

/**
 * Room types available in the cockpit
 */
export type RoomType = 
  | 'observatory'
  | 'collider'
  | 'bonding'
  | 'bridge'
  | 'buffer';

/**
 * Room definition for routing
 */
export interface RoomDefinition {
  id: RoomType;
  label: string;
  icon: string;
  zIndex: number;
  component?: string;
}

/**
 * All available rooms
 */
export const ROOMS: RoomDefinition[] = [
  { id: 'observatory', label: 'Observatory', icon: '🔭', zIndex: Z_LAYERS.ROOM_HUD },
  { id: 'collider', label: 'Collider', icon: '⚛️', zIndex: Z_LAYERS.ROOM_HUD },
  { id: 'bonding', label: 'BONDING', icon: '🔗', zIndex: Z_LAYERS.ROOM_HUD },
  { id: 'bridge', label: 'Bridge', icon: '🌉', zIndex: Z_LAYERS.ROOM_HUD },
  { id: 'buffer', label: 'Buffer', icon: '🧠', zIndex: Z_LAYERS.ROOM_HUD },
];

// ═══════════════════════════════════════════════════════════════════
// Color Palette (matching P31 Cognitive Passport)
// ═══════════════════════════════════════════════════════════════════

export const COCKPIT_COLORS = {
  phosphorus: '#00FF88',
  quantum_cyan: '#00D4FF',
  quantum_violet: '#7A27FF',
  phosphorus_orange: '#FF6600',
  calcium_amber: '#F59E0B',
  danger_red: '#EF4444',
  void: '#050510',
  void_light: '#0B0F19',
  text_primary: '#E8ECF4',
  body_axis: '#ff9944',
  mesh_axis: '#44aaff',
  forge_axis: '#44ffaa',
  shield_axis: '#ff4466',
} as const;

// ═══════════════════════════════════════════════════════════════════
// Export all contracts as a single module
// ═══════════════════════════════════════════════════════════════════

export type {
  // Re-export for convenience
};

export const ALL_CONTRACTS = {
  VOLTAGE_THRESHOLDS,
  SPOON_CONFIG,
  Z_LAYERS,
  Z_LAYER_NAMES,
  FAWN_GUARD_CONFIG,
  ROOMS,
  COCKPIT_COLORS,
} as const;
