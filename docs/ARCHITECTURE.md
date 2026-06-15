# P31 Architecture – Sovereign Cognitive Mesh

**Version:** 1.0.0  
**Last Updated:** June 14, 2026

This document describes the high‑level architecture, network topology, data flow, and security model of the P31 ecosystem.

---

## 1. Architectural Principles

| Principle | Implementation |
|-----------|----------------|
| **Local‑first** | Primary state lives on the device (IndexedDB, SQLite, files). Cloud is for optional sync, not source of truth. |
| **Zero telemetry** | No analytics, no tracking, no third‑party data brokers. |
| **Sovereign identity** | Ed25519 keypairs (passport) — no OAuth dependency on Google/Facebook. |
| **Offline‑capable** | Every core service works without internet. Sync resumes when connectivity returns. |
| **Spoon‑aware** | UI and background tasks adapt to operator cognitive budget (0–5 spoons). |
| **Post‑quantum ready** | ML-KEM-768 (FIPS 203) planned for future key exchange; WebAuthn currently uses ML-DSA-65 (FIPS 204). |

---

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            OPERATOR                                     │
│                    (Tauri desktop, CLI, mobile app)                     │
└───────┬───────────────┬───────────────┬───────────────┬────────────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│    PHOS       │ │   CashPilot   │ │  p31‑cortex   │ │  p31 CLI      │
│  (Desktop)    │ │  (DePIN ops)  │ │ (LLM + safety)│ │ (Unified)     │
│ Tauri, React  │ │ Docker, Python│ │ FastAPI, OLL  │ │ Go (Cobra)    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │                 │
        └─────────────────┼─────────────────┼─────────────────┘
                          │                 │
                    ┌─────▼─────────────────▼─────┐
                    │      Shared Mesh Network     │
                    │   (phos-mesh / cashpilot‑mesh)│
                    │   WebSockets + HTTP + DNS    │
                    └─────┬─────────────────┬─────┘
                          │                 │
              ┌───────────▼───────┐ ┌───────▼───────────┐
              │   Cloudflare Edge │ │   Local Storage   │
              │   Workers / D1    │ │   SQLite / IDB    │
              └───────────────────┘ └───────────────────┘
```

---

## 3. Network Topology

### 3.1 Docker Networks

| Network | Purpose | Subnet | Internal |
|---------|---------|--------|----------|
| `phos-mesh` | Shared between p31‑cortex and PHOS | 172.29.0.0/16 | No |
| `cashpilot-mesh` | CashPilot internal services | 172.28.0.0/16 | No |
| `proxy-net` | Bandwidth harvesters (macvlan) | 172.28.1.0/24 | Yes |
| `gpu-net` | GPU compute containers | 172.28.2.0/24 | Yes |
| `storj-net` | Storage node internal | 172.28.3.0/24 | Yes |
| `monitoring-net` | Prometheus, Grafana | 172.27.0.0/16 | Yes |

**Isolation:** Bandwidth harvesters are separated from GPU/storage traffic using `tc` (QoS) and macvlan bridges.

### 3.2 DNS Resolution

All containers in `phos-mesh` and `cashpilot-mesh` resolve each other by name (e.g., `ollama-backend`, `litellm-proxy`, `auto-solver`). This is achieved via Docker’s embedded DNS.

> **Note:** The CLI’s default `ollama_url` is `http://127.0.0.1:11434`, which does not match the actual container‑mapped ports (`11440` for cortex, `11435` for CashPilot). To use `p31 chat`, either adjust the config in `~/.p31/config.yaml` or run the correct stack.

---

## 4. Data Flow

### 4.1 PHOS (Desktop)

```
User Input → React UI → Tauri IPC → Rust Commands
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
               SQLite DB            cpal Audio            Ollama HTTP
             (karma, vault)        (863 Hz tone)         (LLM inference)
```

### 4.2 CashPilot (DePIN)

```
Bandwidth containers (Honeygain, EarnApp, etc.)
        │
        ▼
Earnings logs → auto-solver → ledger-sync → Cloudflare D1 (optional)
        │
        ▼
Task queue → LLM (via p31-cortex or CashPilot LiteLLM) → earnings.jsonl
```

### 4.3 p31-cortex (LLM + Safety)

```
User prompt → LiteLLM proxy → Ollama
                     │
                     ▼
              Affective Chemistry → voltage score → spoon modulation
                     │
                     ▼
              OQE Verification → hallucination filter → response
```

---

## 5. Security Model

### 5.1 Authentication

| Service | Auth Mechanism |
|---------|----------------|
| CashPilot API | `X-P31-Node-Token` header (env `SOLVER_API_TOKEN`) |
| Cloudflare Workers | `Authorization: Bearer <token>` (D1 sync) |
| PHOS | No remote API – local IPC only |
| p31‑cortex | Localhost bound (no external auth) |
| Discord bot | Discord token + Upstash Redis ACL |

### 5.2 Secrets Management

- All tokens stored in `.env` files (ignored by git)
- Zenodo token at `~/.secrets/zenodo_token.txt` (600 perms)
- No hardcoded secrets in code; verified by `gitleaks` pre‑commit
- **Grafana:** Default password `cashpilot` is hardcoded in `docker-compose.yml` for localhost-only access. Override with `GRAFANA_PASSWORD` env var.

### 5.3 Rate Limiting

- CLI: somatic rate limit (30 commands / 15 min) – SQLite backed
- API: none (all services are local‑only or token‑protected)

---

## 6. Offline‑First Design

| Component | Offline Behaviour |
|-----------|-------------------|
| PHOS | Full operation (IndexedDB persists data) |
| CashPilot | Earnings queued locally, sync on reconnect |
| p31‑cortex | LLM works if model cached (Ollama) |
| Mesh | WebSocket reconnects with exponential backoff |
| CLI | All commands work offline except those hitting remote APIs |

---

## 7. Observability

- **Logs:** Docker containers log to journald; `p31 logs tail` aggregates
- **Metrics:** Prometheus scrapes auto‑solver (:9100), storj (:14002), node exporter
- **Dashboards:** Grafana (port 3000) – ROI, task completion, LLM latency
- **Health checks:** All Docker services have healthchecks; `p31 doctor` probes

---

## 8. Sourcing & License

This architecture is **open source** (MIT) and designed to be replicated on any Linux machine with Docker, Go, and Node.js. See [DEPLOYMENT.md](./DEPLOYMENT.md) for hardware tiers and installation.

**Next:** [DEPLOYMENT.md](./DEPLOYMENT.md) – One‑command installs and hardware tiers.

*The mesh holds. 🔺*
