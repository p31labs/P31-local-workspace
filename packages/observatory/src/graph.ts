/**
 * @file observatory/graph.ts — P31 Graph Data (VERTICES + EDGES)
 * 
 * The canonical 58-node / 55-edge P31 graph — Body, Mesh, Forge, Shield axes.
 * State-driven glows, bus colors, axis markers.
 * 
 * This is the reference data from ObservatoryRoom.tsx, repurposed for ecosystem-wide use.
 */

import type { NodeInfo, EdgeInfo, AxisKey, AxisConfig, NodeState, Bus } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// AXIS CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const AXES: Record<AxisKey, AxisConfig> = {
  Body:   { label: 'Body',   color: 0xff9944, rgb: [255, 153, 68] },
  Mesh:   { label: 'Mesh',   color: 0x44aaff, rgb: [68, 170, 255] },
  Forge:  { label: 'Forge',  color: 0x44ffaa, rgb: [68, 255, 170] },
  Shield: { label: 'Shield', color: 0xff4466, rgb: [255, 68, 102] },
};

export const AXIS_ORDER: AxisKey[] = ['Body', 'Mesh', 'Forge', 'Shield'];

// ═══════════════════════════════════════════════════════════════════════════════
// STATE GLOW MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export const STATE_GLOW: Record<NodeState, { color: string; intensity: number; scale: number }> = {
  operational: { color: '#4488ff', intensity: 0.3, scale: 1.0 },
  active:      { color: '#44ffaa', intensity: 0.5, scale: 1.1 },
  pending:     { color: '#ffaa44', intensity: 0.4, scale: 1.0 },
  review:      { color: '#aa88ff', intensity: 0.4, scale: 1.0 },
  countdown:   { color: '#ffcc44', intensity: 0.8, scale: 1.5 }, // pulse
  missing:     { color: '#888888', intensity: 0.2, scale: 0.8 },
  urgent:      { color: '#ff8844', intensity: 0.7, scale: 1.3 },
  crisis:      { color: '#ff4466', intensity: 1.0, scale: 1.6 },
  emergency:   { color: '#ff2244', intensity: 1.2, scale: 1.8 },
  actionable:  { color: '#88ff44', intensity: 0.6, scale: 1.2 },
  stable:      { color: '#44aa88', intensity: 0.3, scale: 1.0 },
  blocked:     { color: '#ff6644', intensity: 0.5, scale: 1.0 },
  stale:       { color: '#666666', intensity: 0.1, scale: 0.9 },
  unknown:     { color: '#444444', intensity: 0.1, scale: 0.8 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUS COLOR MAPPING
// ═══════════════════════════════════════════════════════════════════════════════

export const BUS_CSS: Record<Bus, string> = {
  vital: '#ff6633',
  ac:    '#33aacc',
  dc:    '#cccc44',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VERTICES (58 nodes)
// ═══════════════════════════════════════════════════════════════════════════════

export const VERTICES: NodeInfo[] = [
  // ─── Body Axis (12) ─────────────────────────────────────────────────────────
  { id: 'med-calcitriol', label: 'Calcitriol', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Active vitamin D (hypopara)' },
  { id: 'med-effexor', label: 'Effexor XR', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Venlafaxine 150mg (depression/anxiety)' },
  { id: 'med-vyvanse', label: 'Vyvanse', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Lisdexamfetamine 30mg (ADHD)' },
  { id: 'med-calcium', label: 'Calcium', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Ca carbonate 500mg TID (hypopara)' },
  { id: 'spoon-budget', label: 'Spoon Budget', axis: 'Body', state: 'active', bus: 'vital', notes: 'Daily spoon tracking (0-5)' },
  { id: 'audhd', label: 'AuDHD', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Autism + ADHD co-occurrence' },
  { id: 'hypopara', label: 'Hypopara', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Hypoparathyroidism (chronic)' },
  { id: 'exec-dys', label: 'Exec Dysfunction', axis: 'Body', state: 'active', bus: 'vital', notes: 'Executive function challenges' },
  { id: 'fawn', label: 'Fawn Response', axis: 'Body', state: 'review', bus: 'vital', notes: 'Trauma response pattern' },
  { id: 'decoherence', label: 'Decoherence', axis: 'Body', state: 'crisis', bus: 'vital', notes: 'System-wide coherence collapse' },
  { id: 'snap', label: 'SNAP Benefits', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Food assistance (active)' },
  { id: 'medicaid', label: 'Medicaid', axis: 'Body', state: 'operational', bus: 'vital', notes: 'Health coverage (active)' },

  // ─── Mesh Axis (9) ──────────────────────────────────────────────────────────
  { id: 'kids-bash', label: 'Sebastian (7)', axis: 'Mesh', state: 'countdown', bus: 'vital', notes: 'Birthday T-7 days' },
  { id: 'kids-willow', label: 'Willow (4)', axis: 'Mesh', state: 'active', bus: 'vital', notes: 'Youngest' },
  { id: 'brenda', label: 'Brenda', axis: 'Mesh', state: 'operational', bus: 'vital', notes: 'Co-parent' },
  { id: 'tyler', label: 'Tyler', axis: 'Mesh', state: 'operational', bus: 'ac', notes: 'Friend / mesh peer' },
  { id: 'robby', label: 'Robby', axis: 'Mesh', state: 'operational', bus: 'ac', notes: 'Friend / support' },
  { id: 'bonding-game', label: 'Bonding (game)', axis: 'Mesh', state: 'active', bus: 'ac', notes: 'Family bonding game engine' },
  { id: 'bonding-mp', label: 'Bonding Multiplayer', axis: 'Mesh', state: 'pending', bus: 'ac', notes: 'WebRTC mesh sync' },
  { id: 'bonding-quest', label: 'Quest Mode', axis: 'Mesh', state: 'pending', bus: 'ac', notes: 'Care task gamification' },
  { id: 'kids-encopresis', label: 'Encopresis', axis: 'Mesh', state: 'urgent', bus: 'vital', notes: 'Pediatric GI care (active)' },

  // ─── Forge Axis (20) ────────────────────────────────────────────────────────
  { id: 'p31-labs', label: 'P31 Labs', axis: 'Forge', state: 'active', bus: 'ac', notes: 'Org umbrella' },
  { id: 'spaceship', label: 'Spaceship Earth', axis: 'Forge', state: 'active', bus: 'ac', notes: 'This app (DUNA dome)' },
  { id: 'buffer', label: 'Buffer', axis: 'Forge', state: 'active', bus: 'ac', notes: 'Sovereign web platform' },
  { id: 'node-one', label: 'Node One', axis: 'Forge', state: 'operational', bus: 'ac', notes: 'Node Zero relay (Cloudflare)' },
  { id: 'whale', label: 'Whale', axis: 'Forge', state: 'pending', bus: 'dc', notes: 'Future project' },
  { id: 'centaur', label: 'Centaur', axis: 'Forge', state: 'pending', bus: 'dc', notes: 'AI copilot concept' },
  { id: 'andromeda', label: 'Andromeda', axis: 'Forge', state: 'operational', bus: 'ac', notes: 'CLI toolchain' },
  { id: 'genesis', label: 'Genesis', axis: 'Forge', state: 'operational', bus: 'ac', notes: 'Love ledger genesis block' },
  { id: 'love-econ', label: 'LOVE Economy', axis: 'Forge', state: 'active', bus: 'ac', notes: 'Care credit system' },
  { id: 'phosphorus31', label: 'Phosphorus31.org', axis: 'Forge', state: 'operational', bus: 'dc', notes: 'Public site' },
  { id: 'p31ca-site', label: 'p31ca.org', axis: 'Forge', state: 'operational', bus: 'dc', notes: 'Main landing' },
  { id: 'hcb', label: 'HCB', axis: 'Forge', state: 'operational', bus: 'dc', notes: 'Hack Club Bank (fiscal host)' },
  { id: 'stripe-wallet', label: 'Stripe Wallet', axis: 'Forge', state: 'operational', bus: 'dc', notes: 'Payment rails' },
  { id: 'cloudflare', label: 'Cloudflare', axis: 'Forge', state: 'operational', bus: 'ac', notes: 'Edge infra (Workers/Pages)' },
  { id: 'relay', label: 'Node Zero Relay', axis: 'Forge', state: 'operational', bus: 'ac', notes: 'Sovereign bridge' },
  { id: 'posner', label: 'Posner Molecule', axis: 'Forge', state: 'review', bus: 'dc', notes: 'Quantum phosphate concept' },
  { id: 'larmor', label: 'Larmor Freq', axis: 'Forge', state: 'operational', bus: 'dc', notes: '863 Hz P31 resonance' },
  { id: 'ivm', label: 'IVM Protocol', axis: 'Forge', state: 'pending', bus: 'dc', notes: 'Isolated VM sandbox' },
  { id: 'wye-delta', label: 'Wye-Delta', axis: 'Forge', state: 'pending', bus: 'dc', notes: 'Power transform concept' },
  { id: 'soulsafe', label: 'SOULSAFE', axis: 'Forge', state: 'active', bus: 'ac', notes: '3-gate verification protocol' },

  // ─── Shield Axis (17) ───────────────────────────────────────────────────────
  { id: 'opm-3112a', label: 'OPM SF-3112A', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Disability app (agency cert)' },
  { id: 'opm-3112b', label: 'OPM SF-3112B', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Applicant statement' },
  { id: 'opm-3112c', label: 'OPM SF-3112C', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Physician statement' },
  { id: 'opm-3112d', label: 'OPM SF-3112D', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Accommodation history' },
  { id: 'opm-3112e', label: 'OPM SF-3112E', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Medical documentation' },
  { id: 'opm-sf3107', label: 'OPM SF-3107', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'FERS disability retirement' },
  { id: 'opm-deadline', label: 'OPM Deadline', axis: 'Shield', state: 'countdown', bus: 'vital', notes: 'Filing deadline (urgent)' },
  { id: 'opm-mail', label: 'OPM Mail', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Physical mail tracking' },
  { id: 'court-mar12', label: 'Mar 12 Hearing', axis: 'Shield', state: 'countdown', bus: 'vital', notes: 'Court date T-30' },
  { id: 'court-contempt', label: 'Contempt Motion', axis: 'Shield', state: 'urgent', bus: 'vital', notes: 'Filed; awaiting ruling' },
  { id: 'court-vexatious', label: 'Vexatious Litigant', axis: 'Shield', state: 'crisis', bus: 'vital', notes: 'Defense strategy' },
  { id: 'court-ada', label: 'ADA Accommodation', axis: 'Shield', state: 'active', bus: 'vital', notes: 'Court access request' },
  { id: 'court-void', label: 'Void Judgment', axis: 'Shield', state: 'urgent', bus: 'vital', notes: 'Motion to vacate' },
  { id: 'court-tsp', label: 'TSP Garnish', axis: 'Shield', state: 'blocked', bus: 'vital', notes: 'Thrift Savings Plan hold' },
  { id: 'ssa-psych', label: 'SSA Psych Eval', axis: 'Shield', state: 'review', bus: 'vital', notes: 'Disability eval' },
  { id: 'ssa-medical', label: 'SSA Medical Records', axis: 'Shield', state: 'active', bus: 'vital', notes: 'Records request' },
  { id: 'ssa-decision', label: 'SSA Decision', axis: 'Shield', state: 'pending', bus: 'vital', notes: 'Disability claim ruling' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EDGES (55 typed relationships)
// ═══════════════════════════════════════════════════════════════════════════════

export const EDGES: EdgeInfo[] = [
  // ─── Body Internals (7) ─────────────────────────────────────────────────────
  { source: 'med-calcitriol', target: 'hypopara', relationship: 'treats' },
  { source: 'med-calcium', target: 'hypopara', relationship: 'treats' },
  { source: 'med-effexor', target: 'audhd', relationship: 'treats' },
  { source: 'med-vyvanse', target: 'audhd', relationship: 'treats' },
  { source: 'audhd', target: 'exec-dys', relationship: 'includes' },
  { source: 'exec-dys', target: 'spoon-budget', relationship: 'requires' },
  { source: 'decoherence', target: 'fawn', relationship: 'relates-to' },

  // ─── Family Mesh (7) ────────────────────────────────────────────────────────
  { source: 'kids-bash', target: 'bonding-game', relationship: 'uses' },
  { source: 'kids-willow', target: 'bonding-game', relationship: 'uses' },
  { source: 'brenda', target: 'kids-bash', relationship: 'supports' },
  { source: 'brenda', target: 'kids-willow', relationship: 'supports' },
  { source: 'bonding-game', target: 'bonding-mp', relationship: 'depends-on' },
  { source: 'bonding-quest', target: 'love-econ', relationship: 'uses' },
  { source: 'kids-encopresis', target: 'medicaid', relationship: 'requires' },

  // ─── FERS Chain (7) ─────────────────────────────────────────────────────────
  { source: 'opm-3112a', target: 'opm-3112b', relationship: 'includes' },
  { source: 'opm-3112a', target: 'opm-3112c', relationship: 'includes' },
  { source: 'opm-3112a', target: 'opm-3112d', relationship: 'includes' },
  { source: 'opm-3112a', target: 'opm-3112e', relationship: 'includes' },
  { source: 'opm-sf3107', target: 'opm-3112a', relationship: 'requires' },
  { source: 'opm-deadline', target: 'opm-sf3107', relationship: 'monitors' },
  { source: 'opm-mail', target: 'opm-sf3107', relationship: 'supports' },

  // ─── Legal Chain (5) ────────────────────────────────────────────────────────
  { source: 'court-contempt', target: 'court-mar12', relationship: 'relates-to' },
  { source: 'court-vexatious', target: 'court-contempt', relationship: 'blocks' },
  { source: 'court-ada', target: 'court-mar12', relationship: 'supports' },
  { source: 'court-void', target: 'court-tsp', relationship: 'relates-to' },
  { source: 'ssa-decision', target: 'ssa-psych', relationship: 'depends-on' },

  // ─── Products (9) ───────────────────────────────────────────────────────────
  { source: 'p31-labs', target: 'spaceship', relationship: 'includes' },
  { source: 'p31-labs', target: 'buffer', relationship: 'includes' },
  { source: 'p31-labs', target: 'andromeda', relationship: 'includes' },
  { source: 'p31-labs', target: 'love-econ', relationship: 'includes' },
  { source: 'spaceship', target: 'node-one', relationship: 'uses' },
  { source: 'buffer', target: 'node-one', relationship: 'uses' },
  { source: 'andromeda', target: 'genesis', relationship: 'uses' },
  { source: 'love-econ', target: 'genesis', relationship: 'depends-on' },
  { source: 'bonding-quest', target: 'love-econ', relationship: 'uses' },

  // ─── Infrastructure (6) ─────────────────────────────────────────────────────
  { source: 'node-one', target: 'cloudflare', relationship: 'uses' },
  { source: 'relay', target: 'cloudflare', relationship: 'uses' },
  { source: 'p31ca-site', target: 'cloudflare', relationship: 'uses' },
  { source: 'phosphorus31', target: 'cloudflare', relationship: 'uses' },
  { source: 'hcb', target: 'stripe-wallet', relationship: 'uses' },
  { source: 'love-econ', target: 'hcb', relationship: 'uses' },

  // ─── Concepts (4) ───────────────────────────────────────────────────────────
  { source: 'posner', target: 'larmor', relationship: 'relates-to' },
  { source: 'soulsafe', target: 'ivm', relationship: 'uses' },
  { source: 'wye-delta', target: 'larmor', relationship: 'relates-to' },
  { source: 'centaur', target: 'andromeda', relationship: 'depends-on' },

  // ─── Support (3) ────────────────────────────────────────────────────────────
  { source: 'tyler', target: 'bonding-mp', relationship: 'supports' },
  { source: 'robby', target: 'p31-labs', relationship: 'supports' },
  { source: 'brenda', target: 'kids-encopresis', relationship: 'monitors' },

  // ─── SSA (4) ────────────────────────────────────────────────────────────────
  { source: 'ssa-psych', target: 'ssa-medical', relationship: 'requires' },
  { source: 'ssa-decision', target: 'ssa-medical', relationship: 'depends-on' },
  { source: 'ssa-medical', target: 'audhd', relationship: 'relates-to' },
  { source: 'ssa-medical', target: 'hypopara', relationship: 'relates-to' },

  // ─── Benefits (3) ───────────────────────────────────────────────────────────
  { source: 'medicaid', target: 'ssa-decision', relationship: 'depends-on' },
  { source: 'snap', target: 'ssa-decision', relationship: 'relates-to' },
  { source: 'opm-sf3107', target: 'court-tsp', relationship: 'blocks' },
];
