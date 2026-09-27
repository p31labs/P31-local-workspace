# Roblox Expansion — P3 Work Package

## Objective

Continue the P31–Roblox integration beyond the current P0–P2 code-generation bridge. P3 delivers **live Roblox runtime integration**: LOVE minting from in-game events, persistent game sessions, CLI/MCP tooling, and a Roblox plugin that connects Roblox experiences back to the P31 shell.

## Current State (What's Already Built)

### Deployed Workers
| Worker | URL | Status | Version |
|--------|-----|--------|---------|
| `roblox-bridge` | `https://roblox-bridge.trimtab-signal.workers.dev` | ✅ Live | v1.0.0 |
| `shadow-bridge` | `https://shadow-bridge.trimtab-signal.workers.dev` | ✅ Live | v2.0.0 |
| `p31-game-builder` | `https://p31-game-builder.trimtab-signal.workers.dev` | ✅ Live | Latest |

### What Works Today
1. **Code Generation → Luau**: `game-builder` exports `GameSnapshot` → `@p31ca/game-engine` `generateLuau()` + `generateP31Skin()` → posts to `roblox-bridge/deploy`
2. **Bridge Fallback**: `roblox-bridge/deploy` returns generated Luau with P31 skin even without a live Roblox backend configured
3. **LOVE Queueing**: `shadow-bridge/game/action` records actions, detects milestones, queues LOVE for shell sync via `/game/pending-love`
4. **Game Sessions**: `game-builder` creates in-memory `GameSession` with `GameEngine` (Maxwell rigidity, spoon-gating, challenges)
5. **14 Roblox Tools**: `roblox-bridge` exposes `roblox_create_instance`, `roblox_deploy_code`, `roblox_set_lighting`, etc. via Hono routes

### Known Gaps (P3 Targets)
| Gap | Why It Blocks P3 |
|-----|-----------------|
| `roblox-bridge` NOT in `version-manifest.json` | No formal deploy tracking |
| No CLI commands (`roblox:status`, `roblox:deploy`, `roblox:sync`) | Users can't interact with Roblox from shell |
| `roblox-bridge` uses Hono routes, not MCP JSON-RPC | Can't route through `mcp-x402-gateway` |
| `game-builder` sessions are in-memory only | Lost on worker restart |
| `renderRoblox()` in `game-generator` is skeletal | No real Roblox place generation |
| No Roblox LOVE minting endpoint in `roblox-bridge` | Roblox → P31 LOVE flow is one-way only |
| No Roblox plugin / HttpService client | Roblox experiences can't call back to P31 |
| `worlds` table schema is orphaned (defined in `marketplace`) | roblox-bridge D1 writes will fail |

---

## P3 Tasks (Ordered)

### Task 1: Fix roblox-bridge D1 Schema
**Files:**
- `workers/roblox-bridge/wrangler.toml` — add migration or inline schema
- `workers/roblox-bridge/src/index.ts` — add `ensureWorldsTable()` helper

**Required:**
1. Create `workers/roblox-bridge/migrations/001_worlds.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS worlds (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT DEFAULT '',
     creator_did TEXT DEFAULT 'anonymous',
     created_at INTEGER NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_worlds_created ON worlds(created_at DESC);
   ```
2. Add `ensureWorldsTable()` that runs on every `/worlds` request (same pattern as `federation-bridge`):
   ```typescript
   async function ensureWorldsTable(db: D1Database) {
     await db.exec(`CREATE TABLE IF NOT EXISTS worlds (...)`);
   }
   ```
3. Call `ensureWorldsTable(c.env.LOVE_DB)` at the top of each `/worlds` handler.

**Verification:** `curl -X POST https://roblox-bridge.trimtab-signal.workers.dev/worlds -H 'Content-Type: application/json' -d '{"name":"Test"}'` returns 200 with `{ id, name }`.

---

### Task 2: Add MCP JSON-RPC Endpoint to roblox-bridge
**Files:**
- `workers/roblox-bridge/src/index.ts`

**Required:**
1. Add `app.post('/mcp', async (c) => { ... })` route following the pattern from `workers/bros/src/index.ts` or `workers/dads/src/index.ts`
2. Support JSON-RPC 2.0 methods:
   - `initialize` → return `{ protocolVersion, capabilities, serverInfo }`
   - `tools/list` → return `{ tools: TOOLS }`
   - `tools/call` → proxy to existing `/tools/call` logic
   - `notifications/initialized` → 200 OK
3. Add CORS headers for MCP clients (`Access-Control-Allow-Origin: *`)

**Verification:**
```bash
curl -X POST https://roblox-bridge.trimtab-signal.workers.dev/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
Returns `{ jsonrpc: "2.0", id: 1, result: { tools: [...] } }`.

---

### Task 3: Register roblox-bridge in mcp-x402-gateway
**Files:**
- `workers/mcp-x402-gateway/bridge/src/backends.mjs`
- `workers/mcp-x402-gateway/bridge/src/router.mjs`

**Required:**
1. Add `roblox-bridge` backend config in `backends.mjs`:
   ```javascript
   {
     id: 'roblox',
     name: 'Roblox Bridge',
     url: 'https://roblox-bridge.trimtab-signal.workers.dev/mcp',
     tools: 14,
     auth: null, // public
   }
   ```
2. Add routing rule in `router.mjs` for `roblox_*` tool names → `roblox` backend.
3. Update tool count in `workers/mcp-x402-gateway/src/index.ts` if it has a hardcoded total.

**Verification:** `POST https://mcp-x402-gateway.trimtab-signal.workers.dev/mcp` with `tools/list` returns roblox tools.

---

### Task 4: Add Shell CLI Commands for Roblox
**Files:**
- `cli/commands/roblox.js` (new file)
- `cli/index.js` — register new commands

**Required:**
1. Create `cli/commands/roblox.js` with:
   - `roblox status` — calls `roblox-bridge/health`, prints status
   - `roblox deploy <file.luau>` — reads Luau file, posts to `roblox-bridge/deploy`
   - `roblox sync` — calls `shadow-bridge/game/pending-love`, prints queued LOVE
   - `roblox worlds` — lists worlds from `roblox-bridge/worlds`
   - `roblox tool <name> <params>` — calls `roblox-bridge/tools/call`
2. Register in `cli/index.js`:
   ```javascript
   program.command('roblox <subcommand>')
     .description('Roblox integration commands')
     .action((subcommand, ...args) => require('./commands/roblox')(subcommand, ...args));
   ```

**Verification:**
```bash
node cli/index.js roblox status
node cli/index.js roblox worlds
```

---

### Task 5: Add Roblox LOVE Minting Endpoint
**Files:**
- `workers/roblox-bridge/src/index.ts`
- `workers/roblox-bridge/wrangler.toml`

**Required:**
1. Add new route `POST /game/mint-love`:
   ```typescript
   app.post('/game/mint-love', async (c) => {
     const { userId, amount, reason, source } = await c.req.json<{
       userId: string; amount: number; reason: string; source: string;
     }>();
     // Forward to shadow-bridge for actual minting
     const res = await fetch(`${SHADOW_BRIDGE_URL}/game/action`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         gameId: 'roblox',
         userId,
         action: 'mint_love',
         payload: { amount, reason, source },
       }),
     });
     return c.json(await res.json());
   });
   ```
2. Add `SHADOW_BRIDGE_URL` secret (commented placeholder in wrangler.toml).
3. If `SHADOW_BRIDGE_URL` is not set, return queued response with note.

**Verification:**
```bash
curl -X POST https://roblox-bridge.trimtab-signal.workers.dev/game/mint-love \
  -H 'Content-Type: application/json' \
  -d '{"userId":"player1","amount":5,"reason":"block_10","source":"roblox"}'
```

---

### Task 6: Add Roblox Game-Surface UI in Shell
**Files:**
- `apps/game-builder/src/index.ts` — already has `handleGameSurface()` for `/play/:gameId`
- New file: `apps/game-builder/src/roblox-surface.ts` (or extend existing)

**Required:**
1. Enhance `/play/:gameId` handler to support Roblox embed mode:
   - Query param `?mode=roblox` → render iframe embedding `https://www.roblox.com/games/?worldName=...`
   - Query param `?mode=luau` → show generated Luau code in syntax-highlighted viewer
   - Default mode → show current P31 game surface (tetrahedron builder)
2. Add WebSocket proxy endpoint `/play/:gameId/ws` that forwards to `roblox-bridge` for real-time LOVE updates (use `ws` polyfill or Cloudflare WebSocket API)
3. Add `data-mcp-roblox-*` annotations to the game surface for WebMCP control

**Verification:**
```bash
curl "https://p31-game-builder.trimtab-signal.workers.dev/play/test-game?mode=roblox&worldName=MyGame"
```
Returns HTML with embedded Roblox iframe.

---

### Task 7: Build Roblox Plugin (HttpService Client)
**Files:**
- `workers/roblox-bridge/src/plugin/` (new directory)
  - `P31RobloxBridge.lua` — Roblox plugin/ModuleScript
  - `README.md`

**Required:**
1. Create `P31RobloxBridge.lua` ModuleScript that:
   - Uses `HttpService:PostAsync()` to call `roblox-bridge/game/mint-love`
   - Uses `HttpService:GetAsync()` to poll `roblox-bridge/game/pending-love`
   - Hooks into `Players.PlayerAdded` / `Players.PlayerRemoving` for session events
   - Sends milestone events (`block_10`, `block_50`, `block_100`) with configurable LOVE rewards
   - Retries with exponential backoff on network failure
   - Stores pending LOVE in `DataStoreService` as fallback
2. Create `README.md` with installation instructions:
   - Insert ModuleScript into `ReplicatedStorage`
   - Configure `P31_BRIDGE_URL` (default: `https://roblox-bridge.trimtab-signal.workers.dev`)
   - Call `P31Bridge:init(gameId)` from a ServerScript

**Verification:** Plugin loads in Roblox Studio, calls `/game/mint-love`, receives queued response.

---

### Task 8: Persistent Game Sessions in game-builder
**Files:**
- `apps/game-builder/src/index.ts`
- `apps/game-builder/wrangler.toml`

**Required:**
1. Add D1 binding to `game-builder` `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "GAME_DB"
   database_name = "game-builder-db"
   database_id = "<new-db-id>"
   ```
2. Create migration `apps/game-builder/migrations/001_sessions.sql`:
   ```sql
   CREATE TABLE sessions (
     id TEXT PRIMARY KEY,
     definition TEXT NOT NULL,
     spoons INTEGER DEFAULT 3,
     created_at TEXT NOT NULL
   );
   CREATE TABLE structures (
     id TEXT PRIMARY KEY,
     session_id TEXT NOT NULL,
     data TEXT NOT NULL,
     FOREIGN KEY (session_id) REFERENCES sessions(id)
   );
   ```
3. Replace in-memory `Map<string, GameSession>` with D1 queries:
   - `handleCreateSession()` → INSERT into `sessions`
   - `handleGetSession()` → SELECT from `sessions` + `structures`
   - `handleGameAction()` → load from D1, mutate, save back

**Verification:** Create session, restart worker (simulate via `wrangler deploy`), retrieve session — data persists.

---

### Task 9: Build Real Roblox Game Generator
**Files:**
- `packages/game-generator/src/renderers/roblox.ts`

**Required:**
1. Replace hardcoded `renderRoblox()` with actual generation:
   - Accept full `GameDefinition` (not just builder type)
   - Generate place file (`place.rbxl` equivalent as Luau code)
   - Include:
     - `ServerScriptService/GameManager.lua` — handles game loop, scoring, LOVE minting
     - `Workspace/Structures/` — generated from `GameSnapshot`
     - `ReplicatedStorage/GameConfig` — spawns, rules, LOVE values
     - `Lighting` — P31 skin
2. Add `gameType` branching:
   - `builder` → tetrahedron placement with Maxwell validation
   - `collector` → item spawning + collection scoring
   - `strategy` → turn-based board game scaffold

**Verification:**
```typescript
import { renderRoblox } from '@p31/game-generator/renderers/roblox';
const result = renderRoblox(builderDefinition);
console.log(result.luau.includes('GameManager'));
console.log(result.partCount > 0);
```

---

### Task 10: Add version-manifest.json Entry
**Files:**
- `version-manifest.json` (root)

**Required:**
1. Add `roblox-bridge` entry:
   ```json
   {
     "name": "roblox-bridge",
     "version": "1.0.0",
     "deployed": "2026-08-09T00:00:00.000Z",
     "worker": "roblox-bridge",
     "description": "Roblox Luau code generation + live bridge",
     "dependencies": ["shadow-bridge", "love-ledger"]
   }
   ```
2. Add `shadow-bridge` entry (already deployed but missing):
   ```json
   {
     "name": "shadow-bridge",
     "version": "2.0.0",
     "deployed": "2026-07-16T21:42:00.000Z",
     "worker": "shadow-bridge",
     "description": "Game session DO + LOVE queueing",
     "dependencies": ["love-ledger"]
   }
   ```

**Verification:** `cat version-manifest.json | jq '.[] | select(.name | contains("roblox"))'`

---

## Execution Order

```
Task 1 (D1 schema) → Task 2 (MCP endpoint) → Task 3 (gateway registration)
→ Task 4 (CLI commands) → Task 5 (LOVE minting) → Task 6 (game surface)
→ Task 7 (Roblox plugin) → Task 8 (persistent sessions) → Task 9 (real generator)
→ Task 10 (version manifest)
```

Tasks 1–5 are **independent** and can run in parallel. Tasks 6–9 depend on 1–5. Task 10 is final cleanup.

## Guardrails

1. **No new dependencies without checking `pnpm-workspace.yaml`** — all packages must be in the monorepo
2. **Follow existing patterns** — use `federation-bridge` for D1 migrations, `bros` for MCP JSON-RPC, `dads` for DO patterns
3. **All Workers use `nodejs_compat`** flag (required for `fetch` and `crypto`)
4. **LOVE minting must call shadow-bridge** — never mint directly to D1 from `roblox-bridge`
5. **No secrets in source** — `ROBLOX_BRIDGE_URL`, `SHADOW_BRIDGE_URL` go in `wrangler secret put`
6. **All new routes need CORS** — use the existing `cors()` middleware from `hono/cors`
7. **Maxwell rigidity is computed upstream** — `roblox-adapter.ts` only consumes pre-validated snapshots

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `workers/roblox-bridge/src/index.ts` | Bridge routes, tools, D1 worlds | 304 |
| `workers/roblox-bridge/wrangler.toml` | Config, bindings | 20 |
| `workers/shadow-bridge/src/index.ts` | Game sessions, LOVE minting, pending-love | 293 |
| `workers/shadow-bridge/src/game-session-do.ts` | DO logic, KV stores | 301 |
| `apps/game-builder/src/index.ts` | Session management, deploy-to-roblox action | 601 |
| `apps/game-builder/wrangler.toml` | Service binding to roblox-bridge | 14 |
| `packages/game-engine/src/roblox-adapter.ts` | Luau + skin generation | 197 |
| `packages/game-engine/src/engine.ts` | GameEngine, export/import, challenges | 374 |
| `packages/game-generator/src/renderers/roblox.ts` | Roblox game renderer (skeletal) | 60 |
| `packages/game-generator/src/schema.ts` | GameDefinition types | 81 |
| `workers/mcp-x402-gateway/bridge/src/backends.mjs` | Backend routing config | — |
| `workers/mcp-x402-gateway/bridge/src/router.mjs` | Tool routing | — |
| `cli/index.js` | CLI command registration | — |

## Verification Checklist

- [ ] `roblox-bridge/health` returns 200 with `tools: >= 14`
- [ ] `roblox-bridge/mcp` returns valid JSON-RPC 2.0 response
- [ ] `mcp-x402-gateway/mcp` `tools/list` includes `roblox_*` tools
- [ ] `cli roblox status` prints bridge status
- [ ] `shadow-bridge/game/pending-love` returns queued LOVE events
- [ ] `roblox-bridge/game/mint-love` forwards to shadow-bridge
- [ ] `game-builder/play/:id?mode=luau` renders code viewer
- [ ] `game-builder/play/:id?mode=roblox` renders iframe
- [ ] `P31RobloxBridge.lua` loads in Roblox Studio without errors
- [ ] `version-manifest.json` contains both `roblox-bridge` and `shadow-bridge` entries

## Out of Scope (Do Not Touch)

- `packages/game-engine/src/engine.ts` — core game logic, only add Roblox-related exports if needed
- `packages/game-engine/src/geometry.ts` — Maxwell rigidity computation is correct
- `packages/game-engine/src/spoon-gated.ts` — spoon gating logic is correct
- `workers/love-ledger/` — LOVE minting is handled by `shadow-bridge` and `dads`
- `packages/shared/src/cognitive-passport/` — client-side only, no on-chain changes
- Profile page / Phenix wallet / Quantum identity — separate work package

## Contact / Handoff

This work package is self-contained. The executing agent should:
1. Read this file completely before starting
2. Execute tasks in order unless marked parallel
3. Verify each task before moving to the next
4. Do NOT deviate from the guardrails
5. If a task is blocked, document the blocker and continue to independent tasks
