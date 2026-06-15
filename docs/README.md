# P31 Labs – Sovereign Cognitive Ecosystem

**Version:** 1.0.0 (Production Release)  
**Date:** June 14, 2026  
**Status:** 🟢 All systems operational – Fortune 1 production

P31 Labs is a 501(c)(3) nonprofit building a zero‑telemetry, local‑first cognitive prosthetic platform for neurodivergent individuals. The ecosystem spans desktop, mobile, edge workers, mesh networking, DePIN earnings, and a unified CLI.

---

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, networks, data flow, security model |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | One‑command installs, hardware tiers, cloud deployment |
| [CLI.md](./CLI.md) | `p31` command reference, flags, environment variables |
| [API.md](./API.md) | HTTP endpoints, WebSocket protocols, authentication |
| [COGNITIVE_SAFETY.md](./COGNITIVE_SAFETY.md) | Spoon economy, rate limiting, somatic telemetry |
| [HARDENING.md](./HARDENING.md) | Security posture, access control, zero‑trust defaults |
| [GRANTS.md](./GRANTS.md) | Active grants, pipeline, submission status |
| [OPERATIONS.md](./OPERATIONS.md) | Monitoring, backup, disaster recovery, SLAs |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Code style, PR process, testing requirements |
| [GLOSSARY.md](./GLOSSARY.md) | Terminology (K₄, Spoon, Larmor, Posner, etc.) |

---

## Ecosystem Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     P31 ECOSYSTEM                           │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  PHOS   │  │ CashPilot│ │ p31-cortex│ │Website │        │
│  │(Desktop)│  │ (DePIN)  │  │ (LLM +   │  │(p31ca)  │        │
│  │ Tauri   │  │  Docker  │  │ Safety)  │  │ Astro   │        │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘        │
│       │            │             │             │              │
│       └────────────┼─────────────┼─────────────┘              │
│                    │             │                            │
│              ┌─────▼─────────────▼─────┐                      │
│              │      p31 CLI (Go)       │                      │
│              │  unified command shell  │                      │
│              └───────────┬─────────────┘                      │
│                          │                                    │
│         ┌────────────────┼────────────────┐                  │
│         │                │                │                  │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐            │
│    │Mesh/K4  │      │Ledger   │      │ Workers │            │
│    │Cloudflare│     │SQLite   │      │Edge     │            │
│    └─────────┘      └─────────┘      └─────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

| Component | Description | Tech Stack | Primary Repo |
|-----------|-------------|------------|--------------|
| **PHOS** | Desktop cognitive prosthetic | Tauri (Rust), React, Tailwind | `~/P31-local-workspace/phos` |
| **CashPilot** | DePIN earnings automation | Docker, Python, Go | `~/cashpilot` |
| **p31‑cortex** | LLM inference + safety middleware | FastAPI, Ollama, LiteLLM | `~/p31-cortex` |
| **p31 CLI** | Unified command interface | Go (Cobra, Bubble Tea) | `~/go/p31-cli` |
| **p31ca.org** | Technical hub website | Astro, Tailwind, Cloudflare | `~/P31-local-workspace/software/p31ca` |
| **Discord Bot** | Community oracle & ledger | Node.js, Upstash Redis | `~/P31-local-workspace/ecosystem/discord/` or `~/P31-local-workspace/software/discord/p31-bot/` |

---

## Quick Start (New Machine)

```bash
# 1. Clone the ecosystem
git clone https://github.com/p31labs/andromeda.git ~/P31-local-workspace
git clone https://github.com/p31labs/cashpilot.git ~/cashpilot
git clone https://github.com/p31labs/p31-cortex.git ~/p31-cortex

# 2. Install unified CLI
cd ~/go/p31-cli && make install

# 3. Deploy CashPilot & cortex
cd ~/cashpilot && ./deploy.sh --skip-build
cd ~/p31-cortex && docker compose up -d

# 4. Run health check
p31 doctor --mesh --fun
```

> ⚠️ **Grafana default credentials** are `admin/cashpilot` when running locally. Change immediately if exposed beyond localhost.

---

## Minimum Hardware Requirements

| Tier | CPU | RAM | Storage | GPU | Use Case |
|------|-----|-----|---------|-----|----------|
| Tier 1 | 2 cores | 4 GB | 20 GB | None | CLI + basic services |
| Tier 2 | 4 cores | 8 GB | 40 GB + 2TB HDD | GTX 1060 | DePIN + storage |
| Tier 3 | 6+ cores | 16 GB+ | 60 GB + 4TB HDD | RTX 3060+ | Full stack + GPU compute |

*Chromebook (Crostini) can run Tier 1 with software rendering flags.*  
*ESP32 can act as a mesh sensor node.*

---

## Security & Privacy

- **Zero telemetry** – No cloud databases; all state is local‑first (IndexedDB, SQLite)
- **Post‑quantum ready** – ML-KEM-768 / FIPS 203 planned for future key exchange (WebAuthn path currently uses ML-DSA-65 / FIPS 204)
- **Somatic rate limiting** – 30 commands / 15 min prevents hyperfocus burnout
- **API tokens required** – `X-P31-Node-Token` for CashPilot endpoints; rotate regularly
- **All communications encrypted** – WebSockets over TLS, SSH for remote access

---

## License & Contribution

**License:** MIT (code), CC‑BY‑4.0 (research papers)  
**Nonprofit:** P31 Labs is a determined 501(c)(3) (EIN 42‑1888158)  
**Contributing:** See [CONTRIBUTING.md](./CONTRIBUTING.md). All PRs must pass `p31 verify` and have ≥1 approving review.

---

## Contact & Support

- **Website:** [p31ca.org](https://p31ca.org)
- **GitHub:** [p31labs/andromeda](https://github.com/p31labs/andromeda)
- **Discord:** [P31 Labs Community](https://discord.gg/uYW5rTCuZ)
- **Email:** will@p31ca.org

---

**The mesh holds. Build sovereign. 🔺**

*Last updated: June 14, 2026*
