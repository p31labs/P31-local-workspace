/**
 * @file schema.ts — Universal Tetrahedron JSON Schema for P31
 *
 * Every entity in the P31 software stack conforms to this single contract.
 * From a single calcium value to the global marketplace, all data expresses
 * as a 4-vertex, 6-edge K4 tetrahedron with recursive nesting.
 *
 * This is the "Synergetic Coordinate System" — pure Bucky Fuller.
 * Scale is not a different format; it's a different depth in the recursion.
 */

import { TETRA_VERTICES } from './tetra';

// ── Schema version ─────────────────────────────────────────────────────────

export const TETRA_SCHEMA = 'p31.tetra/v1' as const;

// ── Entity classification ───────────────────────────────────────────────────

export type TetraClass = 
  | 'PHYSIOLOGICAL'        // Single person's vitals (Ca, HRV, Spoons, Genesis)
  | 'FAMILY_CAGE'          // 4-person family tetrahedron
  | 'AGENT_HUB'            // AI agent cluster (4 agents)
  | 'MARKETPLACE'          // Economic exchange node
  | 'ECOSYSTEM'            // Global system state
  | 'ROOM'                 // Physical/virtual space occupancy
  | 'CAR'                  // Vehicle/transport node
  | 'MESH_NODE'            // Individual K4 network node
  | 'BONDING_GAME'         // BONDING chemistry game state
  | 'SPACESHIP_EARTH';     // Dashboard instance itself

export type TetraScale = 'personal' | 'family' | 'hub' | 'marketplace' | 'ecosystem';

// ── Core tetrahedron data structure ────────────────────────────────────────

export interface TetraVertex {
  /** Unique identifier within this tetrahedron */
  id: string;
  /** Human-readable label */
  label: string;
  /** Normalized value (0-1). Maps to size/glow/position offset */
  val: number;
  /** Primary color for this vertex */
  color: string;
  /** Optional raw data payload (FHIR Observation, Stripe charge, etc.) */
  raw?: unknown;
  /** Vertex type for visualization hints */
  type?: 'sensor' | 'actuator' | 'processor' | 'memory' | 'network';
}

export interface TetraEdge {
  /** Source vertex id */
  source: string;
  /** Target vertex id */
  target: string;
  /** Connection strength (0-1). Maps to edge thickness/brightness */
  weight: number;
  /** Optional relationship type */
  relation?: 'flow' | 'causal' | 'synchrony' | 'dependency';
}

export interface TetraMetadata {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Data source identifier */
  source: string;
  /** Schema version */
  version: string;
  /** Scale of this tetrahedron */
  scale: TetraScale;
  /** Entity class */
  class: TetraClass;
  /** Optional parent tetrahedron id (for recursion) */
  parent_id?: string;
  /** Optional depth in recursion tree (0 = root) */
  depth?: number;
}

export interface TetraData {
  schema: typeof TETRA_SCHEMA;
  id: string;
  metadata: TetraMetadata;
  vertices: TetraVertex[];
  edges: TetraEdge[];
  sub_tetras?: Record<string, TetraData>;  // Recursive children (for zoom)
  parent_id?: string;        // Parent tetrahedron id
  parent_hash?: string;      // SHA-256 of parent for consistency
  transform?: {
    rotation?: [number, number, number];  // Euler angles in radians
    scale?: number;                        // Overall scale multiplier
    jitterbugPhase?: number;               // 0=tetra, 0.5=octa, 1=cube
    opacity?: number;                      // 0-1 for fade transitions
  };
}

// ── Validation helpers ──────────────────────────────────────────────────────

export function validateTetra(data: unknown): data is TetraData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  
  if (d.schema !== TETRA_SCHEMA) return false;
  if (typeof d.id !== 'string') return false;
  if (typeof d.metadata !== 'object') return false;
  
  const meta = d.metadata as Record<string, unknown>;
  if (typeof meta.scale !== 'string') return false;
  if (typeof meta.class !== 'string') return false;
  
  const vertices = d.vertices as Array<unknown> | undefined;
  if (!Array.isArray(vertices) || vertices.length !== 4) return false;
  
  const edges = d.edges as Array<unknown> | undefined;
  if (!Array.isArray(edges) || edges.length !== 6) return false;
  
  return true;
}

// ── Factory functions for common tetrahedron types ─────────────────────────

export function createPhysiologicalTetra(
  id: string,
  calcium: number,
  hrv: number,
  spoons: number,
  genesisSync: number
): TetraData {
  // Normalize values to 0-1 range
  const norm = (val: number, min: number, max: number) => Math.max(0, Math.min(1, (val - min) / (max - min)));
  
  return {
    schema: TETRA_SCHEMA,
    id,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'k4-personal',
      version: '1.0.0',
      scale: 'personal',
      class: 'PHYSIOLOGICAL',
    },
    vertices: [
      { id: 'v0', label: 'Calcium', val: norm(calcium, 7.5, 9.5), color: '#FFD93D', raw: { calcium, unit: 'mg/dL' } },
      { id: 'v1', label: 'HRV',     val: norm(hrv, 30, 100),        color: '#4D96FF', raw: { hrv, unit: 'ms' } },
      { id: 'v2', label: 'Spoons',  val: norm(spoons, 0, 12),       color: '#9B59B6', raw: { spoons } },
      { id: 'v3', label: 'Genesis',  val: genesisSync,                color: '#6BCB77', raw: { sync: genesisSync } },
    ],
    edges: [
      { source: 'v0', target: 'v1', weight: 0.7, relation: 'causal' },
      { source: 'v0', target: 'v2', weight: 0.8, relation: 'dependency' },
      { source: 'v0', target: 'v3', weight: 0.6, relation: 'synchrony' },
      { source: 'v1', target: 'v2', weight: 0.5, relation: 'flow' },
      { source: 'v1', target: 'v3', weight: 0.7, relation: 'synchrony' },
      { source: 'v2', target: 'v3', weight: 0.4, relation: 'flow' },
    ],
  };
}

export function createHubTetra(
  id: string,
  nodeCount: number,
  activeConnections: number,
  messageRate: number,
  healthScore: number
): TetraData {
  return {
    schema: TETRA_SCHEMA,
    id,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'p31ca-hub',
      version: '1.0.0',
      scale: 'hub',
      class: 'AGENT_HUB',
    },
    vertices: [
      { id: 'v0', label: 'Nodes',     val: nodeCount / 100,       color: '#00D4FF' },
      { id: 'v1', label: 'Connections', val: activeConnections / 1000, color: '#00FF88' },
      { id: 'v2', label: 'Throughput', val: messageRate / 10000,   color: '#FFD93D' },
      { id: 'v3', label: 'Health',    val: healthScore,           color: '#EF4444' },
    ],
    edges: [
      { source: 'v0', target: 'v1', weight: 0.9 },
      { source: 'v0', target: 'v2', weight: 0.8 },
      { source: 'v0', target: 'v3', weight: 0.7 },
      { source: 'v1', target: 'v2', weight: 0.9 },
      { source: 'v1', target: 'v3', weight: 0.6 },
      { source: 'v2', target: 'v3', weight: 0.5 },
    ],
  };
}

export function createMarketplaceTetra(
  id: string,
  buyers: number,
  sellers: number,
  liquidity: number,
  volume: number
): TetraData {
  const norm = (v: number, max: number) => Math.min(1, v / max);
  
  return {
    schema: TETRA_SCHEMA,
    id,
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'p31-marketplace',
      version: '1.0.0',
      scale: 'marketplace',
      class: 'MARKETPLACE',
    },
    vertices: [
      { id: 'v0', label: 'Buyers',    val: norm(buyers, 1000),    color: '#4D96FF' },
      { id: 'v1', label: 'Sellers',   val: norm(sellers, 500),     color: '#FFD93D' },
      { id: 'v2', label: 'Liquidity', val: norm(liquidity, 1e6),  color: '#6BCB77' },
      { id: 'v3', label: 'Volume',    val: norm(volume, 1e7),      color: '#9B59B6' },
    ],
    edges: [
      { source: 'v0', target: 'v1', weight: 0.9, relation: 'flow' },
      { source: 'v0', target: 'v2', weight: 0.6 },
      { source: 'v0', target: 'v3', weight: 0.8 },
      { source: 'v1', target: 'v2', weight: 0.7 },
      { source: 'v1', target: 'v3', weight: 0.9 },
      { source: 'v2', target: 'v3', weight: 0.8 },
    ],
  };
}

// ── Serialization / Deserialization ────────────────────────────────────────

export function tetraToJSON(tetra: TetraData): string {
  return JSON.stringify(tetra, null, 2);
}

export function tetraFromJSON(json: string): TetraData | null {
  try {
    const parsed = JSON.parse(json);
    if (validateTetra(parsed)) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

// ── Hashing for consistency (Daubert chain) ─────────────────────────────────

export async function hashTetra(tetra: TetraData): Promise<string> {
  const canonical = JSON.stringify({
    schema: tetra.schema,
    id: tetra.id,
    metadata: tetra.metadata,
    vertices: tetra.vertices.map(v => ({ id: v.id, label: v.label, val: v.val })),
    edges: tetra.edges.map(e => ({ source: e.source, target: e.target, weight: e.weight })),
  });
  
  const buf = new TextEncoder().encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Default export ──────────────────────────────────────────────────────────

export default {
  createPhysiologicalTetra,
  createHubTetra,
  createMarketplaceTetra,
  tetraToJSON,
  tetraFromJSON,
  hashTetra,
  validateTetra,
  TETRA_VERTICES,
  TETRA_SCHEMA,
};
