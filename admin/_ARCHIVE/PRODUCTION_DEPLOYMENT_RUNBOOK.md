# P31 Andromeda — Production Deployment Runbook

**Version:** 1.0.0  
**Date:** March 24, 2026  
**Classification:** Medical Device (21 CFR §890.3710)  
**Status:** 🟢 DEPLOYMENT READY

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Deployment](#deployment)
4. [Operations](#operations)
5. [Troubleshooting](#troubleshooting)
6. [Escalation](#escalation)

---

## 1. System Overview

### Mission
P31 Labs builds open-source assistive technology for neurodivergent individuals. The P31 Andromeda ecosystem provides cognitive prosthetics that shield operators from systemic entropy.

### Core Products
| Product | Status | URL |
|---------|--------|-----|
| BONDING | 🟢 Shipped March 10, 2026 | bonding.p31ca.org |
| Spaceship Earth | 🟡 In Development | p31ca.org |
| Phenix Navigator | 🔴 Hardware Prototype | $37.50 BOM |

### Technology Stack
- **Frontend:** React + TypeScript + Vite + Three.js (@react-three/fiber + drei)
- **Backend:** Cloudflare Workers + KV (BONDING relay); FastAPI + PostgreSQL + Redis (planned)
- **State Sync:** CRDT + WebSocket relay; Cloudflare KV polling (BONDING multiplayer)
- **Hardware:** ESP32-S3 + DRV2605L + LoRa SX1262 + NXP SE050

---

## 2. Architecture

### Delta Topology (Preferred)
The P31 ecosystem uses Delta topology (decentralized mesh) over Wye topology (centralized star). This provides:
- Resilient routing — multiple paths to any node
- No single point of failure
- Geometric stability (K₄ complete graph = minimum rigid structure)

### Room Router Pattern
Hash-based routing, no react-router. `ROOMS` array in `rooms/index.ts` is single source of truth.

```
#observatory  → Geodesic Data Dome
#collider     → Particle Collider Simulator
#bonding      → BONDING (iframe)
#bridge       → LOVE wallet, identity, settings
#buffer       → Buffer Dashboard (planned)
```

### Z-Index Contract (Cockpit Doctrine)
| Layer | Z | Contents |
|-------|---|----------|
| Canvas | 1 | Three.js renderer |
| Room HUD | 10 | Axis filters, beam selectors |
| Navigation | 11 | Room switcher bar |
| Toasts | 50 | System notifications |
| Modals | 60 | Overlays |
| Boot/Full-screen | 100 | Intentional full-screen |

---

## 3. Deployment

### BONDING Deployment
```bash
cd software/bonding
npm run build
npx wrangler deploy
```

### Cloudflare Workers
- `bonding-relay` — Multiplayer relay at bonding.p31ca.org
- `kofi-webhook` — Ko-fi integration at trimtab-signal.workers.dev

### Production Checks
1. `npm run build` — clean build
2. `tsc --noEmit` — TypeScript validation
3. `vitest run` — All tests pass
4. `wrangler deploy` — Cloudflare deployment

---

## 4. Operations

### SOP-001: The Parking Lot Pattern
**Spoon Cost:** 1/5 (Crisis-level executable)

When impulse fires during high-priority task:
1. Open Parking Lot (plain text file)
2. Write ONE line capturing the task
3. Return to primary task immediately
4. Triage at designated phase gates (e.g., 8 PM Evening Review)

### SOP-002: The Triad (AI Tag-Out)
**Spoon Cost:** 3/5 (Requires setup, dramatically lowers daily cognitive load)

| Agent | Role | Tag IN For | Tag OUT For |
|-------|------|------------|-------------|
| Opus | Architect | QA, verification, architecture | Minor coding |
| Sonnet | Mechanic | React, TypeScript, rapid iteration | Architecture |
| Gemini | Narrator | Grants, narrative, specs | Code execution |
| DeepSeek | Firmware | ESP32 C/C++, hardware | UI, architecture |

**Failure Modes:**
- Gemini: "The Chaplain" — over-narrates, writes docs instead of code
- Opus: Over-intervention — tries to architect when it should verify
- Sonnet: Hallucination under low context — mitigated by pre-patched code
- DeepSeek: Scope creep into UI — keep in firmware lane

### Spoon Economy
- **Daily Max:** 12 spoons (calibrated to AuDHD + hypoparathyroidism)
- **Bad calcium days:** 8-9 spoons
- **Court days/poor sleep:** 6-7 spoons

### L.O.V.E. Protocol
- **Spoons:** Cognitive energy spent (entropy)
- **LOVE:** Regulation credits earned (syntropy)
- **Soulbound:** Cannot be bought/sold/transfered — earned through care

---

## 5. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **localStorage eviction** | PATCH 1: IndexedDB via idb-keyval + navigator.storage.persist() |
| **KV session contention** | PATCH 2: Per-session unique keys + KV.list() |
| **sendBeacon drops** | PATCH 3: 30s incremental flush + IDB backstop + orphan recovery |
| **Executive dysfunction freeze** | Use Thick Click (Kailh Choc Navy 60gf) for proprioceptive feedback |
| **Fawn response decoherence** | Activate Fawn Guard in Buffer Dashboard |
| **Manic label in court** | Psychiatrist letter (Maughon, March 23) as Exhibit WRJ-010 |

### Medical Device Compliance (21 CFR §890.3710)
- Class II exempt — Powered Communication System
- Cognitive load management implemented
- Executive function support verified
- Zero-spoon graceful degradation tested

---

## 6. Escalation

### Critical Paths
1. **March 24:** Psychiatrist appointment — ✅ COMPLETED
2. **March 26:** Discovery response deadline — PENDING
3. **April 4:** Eviction from 401 Powder Horn Rd — 14 days away

### Contacts
- **Operator:** William R. Johnson — (912) 227-4980
- **Board Member (ADA Support):** Brenda O'Dell — brendaodell54@gmail.com
- **Beta Tester:** Tyler — Tailscale mesh

### Emergency Contacts
- **Medical:** Hypoparathyroidism — calcium carbonate + calcitriol
- **Legal:** Johnson v. Johnson (2025CV936) — Camden County Superior Court
- **Technical:** GitHub (p31labs), Cloudflare Workers, Zenodo (DOIs)

---

## Appendix A: Key Files

| File | Purpose |
|------|---------|
| `docs/Johnson_Discovery_Response.docx` | Legal response (15 requests + objections) |
| `docs/Johnson_Production_Cover_Sheet.docx` | Exhibit index (WRJ-001–009) |
| `docs/CognitivePassport-v2_6.md` | Operator profile (52KB) |
| `software/bonding/src/genesis/genesis.ts` | Genesis Block (PATCH 1-3) |
| `software/bonding/worker/telemetry.ts` | Cloudflare Worker relay |

---

## Appendix B: Quick Commands

```bash
# Build BONDING
cd software/bonding && npm run build

# Type check
cd software/bonding && npx tsc --noEmit

# Run tests
cd software/bonding && npx vitest run

# Deploy to Cloudflare
cd software/bonding && npx wrangler deploy
```

---

*Last Updated: March 24, 2026*
*P31 Labs | phosphorus31.org | github.com/p31labs*
*"It's okay to be a little wonky."* 🔺