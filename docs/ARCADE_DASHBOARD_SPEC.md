# Arcade Dashboard Specification

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Overview

The Arcade is a Cloudflare Worker that serves a live dashboard (`arcade.p31ca.org`) showing the real-time status of all pilot families, their nodes, and mesh health.

It is the **public face** of the LOVE ecosystem – a transparent, always-fresh view of the care economy in action.

## 2. Worker: `apps/arcade`

### `wrangler.toml`

```toml
name = "arcade"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[[d1_databases]]
binding = "DB"
database_name = "love-ledger"
database_id = "592e3e2e-3203-4e0a-8342-9e85215ec8a6"

[env.production]
routes = [
  { pattern = "arcade.p31ca.org/*", zone_name = "p31ca.org" }
]
```

### `src/index.ts`

A Hono app with routes:

- `GET /` – HTML dashboard (live, auto-refreshing)
- `GET /api/pilots` – JSON list of pilot families with stats
- `GET /api/health` – JSON summary of total pilots, active pilots, avg health, total nodes

**Example response (`/api/pilots`):**

```json
[
  {
    "did": "did:key:abc123",
    "family_name": "Johnson Family",
    "status": "active",
    "onboarded_at": 1749696000,
    "active_nodes": 2,
    "mesh_health": 0.85,
    "care_events": 47
  }
]
```

**UI:** A grid of pilot cards, each showing family name, status, node count, care events, and a health bar. Auto-refreshes every 60 seconds.

## 3. Optional K4 Enrichment (Phase 2)

Add a service binding to `k4-cage` to read real-time topology data (vertex presence, edge love counts) and enrich the pilot cards with K4 mesh metrics.

```toml
# wrangler.toml addition
services = [
  { binding = "K4_CAGE", service = "k4-cage" }
]
```

Then in `/api/pilots`, call `K4_CAGE.fetch('/api/topology')` and merge the data.

## 4. Deployment

```bash
cd apps/arcade
npx wrangler deploy --env production
```

## 5. Security

- The Arcade is **read-only**. It has no write access to D1.
- It exposes only aggregated, non-sensitive data (family names, health metrics, event counts).
- No PII (email, phone, etc.) is stored or displayed.
