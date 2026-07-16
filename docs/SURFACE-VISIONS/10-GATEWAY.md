# Gateway — Design Vision

## Identity

- **Name:** P31 Gateway
- **URL:** `gateway.p31ca.org`
- **Tagline:** "AI proxy and API routing layer"
- **Audience:** Other P31 apps (not user-facing)
- **Purpose:** API gateway — routes requests to backend services (LLM proxy, jitterbug, K4 cage, genesis spark)
- **Tech:** Hono framework, Cloudflare Worker, service bindings
- **UI:** API-only (JSON endpoints) — NO user-facing HTML

---

## API Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/health` | Health check | None |
| GET | `/api/phos/surfaces` | List available PHOS surfaces | None |
| POST | `/ai/chat` | Conversational AI | Bearer token |
| POST | `/v1/chat/completions` | OpenAI-compatible completions | Bearer token |
| POST | `/transcribe` | Voice transcription | Bearer token |
| ALL | `/api/*` | Proxied API routes | Varies |

---

## Service Bindings

| Binding | Target Worker | Purpose |
|---------|--------------|---------|
| `phos_ai_proxy` | `p31-llm-proxy` | LLM routing and AI inference |
| `jitterbug_api` | `jitterbug-api` | Ambient exocortex brain-dump orchestrator |
| `k4_cage` | `k4-cage` | K4 tetrahedron computation |
| `genesis_spark` | `genesis-spark` | Genesis event handling |
| `command_center` | `command-center` | Fleet operations (optional) |
| `auth_service` | `p31-auth` | Authentication (optional) |

---

## Response Format

All endpoints return JSON with appropriate CORS headers.

### Health Check
```json
{ "status": "ok", "gateway": "p31-gateway", "version": "1.0.0" }
```

### PHOS Surfaces
```json
{
  "surfaces": [
    { "id": "greeting", "name": "Greeting", "description": "Landing/entry point" },
    { "id": "ignition", "name": "Ignition", "description": "Main workspace" },
    ...
  ]
}
```

### AI Chat (OpenAI-compatible)
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

### Error Response
```json
{ "error": "Rate limit exceeded", "status": 429 }
```

---

## CORS Configuration

Allowed origins:
- `https://phos.p31ca.org`
- `https://p31ca.org`
- `https://willow.p31ca.org`
- `https://bonding.p31ca.org`
- `https://phosphorus31.org`

Headers:
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Origin: <matched origin>` (or omitted if not matched)

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Implementation:** In-memory per-isolate (best-effort)
- **Eviction:** Stale entries evicted when map exceeds 1000 entries
- **Response:** `429 Too Many Requests` with `{ "error": "Rate limit exceeded" }`

---

## Visual Language (API Documentation)

Since Gateway has no UI, the "design vision" describes API contract:

- **Consistent JSON structure** across all endpoints
- **OpenAI-compatible** `/v1/chat/completions` format
- **CORS enabled** for allowed origins only
- **Error responses:** `{ "error": "message", "status": N }` format
- **Rate limit headers:** Included in responses when applicable

---

## Error Handling

| Status | Meaning | Response |
|--------|---------|----------|
| 200 | Success | JSON payload |
| 400 | Bad request | `{ "error": "Invalid request" }` |
| 401 | Unauthorized | `{ "error": "Missing or invalid token" }` |
| 405 | Method not allowed | `{ "error": "Method not allowed" }` |
| 429 | Rate limited | `{ "error": "Rate limit exceeded" }` |
| 500 | Server error | `{ "error": "Internal server error" }` |

---

## Observability

- **Sentry:** Optional error tracking (`@sentry/cloudflare`)
- **Traces sample rate:** 10%
- **Request logging:** Via Cloudflare Workers analytics

---

## Gemini Prompt Notes

- Gateway is a **backend API service** — no HTML templates to generate
- The design vision describes API contracts, not visual layouts
- The OpenAI-compatible endpoint is the primary integration point
- CORS is restricted to known P31 origins — not wildcard
- Rate limiting is per-IP, in-memory (resets on isolate restart)
- Service bindings route to backend workers without network hops
- Include the full endpoint table in any documentation
- The health check endpoint is the simplest integration test
