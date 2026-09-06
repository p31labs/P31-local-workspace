/**
 * @file observatory/types.ts — P31 Graph Data Types
 * 
 * Pure TypeScript types for the P31 graph data dome — nodes, edges, axes, state, bus.
 * Framework-agnostic, repurposable across the ecosystem.
 */

export type AxisKey = 'Body' | 'Mesh' | 'Forge' | 'Shield';

export type Bus = 'vital' | 'ac' | 'dc';

export type NodeState = 
  | 'operational'
  | 'active'
  | 'pending'
  | 'review'
  | 'countdown'
  | 'missing'
  | 'urgent'
  | 'crisis'
  | 'emergency'
  | 'actionable'
  | 'stable'
  | 'blocked'
  | 'stale'
  | 'unknown';

export interface NodeInfo {
  id: string;
  label: string;
  axis: AxisKey;
  state: NodeState;
  bus: Bus;
  notes?: string;
}

export type EdgeRelationship = 
  | 'treats'
  | 'requires'
  | 'includes'
  | 'uses'
  | 'monitors'
  | 'litigates'
  | 'depends-on'
  | 'supports'
  | 'blocks'
  | 'relates-to';

export interface EdgeInfo {
  source: string;
  target: string;
  relationship: EdgeRelationship;
  color?: string;
}

export interface AxisConfig {
  label: string;
  color: number;
  rgb: [number, number, number];
}
