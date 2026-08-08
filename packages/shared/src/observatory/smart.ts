/**
 * @file observatory/smart.ts — SMART Notification Logic
 * 
 * Maps notification sources to graph nodes, state glow bumps, pulse sets.
 * Powers the "deep integration" layer — shell notifications → dome glows → starfield bursts.
 */

import type { NodeInfo, AxisKey } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SOURCE → GRAPH NODE MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationSource = 
  | 'spoon'
  | 'love'
  | 'mesh'
  | 'system'
  | 'app'
  | 'assistant'
  | 'crisis'
  | 'court'
  | 'opm'
  | 'ssa'
  | 'kids'
  | 'bonding';

/**
 * Maps notification sources to related graph node IDs.
 * 
 * @param source - Notification source family
 * @returns Array of node IDs that should glow/pulse when this source fires
 */
export function sourceToGraphNodes(source: NotificationSource): string[] {
  switch (source) {
    case 'spoon':
      return ['spoon-budget', 'exec-dys', 'audhd'];
    case 'love':
      return ['love-econ', 'bonding-game', 'bonding-quest'];
    case 'mesh':
      return ['bonding-mp', 'tyler', 'robby', 'brenda'];
    case 'system':
      return ['relay', 'cloudflare', 'node-one', 'spaceship'];
    case 'app':
      return ['andromeda', 'spaceship', 'centaur', 'p31-labs'];
    case 'assistant':
      return ['centaur', 'andromeda', 'soulsafe'];
    case 'crisis':
      return ['decoherence', 'court-vexatious', 'court-contempt', 'opm-deadline'];
    case 'court':
      return ['court-mar12', 'court-contempt', 'court-vexatious', 'court-ada', 'court-void'];
    case 'opm':
      return ['opm-deadline', 'opm-3112a', 'opm-sf3107', 'opm-mail'];
    case 'ssa':
      return ['ssa-decision', 'ssa-psych', 'ssa-medical'];
    case 'kids':
      return ['kids-bash', 'kids-willow', 'kids-encopresis'];
    case 'bonding':
      return ['bonding-game', 'bonding-mp', 'bonding-quest'];
    default:
      return [];
  }
}

/**
 * Maps notification source to dominant axis (for axis-wide glows).
 * 
 * @param source - Notification source family
 * @returns Dominant axis key
 */
export function sourceToAxis(source: NotificationSource): AxisKey | null {
  switch (source) {
    case 'spoon':
    case 'crisis':
      return 'Body';
    case 'love':
    case 'mesh':
    case 'bonding':
    case 'kids':
      return 'Mesh';
    case 'system':
    case 'app':
    case 'assistant':
      return 'Forge';
    case 'court':
    case 'opm':
    case 'ssa':
      return 'Shield';
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION → PULSE EVENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface PulseEvent {
  nodeIds: string[];
  axis: AxisKey | null;
  color: string;
  intensity: number;
  burstType: 'spoon' | 'love' | 'crisis' | 'info' | 'system';
}

/**
 * Converts a notification into a pulse event for the dome + starfield.
 * 
 * @param source - Notification source
 * @param message - Optional message (for context)
 * @returns Pulse event config
 */
export function notificationToPulse(source: NotificationSource, message?: string): PulseEvent {
  const nodeIds = sourceToGraphNodes(source);
  const axis = sourceToAxis(source);

  let color = '#44aaff';
  let intensity = 0.5;
  let burstType: PulseEvent['burstType'] = 'info';

  if (source === 'spoon') {
    color = '#ffaa44';
    intensity = 0.7;
    burstType = 'spoon';
  } else if (source === 'love') {
    color = '#ff44aa';
    intensity = 0.8;
    burstType = 'love';
  } else if (source === 'crisis' || source === 'court') {
    color = '#ff4466';
    intensity = 1.0;
    burstType = 'crisis';
  } else if (source === 'system' || source === 'app') {
    color = '#44ffaa';
    intensity = 0.6;
    burstType = 'system';
  }

  return { nodeIds, axis, color, intensity, burstType };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTDOWN PULSE SET (nodes that pulse on timers)
// ═══════════════════════════════════════════════════════════════════════════════

export const COUNTDOWN_NODES = new Set([
  'kids-bash',      // Birthday T-7
  'opm-deadline',   // Filing deadline
  'court-mar12',    // Court date T-30
]);

/**
 * Checks if a node should pulse (countdown / urgent).
 * 
 * @param node - The node to check
 * @returns True if the node should pulse
 */
export function shouldPulse(node: NodeInfo): boolean {
  return COUNTDOWN_NODES.has(node.id) || node.state === 'countdown' || node.state === 'crisis';
}
