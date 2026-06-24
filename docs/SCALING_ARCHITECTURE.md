# Scaling the Jitterbug: Ambient Exocortex Architecture

## Philosophy

The Jitterbug is not an app; it is a **way of life**. It scales by becoming invisible — an exocortex that follows you across every device, every context, every thought. This document describes the scientific infrastructure that realises that poetic vision.

## System Components

### 1. Capture Layer (PWA)
- **React + Vite** PWA, installable on iOS, Android, Chromebook.
- Offline‑first with IndexedDB for drafts.
- Voice input (Web Speech API) for hands‑free capture.
- Sends brain dumps to the API via `fetch()`.

### 2. API Layer (Cloudflare Worker)
- REST endpoints: `POST /brain-dump`, `GET /brain-dump/:id`, `GET /brain-dump/:id/status`.
- Validates payloads with Zod (shared schemas from `@p31/brain-dump-orchestrator`).
- Stores brain dumps in D1.
- Enqueues orchestration jobs via Durable Object alarm.

### 3. Orchestration Layer (Durable Object)
- Each brain dump gets a dedicated Durable Object instance.
- The DO imports `@p31/brain-dump-orchestrator` and runs `decomposeBrainDump` and `runAll` asynchronously.
- Alarms trigger retries and timeouts.
- Status updates are persisted in D1 and exposed via API.

### 4. Persistence Layer (D1 + KV)
- D1: relational data for brain dumps, axes, convergence results.
- KV: caching for status endpoints (optional).

### 5. Edge Runtime (Cloudflare Workers + DO)
- Global, low‑latency execution.
- No cold starts for frequent captures.
- Scales to zero when idle.

## Data Flow

1. **User** opens PWA on any device.
2. **Fills** capture form (or speaks it).
3. **Submits** → PWA sends JSON to `POST /brain-dump`.
4. **Worker** validates, stores in D1, creates Durable Object instance (or wakes existing one).
5. **DO** runs orchestrator asynchronously:
   - Decomposes brain dump into axes.
   - For each axis, uses `claude-code` adapter (or other) to run agent.
   - Writes deliverables to R2 or file system (via adapter).
   - Updates status in D1.
6. **PWA** polls `GET /brain-dump/:id/status` or listens via WebSocket (future).
7. **Convergence** report is generated and stored.
8. **User** views results in PWA dashboard.

## Deployment

- All Cloudflare components are deployed via `wrangler`.
- PWA is deployed to Cloudflare Pages with automatic builds.
- Secrets: API keys for LLM providers, R2 bucket credentials.

## Scaling Considerations

- **Concurrency**: Durable Objects isolate per brain dump, so many can run in parallel.
- **Edge caching**: Status endpoints can be cached for 5 seconds.
- **Offline**: PWA works without internet; syncs when back online.
- **Device diversity**: Responsive design, touch‑friendly, keyboard shortcuts.

## Future Extensions

- WebSocket push for real‑time progress updates.
- LoRa mesh integration for offline peer‑to‑peer sync.
- Voice‑first mode for hands‑free capture during walks.
- Integration with existing `p31-cortex` agents.
