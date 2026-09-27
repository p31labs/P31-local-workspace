#!/usr/bin/env node
/**
 * generate-core-yaml.mjs
 *
 * Generates docs/00-CANONICAL-CORE.yaml from inventory.json + curated layer rules.
 * Layer-level `must_not` defaults are inherited by all entries in that layer.
 * The canonical-artifact overrides are hand-curated here.
 *
 * Run: node scripts/generate-core-yaml.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const INVENTORY = join(ROOT, 'inventory.json')
const OUT = join(ROOT, 'docs', '00-CANONICAL-CORE.yaml')

const inventory = JSON.parse(readFileSync(INVENTORY, 'utf-8'))

const LAYER_DEFAULTS = {
  L0: {
    must_not: ['hold balances', 'render UI', 'import L1+ L2+ L3+ internals', 'contain component logic'],
    description: 'Identity atom — never changes',
  },
  L1: {
    must_not: ['contain component logic', 'import L2+ L3+ internals', 'hold runtime state', 'expose network APIs'],
    description: 'Tokens — additive only, never subtractive',
  },
  L2: {
    must_not: ['import L3 surfaces', 'render UI', 'hold user state across requests', 'hardcode token values'],
    description: 'Contracts — versioned, frozen, diffed',
  },
  L3: {
    must_not: ['import L2 internals directly (must go through contract API)', 'hardcode tokens', 'bypass mode guards', 'hold identity state', 'directly write to D1 without L2 wrapper'],
    description: 'Surfaces — disposable, rebuild freely',
  },
}

// --- CURATED CLASSIFICATION RULES (most specific first) ---

function classify(path, name, hints) {
  const hay = `${path} ${name}`
  const lower = hay.toLowerCase()

  // ---------- L0: Identity ----------
  if (/shared-identity|shared-identity/i.test(name)) return { layer: 'L0', status: 'active', owns: ['DID:key generation', 'JWT auth', 'passport model'], notes: 'canonical identity source' }
  if (/cognitive-passport/i.test(name)) return { layer: 'L0', status: 'active', owns: ['neurocognitive profile model', 'agentic intent decomposition'], notes: 'passport schema + scoring' }
  if (/eudi/i.test(hay) && !/test/i.test(path)) return { layer: 'L0', status: 'migrate-later', owns: ['EUDI wallet integration (W3C)'], notes: 'pending EUDI certification track' }

  // ---------- L1: Tokens ----------
  if (/design-core|design-system/i.test(name)) return { layer: 'L1', status: 'active', owns: ['THEME_TOKENS (single source)', 'OKLCH color space', '863Hz rhythm', 'DTCG export', 'compositions', 'recipes'], notes: 'canonical design-core, workspace packages/design-core' }
  if (/design-validator/i.test(name)) return { layer: 'L1', status: 'active', owns: ['token compliance checks', 'contract diff', 'WCAG contrast validation'], notes: 'consumed by MCP + CI' }
  if (/skin-|tokens-|theme-/i.test(name)) return { layer: 'L1', status: 'active', owns: ['theme variant CSS/TS artifacts'], notes: 'generated from design-core THEME_TOKENS' }
  if (/rules/i.test(name) && !/lovrules/i.test(lower)) return { layer: 'L1', status: 'active', owns: ['design rule constants (MUST/SHOULD/MAY)'], notes: 'consumed by validators' }

  // ---------- L2: Contracts ----------
  if (hints.mcp && /design-mcp-v3/i.test(name)) return { layer: 'L2', status: 'active', owns: ['stateless 2026-07-28 split-SDK surface (merge target for design-mcp)', 'hub-readied spoke', 'skills/list + skills/get over MCP'], must_not: ['import L3 surfaces', 'render UI', 'hold user state across requests', 'hardcode token values', 'duplicate tool logic (import from canonical surface)'], notes: 'workers/design-mcp-v3 — merge target; gateway added at 3+ spokes' }
  if (hints.mcp && /design-mcp/i.test(name)) return { layer: 'L2', status: 'active', owns: ['34 canonical MCP tools (token + component + contract + clarify + propose)', 'server/discover (2026-07-28)', 'tool contract validation'], notes: 'workers/design-mcp — the canonical MCP surface' }
  if (hints.skill && /p31-standards/i.test(name)) return { layer: 'L2', status: 'active', owns: ['enforcement rules (no hex, no media queries, no inline styles, spoons, motion, a11y, contracts, transient state)', '10 golden eval cases under evals/', 'agentskills.io machine-readable format'], must_not: ['give non-deterministic advice', 'rely on agent self-reporting', 'drift from eval baselines'], notes: 'enforcement truth — CI runs scripts/skills-eval.mjs' }
  if (hints.mcp && /crypto-mcp/i.test(name)) return { layer: 'L2', status: 'active', owns: ['ML-DSA-65/ML-KEM-768/SLH-DSA-128s', 'PQC keygen + sign + verify', 'SD-JWT issuance'], notes: 'post-quantum crypto layer for agent identity' }
  if (hints.mcp && /x402/i.test(hay)) return { layer: 'L2', status: 'active', owns: ['USDC/BTC micro-payment settlement', 'x402 v2 header negotiation', 'facilitator routing'], notes: 'payment contract over HTTP' }
  if (hints.mcp && /marketplace-mcp/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['marketplace discovery tools'], notes: 'merge into x402 contract or retire after migration' }
  if (hints.mcp && /wallet-mcp|phenix/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['wallet introspection tools'], notes: 'merge into design-mcp or retire after migration' }
  if (hints.mcp && /mcp-registry/i.test(name)) return { layer: 'L2', status: 'active', owns: ['MCP server discovery + catalog', 'spoke registration registry'], notes: 'hub-spoke pattern registry, consumed by mcp-gateway' }
  if (hints.mcp && /p31-mcp-server|p31-mcp-server/i.test(name)) {
    if (/software\/workers/i.test(path)) return { layer: 'L2', status: 'retire', owns: ['(superseded by workers/p31-mcp-server)'], notes: 'duplicate of workspace version — retire this copy' }
    return { layer: 'L2', status: 'active', owns: ['general-purpose MCP server (13 tools: token, component, recipe, converter, audit)'], notes: 'workers/p31-mcp-server — secondary MCP surface' }
  }
  if (hints.mcp && /mcp-justice/i.test(name)) return { layer: 'L2', status: 'active', owns: ['dispute resolution contracts', 'appeal workflow'], notes: 'contract layer for governance' }
  if (hints.mcp && /mcp-membrane/i.test(name)) return { layer: 'L2', status: 'active', owns: ['cross-boundary data layer', 'cell-membrane semantics'], notes: 'L2 isolation layer for data flows' }
  if (hints.mcp && /ui-mcp/i.test(name)) return { layer: 'L2', status: 'active', owns: ['UI introspection tools for MCP clients'], notes: 'optional MCP surface for UI consumers' }
  if (hints.mcp && /mcp-vibe|p31-mcp$/i.test(name)) return { layer: 'L2', status: 'active', owns: ['vibe-coding MCP tools (app generation + deploy)'], notes: 'packages/p31-mcp — developer-facing MCP' }

  if (/love-ledger/i.test(name) && /packages/i.test(path)) return { layer: 'L2', status: 'active', owns: ['LOV accounting primitives (ledger.ts, wallet.ts, vesting.ts, version.ts)', 'append-only hash chain'], notes: 'canonical @p31ca/love-ledger npm package' }
  if (/love-ledger/i.test(name) && /workers/i.test(path)) return { layer: 'L2', status: 'active', owns: ['HTTP API wrapper over @p31ca/love-ledger', 'LOV earn/spend/give/donate/take endpoints'], notes: 'workers/love-ledger — deployed API' }
  if (/love-chain/i.test(name)) return { layer: 'L2', status: 'active', owns: ['append-only love-chain sink (hash chain persistence)'], notes: 'software/workers/love-chain-worker' }
  if (/love-bridge/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['LOV bridge (cross-surface settlement)'], notes: 'software/love-bridge — evaluate for consolidation' }
  if (/economy/i.test(name)) return { layer: 'L2', status: 'active', owns: ['LOV economics model', 'tokenomics parameters'], notes: 'consumes @p31ca/love-ledger' }
  if (/gamification/i.test(name)) return { layer: 'L2', status: 'active', owns: ['LOV earn/spend game logic', 'spoon-dial scoring'], notes: 'consumes @p31/economy' }
  if (/contract-engine/i.test(name)) return { layer: 'L2', status: 'active', owns: ['web3 contract ABI registry', 'on-chain verification'], notes: 'EVM contract interaction layer' }
  if (/governance-engine/i.test(name)) return { layer: 'L2', status: 'active', owns: ['on-chain governance voting', 'proposal + ratification flow'], notes: 'governance contract over EVM' }

  // Payment rails — keep as L2 contracts
  if (/btcpay-gateway/i.test(name)) return { layer: 'L2', status: 'active', owns: ['BTC settlement via BTCPay', 'testnet invoice handling'], notes: 'payment rail' }
  if (/revenue-ledger/i.test(name)) return { layer: 'L2', status: 'active', owns: ['append-only revenue hash chain', 'invoice hashing'], notes: 'production revenue-ledger worker' }
  if (/gumroad/i.test(name)) return { layer: 'L2', status: 'retire', owns: ['Gumroad webhook processing'], notes: 'legacy — retire after Stripe checkout unification' }
  if (/stripe|checkout/i.test(lower)) return { layer: 'L2', status: 'active', owns: ['Stripe integration', 'fiat checkout'], notes: 'primary fiat rail' }
  if (/ko-fi|kofi/i.test(lower)) return { layer: 'L3', status: 'retire', owns: ['Ko-fi tip integration'], notes: 'retire — consolidate into unified checkout' }
  if (/paypal/i.test(lower)) return { layer: 'L3', status: 'retire', owns: ['PayPal button integration'], notes: 'retire — consolidate into unified checkout' }
  if (/sponsors|github/i.test(lower)) return { layer: 'L3', status: 'retire', owns: ['GitHub Sponsors redirect'], notes: 'retire — not a payment rail, just a link' }
  if (/blockonomics/i.test(lower)) return { layer: 'L2', status: 'retire', owns: ['Blockonomics BTC invoice'], notes: 'retire — merge into BTCPay rail' }

  // Deeper L2 — agent, component registry, dispatch, etc.
  if (/agent-runtime/i.test(name)) return { layer: 'L2', status: 'active', owns: ['agent execution runtime'], notes: 'L2 orchestration layer for agents' }
  if (/component-registry/i.test(name)) return { layer: 'L2', status: 'active', owns: ['component catalog + validation'], notes: 'contract: which components exist and their schemas' }
  if (/device-registry/i.test(name)) return { layer: 'L2', status: 'active', owns: ['device capability + enrollment registry'], notes: 'IoT / device trust layer' }
  if (/fhir-bridge|fhir/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['FHIR health data bridge'], notes: 'integration contract — pending pilot decision' }
  if (/federation-bridge/i.test(name)) return { layer: 'L2', status: 'active', owns: ['cross-surface identity federation', 'JWT + DPoP'], notes: 'identity federation across surfaces' }
  if (/intent-resolver/i.test(name)) return { layer: 'L2', status: 'active', owns: ['agentic intent → tool-call translation'], notes: 'orchestration L2' }
  if (/ledger-bridge/i.test(name)) return { layer: 'L2', status: 'active', owns: ['ledger HTTP adapter'], notes: 'bridge over @p31ca/love-ledger' }
  if (/membrane-coordinator/i.test(name)) return { layer: 'L2', status: 'active', owns: ['cross-boundary data flow coordination'], notes: 'L2 inter-surface coordination' }
  if (/meshy-bridge/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['Meshy API bridge (3D generation)'], notes: 'integration — pending value assessment' }
  if (/taler-bridge|billing/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['Taler billing bridge'], notes: 'integration — evaluate retention' }
  if (/kill-switch/i.test(name)) return { layer: 'L2', status: 'active', owns: ['emergency halt across all surfaces'], notes: 'safety contract, always on' }
  if (/secret-rotator/i.test(name)) return { layer: 'L2', status: 'active', owns: ['Cloudflare secret rotation', 'token expiry management'], notes: 'ops contract' }
  if (/artifact-registry/i.test(name)) return { layer: 'L2', status: 'active', owns: ['artifact catalog + manifest storage'], notes: 'L2 artifact metadata store' }
  if (/dispatch-router|dispatch/i.test(name)) return { layer: 'L2', status: 'active', owns: ['request routing + dispatch'], notes: 'contract: routing across services' }
  if (/governance-engine/i.test(name)) return { layer: 'L2', status: 'active', owns: ['governance voting + proposals'], notes: 'contract: on-chain governance' }
  if (/intent-resolver/i.test(name)) return { layer: 'L2', status: 'active', owns: ['user intent → tool-call translation'], notes: 'L2 orchestration contract' }
  if (/notification-queue/i.test(name)) return { layer: 'L2', status: 'active', owns: ['outbound notification queue'], notes: 'contract: messaging layer' }
  if (/oauth-relay/i.test(name)) return { layer: 'L2', status: 'active', owns: ['OAuth relay / token exchange'], notes: 'contract: auth relay' }
  if (/pilot-dashboard/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['pilot metrics dashboard API'], notes: 'pending pilot expansion' }
  if (/terminal-relay/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['terminal relay (SSH/tmux bridge)'], notes: 'evaluate value; deprecate if unused' }
  if (/governance-engine/i.test(name)) return { layer: 'L2', status: 'active', owns: ['governance proposals + voting'], notes: 'contract: DAO-level governance' }
  if (/creation-accountant/i.test(name)) return { layer: 'L2', status: 'active', owns: ['creation revenue accounting', 'LOV grant lifecycle'], notes: 'financial contract' }
  if (/q-factor/i.test(name)) return { layer: 'L2', status: 'active', owns: ['quality factor scoring', 'compliance scoring'], notes: 'contract: quality scoring' }
  if (/sovereign-agent/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['sovereign agent runtime'], notes: 'pending sovereign stack consolidation' }
  if (/personal-swarm/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['personal AI swarm orchestration'], notes: 'pending consolidation with agent-runtime' }
  if (/edge-render/i.test(name)) return { layer: 'L2', status: 'active', owns: ['edge rendering (Cloudflare Pages functions)'], notes: 'contract: SSR + ISR' }
  if (/app-supervisor/i.test(name)) return { layer: 'L2', status: 'active', owns: ['app supervision + health checks'], notes: 'contract: application supervisor' }
  if (/bob-marge-monitor/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['Bob/Marge resource monitoring'], notes: 'pending value assessment' }
  if (/care-api/i.test(name)) return { layer: 'L2', status: 'active', owns: ['care session API'], notes: 'contract: care data' }
  if (/care-mesh/i.test(name)) return { layer: 'L2', status: 'active', owns: ['care mesh coordination'], notes: 'contract: care coordination' }
  if (/chat-sandbox/i.test(name)) return { layer: 'L3', status: 'active', owns: ['standalone chat sandbox (no surfaces)'], notes: 'L3 standalone surface; deploys to chat-sandbox.trimtab-signal' }
  if (/game-builder/i.test(name)) return { layer: 'L3', status: 'migrate-later', owns: ['game builder UI + logic'], notes: 'pending value assessment' }
  if (/multiplayer-room/i.test(name)) return { layer: 'L2', status: 'active', owns: ['multiplayer room session coordination'], notes: 'contract: multiplayer state sync' }
  if (/notification-queue/i.test(name)) return { layer: 'L2', status: 'active', owns: ['notification queue'], notes: 'contract: messaging' }
  if (/phantom-wallet|phenix-wallet/i.test(name) && !/mcp/i.test(name)) return { layer: 'L2', status: 'active', owns: ['crypto wallet state + balance'], notes: 'contract: wallet layer for LOV + USDC' }
  if (/portal-chat|portal-worker/i.test(name)) return { layer: 'L3', status: 'active', owns: ['portal rendering + routing worker'], notes: 'L3 deployed portal worker' }
  if (/roblox-bridge/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['Roblox integration bridge'], notes: 'pending game integration decisions' }
  if (/shadow-bridge/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['shadow data bridge'], notes: 'pending value assessment' }
  if (/signaling/i.test(name)) return { layer: 'L2', status: 'active', owns: ['WebSocket signaling (peer mesh)'], notes: 'contract: real-time signaling' }
  if (/social-drop-automation/i.test(name)) return { layer: 'L3', status: 'migrate-later', owns: ['social drop automation'], notes: 'L3 surface automation' }
  if (/swarm-router/i.test(name)) return { layer: 'L2', status: 'active', owns: ['swarm task routing'], notes: 'contract: swarm orchestration' }
  if (/tetra-tools/i.test(name)) return { layer: 'L2', status: 'active', owns: ['tetrahedral layout + K4 geometry tools'], notes: 'contract: geometry layer' }
  if (/vibe-generate/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['vibe code generation'], notes: 'evaluate: consolidate with p31-mcp or retire' }
  if (/vibe-sandbox/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['vibe code sandbox execution'], notes: 'evaluate: consolidate with sandbox-sdk or retire' }
  if (/sovereign/i.test(name) && /packages/i.test(path)) return { layer: 'L0', status: 'active', owns: ['sovereign primitives (zero-knowledge, privacy, DID:key minting)'], notes: 'layer 0 primitives for sovereign stack' }
  if (/shared-core/i.test(name)) return { layer: 'L0', status: 'active', owns: ['shared types, constants, env config'], notes: 'layer 0 shared foundation' }
  if (/protocol-commons/i.test(name)) return { layer: 'L0', status: 'active', owns: ['protocol-level shared types and helpers'], notes: 'cross-cutting protocol primitives' }
  if (/geodesic-core/i.test(name)) return { layer: 'L1', status: 'active', owns: ['geodesic dome + tetrahedral geometry primitives'], notes: 'K4 geometry source' }
  if (/game-engine/i.test(name)) return { layer: 'L2', status: 'active', owns: ['game engine runtime', 'state + rendering'], notes: 'contract: game runtime' }
  if (/game-generator/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['procedural game generation'], notes: 'pending value assessment' }
  if (/observatory/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['observability + metrics'], notes: 'pending observability strategy' }
  if (/spaceship-earth/i.test(name)) return { layer: 'L3', status: 'active', owns: ['Spaceship Earth UX'], notes: 'L3 experiential surface' }
  if (/forge-sdk/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['forge SDK (contract deployment)'], notes: 'SDK for on-chain contract interaction' }
  if (/vibe-sdk/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['vibe SDK (code generation)'], notes: 'pending consolidation with mcp-vibe' }
  if (/interface-generator/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['UI schema → code generation'], notes: 'pending consolidation' }
  if (/node-zero/i.test(name)) return { layer: 'L0', status: 'active', owns: ['zero-trust device bootstrapping'], notes: 'device identity bootstrapping' }
  if (/oracle-terminal/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['oracle terminal (WASM skill execution)'], notes: 'pending value assessment' }
  if (/bonding/i.test(name)) return { layer: 'L3', status: 'active', owns: ['BONDING game surface'], notes: 'L3 game surface' }
  if (/sovereign-sdk/i.test(name)) return { layer: 'L0', status: 'active', owns: ['sovereign SDK (identity + encryption primitives)'], notes: 'L0 primitives layer' }
  if (/sovereign-justice/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['sovereign justice dispute system'], notes: 'pending consolidation with mcp-justice' }
  if (/sovereign-primitives/i.test(name)) return { layer: 'L0', status: 'active', owns: ['zero-knowledge proof primitives'], notes: 'L0 core' }
  if (/quantum-core/i.test(name)) return { layer: 'L1', status: 'active', owns: ['quantum-inspired math primitives (tetrahedral, quantum computing models)'], notes: 'math layer' }
  if (/ble/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['BLE proximity detection'], notes: 'pending device mesh strategy' }
  if (/forge-sdk/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['forge SDK (web3 contract deploy)'], notes: 'SDK layer' }
  if (/design-validator/i.test(name)) return { layer: 'L1', status: 'active', owns: ['WCAG + token + contract compliance validator'], notes: 'consumed by CI + MCP' }
  if (/love-ledger/i.test(name)) return { layer: 'L2', status: 'active', owns: ['LOV accounting + hash chain'], notes: 'canonical LOV ledger' }

  // ---------- L3: Surfaces ----------
  // Production portals
  if (/portals\/design/i.test(path)) return { layer: 'L3', status: 'active', owns: ['design.p31ca.org (design portal, Storybook)'], notes: 'L3 portal surface' }
  if (/portals\/qpj/i.test(path)) return { layer: 'L3', status: 'active', owns: ['qpj.p31ca.org (quantum pickle jar portal)'], notes: 'L3 portal surface, WebMCP Phase 1 complete' }
  if (/portals\/chat/i.test(path)) return { layer: 'L3', status: 'active', owns: ['chat.p31ca.org (chat portal)'], notes: 'L3 portal surface' }
  if (/portals\/teen/i.test(path)) return { layer: 'L3', status: 'active', owns: ['teen portal (13-17 age surface)'], notes: 'L3 portal surface' }
  if (/portals\/meatspace/i.test(path)) return { layer: 'L3', status: 'active', owns: ['meatspace portal (adult surface)'], notes: 'L3 portal surface' }
  if (/portals\/children/i.test(path)) return { layer: 'L3', status: 'active', owns: ['children portal (6-12 age surface)'], notes: 'L3 portal surface' }
  if (/portals\/parent/i.test(path)) return { layer: 'L3', status: 'active', owns: ['parent portal (adult guard + child profile)'], notes: 'L3 portal surface' }
  if (/portals\/template/i.test(path)) return { layer: 'L3', status: 'active', owns: ['template portal scaffold'], notes: 'L3 scaffold — use to create new portals' }
  if (/portals\/assets/i.test(path)) return { layer: 'L3', status: 'active', owns: ['static assets + webmcp-registry'], notes: 'L3 asset surface' }

  // Production non-portal surfaces
  if (/production\/shell/i.test(path)) return { layer: 'L3', status: 'active', owns: ['app.p31ca.org (P31 shell app)'], notes: 'L3 shell surface' }
  if (/production\/monetization/i.test(path)) return { layer: 'L3', status: 'active', owns: ['monetization dashboard surface'], notes: 'L3 monetization surface' }
  if (/production\/campaign/i.test(path)) return { layer: 'L3', status: 'migrate-later', owns: ['marketing campaign pages'], notes: 'L3 marketing surface' }
  if (/production\/assets/i.test(path)) return { layer: 'L3', status: 'active', owns: ['production static assets'], notes: 'L3 asset surface' }

  // Workspace apps (surface)
  if (/apps\/p31ca/i.test(path)) return { layer: 'L3', status: 'active', owns: ['p31ca.org main site (Astro)'], notes: 'L3 marketing + docs surface' }
  if (/apps\/bonding/i.test(path)) return { layer: 'L3', status: 'active', owns: ['bonding game surface'], notes: 'L3 game surface' }
  if (/apps\/k4-cage/i.test(path)) return { layer: 'L3', status: 'active', owns: ['K4 tetrahedral cage (WebGL)'], notes: 'L3 experiential surface' }
  if (/apps\/auth/i.test(path)) return { layer: 'L3', status: 'active', owns: ['auth surface (login + passport)'], notes: 'L3 auth UI' }
  if (/phos\//i.test(path) && !/mcp/i.test(name) && /apps|software|workers/i.test(path) && !/software\/workers/i.test(path)) return { layer: 'L3', status: 'migrate-later', owns: ['Phos portal surface'], notes: 'L3 surface — pending phos architecture decision' }

  // Chat surface
  if (/chat-sandbox/i.test(name)) return { layer: 'L3', status: 'active', owns: ['chat sandbox standalone surface'], notes: 'L3 standalone surface' }
  if (/willow-chat/i.test(name)) return { layer: 'L3', status: 'migrate-later', owns: ['Willow chat surface'], notes: 'L3 — pending willow architecture decision' }

  // Arcades / game surfaces
  if (/arcade-room/i.test(name)) return { layer: 'L3', status: 'migrate-later', owns: ['arcade room surface'], notes: 'L3 — pending arcade strategy' }

  // ---------- L0: Sovereign / Identity ----------
  if (/p31-surrogate-backend/i.test(path)) return { layer: 'L3', status: 'migrate-later', owns: ['p31 surrogate backend'], notes: 'L3 backend surface — pending consolidation' }
  if (/sovereign-core/i.test(name)) return { layer: 'L0', status: 'active', owns: ['sovereign core (DID, W3C VC, ZK proofs)'], notes: 'L0 core' }
  if (/schema-export/i.test(path)) return { layer: 'L0', status: 'active', owns: ['cognitive passport schema export'], notes: 'L0 schema for passports' }

  // ---------- L2: Remaining workers with wrangler.toml (undeployed infrastructure) ----------
  if (/software\/cloudflare-worker/i.test(path)) {
    if (/orchestrator/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['software orchestrator'], notes: 'pending consolidation' }
    if (/p31-gumroad/i.test(name)) return { layer: 'L2', status: 'retire', owns: ['Gumroad webhook handler'], notes: 'retire — legacy payment rail' }
    if (/bouncer/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['legacy bouncer'], notes: 'pending consolidation with production bouncer' }
    if (/command-center/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['legacy command center'], notes: 'pending consolidation' }
    if (/q-factor/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['legacy q-factor'], notes: 'pending consolidation with production q-factor' }
    if (/social-drop/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['legacy social-drop'], notes: 'pending consolidation' }
    return { layer: 'L2', status: 'migrate-later', owns: ['undeployed / legacy worker'], notes: 'evaluate for migration or retirement' }
  }

  // remaining software packages
  if (/software\/packages/i.test(path)) {
    if (/love-ledger/i.test(name)) return { layer: 'L2', status: 'active', owns: ['@p31ca/love-ledger (software copy — canonical npm package)'], notes: 'this is the source of truth for the npm package' }
    if (/interface-generator/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['interface generator (software copy)'], notes: 'duplicate of workspace — keep one' }
    if (/sovereign/i.test(name)) return { layer: 'L0', status: 'migrate-later', owns: ['sovereign SDK (software copy)'], notes: 'duplicate — keep workspace copy' }
    return { layer: 'L2', status: 'migrate-later', owns: ['software package'], notes: 'evaluate: consolidate into workspace or retire' }
  }

  // Software workers (legacy / undeployed)
  if (/software\/workers/i.test(path)) {
    if (/care-mesh|love-chain|intent-resolver|pilot-dashboard|secret-rotator/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['undeployed software worker'], notes: 'consolidate with workspace equivalent' }
    if (/agent-runtime/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['agent runtime (software copy)'], notes: 'duplicate — consolidate' }
    if (/sovereign-agent/i.test(name)) return { layer: 'L2', status: 'migrate-later', owns: ['sovereign agent runtime (software copy)'], notes: 'duplicate — consolidate' }
    return { layer: 'L2', status: 'migrate-later', owns: ['undeployed / legacy software worker'], notes: 'evaluate for migration or retirement' }
  }

  // remaining workspace packages
  if (/packages/i.test(path)) return { layer: 'L1', status: 'active', owns: ['design-token package'], notes: 'design token / utility package' }

  // remaining workspace workers (everything under workers/)
  if (/workers/i.test(path)) return { layer: 'L2', status: 'active', owns: ['worker'], notes: 'contract layer worker' }

  // remaining workspace root items
  if (/software\/bonding/i.test(path)) return { layer: 'L3', status: 'migrate-later', owns: ['bonding game (software source)'], notes: 'pending consolidation with apps/bonding' }
  if (/software\/agents/i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['agent topology (software)'], notes: 'pending consolidation with agent-runtime' }
  if (/software\/design-tokens/i.test(path)) return { layer: 'L1', status: 'active', owns: ['generated design-token artifacts'], notes: 'generated from design-core THEME_TOKENS' }
  if (/phosphorus31/i.test(path) && !/apps/i.test(path)) return { layer: 'L3', status: 'active', owns: ['phosphorus31.org surface'], notes: 'L3 marketing surface' }

  // L3 surfaces — user-facing apps and production surfaces
  if (/apps\//i.test(path)) return { layer: 'L3', status: 'active', owns: ['product surface (app)'], notes: 'L3 surface — app surface' }
  // ecosystem/ — integration periphery
  if (/ecosystem\//i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['integration ecosystem'], notes: 'integration periphery — evaluate for consolidation' }
  // remaining software/ (undeployed infrastructure not caught above)
  if (/software\//i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['undeployed software worker'], notes: 'undeployed infrastructure — evaluate for migration or retirement' }

  // workspace root workers and utilities
  if (/buffer-worker/i.test(name)) return { layer: 'L2', status: 'active', owns: ['buffer worker (Cloudflare Worker)'], notes: 'L2 worker contract' }
  if (/crypto-monitor/i.test(name)) return { layer: 'L2', status: 'active', owns: ['crypto monitoring worker'], notes: 'L2 worker contract' }
  if (/fawn-guard/i.test(name)) return { layer: 'L2', status: 'active', owns: ['fawn guard worker'], notes: 'L2 worker contract' }
  if (/k4-worker$/i.test(path)) return { layer: 'L2', status: 'active', owns: ['K4 cage worker'], notes: 'L2 worker contract' }
  if (/cli$/i.test(path)) return { layer: 'L2', status: 'active', owns: ['CLI + MCP surface'], notes: 'L2 MCP tool surface' }
  if (/^P31-local-workspace\/software$/i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['software repo umbrella'], notes: 'repo root — decompose into individual artifacts' }

  // workspace root utilities and tools (tools/*, p31labs/*)
  if (/tools\//i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['tool / utility surface'], notes: 'workspace tool — evaluate for consolidation' }
  if (/p31labs\//i.test(path)) return { layer: 'L2', status: 'migrate-later', owns: ['p31labs surface'], notes: 'workspace surface — evaluate for consolidation' }
  if (/production\/tools\//i.test(path)) return { layer: 'L2', status: 'active', owns: ['production tool surface'], notes: 'L3 production tool' }
  // production/ surfaces not covered above (portals, shell, monetization, campaign, assets are already classified)
  if (/production\//i.test(path)) return { layer: 'L3', status: 'active', owns: ['production surface'], notes: 'L3 production surface' }

  // default for anything remaining — intentionally a stub that fails validation
  return { layer: 'L2', status: 'unclassified', owns: ['artifact'], notes: 'UNCLASSIFIED — review and assign correct layer' }
}

function main() {
  const rows = inventory.artifacts.map((a) => {
    const { layer, status, owns, must_not: rowMustNot, notes } = classify(a.path, a.name, a.hints)
    const entry = {
      path: a.path,
      repo: a.repo,
      name: a.name,
      kind: a.kind,
      layer,
      owns,
      must_not: rowMustNot ?? (layer === 'retire' ? [] : (LAYER_DEFAULTS[layer]?.must_not ?? [])),
      status,
      notes,
    }
    return entry
  })

  // Sort: layer, then repo, then path
  rows.sort((a, b) => {
    const lo = { L0: 0, L1: 1, L2: 2, L3: 3, retire: 4 }
    const al = a.status === 'retire' ? 'retire' : a.layer
    const bl = b.status === 'retire' ? 'retire' : b.layer
    if (lo[al] !== lo[bl]) return lo[al] - lo[bl]
    if (a.repo !== b.repo) return a.repo.localeCompare(b.repo)
    return a.path.localeCompare(b.path)
  })

  const yaml = `# P31 Canonical Core — Cycle 1
# Machine-readable classification. Layer-level must_not inherited by all entries.
# Regenerate: node scripts/generate-core-yaml.mjs

version: 1
generated_at: ${new Date().toISOString()}

layers:
  L0:
    name: identity
    description: "The atom — never changes. DID:key, passport, sovereign primitives."
    must_not: ${JSON.stringify(LAYER_DEFAULTS.L0.must_not)}
  L1:
    name: tokens
    description: "Additive only, never subtractive. OKLCH, 863Hz, DTCG, 30 variants."
    must_not: ${JSON.stringify(LAYER_DEFAULTS.L1.must_not)}
  L2:
    name: contracts
    description: "Versioned, frozen, diffed. MCP tools, LOV ledger, payment rails, component contracts."
    must_not: ${JSON.stringify(LAYER_DEFAULTS.L2.must_not)}
  L3:
    name: surfaces
    description: "Disposable, rebuild freely. Each reads from L0-L2, never around them."
    must_not: ${JSON.stringify(LAYER_DEFAULTS.L3.must_not)}

entries:
${rows.map((r) => {
  const doc = {
    path: r.path,
    repo: r.repo,
    name: r.name,
    kind: r.kind,
    layer: r.status === 'retire' ? undefined : r.layer,
    owns: r.owns,
    must_not: r.must_not,
    status: r.status,
    notes: r.notes,
  }
  if (r.status === 'retire') doc.layer = undefined
  // Emit YAML inline
  const y = []
  y.push(`  - path: "${r.path}"`)
  y.push(`    repo: "${r.repo}"`)
  y.push(`    name: "${r.name}"`)
  y.push(`    kind: "${r.kind}"`)
  if (doc.layer) y.push(`    layer: ${doc.layer}`)
  y.push(`    owns: ${JSON.stringify(doc.owns)}`)
  y.push(`    must_not: ${JSON.stringify(doc.must_not)}`)
  y.push(`    status: ${r.status}`)
  y.push(`    notes: "${(r.notes ?? '').replace(/"/g, '\\"')}"`)
  return y.join('\n')
}).join('\n')}
`
  writeFileSync(OUT, yaml)
  console.log(`Wrote ${rows.length} entries → ${OUT}`)
  // summary
  const counts = {}
  rows.forEach((r) => { const k = r.status === 'retire' ? 'retire' : r.layer; counts[k] = (counts[k] ?? 0) + 1 })
  console.log(JSON.stringify(counts))
}

main()