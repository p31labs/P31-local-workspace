# @p31/jitterbug-api

Cloudflare Worker API for the Jitterbug Ambient Exocortex. Accepts brain dumps, stores them in D1, and triggers async orchestration via Durable Objects.

## Architecture

Jitterbug is a recursive brain-dump orchestration system. Users capture unstructured thoughts through the PWA; the API validates, persists, and dispatches work to the orchestration layer. The system uses Cloudflare D1 for structured storage, R2 for large artifacts, KV for status caching, and Durable Objects for coordination.

```
┌─────────────┐     POST      ┌─────────────┐     dispatch     ┌──────────────────┐
│  jitterbug  │ ────────────▶ │  jitterbug  │ ──────────────▶ │  brain-dump-      │
│     PWA     │               │     API     │                 │  orchestrator DO  │
└─────────────┘               └──────┬──────┘                 └──────────────────┘
                                     │                               │
                              ┌──────┴──────┐                ┌──────┴──────┐
                              │    D1       │                │    etc.     │
                              │ (brain dumps)│                │             │
                              └─────────────┘                └─────────────┘
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/brain-dump` | Submit a new brain dump |
| GET | `/brain-dump/:id` | Retrieve a brain dump |
| GET | `/brain-dump/:id/status` | Get orchestration status |

### POST /brain-dump

Accepts a JSON payload conforming to the BrainDump schema:

```json
{
  "projectName": "string",
  "coreProblem": "string",
  "constraints": ["string"],
  "assets": ["string"],
  "questions": ["string"],
  "desiredEndState": "string",
  "maxDepth": 3,
  "batchStrategy": "depth-first"
}
```

Returns:

```json
{
  "id": "uuid",
  "status": "queued"
}
```

### GET /brain-dump/:id

Returns the stored brain dump record with current orchestration metadata.

### GET /brain-dump/:id/status

Returns orchestration progress:

```json
{
  "id": "uuid",
  "stage": "decomposing",
  "progress": 0.4,
  "children": 12,
  "completed": 5
}
```

## Data Model

The primary storage is D1 (`jitterbug-db`). Key tables:

- `brain_dumps` — top-level captures
- `recursive_tasks` — decomposed sub-tasks
- `ephemeral_snapshots` — time-limited derivations

## PSK Authentication

All endpoints require a pre-shared key via `X-PSK` header. The PSK is synchronized between the Worker secret and `software/.env.jitterbug`.

```bash
curl -X POST https://jitterbug-api.trimtab-signal.workers.dev/brain-dump \
  -H "Content-Type: application/json" \
  -H "X-PSK: your-psk" \
  -d @payload.json
```

## Development

```bash
cd software/packages/jitterbug-api
pnpm install
pnpm run dev
```

The Worker binds to:
- D1: `jitterbug-db`
- KV: `jitterbug-status-cache`
- R2: `jitterbug-deliverables`
- DO: `brain-dump-orchestrator`

## Deploy

```bash
pnpm run deploy
```

## Observability

- Health endpoint: `/health`
- SSE streaming: `/ws` (WebSocket) and `/api/stream` (EventSource)
- Enriched health includes DB, R2, and KV connectivity checks

## Related

- `software/packages/brain-dump-orchestrator` — CLI and recursive decomposition engine
- `software/packages/jitterbug-pwa` — installable PWA for capture
- `docs/ARCHITECTURE.md` — 5-layer orchestration pattern
- `docs/DEPLOYMENT.md` — automated and manual deployment
