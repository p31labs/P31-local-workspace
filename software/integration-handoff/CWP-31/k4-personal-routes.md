# k4-personal — public route map (PA-0.2)

**Source of truth:** `k4-personal/src/index.js` (worker `fetch`) + `PersonalAgent.fetch` (Durable Object).

## Worker (edge)

| Path | Methods | Auth / notes |
|------|---------|----------------|
| `OPTIONS *` | OPTIONS | CORS preflight. |
| `/health` | GET | Public liveness: `{ service: "k4-personal" }`. |
| `/api`, `/api/mesh`, `/api/health` | GET | Personal K₄ mesh API (KV-backed); shape matches cage tooling expectations. |
| `/api/vertex/:id`, `/api/presence/:id`, `/api/ping/...` | GET/POST | Personal mesh vertex/presence/ping. |
| `/viz` | GET | Personal viz (HTML/JSON). |
| `/u/:userId/home` | GET | Tetra shell HTML (same `userId` as `/agent/:userId/...`). |
| `/agent/:userId/*` | * | **Forwarded to `PersonalAgent` DO**; sub-path defaults to `/health` if empty. **Binding key** = `userId` string → `idFromName`. |
| *(fallback)* | GET | `200` text body `k4-personal alive` for unmatched GET. |

**No bearer/API-key gate** on these routes today: isolation is by **opaque `userId` in the URL** and per-DO storage. Do not put raw email in `userId` (see [`identity.md`](./identity.md)).

## Durable Object (`PersonalAgent`)

Sub-paths under `/agent/:userId/` (strip prefix before DO `fetch`):

| Path | Methods | Notes |
|------|---------|--------|
| `/health` | GET | `{ status, agent: "personal" }`. |
| `/chat` | POST | Workers AI; validates message length. |
| `/history` | GET | `?limit=` capped at 100. |
| `/state` | GET, PUT | Merged key/value state; `personalTetra` validated. |
| `/reminders` | GET, POST | — |
| `/energy` | GET, PUT | — |
| `/bio` | POST | Validated telemetry types. |
| `/tetra` | GET, PUT | `p31.personalTetra/1.0.0` |
| `/manifest` | GET | `p31.personalAgentManifest/0.1.0` (see [`manifest.md`](./manifest.md)). |

Alarm: telemetry flush to optional D1 (`telemetry_pending`), not message TTL (see parent CWP PA-2.4 / retention).
