# p31-agent-hub

Workers AI orchestrator with **service bindings** to `k4-cage`, `k4-personal`, and `k4-hubs`, plus a **SQLite-backed** `AgentSession` Durable Object for chat history.

## Endpoints

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Liveness + probe `k4-cage` `/api/mesh` |
| GET | `/api/tools` | Tool metadata; `writes_enabled` only when `RELEASE_CHANNEL=internal` and `HUBS_WRITE_TOKEN` is set |
| GET | `/api/proxy/k4-cage/api/mesh` | Pass-through to bound Worker |
| GET | `/api/proxy/k4-personal/...` | Pass-through |
| GET | `/api/proxy/k4-hubs/...` | Pass-through |
| POST | `/api/chat`, `/api/agent-chat` | Chat; optional `AGENT_HUB_SECRET` via `Authorization: Bearer …`; session via `X-Session-Id` or JSON `sessionId` |

## Deploy

```bash
cd software/p31-agent-hub
npm install
npx wrangler deploy              # default → p31-agent-hub
npx wrangler deploy --env internal   # → p31-agent-hub-internal
```

Secrets (optional): `npx wrangler secret put AGENT_HUB_SECRET` — for internal env also `HUBS_WRITE_TOKEN` per `wrangler.toml` comments.

## Repo layout

- `src/index.js` — HTTP router, CORS, proxy + DO stub routing  
- `src/agent-session.js` — `AgentSession` class (Workers AI + storage)
