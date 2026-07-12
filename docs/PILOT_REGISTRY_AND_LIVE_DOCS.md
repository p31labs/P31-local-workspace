# Pilot Registry & Live Docs

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Overview

This document specifies the data model, API endpoints, and live-docs pipeline for the P31 pilot registry.

The pilot registry is the **canonical source of truth** for all participating families, their active nodes, and their status. The live-docs pipeline keeps the project documentation automatically updated with real-time pilot data.

## 2. Data Model

### Migration `008_pilot_registry.sql`

```sql
-- Migration 008: Pilot registry and node registry tables.
-- Separates pilot-specific metadata from core love_accounts.

CREATE TABLE IF NOT EXISTS pilot_registry (
  did TEXT PRIMARY KEY,
  family_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | active | completed
  onboarded_at INTEGER,           -- unix timestamp
  active_nodes INTEGER DEFAULT 0,
  mesh_health REAL DEFAULT 0.0,
  metadata TEXT,                  -- JSON blob for extensibility
  FOREIGN KEY (did) REFERENCES love_accounts(did)
);

CREATE TABLE IF NOT EXISTS node_registry (
  node_id TEXT PRIMARY KEY,
  family_did TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  firmware_version TEXT,
  battery_level INTEGER,
  FOREIGN KEY (family_did) REFERENCES love_accounts(did)
);

CREATE INDEX idx_node_registry_family ON node_registry (family_did);
CREATE INDEX idx_pilot_registry_status ON pilot_registry (status);
```

Apply:
```bash
wrangler d1 execute love-ledger --remote --file=migrations/008_pilot_registry.sql
```

## 3. API Endpoints (love-ledger)

### `POST /family/onboard`

Registers a new pilot family.

**Request:**
```json
{
  "did": "did:key:abc123",
  "family_name": "Johnson Family",
  "nodes": ["node-esp32-001", "node-esp32-002"]
}
```

**Response:**
```json
{
  "success": true,
  "did": "did:key:abc123",
  "status": "pending"
}
```

### `PATCH /family/{did}/status`

Updates the pilot status.

**Request:**
```json
{ "status": "active" }
```

**Response:**
```json
{ "success": true, "did": "did:key:abc123", "status": "active" }
```

## 4. Backfill Script

`scripts/backfill-pilots.js` – run once to populate `pilot_registry` from existing `love_accounts` and `hardware_pairings`.

```bash
node scripts/backfill-pilots.js
```

## 5. Live Docs Pipeline (GitHub Action)

### `scripts/update-live-docs.js`

Queries D1 for pilot and node data, renders Markdown tables, replaces `{{PLACEHOLDERS}}` in `docs/MESH_RESILIENCE_RESEARCH_NOTE.md` and `docs/LOVE_TOKENOMICS_WHITE_PAPER.md`, and commits if changed.

### `.github/workflows/update-live-docs.yml`

```yaml
name: Update Live Docs
on:
  schedule:
    - cron: '0 */6 * * *'   # every 6 hours
  push:
    paths:
      - 'migrations/008_*'
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g wrangler
      - run: node scripts/update-live-docs.js
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "docs: auto-update live pilot data [skip ci]"
          file_pattern: docs/*.md
```

## 6. Placeholders in Docs

| Document | Placeholders |
|----------|--------------|
| `docs/MESH_RESILIENCE_RESEARCH_NOTE.md` | `{{PILOT_TABLE}}`, `{{NODE_TABLE}}`, `{{AVG_CURVATURE}}`, `{{WORST_NODE}}`, `{{LAST_UPDATE}}` |
| `docs/LOVE_TOKENOMICS_WHITE_PAPER.md` | `{{PILOT_SUMMARY}}`, `{{FAMILY_COUNT}}`, `{{ACTIVE_WORKERS}}`, `{{TOTAL_LOVE}}`, `{{TOTAL_SBTS}}`, `{{LAST_UPDATE}}` |
