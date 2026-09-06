/**
 * @file features.ts — Unified feature & add-on registry for the P31 Sovereign Mesh.
 *
 * Single source of truth spanning components, app surfaces, workers, skins,
 * templates, blocks, and add-ons. Powers the Design Catalog, Marketplace, and
 * adoption analytics. Seeded from the existing `components.ts` (14 UI components),
 * the documented 14-worker fleet, the PHOS/WILLOW surface inventories, and the
 * 4 installable skins.
 *
 * Dynamic marketplace listings (user-published add-ons) live in the
 * `marketplace_listings` D1 table and are merged at read time by featureRegistry.ts.
 */

export type FeatureType =
  | 'component'
  | 'surface'
  | 'worker'
  | 'skin'
  | 'template'
  | 'block'
  | 'addon';

export type Maturity = 'alpha' | 'beta' | 'stable' | 'deprecated';
export type FeatureStatus = 'active' | 'draft' | 'archived';

export interface Feature {
  id: string;
  name: string;
  type: FeatureType;
  category: string;
  description: string;
  version: string;
  maturity: Maturity;
  status: FeatureStatus;
  usedBy: string[];
  dependencies?: string[];
  marketplace?: { listingId?: string; price?: number; published: boolean };
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

const NOW = 1752900000000; // 2026-07-19 (CWP-2026-069/070 epoch)

/* ── Components (from data/components.ts) ──────────────────────────────── */
const COMPONENT_FEATURES: Feature[] = [
  { id: 'app-nav', name: 'AppNav', type: 'component', category: 'chrome', description: 'Canonical SPA header — BrandMark, nav links, SpoonDial, companion trigger.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos', 'willow'], tags: ['navigation'] },
  { id: 'site-nav', name: 'SiteNav', type: 'component', category: 'chrome', description: 'Canonical Astro header — brand box, spoon pips, dyslexia toggle.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phosphorus31', 'p31ca'], tags: ['navigation'] },
  { id: 'brand-mark', name: 'BrandMark', type: 'component', category: 'chrome', description: 'P31 brand glyph — gradient icon + app name + tagline.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['brand'] },
  { id: 'spoon-dial', name: 'SpoonDial', type: 'component', category: 'chrome', description: 'Spoon-level selector — pips or buttons, crisis toggle.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['spoons', 'a11y'] },
  { id: 'sovereignty-strip', name: 'SovereigntyStrip', type: 'component', category: 'chrome', description: 'Persistent identity strip — passport name, pronouns, sovereign badge.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['identity'] },
  { id: 'companion-panel', name: 'CompanionPanel', type: 'component', category: 'chrome', description: 'Tabbed slide-over — Companion + Settings tabs.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['care'] },
  { id: 'footer', name: 'Footer', type: 'component', category: 'layout', description: 'Institutional footer — products, org links, copyright.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phosphorus31'], tags: ['layout'] },
  { id: 'glass-card', name: 'GlassCard', type: 'component', category: 'ui', description: 'Glassmorphic card — subtle/strong, accent border.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['glass'] },
  { id: 'glow-button', name: 'GlowButton', type: 'component', category: 'ui', description: 'Accent-glow button — 5 colors, 3 sizes, 3 variants.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['button'] },
  { id: 'skip-link', name: 'SkipLink', type: 'component', category: 'chrome', description: 'Skip-to-content link — WCAG 2.2 compliant.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['a11y'] },
  { id: 'starfield', name: 'Starfield', type: 'component', category: 'ui', description: 'GPU particle field — spoon-aware density, accent tint.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['ambient'] },
  { id: 'k4-hero', name: 'K4Hero', type: 'component', category: 'ui', description: 'Animated K4 tetrahedron SVG.', version: '1.0.0', maturity: 'beta', status: 'active', usedBy: ['bonding'], tags: ['geometry'] },
  { id: 'spoon-orbit', name: 'SpoonOrbit', type: 'component', category: 'ui', description: 'Breathing core + 5 orbiting nodes on SMIL paths.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['spoons'] },
  { id: 'crisis-overlay', name: 'CrisisOverlay', type: 'component', category: 'layout', description: 'Full-screen breathing overlay — activates at spoons=0.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['all'], tags: ['crisis', 'a11y'] },
].map((f) => ({ ...f, createdAt: NOW, updatedAt: NOW })) as Feature[];

/* ── Workers (14-fleet, AGENTS.md) ─────────────────────────────────────── */
const WORKER_FEATURES: Feature[] = [
  'love-ledger', 'intent-resolver', 'federation-bridge', 'genesis-gate', 'ledger-bridge',
  'creation-accountant', 'care-mesh', 'agent-runtime', 'p31-mcp-server', 'phos-backup',
  'fawn-guard', 'governance-engine', 'contract-engine', 'vibe-sandbox',
].map((id) => ({
  id,
  name: id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
  type: 'worker' as FeatureType,
  category: 'backend',
  description: `Cloudflare Worker — ${id}.`,
  version: '0.0.1',
  maturity: 'stable' as Maturity,
  status: 'active' as FeatureStatus,
  usedBy: ['phos', 'willow', 'p31ca', 'phosphorus31', 'tetra-ops'],
  tags: ['worker', 'cloudflare'],
  createdAt: NOW,
  updatedAt: NOW,
}));

/* ── Skins (4 installable) ──────────────────────────────────────────────── */
const SKIN_FEATURES: Feature[] = [
  { id: 'skin-willow', name: 'WILLOW Skin', type: 'skin', category: 'theme', description: 'Child companion skin — green accent, garden palette.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['willow'], dependencies: ['design-core'], tags: ['skin'] },
  { id: 'skin-phos', name: 'PHOS Skin', type: 'skin', category: 'theme', description: 'Adult workspace skin — violet accent, void palette.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos'], dependencies: ['design-core'], tags: ['skin'] },
  { id: 'skin-tetra', name: 'TETRA Skin', type: 'skin', category: 'theme', description: 'Ops hub skin — gold accent.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['tetra-ops'], dependencies: ['design-core'], tags: ['skin'] },
  { id: 'skin-apex', name: 'APEX Skin', type: 'skin', category: 'theme', description: 'High-contrast skin — cyan accent.', version: '1.0.0', maturity: 'beta', status: 'active', usedBy: ['all'], dependencies: ['design-core'], tags: ['skin'] },
].map((f) => ({ ...f, createdAt: NOW, updatedAt: NOW })) as Feature[];

/* ── PHOS surface clusters (representative surfaces) ────────────────────── */
const PHOS_SURFACES: Feature[] = [
  'dashboard', 'passport', 'compass', 'forge', 'cognitive', 'arcade', 'code', 'developer',
  'vault', 'ledger', 'marketplace', 'caremint', 'justice', 'bonding', 'spaceship',
  'ecosystem', 'trustgraph', 'family', 'health', 'school', 'pilot', 'brain', 'telemetry',
  'workers', 'mcp', 'settings',
].map((id) => ({
  id: `surface-phos-${id}`,
  name: `PHOS · ${id[0].toUpperCase()}${id.slice(1)}`,
  type: 'surface' as FeatureType,
  category: 'phos',
  description: `PHOS ambient workspace surface — ${id}.`,
  version: '1.0.0',
  maturity: 'stable' as Maturity,
  status: 'active' as FeatureStatus,
  usedBy: ['phos'],
  tags: ['surface', 'phos'],
  createdAt: NOW,
  updatedAt: NOW,
}));

/* ── WILLOW garden rooms (representative) ───────────────────────────────── */
const WILLOW_SURFACES: Feature[] = [
  'home', 'draw', 'voice', 'magic', 'feelings', 'family', 'memory', 'bubbles',
  'catch', 'quests', 'diary', 'portal',
].map((id) => ({
  id: `surface-willow-${id}`,
  name: `WILLOW · ${id[0].toUpperCase()}${id.slice(1)}`,
  type: 'surface' as FeatureType,
  category: 'willow',
  description: `WILLOW garden room — ${id}.`,
  version: '1.0.0',
  maturity: 'stable' as Maturity,
  status: 'active' as FeatureStatus,
  usedBy: ['willow'],
  tags: ['surface', 'willow'],
  createdAt: NOW,
  updatedAt: NOW,
}));

/* ── Add-ons (key ecosystem extensions) ────────────────────────────────── */
const ADDON_FEATURES: Feature[] = [
  { id: 'addon-roblox-bridge', name: 'Roblox Bridge', type: 'addon', category: 'bridge', description: 'World CRUD + P31 skin injection for Roblox.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos', 'willow'], dependencies: ['design-core'], marketplace: { published: false }, tags: ['roblox', 'addon'] },
  { id: 'addon-vibe-engine', name: 'Vibe Engine', type: 'addon', category: 'ai', description: 'vibe-sdk + Generate + sandbox + app-supervisor.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos'], dependencies: ['cognitive'], marketplace: { published: false }, tags: ['ai', 'addon'] },
  { id: 'addon-page-builder', name: 'Page Builder', type: 'addon', category: 'build', description: 'Native HTML5 drag-and-drop builder with templates + presets.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos', 'tetra-ops'], marketplace: { published: false }, tags: ['builder', 'addon'] },
  { id: 'addon-marketplace', name: 'Marketplace', type: 'addon', category: 'economy', description: 'Publish/buy listings settled in LOVE.', version: '1.0.0', maturity: 'stable', status: 'active', usedBy: ['phos', 'tetra-ops'], marketplace: { published: true, price: 0 }, tags: ['love', 'addon'] },
].map((f) => ({ ...f, createdAt: NOW, updatedAt: NOW })) as Feature[];

export const FEATURES: Feature[] = [
  ...COMPONENT_FEATURES,
  ...WORKER_FEATURES,
  ...SKIN_FEATURES,
  ...PHOS_SURFACES,
  ...WILLOW_SURFACES,
  ...ADDON_FEATURES,
];
