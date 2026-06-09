# P31 Cloudflare Workers

Edge computing infrastructure for the P31 Andromeda ecosystem.

## Orchestrator (`p31-orchestrator.trimtab-signal.workers.dev`)

**Source of truth:** deploy from this directory with **`wrangler-orchestrator.toml`** (Worker name `p31-orchestrator`, entry `orchestrator.ts`). Same URL as **`p31-constants.json` → `mesh.orchestratorWorkerUrl`** and k4-cage `ORCHESTRATOR_WEBHOOK`.

```bash
cd andromeda/software/workers
npx wrangler deploy --config wrangler-orchestrator.toml
```

**Note:** `p31-cortex` is a separate Worker (multi-agent DO stack); do not confuse with the mesh orchestrator hostname above.

## Workers Implemented

| Worker | File | Priority | Description |
|--------|------|----------|-------------|
| Cognitive Passport Edge Cache | `passport-cache.ts` | P1 | Edge-cached Cognitive Passport |
| L.O.V.E. Token Ledger | `love-ledger.ts` | P1 | Soulbound token currency |
| Emergency Broadcast System | `emergency-broadcast.ts` | P2 | Crisis notification system |
| Cognitive Load API | `spoons-api.ts` | P3 | Spoon expenditure tracking |
| Legal Document Versioning | `legal-versioning.ts` | P4 | Tamper-evident hash chain |

## Quick Start

```bash
# Install dependencies
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV and D1 databases (see wrangler.toml)
wrangler d1 create love-ledger
wrangler d1 create spoons-db
# ... etc

# Deploy workers
wrangler deploy
```

## Configuration

All bindings are defined in [`wrangler.toml`](wrangler.toml):

- **KV Namespaces:** PASSPORT_KV, SPOONS_KV, THRESHOLDS_KV
- **R2 Buckets:** PASSPORT_R2, LEGAL_R2, MESH_R2
- **D1 Databases:** LOVE_D1, SPOONS_D1, LEGAL_D1, MESH_D1, TELEMETRY_D1
- **Durable Objects:** LOVE_TRANSACTION, GAME_ROOM, ROOM_STATE
- **Queues:** TELEMETRY_QUEUE

## Guardrails System

The P31 Orchestrator includes a spoons-economy-driven guardrails system that automatically throttles automation based on cognitive capacity.

### Guardrails Flowchart

```text
┌──────────────┐
│ Spoons       │
│ Update Event │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Recompute Target    │
│ Level (no hysteresis)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Check Pending Level │
│ & Hysteresis Count  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2 Consecutive?      │
└──────┬───────┬──────┘
       │       │
      NO      YES
       │       │
       ▼       ▼
   ┌───────┐  ┌───────────────┐
   │ Keep  │  │ Transition to │
   │ Current│ │ New Level     │
   └───────┘  └───────┬───────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ Broadcast           │
         │ guardrails:         │
         │ levelChanged Event  │
         └───────┬─────────────┘
                 │
                 ▼
         ┌─────────────────────┐
         │ Update Command      │
         │ Center Status       │
         └─────────────────────┘
```

### Safety Levels

| Level | Spoons Range | Automation Mode | Throttle Multiplier |
|-------|--------------|-----------------|---------------------|
| LEVEL_0 | ≥ 8 | Full automation | 1x |
| LEVEL_1 | 5–7 | Standard | 1.5x |
| LEVEL_2 | 3–4 | Reduced | 3x |
| LEVEL_3 | 1–2 | Minimal | 10x |
| LEVEL_4 | 0 | Emergency halt | ∞ (all non-critical blocked) |

### Spoons-to-Automation Matrix

| Action Type | Risk Level | Level 0 | Level 1 | Level 2 | Level 3 | Level 4 |
|-------------|------------|---------|---------|---------|---------|---------|
| System: throttle_all | 0 | ✅ | ✅ | ✅ | ✅ | ❌ |
| Health: calcium_alert | 1 | ✅ | ✅ | ✅ | ✅ | ❌ |
| K4: presence_update | 2 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Grant: scan | 2 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Command-center: update | 2 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Forge: generate_document | 3 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Social: publish | 3 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Grant: new_match | 3 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Legal: court_deadline | 3 | ✅ | ✅ | ❌ | ❌ | ❌ |

**Key**
- ✅ Automatically approved
- ❌ Requires manual approval (queue indefinitely)
- ❌❌ Blocked entirely (except Priority 10 critical events)

### Hysteresis

To prevent oscillation around threshold boundaries, the guardrail level requires **2 consecutive readings** in a new zone before transitioning. This prevents rapid thrashing when spoons hover near 5 or 3.

### Event Flow

1. **Spoons change** → `spoons-api` logs event → publishes `spoons:update` to Orchestrator DO
2. **Orchestrator** recalculates guardrail level with hysteresis, persists state
3. **Level change** → broadcasts `guardrails:levelChanged` event, updates Command Center
4. **Action evaluation** → all triggers checked against current level before queueing

### Integration Points

- **spoons-api.ts**: Exposes `/api/spoons/current/{userId}`; publishes `spoons:update` events
- **orchestrator-event-bus.ts**: Listens for `spoons:update`; updates guardrail state; broadcasts changes
- **action-registry.ts**: All actions declare `safetyLevel`; executed only if permitted by guardrails

### Exponential Backoff

Failed actions are retried with exponential backoff: `retryDelay = base * 2^attempts` (capped at 5 minutes).

---

## API Endpoints

### Orchestrator (Event Bus DO)
```
POST /api/orchestrator/trigger      - Submit trigger event
GET  /api/orchestrator/status       - Current guardrail level + state
GET  /api/orchestrator/queue        - View pending action queue
GET  /api/orchestrator/audit-log    - Immutable audit trail
POST /api/orchestrator/spoons-update- Internal: spoons change notification
```

### Spoons API Worker
```
POST /api/spoons/log                - Log spoon expenditure
GET  /api/spoons/summary/{userId}    - Daily summary
GET  /api/spoons/trends/{userId}    - 7-day trends
GET  /api/spoons/current/{userId}   - Current spoons + guardrail level
GET  /api/spoons/debt/{userId}      - Spoon debt warning (30d)
```


## Type Definitions

Type definitions are in [`types.ts`](types.ts).

## Deployment

```bash
# Deploy to production
wrangler deploy --env production

# Deploy to preview
wrangler deploy --env preview
```

## Cost Estimation

All workers fit within free tier:
- Workers: 100K req/day
- KV: 1GB
- D1: 5GB
- Durable Objects: $0.018/100K ops

Estimated monthly cost: **~$0** (within free tier)

---

*Prepared: March 24, 2026*
*P31 Labs | phosphorus31.org*
*It's okay to be a little wonky.* 🔺