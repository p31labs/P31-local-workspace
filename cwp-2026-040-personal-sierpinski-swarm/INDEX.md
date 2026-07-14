# CWP-2026-040 — Personal Sierpinski Swarm

**Status:** Active (build mode)
**Parent vision:** "The Personal Sierpinski Swarm — A Plan"
**Scope decisions (user):** all 3 scales (Self / Family / Career); storage = best fit for stack; identity = best fit for stack + constraints.

## Grounding reality check
The vision doc references external OSS projects (KernelBot, Cortex, SecondBrain, Family Organizer, SkillBridge). Those are **not** in this monorepo and will **not** be `npm install -g`'d. The real buildable substrate already in this repo:

| Layer | What exists | Used as |
|---|---|---|
| Knowledge graph | `apps/phos/src/lib/ChaosVault.ts` (PGLite `unified_knowledge_graph`), `software/p31-cortex` (Hono+DO, 6 agents, D1) | fractal graph backend |
| Brain-dump ingest | `software/packages/jitterbug-api` | KG delta source |
| Swarm | `software/workers/orchestrator.ts` (Event Bus DO), `agent-runtime`, `care-mesh`, `mcp-x402-gateway` | swarm dispatcher |
| Sovereignty | DID stack (`did:key`/`did:jwk`/`did:web`), `love-ledger` identity_registry | one DID per fractal node |
| Shared DB | `love-ledger` D1 (id `592e3e2e-…`) | Family/Career sync tables |
| Constraints | D1 Free = 10/10 used; Cron = 5/5 used | **no new DB, no new cron** |

## Fractal invariant
Every node (Self, a Family cluster, a Career cluster) is the **same schema**:
a DID-anchored knowledge graph + causal memory + behavioural DNA + a swarm of agents.
Cloning across scales = same code, different `scale` + `node_id`. Data for **Self** stays local (PGLite, sovereign); data for **Family/Career** syncs to the shared `love-ledger` D1.

## Decomposition

| ID | Module | Storage | Depends on |
|---|---|---|---|
| 040A | Causal Memory (trigger→goal→approach→outcome→lesson) | PGLite (Self) / D1 (sync) | graph |
| 040B | Behavioural DNA (13-trait evolving genome) | PGLite (Self) / D1 (sync) | none |
| 040C | Personal Swarm wiring (orchestrate p31-cortex agents over fractal graph) | — | 040A, graph |
| 040D | Memory Consolidation loop (event-driven, **no cron**) | PGLite | 040A, 040B |
| 040E | Family scale clone (cortex D1 tables) | D1 | 040A–D |
| 040F | Career scale clone (cortex D1 tables) | D1 | 040A–D |
| 040G | Cross-scale link (Self↔Family↔Career) | D1 | 040E, 040F |
| 040H | Unified Fractal dashboard + clone API | PGLite+D1 | 040E–G |
| 040I | DID-per-node anchoring + verification | DID stack | 040B, 040H |
| 040J | E2E fractal test harness + docs | — | all |

## Constraints honoured
- **No new D1 database** — Self core is PGLite (local, sovereign); Family/Career add tables to existing `love-ledger` D1.
- **No new cron trigger** — consolidation is event-driven (fired from ingest + an existing cron slot if needed).
- **Sovereignty first** — Self graph never leaves the device/browser; only consent-gated deltas sync to D1.

## Build status (2026-07-14)
Implemented the fractal backend in `software/workers/personal-swarm/`:

- `src/types.ts` — `FractalDB` storage-agnostic interface + 13-trait genome + swarm types.
- `src/store.ts` — three `FractalDB` implementations:
  - `MemoryFractalDB` (in-JS; used by tests + zero-wasm fallback)
  - `PgliteFractalDB` (sovereign **Self** core in the PHOS browser/PGLite)
  - `D1FractalDB` (shared **Family/Career** sync on p31-cortex D1 — no new DB)
- `src/fractal.ts` (040A node/clone/link), `src/causalMemory.ts` (040A causal chains),
  `src/behaviouralDna.ts` (040B 13-trait evolving genome),
  `src/swarm.ts` (040C scale→agent mapping), `src/consolidation.ts` (040D event-driven),
  `src/index.ts` (Hono API; D1-backed for Family/Career, Self stays client-side PGLite).
- `migrations/0001_fractal.sql` — D1 tables for p31-cortex (apply with `database_id 6a645125-…`).
- `test/*` — 15 vitest tests, all passing; `pnpm typecheck` clean.

**Constraints honoured:** no new D1 database (Family/Career reuse p31-cortex D1), no new cron (consolidation is event-driven on causal capture), sovereignty (Self graph is PGLite/local).

**Remaining (040H–040J):** unified fractal dashboard UI, DID-per-node verification endpoint, full E2E harness. Backend for all three scales + cross-scale links already exists.

## Run
```
cd software/workers/personal-swarm
pnpm test        # 15 passing
pnpm typecheck   # clean
# apply D1 tables:
wrangler d1 execute p31-cortex --local --file=./migrations/0001_fractal.sql
```

## Commits
- TBD (build in progress)
