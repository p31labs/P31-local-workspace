# P31 API Reference – HTTP & WebSocket

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document describes all public and internal API endpoints, WebSocket protocols, authentication requirements, and data formats used across the P31 ecosystem.

---

## 1. Common Conventions

- **Base URLs** vary by service (see each section).
- **Authentication** uses `X-P31-Node-Token` header (CashPilot) or `Authorization: Bearer <token>` (Cloudflare Workers).
- **Error responses** return a JSON object with `error` field and appropriate HTTP status code.
- **Rate limiting** is applied per endpoint (see service‑specific notes).

---

## 2. CashPilot API (Auto‑Solver)

**Base URL:** `http://localhost:9100`  
**Auth:** `X-P31-Node-Token` header (required for all routes except `/health`).  
**Token:** Set `SOLVER_API_TOKEN` in `.env` file.

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/health` | GET | Health check (returns queue size, uptime) | No |
| `/metrics` | GET | Prometheus metrics endpoint | Yes |
| `/task` | POST | Submit a new task for processing | Yes |
| `/earnings` | GET | Retrieve recent earnings (last 100 entries) | Yes |
| `/api/tasks` | GET | List recent tasks (default limit 50) | Yes |
| `/api/stats` | GET | Aggregate statistics (total earnings, by source, hardware cost) | Yes |
| `/` | GET | HTML dashboard (node_id, tier as query params) | Yes |

### 2.1 POST `/task` – Submit Task

**Request body:**
```json
{
  "source": "mturk",
  "task_id": "task-123",
  "prompt": "Classify this image as ...",
  "context": { "optional": "data" }
}
```

**Response:**
```json
{
  "task_id": "task-123",
  "status": "queued",
  "duration_ms": 0
}
```

### 2.2 GET `/earnings` – Retrieve Earnings

**Response:**
```json
{
  "earnings": [
    {
      "task_id": "task-123",
      "source": "mturk",
      "amount": 0.05,
      "timestamp": "2026-06-14T12:34:56Z"
    }
  ],
  "total": 12.45
}
```

---

## 3. p31‑cortex (LLM & Safety)

**Base URLs:**
- Ollama (cortex): `http://localhost:11440` (docker-compose maps host `11440` → container `11434`)
- Ollama (CashPilot standalone): `http://localhost:11435`
- LiteLLM (cortex): `http://localhost:4000`
- LiteLLM (CashPilot standalone): `http://localhost:4001`
- Affective Chemistry: `http://localhost:5001`
- Spoon Monitor: `http://localhost:5002`
- OQE Verification: `http://localhost:5003`

All p31‑cortex services are bound to localhost (no external auth). Use only on trusted networks.

> **Note:** The CLI and docs may refer to Ollama on `:11434` for historical reasons. When `p31-cortex` is running via Docker Compose, the actual host port is `11440`. When using CashPilot’s standalone Ollama, the port is `11435`.

### 3.1 Ollama (Native API)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tags` | GET | List loaded models |
| `/api/generate` | POST | Generate a response (streaming optional) |

**Example:**
```bash
curl http://localhost:11440/api/generate -d '{
  "model": "qwen2.5:1.5b",
  "prompt": "Explain the K₄ topology",
  "stream": false
}'
```

### 3.2 LiteLLM (OpenAI‑compatible)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/models` | GET | List available models |
| `/v1/chat/completions` | POST | Chat completion (OpenAI‑compatible) |

**Example:**
```bash
curl http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "phos-cognitive-core",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### 3.3 Affective Chemistry (Voltage Scoring)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze text → voltage score, spoon recommendation |
| `/api/voltage/{u}/{e}/{c}` | GET | Quick voltage calculation (0–1 axes) |
| `/health` | GET | Health check |

**POST `/api/analyze` example:**
```bash
curl http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Court filing due in 12 hours",
    "context": {"deadline_hours": 12}
  }'
```

**Response:**
```json
{
  "voltage_score": 0.78,
  "axes": {"urgency": 0.9, "emotional_load": 0.8, "cognitive_complexity": 0.6},
  "recommendation": {"spoon_budget": "FULL", "model_preference": "phos-cognitive-core"},
  "interpretation": "Critical voltage: requires full capacity"
}
```

### 3.4 Spoon Monitor (Telemetry)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/state` | GET | Current spoon level, velocity drop, red board alerts |
| `/api/event` | POST | Inject telemetry event (keystroke, message, tool switch) |
| `/ws` | WebSocket | Real‑time state broadcasts (every 5s) |
| `/health` | GET | Health check |

**WebSocket example:**
```javascript
const ws = new WebSocket("ws://localhost:5002/ws");
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 3.5 OQE Verification (Hallucination Detection)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/verify` | POST | Verify output against OQE rules (domain guardrails, [V:] tags) |
| `/health` | GET | Health check |

**POST `/verify` example:**
```bash
curl http://localhost:5003/verify \
  -H "Content-Type: application/json" \
  -d '{
    "model_output": "The loop runs every 100ms [V: timing, main.cpp]",
    "task_type": "firmware"
  }'
```

**Response:**
```json
{
  "status": "PASSED",
  "output": "...",
  "flags": [],
  "wcd_06_required": false
}
```

---

## 4. Cloudflare Workers (Edge)

**Base URL:** `https://*.trimtab-signal.workers.dev`  
**Auth:** Bearer token (set via `wrangler secret put`)

### 4.1 Discord Alerter

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/` | POST | Forward alert to Discord webhook (body: `{message, level}`) | Bearer token |

### 4.2 K₄ Cage (Mesh Core)

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/mesh` | GET | Current node table | `ADMIN_TOKEN` |
| `/ws/family-mesh` | WebSocket | Real‑time mesh communication | None (origin‑restricted) |
| `/api/telemetry/batch` | POST | Batch telemetry push (D1) | `INTERNAL_FANOUT_TOKEN` |

### 4.3 Quantum Bridge

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/submit` | POST | Submit quantum circuit (IBM Qiskit) | Bearer `IBM_QUANTUM_TOKEN` |
| `/result/{jobId}` | GET | Retrieve job result | Bearer `IBM_QUANTUM_TOKEN` |

---

## 5. PHOS (Tauri IPC)

PHOS does not expose an HTTP API. Instead, it uses Tauri IPC for local inter‑process communication. Available commands (see `src-tauri/src/commands.rs` in the PHOS repo at `~/P31-local-workspace/phos`):

| Command | Description |
|---------|-------------|
| `init_db` | Initialize SQLite database |
| `mint_karma` | Mint karma credits to ledger |
| `get_balance` | Get current balance |
| `start_863hz` | Start 863 Hz Larmor tone (cpal) |
| `stop_863hz` | Stop the tone |
| `embed_and_store` | Store embedding vector in vector DB |
| `query_similar` | Query similar vectors (cosine similarity) |

> **Note:** Spoon level is exposed via HTTP at `https://phos.p31ca.org/api/spoons` (when the web app is deployed) and may also be available via Tauri IPC locally. The CLI reads from the web endpoint by default.

---

## 6. Discord Bot (Slash Commands)

The P31 Oracle Bot exposes slash commands on Discord. The specific commands listed in earlier versions of this document (`/status`, `/contribute-ion`, `/larmor-sync`, `/leaderboard`, `/profile`, `/start-crew-manual`) may not all be implemented in the current bot. Verify with `/help` in Discord.

---

## 7. Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad request (missing field, invalid JSON) |
| 401 | Unauthorised (missing or invalid token) |
| 404 | Endpoint not found |
| 500 | Internal server error (check logs) |
| 502 | Bad gateway (upstream service unreachable) |

---

## 8. Rate Limiting

- **CashPilot API:** None (trusted local services). Add `nginx` or `fail2ban` if exposed.
- **WebSocket:** Reconnection with exponential backoff (1s, 2s, 4s, up to 60s).
- **CLI:** Somatic rate limit (30 commands / 15 min) – not an API constraint.

---

## 9. Examples

### 9.1 Submit a CashPilot task with auth

```bash
curl -X POST http://localhost:9100/task \
  -H "X-P31-Node-Token: $SOLVER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"test","task_id":"abc","prompt":"Hello"}'
```

### 9.2 Stream mesh events via WebSocket

```bash
wscat -c "wss://k4-cage.trimtab-signal.workers.dev/ws/family-mesh?node=cli"
```

### 9.3 Verify a firmware output with OQE

```bash
curl http://localhost:5003/verify \
  -H "Content-Type: application/json" \
  -d '{
    "model_output": "void setup() { pinMode(2, OUTPUT); } [V: pin config, main.cpp]",
    "task_type": "firmware"
  }'
```

---

**Next:** [COGNITIVE_SAFETY.md](./COGNITIVE_SAFETY.md) – Spoon economy, rate limiting, somatic telemetry.
