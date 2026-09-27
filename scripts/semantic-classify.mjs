#!/usr/bin/env node
/**
 * semantic-classify.mjs
 *
 * Cycle 2.6 — replace generic owns strings with per-artifact specific ones.
 * Reads docs/00-CANONICAL-CORE.yaml, applies specific classifications based on
 * actual artifact function (from package.json names/descriptions), and writes back.
 *
 * Run: node scripts/semantic-classify.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

const CORE_PATH = 'docs/00-CANONICAL-CORE.yaml'

const core = parseYaml(readFileSync(CORE_PATH, 'utf8'))

// Per-artifact specific classifications. Each entry: path → { owns, notes, status?, layer? }
const CLASSIFICATIONS = {
  // === Software: apps and surfaces ===
  'P31-local-workspace/software/docs': {
    layer: 'L3', status: 'active',
    owns: ['P31 documentation portal'],
    notes: 'L3 surface — docs and guides',
  },
  'P31-local-workspace/software/frontend': {
    layer: 'L3', status: 'active',
    owns: ['P31 frontend application shell'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/spoon-calculator': {
    layer: 'L3', status: 'active',
    owns: ['personal energy management calculator'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/p31-dashboard': {
    layer: 'L3', status: 'active',
    owns: ['P31 operations dashboard (Astro)'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/geodesic-room': {
    layer: 'L3', status: 'active',
    owns: ['geodesic dome 3D visualization room'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/phos-pwa': {
    layer: 'L3', status: 'active',
    owns: ['Phos progressive web app'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/extensions/p31-cockpit-panel': {
    layer: 'L3', status: 'active',
    owns: ['EDE unified status dashboard extension'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/extensions/p31ca': {
    layer: 'L3', status: 'active',
    owns: ['p31ca Centaur EDE extension'],
    notes: 'L3 surface',
  },

  // === Software: contracts and services ===
  'P31-local-workspace/software/p31-forge': {
    layer: 'L2', status: 'active',
    owns: ['document generation engine (court filings, letters, grants, memos, social posts)'],
    notes: 'L2 contract — document SOT per p31-forge README',
  },
  'P31-local-workspace/software/p31-agent-hub': {
    layer: 'L2', status: 'active',
    owns: ['Workers AI agent session orchestration with SQLite DO'],
    notes: 'L2 contract — agent hub',
  },
  'P31-local-workspace/software/p31-cortex': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Cortex data orchestration layer with DB migration'],
    notes: 'L2 — pending value assessment',
  },
  'P31-local-workspace/software/donate-api': {
    layer: 'L2', status: 'active',
    owns: ['donation API endpoint'],
    notes: 'L2 API contract',
  },
  'P31-local-workspace/software/p31-hearing-ops': {
    layer: 'L2', status: 'active',
    owns: ['hearing operations dashboard and workflow'],
    notes: 'L2 operational contract',
  },
  'P31-local-workspace/software/p31-state': {
    layer: 'L2', status: 'active',
    owns: ['application state management contract'],
    notes: 'L2 state contract',
  },
  'P31-local-workspace/software/telemetry-worker': {
    layer: 'L2', status: 'active',
    owns: ['telemetry collection and reporting worker'],
    notes: 'L2 observability contract',
  },
  'P31-local-workspace/software/spin-mesh': {
    layer: 'L2', status: 'migrate-later',
    owns: ['SpIn Barter Mesh — local-first physical media swap system'],
    notes: 'L2 integration mesh, K4 extension',
  },
  'P31-local-workspace/software/kenosis-mesh': {
    layer: 'L2', status: 'migrate-later',
    owns: ['7-node SIC-POVM serverless topology'],
    notes: 'L2 mesh network',
  },
  'P31-local-workspace/software/cloudflare-worker/social-drop-automation': {
    layer: 'L2', status: 'active',
    owns: ['multi-platform posting, scheduling, and Discord notifications worker'],
    notes: 'L2 social worker contract',
  },
  'P31-local-workspace/software/discord/p31-bot': {
    layer: 'L2', status: 'active',
    owns: ['Discord bot with cognitive accessibility features'],
    notes: 'L2 bot service contract',
  },
  'P31-local-workspace/software/cloudflare-worker/bouncer': {
    layer: 'L2', status: 'migrate-later',
    owns: ['legacy access control bouncer'],
    notes: 'evaluate for consolidation with production bouncer',
  },
  'P31-local-workspace/software/cloudflare-worker/command-center': {
    layer: 'L2', status: 'migrate-later',
    owns: ['EPCP Command Center E2E test suite'],
    notes: 'test infrastructure, not production',
  },
  'P31-local-workspace/software/cloudflare-pages/p31-mesh': {
    layer: 'L2', status: 'migrate-later',
    owns: ['P31 mesh on Cloudflare Pages'],
    notes: 'pending value assessment',
  },
  'P31-local-workspace/software/cloudflare-worker/{project}': {
    layer: 'L2', status: 'migrate-later',
    owns: ['template Cloudflare Worker'],
    notes: 'scaffold — delete if unused',
  },
  'P31-local-workspace/software/unified-k4-cage': {
    layer: 'L2', status: 'migrate-later',
    owns: ['unified K4 cage computation'],
    notes: 'pending consolidation with apps/k4-cage',
  },
  'P31-local-workspace/software/genesis-gate': {
    layer: 'L2', status: 'migrate-later',
    owns: ['genesis gate (onboarding authorization)'],
    notes: 'pending value assessment',
  },
  'P31-local-workspace/software/extensions/p31-cognitive-shield': {
    layer: 'L2', status: 'active',
    owns: ['email voltage scoring with 60s batching for neuro-regulation'],
    notes: 'L2 cognitive tool — extension',
  },
  'P31-local-workspace/software/extensions/p31-progressive-disclosure': {
    layer: 'L2', status: 'active',
    owns: ['UI complexity adaptation by operator spoon level (Layers 0-3)'],
    notes: 'L2 UI tool — extension',
  },
  'P31-local-workspace/software/extensions/p31-spoon-gauge': {
    layer: 'L2', status: 'active',
    owns: ['real-time energy/capacity tracking for operators'],
    notes: 'L2 monitoring — extension',
  },
  'P31-local-workspace/software/spin-mesh/logistics-do': {
    layer: 'L2', status: 'migrate-later',
    owns: ['SpIn mesh logistics service'],
    notes: 'pending consolidation with spin-mesh',
  },
  'P31-local-workspace/software/spin-mesh/matchmaking-do': {
    layer: 'L2', status: 'migrate-later',
    owns: ['SpIn mesh matchmaking service'],
    notes: 'pending consolidation with spin-mesh',
  },

  // === Workers ===
  'P31-local-workspace/workers/intent-resolver': {
    layer: 'L2', status: 'active',
    owns: ['agentic intent → action translation'],
    notes: 'L2 orchestration contract',
  },
  'P31-local-workspace/workers/creation-accountant': {
    layer: 'L2', status: 'active',
    owns: ['creation revenue accounting and LOV grant lifecycle'],
    notes: 'L2 financial contract',
  },
  'P31-local-workspace/workers/federation-bridge': {
    layer: 'L2', status: 'active',
    owns: ['cross-surface identity federation (JWT + DPoP)'],
    notes: 'L2 identity contract',
  },
  'P31-local-workspace/workers/fhir-bridge': {
    layer: 'L2', status: 'migrate-later',
    owns: ['FHIR health data bridge'],
    notes: 'integration — pending pilot decision',
  },
  'P31-local-workspace/workers/roblox-bridge': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Roblox integration bridge'],
    notes: 'pending game integration decisions',
  },
  'P31-local-workspace/workers/phos': {
    layer: 'L3', status: 'active',
    owns: ['Phos portal backend worker'],
    notes: 'L3 surface backend',
  },
  'P31-local-workspace/workers/phosphorus31': {
    layer: 'L3', status: 'active',
    owns: ['phosphorus31 portal backend worker'],
    notes: 'L3 surface backend',
  },
  'P31-local-workspace/workers/willow': {
    layer: 'L3', status: 'active',
    owns: ['Willow portal backend worker'],
    notes: 'L3 surface backend',
  },
  'P31-local-workspace/workers/phos-backup': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Phos backup and replication service'],
    notes: 'pending consolidation',
  },
  'P31-local-workspace/workers/phos-triad': {
    layer: 'L2', status: 'active',
    owns: ['Phos triad coordination service'],
    notes: 'L2 service contract',
  },
  'P31-local-workspace/workers/willow-safety': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Willow safety monitoring service'],
    notes: 'pending consolidation',
  },
  'P31-local-workspace/workers/bros': {
    layer: 'L2', status: 'migrate-later',
    owns: ['bros social/friend network service'],
    notes: 'pending value assessment',
  },
  'P31-local-workspace/workers/dads': {
    layer: 'L2', status: 'migrate-later',
    owns: ['DADS parent dashboard service'],
    notes: 'pending value assessment',
  },
  'P31-local-workspace/workers/marketplace': {
    layer: 'L2', status: 'active',
    owns: ['marketplace discovery and listing service'],
    notes: 'L2 marketplace contract',
  },
  'P31-local-workspace/workers/marketplace-catalog': {
    layer: 'L2', status: 'active',
    owns: ['marketplace catalog management'],
    notes: 'L2 marketplace contract',
  },
  'P31-local-workspace/workers/marketplace-mcp': {
    layer: 'L2', status: 'active',
    owns: ['marketplace MCP tools'],
    notes: 'L2 MCP contract (merge into x402 or design-mcp)',
  },
  'P31-local-workspace/workers/p31-justice-hub': {
    layer: 'L2', status: 'active',
    owns: ['sovereign justice dispute resolution hub'],
    notes: 'L2 governance contract',
  },
  'P31-local-workspace/workers/tetra-tools': {
    layer: 'L2', status: 'active',
    owns: ['tetrahedral geometry computation tools'],
    notes: 'L2 geometry contract',
  },
  'P31-local-workspace/workers/artifact-registry': {
    layer: 'L2', status: 'active',
    owns: ['artifact catalog and manifest storage'],
    notes: 'L2 registry contract',
  },
  'P31-local-workspace/workers/agent-runtime': {
    layer: 'L2', status: 'migrate-later',
    owns: ['agent execution runtime (software copy)'],
    notes: 'duplicate — consolidate with workspace agent-runtime',
  },

  // === Production ===
  'production/tools/portal-vendor-sync/ui-src': {
    layer: 'L3', status: 'active',
    owns: ['portal vendor sync UI (@p31ca/ui)'],
    notes: 'L3 surface — production tool',
  },
  'production/workers/p31-passport': {
    layer: 'L2', status: 'active',
    owns: ['passport authentication worker (@p31/workers-p31-passport)'],
    notes: 'L2 auth contract',
  },

  // === Ecosystem ===
  'P31-local-workspace/ecosystem/analytics': {
    layer: 'L2', status: 'migrate-later',
    owns: ['analytics data collection and query service'],
    notes: 'L2 integration — pending value assessment',
  },
  'P31-local-workspace/ecosystem/discord': {
    layer: 'L2', status: 'active',
    owns: ['Discord bot with cognitive accessibility features (oracle-bot)'],
    notes: 'L2 bot service contract',
  },
  'P31-local-workspace/ecosystem/ipfs': {
    layer: 'L2', status: 'migrate-later',
    owns: ['IPFS content management and pinning'],
    notes: 'L2 integration — pending value assessment',
  },
  'P31-local-workspace/ecosystem/middleware': {
    layer: 'L2', status: 'migrate-later',
    owns: ['middleware routing and translation layer'],
    notes: 'L2 integration — pending value assessment',
  },

  // === Repo root ===
  'P31-local-workspace/software': {
    layer: 'L2', status: 'migrate-later',
    owns: ['software repo umbrella (decompose: identify canonical copy per domain)'],
    notes: 'repo root — decompose into individual artifacts',
  },
  'P31-local-workspace/p31labs/social-content-engine': {
    layer: 'L2', status: 'migrate-later',
    owns: ['social content generation and scheduling engine'],
    notes: 'L2 content engine — pending consolidation',
  },

  // === Packages ===
  'P31-local-workspace/packages/p31-mcp': {
    layer: 'L2', status: 'active',
    owns: ['vibe-coding MCP server (app generation + deploy via MCP tools)'],
    notes: 'L2 MCP tool contract — @p31ca/mcp-vibe',
  },
  'P31-local-workspace/packages/ui-mcp': {
    layer: 'L2', status: 'active',
    owns: ['UI introspection tools for MCP clients'],
    notes: 'L2 MCP tool contract',
  },
  'P31-local-workspace/packages/shared': {
    layer: 'L2', status: 'migrate-later',
    owns: ['shared modules (DEPRECATED — use @p31/shared-core, @p31/sovereign-primitives, @p31/cognitive-passport)'],
    notes: 'deprecated — consolidate into L0 primitives',
  },
  'P31-local-workspace/packages/game-engine': {
    layer: 'L2', status: 'active',
    owns: ['game engine runtime (Maxwell rigidity, jitterbug geometry, geodesic primitives, spoon-gated)'],
    notes: 'L2 game contract — @p31ca/game-engine',
  },
  // === Remaining 22 entries (Cycle 2.6) ===
  'P31-local-workspace/software/k4-cage': {
    layer: 'L3', status: 'active',
    owns: ['K4 tetrahedral cage browser application'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/k4-cage-pwa': {
    layer: 'L3', status: 'active',
    owns: ['K4 cage progressive web app'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/k4-hubs': {
    layer: 'L3', status: 'active',
    owns: ['K4 virtual hub spaces'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/k4-personal': {
    layer: 'L3', status: 'active',
    owns: ['K4 personal workspace'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/p31-delta-hiring': {
    layer: 'L2', status: 'migrate-later',
    owns: ['delta hiring platform'],
    notes: 'L2 — pending value assessment',
  },
  'P31-local-workspace/software/p31-google-bridge': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Google Bridge design-token API'],
    notes: 'L2 integration — pending value assessment',
  },
  'P31-local-workspace/software/sovereign-command-center': {
    layer: 'L3', status: 'active',
    owns: ['sovereign command center dashboard'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/packages/agent-engine': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31ca/agent-engine — agent topology and runtime primitives'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/andromeda-gateway': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/andromeda-gateway — cross-repository gateway'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/brain-dump-orchestrator': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/brain-dump-orchestrator — knowledge dump orchestration'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/genesis-spark-worker': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/genesis-spark-worker — genesis server worker'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/harmonic-linter': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/harmonic-linter — harmonic analysis linter'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/jitterbug-api': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/jitterbug-api — jitterbug math API'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/jitterbug-pwa': {
    layer: 'L3', status: 'active',
    owns: ['@p31/jitterbug-pwa — jitterbug progressive web app'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/packages/k4-mesh-core': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/k4-mesh-core — K4 mesh networking core'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/node-zero/pwa': {
    layer: 'L3', status: 'active',
    owns: ['p31-pwa — node-zero progressive web app'],
    notes: 'L3 surface',
  },
  'P31-local-workspace/software/packages/q-distribution': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/q-distribution — quantum distribution primitives'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/quantum-edge': {
    layer: 'L2', status: 'migrate-later',
    owns: ['@p31/quantum-edge — quantum edge compute'],
    notes: 'L2 package contract',
  },
  'P31-local-workspace/software/packages/shared': {
    layer: 'L2', status: 'migrate-later',
    owns: ['shared modules (DEPRECATED — use @p31/shared-core, @p31/sovereign-primitives, @p31/cognitive-passport)'],
    notes: 'deprecated — consolidate into L0 primitives',
  },
  'P31-local-workspace/software/workers': {
    layer: 'L2', status: 'active',
    owns: ['p31-workers orchestration and dispatch layer'],
    notes: 'L2 service contract',
  },
  'P31-local-workspace/software/workers/phos-backup': {
    layer: 'L2', status: 'migrate-later',
    owns: ['Phos backup and replication worker'],
    notes: 'pending consolidation',
  },
  'P31-local-workspace/tools/phos-forge': {
    layer: 'L2', status: 'active',
    owns: ['Phos forge document tooling'],
    notes: 'L2 tool contract',
  },
}

// Apply classifications
let changed = 0
for (const entry of core.entries) {
  const cls = CLASSIFICATIONS[entry.path]
  if (cls) {
    if (cls.layer) entry.layer = cls.layer
    if (cls.status) entry.status = cls.status
    if (cls.owns) entry.owns = cls.owns
    if (cls.notes) entry.notes = cls.notes
    changed++
  }
}

// Write back
const yaml = stringifyYaml(core, { indent: 2, lineWidth: -1 })
writeFileSync(CORE_PATH, yaml)
console.log(`Classified ${changed} artifacts semantically`)
