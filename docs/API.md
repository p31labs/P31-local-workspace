# Jitterbug API Reference

**Base URL:** `https://jitterbug-api.trimtab-signal.workers.dev`

## Authentication

All requests (except `/health`) require a Bearer token:

```http
Authorization: Bearer <your-psk>
```

## Endpoints

### GET /health

Returns `{"status":"ok","timestamp":"..."}`.

### POST /brain-dump

Create a new brain dump and start orchestration.

**Request Body:** `BrainDump` schema (see `@p31/brain-dump-orchestrator`).

**Example:**

```json
{
  "projectName": "My Project",
  "coreProblem": "Build an ambient exocortex.",
  "currentState": {"artifacts":[],"gaps":[],"blockers":[]},
  "constraints": [],
  "knownAssets": [],
  "openQuestions": [],
  "desiredEndState": {"description":"FRUIT","targetStage":"fruit","measurableCriteria":[],"convergenceTarget":"Deploy"},
  "metadata": {"capturedAt":"2026-06-22T00:00:00Z","operator":"api","source":"api","tags":[]}
}
```

**Response (202):**

```json
{"id": "550e8400-e29b-41d4-a716-446655440000"}
```

### GET /brain-dump/:id

Retrieve the full record.

**Response (200):** Full `BrainDumpRecord` (JSON).

### GET /brain-dump/:id/status

Get orchestration status with KV caching (60s TTL).

**Response (200):**

```json
{
  "id": "...",
  "status": "pending|processing|completed|failed",
  "error": null,
  "axes": [...],
  "convergence": {...}
}
```

**Headers:** `X-Cache: HIT` or `MISS`.

### GET /brain-dump/:id/stream

Server-Sent Events (SSE) for real-time status updates.

**Example:**

```bash
curl -H "Authorization: Bearer your-psk" \
  "https://jitterbug-api.trimtab-signal.workers.dev/brain-dump/.../stream"
```

**Event format:**

```
data: {"event":"status","data":{"status":"pending","axes":[...]}}

data: {"event":"done"}
```

## Error Codes

| Code | Meaning |
|------|---------|
| 401 | Unauthorized (missing/invalid PSK) |
| 400 | Invalid request body (Zod validation) |
| 404 | Resource not found |
| 500 | Internal error (check logs) |
