# PHOS Dependency Graph

**Generated:** July 2026
**Format:** Tree-structured dependency map of all PHOS modules, packages, workers, stores, hooks, libs, and surfaces.

---

## 1. PHOS Application Dependencies

### 1.1 Direct npm Dependencies (`apps/phos/package.json`)

```
phos@2.0.0 (Astro 5 + React 19)
├── Runtime
│   ├── astro@^5.0.0
│   ├── react@^19.0.0
│   ├── react-dom@^19.0.0
│   ├── react-router-dom@^7.18.1
│   └── tailwindcss@^3.4.0
│
├── State Management
│   └── @nanostores/persistent@^1.3.4
│
├── UI Components
│   ├── dockview@^1.7.0                  ← Dockview IDE workspace panels
│   ├── lucide-react@^1.17.0             ← Icon library
│   ├── fuse.js@^7.3.0                   ← Command palette search
│   ├── react-markdown@^10.1.0           ← Markdown rendering
│   └── remark-gfm@^4.0.1               ← GFM markdown extension
│
├── Terminal (Forge)
│   ├── @xterm/xterm@^5.5.0              ← Terminal emulator
│   ├── @xterm/addon-fit@^0.10.0         ← Auto-fit terminal
│   └── @cloudflare/sandbox@^0.8.0       ← Sandbox PTY addon
│
├── 3D / Graphics
│   └── three@^0.170.0                   ← 3D previews
│
├── Local AI
│   ├── @mlc-ai/web-llm@0.2.84          ← Browser LLM inference
│   ├── @huggingface/transformers@^4.2.0 ← Transformers.js
│   └── @timur00kh/whisper.wasm@0.1.1    ← Local speech-to-text
│
├── Local Database
│   ├── @electric-sql/pglite@^0.5.3      ← In-browser Postgres (PGlite)
│   └── @electric-sql/pglite-react@^0.4.3
│
├── PWA
│   └── @khmyznikov/pwa-install@^0.6.3   ← PWA install prompt
│
├── Crypto
│   ├── @noble/curves@^2.2.0             ← Ed25519, secp256k1
│   └── @noble/post-quantum@^0.6.1       ← ML-DSA, ML-KEM
│
├── Collaboration
│   └── yjs@^13.6.31                     ← CRDT for multiplayer
│
└── Workspace Packages
    ├── @p31/design-system@file:../../packages/design-system
    ├── @p31ca/ui@file:../../packages/ui
    └── @p31/interface-generator@workspace:*
```

### 1.2 Workspace Package Dependencies (tree)

```
@p31ca/design-core@2.0.0
  └── (zero deps — pure CSS + TypeScript tokens)

@p31ca/ui@1.2.0
  └── @p31ca/design-core@workspace:*

@p31/design-system@1.0.0-deprecated
  └── (no deps — replaced by design-core)

@p31ca/forge-sdk@1.0.0 (published npm)
  ├── react@^19.0.0 (peer)
  ├── react-dom@^19.0.0 (peer)
  ├── dockview@^1.7.0
  ├── @xterm/xterm@^5.5.0
  ├── @xterm/addon-fit@^0.10.0
  └── @cloudflare/sandbox@^0.8.0

@p31ca/gamification@1.0.0
  ├── idb-keyval@^6.2.1
  └── zustand@^5.0.0

@p31ca/mcp-membrane@1.0.0 (published npm)
  └── node-fetch@^3.3.0

@p31ca/mcp-vibe@1.0.0 (published npm)
  └── (zero deps — pure stdio MCP server)

@p31ca/mcp-justice@1.0.0 (published npm)
  └── (zero deps — pure stdio MCP server)

@p31ca/vibe-sdk@1.0.0 (published npm)
  └── (zero deps — pure TypeScript SDK)

@p31/spaceship-earth@0.0.1 (private, React PWA)
  ├── react@^18.3.1
  ├── @react-three/fiber@^8.15.0
  ├── @react-three/drei@^9.88.0
  ├── three@^0.159.0
  ├── yjs@^13.6.30
  ├── y-webrtc@^10.3.0
  ├── y-indexeddb@^9.0.12
  ├── @noble/curves@^2.2.0
  ├── @electric-sql/pglite@^0.1.0
  ├── @scopelift/stealth-address-sdk
  ├── idb-keyval@^6.2.1
  ├── zustand@^5.0.0
  ├── lucide-react@^0.468.0
  └── @sentry/react@^8.55.0
```

### 1.3 Build Toolchain

```
astro.config.ts
├── @astrojs/react@^4.0.0
├── @astrojs/tailwind@^6.0.0
├── Vite (inlined)
│   ├── manualChunks: vendor (react/react-dom), pglite
│   └── optimizeDeps exclude: @electric-sql/pglite
└── output: static (SPA with client:only react)

tsconfig.json
└── extends astro/tsconfigs/strict
    ├── paths: @/* → src/*
    └── exclude: src/workers/** (compiled separately for Workers runtime)
```

---

## 2. PHOS Internal Module Dependency Map

### 2.1 Store Layer (@nanostores/persistent)

```
store/spoons.ts                    persistentAtom<SpoonsState>     key: phos:spoons
  → consumed by: PHOSWorkspace, PassportWizard, CrisisOverlay
  → sets: <html data-spoons="N">

store/density.ts                   persistentAtom<DensityLevel>    key: phos:density
  → consumed by: PHOSWorkspace, WorkspaceShell header
  → sets: <html data-density="N">

store/accessibility.ts             persistentMap<AccessibilityState>  key: phos:accessibility:
  → consumed by: SettingsSurface
  → sets: <html data-dyslexia>, data-reduced-motion, font-size

store/identity.ts                  persistentMap<IdentityState>    key: phos:identity:
  → consumed by: PassportSurface, PassportWizard, PQCKeygenSurface,
  |              BarterMarketplace, GovernanceSurface, MintSurface
  ├── depends on: lib/crypto (generateKeypair)
  ├── depends on: lib/keyVault (saveKey/loadKey/deleteKey)
  └── exports: identityStore, loadPrivateKey, generateAndStoreIdentity,
               clearIdentity, isSovereign
```

### 2.2 Hook Layer

```
hooks/useSovereignBrain.ts
  ├── depends on: lib/llm (brain singleton)
  └── consumed by: PHOSWorkspace, SettingsSurface
  state: idle → downloading → ready → unsupported
  routing: force-edge | force-local | auto

hooks/useChatMessages.ts
  ├── depends on: pglite-react (useLiveQuery)
  ├── depends on: lib/chatStore
  └── consumed by: PHOSWorkspace (PromptBar)

hooks/useMediaQuery.ts
  └── consumed by: PHOSWorkspace (mobile detection)

hooks/useQuantumBrainDump.ts
  └── consumed by: QuantumBrainDumpSurface

hooks/useWebSocketTally.ts
  └── consumed by: GovernanceSurface

hooks/useVibeCode.ts
  └── consumed by: VibeStudio

hooks/useEmbeddingWorker.ts
  └── consumed by: ChaosIngest
```

### 2.3 Lib Layer

```
lib/llm.ts
  └── brain singleton (BrainState, BrainStatus, RoutingOverride)
  consumed by: hooks/useSovereignBrain

lib/mcp-subagent-dispatch.ts
  ├── exports: MCP_SERVERS (8), TOTAL_TOOLS (137)
  ├── exports: dispatchSubagent, dispatchParallel, generateWorktreeId
  └── consumed by: surfaces/AgentCommandCenterSurface

lib/achievement-templates.ts
  ├── exports: ACHIEVEMENT_TEMPLATES (achievement definitions)
  └── consumed by: ArtifactSurface, ArtifactGallerySurface

lib/artifact-serial.ts
  ├── exports: generateSerial, generateQRBlocks, type ArtifactSerial
  └── consumed by: ArtifactSurface

lib/polyslice-integration.ts
  ├── exports: sliceMesh, estimatePrint, SliceConfig, DEFAULT_CONFIG
  └── consumed by: ArtifactSurface

lib/themeEngine.ts
  ├── exports: getBiologicalTheme, getThemeName
  └── consumed by: PHOSWorkspace, WorkspaceShell

lib/crypto.ts
  ├── depends on: @noble/curves (Ed25519)
  ├── depends on: @noble/post-quantum (ML-DSA, ML-KEM)
  └── consumed by: store/identity, MintSurface, PassportSurface, GovernanceSurface

lib/keyVault.ts
  ├── exports: saveKey, loadKey, deleteKey (IndexedDB vault)
  └── consumed by: store/identity

lib/KarmaEngine.ts
  └── consumed by: ArcadeSurface, ChaosIngest, LedgerSurface, OpenLedgerSurface

lib/taler-client.ts
  └── consumed by: SanctuarySurface

lib/did-auth.ts
  └── consumed by: AttestSurface, DisputeSurface, SanctuarySurface

lib/room-client.ts
  └── consumed by: MultiplayerSurface

lib/yjs-integration.ts
  └── consumed by: MultiplayerSurface

lib/chatStore.ts
  └── consumed by: hooks/useChatMessages

lib/semanticSearch.ts
  └── consumed by: hooks/useChatMessages

lib/OpenLedger.ts
  └── consumed by: OpenLedgerSurface

lib/barterEngine.ts, lib/trustGraph.ts
  └── consumed by: BarterMarketplace

lib/i18n.ts
  └── consumed by: OnboardingPortal

lib/K4Bridge.ts
  └── consumed by: ArcadeSurface, LedgerSurface

config/surfaces.ts
  ├── exports: SURFACE_NAV (46 items), SURFACE_IDS
  └── consumed by: lib/surfaceRouter, components/SurfaceContent,
                   components/CommandPalette, components/PHOSSidebar

config/endpoints.ts
  └── consumed by: DashboardSurface, ShakeStream

lib/surfaceRouter.ts
  ├── depends on: config/surfaces
  ├── exports: pathToSurface, surfaceToPath, pathToInitialSurface
  └── consumed by: components/SurfaceRouter
```

### 2.4 Component Layer

```
PHOSWorkspace.tsx (root shell)
├── depends on: store/spoons, store/density, store/identity
├── depends on: hooks/useSovereignBrain, hooks/useChatMessages, hooks/useMediaQuery
├── depends on: lib/themeEngine, lib/KarmaEngine, lib/llm
├── depends on: AtmosphereProvider, SurfaceContent, Starfield, CrisisOverlay
├── renders → CrisisOverlay (@p31/interface-generator) when spoons === 0
├── renders → PassportWizard when unregistered
└── renders → WorkspaceShell when authenticated

AtmosphereProvider.tsx
├── context: spoons, currentSurface, setSurface, theme
└── consumed by: ~6 surfaces (Arcade, Bonding, Compass, Greeting, Hearth, Ignition, Settings)

SurfaceContent.tsx
├── depends on: config/surfaces, lib/surfaceRouter
├── lazy-loads: all 46 surface components via dynamic import()
└── passes props: currentSurface, setSurface, spoons, theme, isGuest, isGenerative, intentPrompt

PHOSSidebar.tsx
├── depends on: config/surfaces (SURFACE_NAV)
├── renders: 48px surface icons in primary/secondary groups
└── consumed by: WorkspaceShell

PHOSMagicDrawer.tsx (right drawer)
├── state: LLM model selection, telemetry config
└── consumed by: WorkspaceShell

PHOSPromptBar.tsx (chat input)
├── depends on: hooks/useChatMessages
├── sub-components: VoiceInputButton (whisper.wasm local ASR)
└── consumed by: WorkspaceShell

CommandPalette.tsx (⌘K)
├── depends on: config/surfaces (SURFACE_NAV)
├── depends on: fuse.js (search)
└── consumed by: WorkspaceShell

Starfield.tsx (ambient particles)
├── depends on: store/spoons (motion scaling)
└── consumed by: WorkspaceShell

ambient/* (7 ambient effect components)
├── AtomOrbitals.tsx, DustMotes.tsx, EmberParticles.tsx
├── HexRain.tsx, PixelGrid.tsx, VagusBreath.tsx, VaultScanlines.tsx
├── all use .phos-gpu CSS class (will-change + translateZ(0))
└── consumed by: various surfaces via AtmosphereProvider
```

### 2.5 Forge Component Layer

```
forge/ForgeWorkspace.tsx
├── depends on: dockview (DockviewReact)
├── depends on: dockview/dist/styles/dockview.css
├── contains: 8 panels (VibeStudio, Documents, Membrane, Devices,
|            Artifacts, Terminal, Admin, MCP Tools)
├── all panels: lazy-loaded via React.lazy()
└── state: layout persisted in localStorage

forge/components/TerminalPanel.tsx
├── depends on: @xterm/xterm, @xterm/addon-fit
├── depends on: @cloudflare/sandbox (PTY addon)
├── connects to: terminal-relay.trimtab-signal.workers.dev (WebSocket)
└── state: connection status, reconnect logic

forge/components/MCPToolPanel.tsx
├── state: 137 tools across 8 MCP servers
├── features: search filter, category filter, one-click execution
└── connects to: x402 gateway (simulated)

forge/components/ForgeStatusBar.tsx
├── state: XP, LOVE, level, streak, DORA score
├── features: spoon cycle control, active panel indicator
└── data source: localStorage cache (phos:dora)
```

---

## 3. Worker Dependency Map

### 3.1 PHOS Workers (bundled inside apps/phos)

```
src/workers/love-ledger/
├── D1: love-ledger (592e3e2e-...)
├── hash chain: SHA-256, love_chain table, prev_hash/entry_hash
├── endpoints: POST /withdraw, GET /chain, GET /export
└── cron: phos-backup (daily cold snapshot to R2)

src/workers/contract-engine/
└── (no bindings)

src/workers/governance-engine/
└── (no bindings)
```

### 3.2 External Workers (`workers/*`)

```
workers/membrane-coordinator/
├── DO: MEMBRANE (MembraneCoordinator)
├── DORA metrics: deployment frequency, lead time, CFR, MTTR
├── gamification: XP, LOVE, level, streak, achievements
├── vars: GENESIS_GATE_URL, LOVE_BRIDGE_URL
└── observability: enabled, head_sampling_rate: 1.0

workers/multiplayer-room/
├── DO: ROOM (RoomCoordinatorDO, SQLite)
├── Yjs WebSocket coordination
├── vars: LOVE_BRIDGE_URL, AI_GATEWAY_URL, GENESIS_GATE_URL
├── compatibility: nodejs_compat
└── observability: enabled, head_sampling_rate: 1.0

workers/device-registry/
├── DO: DEVICE_REGISTRY (DeviceRegistryDO, SQLite)
├── device mesh: ESP32, Roblox, etc.
└── observability: enabled, head_sampling_rate: 1.0

workers/meshy-bridge/
├── vars: MESHY_BASE_URL = https://api.meshy.ai
├── endpoints: /generate, /text-to-3d, /image-to-3d,
│             /print/analyze, /print/repair, /print/multi-color
├── needs: MESHY_API_KEY (not set)
└── observability: enabled, head_sampling_rate: 0.1

workers/terminal-relay/
├── DO: SANDBOX (SandboxDO, SQLite)
├── D1: TERMINAL_DB (terminal-sessions)
├── WebSocket PTY proxy
├── compatibility: nodejs_compat
└── observability: enabled, head_sampling_rate: 1.0

workers/signaling/
├── KV: P31_SIGNALING_KV (id: 9401942b...)
├── DO: SIGNALING_ROOM (SignalingRoom, SQLite)
├── WebRTC signaling for multiplayer
└── compatibility: nodejs_compat

workers/dispatch-router/
├── service binding → app-supervisor
└── (routing layer)

workers/app-supervisor/
├── DO: APP_SUPERVISOR (AppSupervisor)
└── (supervisor process)

workers/care-api/
├── D1: LOVE_DB (shared love-ledger database)
├── vars: ENVIRONMENT, TURNSTILE_SECRET_KEY
└── compatibility: nodejs_compat

workers/vibe-sandbox/
└── (no bindings — sandboxed execution)

workers/willow-chat/
└── (no bindings — chat backend)

workers/bob-marge-monitor/
└── (no wrangler.toml found)
```

### 3.3 Software Workers (`software/workers/*`)

```
software/workers/mcp-x402-gateway/
├── L3.2 x402 billing gateway
├── service binding → bridge (node stdio)
└── bridges: 4 stdio MCP servers (oasis, registry, love, phosforge)

software/workers/ledger-bridge/
├── on-chain attestation relay (Base Sepolia)
├── SD-JWT VC issuance (RFC 9901)
├── FEP-8b32 ActivityPub signing
└── deployed: ledger-bridge.trimtab-signal.workers.dev

software/workers/federation-bridge/
├── Aggregated Status-List-2021
├── did:web /.well-known/did.json
├── pilot registry self-service
└── deployed: federation.p31ca.org

software/workers/fhir-bridge/
├── HL7 FHIR R5 bridge
├── shared: love-ledger D1
└── 4/4 tests pass

software/workers/agent-runtime/
├── Agents SDK tool runtime
├── tools: send_notification, generate_care_report
└── deployed: agent-runtime.trimtab-signal.workers.dev

software/workers/care-mesh/
├── privacy-preserving care data mesh
├── Laplace DP + Ed25519
└── deployed: care-mesh.trimtab-signal.workers.dev

software/workers/p31-mcp-server/
├── Native MCP front door (9 tools)
└── deployed: p31-mcp-server.trimtab-signal.workers.dev

software/workers/personal-swarm/
├── cf-monitor.mjs error tailing
└── deployed: personal-swarm.trimtab-signal.workers.dev

software/workers/intent-resolver/
├── L5 Creation Economy
├── POST /intent → Creation Quote
└── (intent-driven worker model)

software/workers/creation-accountant/
├── L5 Creation Economy
├── POST /receipt → spoon-delta measurement
└── (settlement hardening: Ed25519 receipts)
```

---

## 4. Surface-to-Dependency Matrix

| Surface | Stores | Hooks | Libs | Components | Workers |
|---------|--------|-------|------|------------|---------|
| CHAT | spoons, identity | useChatMessages, useSovereignBrain | llm, chatStore | PromptBar, VoiceInput | love-ledger |
| FORGE | — | — | mcp-subagent-dispatch | ForgeWorkspace, Terminal, MCPToolPanel, StatusBar | terminal-relay |
| AGENT_COMMAND | — | — | mcp-subagent-dispatch | — | — |
| OPERATIONS | — | — | (localStorage DORA) | ForgeStatusBar | membrane-coordinator |
| ARTIFACT | — | — | achievement-templates, artifact-serial, polyslice-integration | ThreePreview | meshy-bridge |
| ARTIFACT_GALLERY | — | — | achievement-templates | — | love-ledger, meshy-bridge |
| MEMBRANE | — | — | — | — | membrane-coordinator |
| DOCUMENTS | — | — | — | — | — |
| MULTIPLAYER | — | — | room-client, yjs-integration | — | multiplayer-room |
| DEVICES | — | — | — | — | device-registry |
| AGENT_SPACES | — | — | — | — | — |
| PASSPORT | identity | — | crypto, keyVault | — | — |
| PQC_KEYS | identity | — | crypto (ML-DSA/ML-KEM) | — | — |
| GOVERNANCE | identity | useWebSocketTally | crypto, api/governance | — | governance-engine |
| BARTER | identity | — | trustGraph, barterEngine, api/contracts | — | — |
| ARCADE | — | — | KarmaEngine, K4Bridge | AtmosphereProvider | — |
| QUANTUM_BRAIN_DUMP | — | useQuantumBrainDump | — | — | jitterbug-api |
| SANCTUARY | — | — | did-auth, taler-client, useSanctuaryWS | — | taler-exchange-bridge |
| ONBOARDING | — | — | i18n | GlassCard, LangSwitcher | federation-bridge |
| SETTINGS | accessibility | useSovereignBrain | — | AtmosphereProvider | — |

---

## 5. Infrastructure Dependency Chain

```
Browser (phos.p31ca.org)
│
├── → Cloudflare Pages (static assets: JS, CSS, HTML)
│
├── → love-ledger.p31ca.org (D1: love-ledger)
│   ├── shared by: care-api, fhir-bridge, jitterbug-api,
│   │             sovereign-justice, care-mesh
│   └── backed up: daily to R2 via phos-backup cron
│
├── → membrane-coordinator.trimtab-signal.workers.dev (DO: MEMBRANE)
│   ├── → genesis-gate.trimtab-signal.workers.dev (event bus)
│   └── → love-bridge.trimtab-signal.workers.dev (LOVE bridge)
│
├── → multiplayer-room.trimtab-signal.workers.dev (DO: ROOM)
│   ├── → love-bridge, ai-gateway, genesis-gate
│   └── → signaling.trimtab-signal.workers.dev (KV + DO for WebRTC)
│
├── → meshy-bridge.trimtab-signal.workers.dev
│   └── → api.meshy.ai (external: Meshy 3D AI)
│
├── → terminal-relay.trimtab-signal.workers.dev (DO: SANDBOX + D1)
│
├── → gateway.p31ca.org (auth gateway)
│   ├── → p31-llm-proxy (LLM proxy)
│   └── → mcp-x402-gateway (MCP bridge → 4 stdio servers)
│
├── → federation.p31ca.org
│   ├── → leder-bridge.trimtab-signal.workers.dev
│   └── → love-ledger (D1: LOVE_DB)
│
├── → dispatch-router.trimtab-signal.workers.dev
│   └── → app-supervisor.trimtab-signal.workers.dev (DO)
│
├── → counterscale (analytics.p31ca.org)
│   ├── Analytics Engine: metricsDataset (WEB_COUNTER_AE)
│   └── R2: counterscale-daily-rollups
│
└── taler: exchange.demo.taler.net (GNU Taler)
```

---

## 6. MCP Server Chain (8 stdio + 3 edge)

### 6.1 In-Repo MCP Servers (CLI-based, stdio JSON-RPC)

```
cli/mcp-server.js                 (Oasis CLI)                     — 11 tools
cli/component-registry.js         (Component Registry)             — 5 tools
cli/love-registry.js              (LOVE Ledger client)             — 4 tools
tools/phos-forge/mcp-server.mjs   (PHOS Forge)                     — 29 tools
cli/cognitive-prosthetic.js        (Cognitive Prosthetic)           — 47 tools
cli/cognitive-comms.js            (Cognitive Comms)                — 20 tools
cli/marge-server.js               (MARGE Design Expert)            — 10 tools
cli/bob-server.js                 (BOB Structural Expert)          — 10 tools
Total                                                                  137 tools
```

### 6.2 Published MCP Packages (npm)

```
@p31ca/mcp-membrane@1.0.0
  └── 7 tools: membrane_status, membrane_dora, membrane_history,
              membrane_deploy_check, membrane_dora_scorecard,
              membrane_artifact_mint, membrane_ping

@p31ca/mcp-vibe@1.0.0
  └── tools: vibe_generate, vibe_deploy, vibe_status, vibe_list

@p31ca/mcp-justice@1.0.0
  └── tools: evidence_vault, escrow_create, escrow_release, odr_submit,
             daubert_check, court_admissible
```

### 6.3 Edge MCP Server

```
software/workers/p31-mcp-server/
  └── 9 tools (native MCP front door for the 8 in-repo servers + membrane)
```

---

## 7. Data Flow Diagram

```
User Input (chat / surface interaction)
    │
    ▼
PHOSWorkspace (state orchestration)
    │
    ├──→ Chat path: PHOSPromptBar → useChatMessages → PGlite (local DB)
    │       ↓
    │    useSovereignBrain (edge or local LLM)
    │       ├── Edge: gateway.p31ca.org → p31-llm-proxy
    │       └── Local: @mlc-ai/web-llm browser inference
    │
    ├──→ Surface path: PHOSSidebar → SurfaceRouter → SurfaceContent
    │       ↓
    │    Surface (e.g., AgentCommandCenter)
    │       ↓
    │    mcp-subagent-dispatch (parallel MCP tool calls)
    │       ↓
    │    Eight in-repo MCP servers (stdin/stdout)
    │
    ├──→ Multiplayer: MultiplayerSurface → room-client → multiplayer-room (WebSocket)
    │       ↓
    │    Yjs CRDT sync across peers via signaling worker
    │
    ├──→ 3D Print: ArtifactSurface → meshy-bridge → api.meshy.ai
    │
    ├──→ Terminal: Forge → TerminalPanel → terminal-relay (WebSocket PTY)
    │
    ├──→ DORA: OperationsDashboard + ForgeStatusBar
    │       ↓
    │    membrane-coordinator (Durable Object)
    │       ↓
    │    membrane MCP tools (publish deploy events)
    │
    └──→ DID/Crypto: PassportSurface → store/identity → lib/crypto → keyVault (IndexedDB)
            ↓
         lib/did-auth → attest/verify with did:key (Ed25519) or did:jwk (ML-DSA-65)
```

---

## 8. Dependency Graph — Critical Path

The critical rendering path from cold start:

```
1. index.astro
   └─→ PHOSWorkspace.tsx (client:only react)
       ├─→ spoonsStore (persistentAtom, localStorage read)
       ├─→ identityStore (persistentMap, localStorage read)
       ├─→ CrisisOverlay check (spoons === 0)
       ├─→ PassportWizard check (unregistered)
       └─→ WorkspaceShell
           ├─→ UnifiedSpoonAwareStyles <style> tag
           ├─→ Starfield (GPU particles, should not block)
           ├─→ PHOSSidebar (static nav, 46 items)
           ├─→ SurfaceContent (lazy load active surface)
           │    └─→ SurfaceRouter (URL parse → surface ID)
           └─→ PHOSPromptBar (chat input, no blocking)

First paint blockers:
  - @p31ca/design-core CSS (imported via globals.css)
  - tailwind base/components/utilities (150KB+)
  - Astro SSR shell → client hydration

Non-blocking (async/lazy):
  - @electric-sql/pglite (~3MB WASM, loaded on demand)
  - @mlc-ai/web-llm (several 100MB, downloaded on first use)
  - @timur00kh/whisper.wasm (voice, loaded on first mic click)
  - All surface components (React.lazy, loaded on navigation)
  - Forge panels (React.lazy within Dockview)
```
