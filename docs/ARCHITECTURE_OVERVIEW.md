# P31 Live Ecosystem – Architecture Overview

**Version:** 1.0 (draft)
**Date:** 2026-07-11

## 1. Purpose

This document describes the unified architecture of the P31 Labs live ecosystem, connecting the LOVE ledger, the pilot registry, the Arcade dashboard, the bonding game, the K4 family mesh, and the spin-mesh barter system into a single, live-updating platform.

The goal is to turn the LOVE ledger from a back-end accounting system into the **canonical record of care**, visible through the Arcade dashboard and reflected in auto-updated documentation.

## 2. High-Level Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                       ARCADE DASHBOARD                         │
│                     (arcade.p31ca.org)                         │
│                                                                 │
│  Displays: pilot families, node health, care events,           │
│            LOVE minted, mesh topology                          │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Reads from:
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                  D1 LOVE-LEDGER DATABASE                       │
│                                                                 │
│  Tables: love_accounts, love_chain, pilot_registry,            │
│          node_registry, cbs_nonce                              │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Writes to:
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                    LOVE-LEDGER WORKER                          │
│                     (love-ledger.p31ca.org)                    │
│                                                                 │
│  Endpoints: /withdraw, /transfer, /family/onboard,             │
│             /family/{did}/status, /blind-pubkey, /blind-sign   │
│                                                                 │
│  CBS WASM (live), ML-DSA-44 PQC seal (live), D1 atomic batch  │
└───────────────┬─────────────────────────────────────────────────┘
                │
                │ Ingest from:
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                    BONDING GAME                                │
│                     (bonding.p31ca.org)                        │
│                                                                 │
│  Telemetry relay → calls /withdraw at session end              │
│  LOVE minted from gameplay (collaborative play)                │
└─────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                      K4 FAMILY MESH                           │
│                                                                 │
│  k4-cage (K4Topology DO), k4-personal, k4-hubs                │
│                                                                 │
│  Service binding to Arcade for topology read                   │
└─────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                    SPIN-MESH BARTER SYSTEM                    │
│                                                                 │
│  HandoverDO → calls /transfer with type='barter_completion'    │
│  Records physical handover events in love_chain                │
└─────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────┐
│                   LIVE DOCS PIPELINE                          │
│                                                                 │
│  GitHub Action (every 6 hours) → queries D1 → replaces        │
│  {{PLACEHOLDERS}} in docs/*.md → commits                      │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Data Flow

| Flow | Source | Destination | Trigger |
|------|--------|-------------|---------|
| Family onboarding | PHOS / API call | `pilot_registry` | User action |
| LOVE mint (CBS) | `/withdraw` | `love_chain` | User action (withdraw) |
| LOVE transfer | `/transfer` | `love_chain` | User action |
| Bonding LOVE | Bonding relay → `/withdraw` | `love_chain` | Session end |
| Barter completion | HandoverDO → `/transfer` | `love_chain` | Physical handover |
| Live docs update | GitHub Action | `*.md` placeholders | Cron (every 6h) / push |
| Arcade dashboard | D1 + K4 service | `arcade.p31ca.org` | Real-time (per request) |

## 4. Security & Privacy

- **LOVE minting** is protected by CBS blind signatures – issuer cannot link credit to recipient.
- **/withdraw** requires a valid blind signature and HMAC-authenticated LOVE path.
- **/transfer** requires did:key signature or Bearer token (for service calls).
- **Pilot registry** is read-only for the Arcade dashboard (no write access).
- All secrets are stored as Wrangler secrets (not in code).

## 5. Dependencies

| Component | Dependencies |
|-----------|--------------|
| Arcade Worker | D1 (love-ledger), optionally K4 service binding |
| Live Docs Action | D1 (via wrangler d1 execute) |
| Bonding Relay | love-ledger (HTTPS) |
| K4-cage | Durable Objects, KV |
| Spin-mesh | love-ledger (HTTPS) |
