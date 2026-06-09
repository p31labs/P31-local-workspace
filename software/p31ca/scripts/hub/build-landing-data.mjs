#!/usr/bin/env node
/**
 * Build src/data/hub-landing.json from hub/registry.mjs (single source of truth).
 * Run: node scripts/hub/build-landing-data.mjs
 * P31 home alignment: p31-alignment.json (registry derivation + verifyPipeline); docs/P31-ALIGNMENT-SYSTEM.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from './registry.mjs';
import { HUB_COCKPIT_ORDER, HUB_PROTOTYPE_ORDER } from './hub-app-ids.mjs';
import { resolvePrsPath, loadHubCardTierMap, prsGridStatus } from './prs-production-posture.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, '../..');
const OUT = path.join(P31CA, 'src', 'data', 'hub-landing.json');

const CONSTANTS_JSON = path.join(P31CA, '../../..', 'p31-constants.json');

/** Zenodo rows from P31 home `p31-constants.json` → `research.papers` (single source). */
function researchFromConstants() {
  try {
    const raw = fs.readFileSync(CONSTANTS_JSON, 'utf8');
    const c = JSON.parse(raw);
    const papers = c?.research?.papers;
    if (!Array.isArray(papers) || papers.length === 0) return null;
    return papers.map((p) => {
      const doi = typeof p.doi === 'string' ? p.doi.trim() : '';
      const title = typeof p.title === 'string' ? p.title.trim() : '';
      if (!doi || !title) return null;
      return { title, doi };
    }).filter(Boolean);
  } catch {
    return null;
  }
}

const RESEARCH = researchFromConstants() ?? [
  { title: 'The Tetrahedron Protocol: A Grand Unified Theory of Structural Resilience', doi: '10.5281/zenodo.19004485' },
  { title: 'Strategic Convergence of Geometric Security and Cognitive Resilience: P31 Labs Genesis Whitepaper', doi: '10.5281/zenodo.19411363' },
  {
    title:
      'Consciousness, Memory, and the Architecture of Self-Preservation: Neuroscientific Foundations for Cognitive Prosthetic Design',
    doi: '10.5281/zenodo.19416491',
  },
  {
    title:
      'The Universal Bridge at the Phase Transition: Kuramoto Criticality, Maxwell Rigidity, and the Topology of Neurodivergent Cognition',
    doi: '10.5281/zenodo.19503542',
  },
];

const byId = new Map(registry.map((r) => [r.id, r]));

const prsPath = resolvePrsPath(P31CA);
const prsTierMap = prsPath ? loadHubCardTierMap(prsPath) : null;
if (prsPath) {
  console.log('hub-landing: PRS posture from', path.relative(P31CA, prsPath));
} else {
  console.log('hub-landing: PRS file not found — registry statusLabel only');
}

function cardStatus(r) {
  const sl = (r.statusLabel || 'LIVE').toUpperCase();
  if (r.status === 'research' || sl === 'RESEARCH') return 'RESEARCH';
  if (sl === 'BUILDING' || r.status === 'building') return 'BUILDING';
  if (sl === 'TOOL' || r.status === 'tool') return 'TOOL';
  if (sl === 'HARDWARE') return 'HARDWARE';
  return 'LIVE';
}

function toTags(tech) {
  const t = (tech || []).slice(0, 4);
  if (t.length < 2) t.push('P31', 'Web');
  return t;
}

// Category mapping for hub cards (derived from product id patterns)
const CATEGORY_MAP = {
  // Arcade games
  'arcade-hub': 'arcade',
  'arcade-smallball': 'arcade',
  'arcade-gridiron': 'arcade',
  'arcade-strategy': 'arcade',
  'arcade-cards': 'arcade',
  'arcade-liquid-sculptor': 'arcade',
  // Core products
  'ede': 'core',
  'spaceship-earth': 'core',
  'buffer': 'core',
  'content-forge': 'core',
  'geodesic': 'core',
  'signal': 'core',
  'connect': 'core',
  'planetary-onboard': 'core',
  'bridge': 'core',
  'sovereign': 'core',
  'tether': 'core',
  // Social
  'bonding': 'social',
  'social-molecules': 'social',
  'discord-bot': 'social',
  'poets': 'social',
  'book': 'social',
  'forge': 'social',
  // Infra
  'cortex': 'infra',
  'node-zero': 'infra',
  'integrations': 'infra',
  'super-centaur': 'infra',
  // Research
  'alchemy': 'research',
  'attractor': 'research',
  'axiom': 'research',
  'resonance': 'research',
  // Utility
  'tactile': 'utility',
  'appointment-tracker': 'utility',
  'budget-tracker': 'utility',
  'contact-locker': 'utility',
  'echo': 'utility',
  'legal-evidence': 'utility',
  'medical-tracker': 'utility',
  'prism': 'utility',
  'sleep-tracker': 'utility',
  'somatic-anchor': 'utility',
};

function deriveCategory(id, r) {
  // Use explicit category from registry if available
  if (r.category) return r.category;
  // Otherwise use map
  return CATEGORY_MAP[id] || 'core';
}

function productRow(id) {
  const r = byId.get(id);
  if (!r) {
    throw new Error(`[hub:build] unknown registry id: ${id}`);
  }
  // Skip concept/draft products
  if (r.status === 'concept' || r.status === 'draft') return null;
  const prs = prsGridStatus(r, prsTierMap);
  const status = prs ? prs.landingStatus : cardStatus(r);
  return {
    id,
    title: r.title,
    status,
    category: deriveCategory(id, r),
    icon: r.icon || '◆',
    desc: r.tagline,
    tags: toTags(r.tech),
    url: `/${id}-about.html`,
  };
}

function protoRow(id) {
  const r = byId.get(id);
  if (!r) throw new Error(`[hub:build] unknown prototype id: ${id}`);
  // Skip concept/draft products
  if (r.status === 'concept' || r.status === 'draft') return null;
  return {
    id,
    title: r.title,
    desc: r.tagline,
    url: `/${id}-about.html`,
  };
}

const coreProducts = HUB_COCKPIT_ORDER.map(productRow).filter(Boolean);
const prototypes = HUB_PROTOTYPE_ORDER.map(protoRow).filter(Boolean);

const payload = {
  // No `generated` timestamp: deterministic build for drift detection.
  // Git log on this file IS the audit trail. (Same pattern as
  // home repo scripts/build-phos-voice-json.mjs line 205.)
  meta: {
    schema: "p31.hub-landing/1.0.0",
    registry: "scripts/hub/registry.mjs",
    hubCardIds: "scripts/hub/hub-app-ids.mjs",
    alignment:
      "P31 home: p31-alignment.json (p31.alignment/1.0.0); human: docs/P31-ALIGNMENT-SYSTEM.md; verify: npm run verify:alignment (root)",
    prsPosture: prsPath ? path.relative(P31CA, prsPath).replace(/\\/g, '/') : null,
  },
  coreProducts,
  prototypes,
  research: RESEARCH,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(
  'hub-landing →',
  path.relative(P31CA, OUT),
  `(${coreProducts.length} products, ${prototypes.length} prototypes, ${RESEARCH.length} Zenodo rows)`
);
