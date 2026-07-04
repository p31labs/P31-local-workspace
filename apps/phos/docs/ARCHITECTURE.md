# Architecture

## Overview

PHOS is a sovereign edge architecture where all computation stays local and no data is exfiltrated. State is persisted in D1 databases, and all mutations require Ed25519 signature verification.

## Component Diagram
```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React)                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │LedgerSurface │  │BarterMarket  │  │GovernanceSurface │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│              │              │                     │           │
│              ▼              ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ API Layer (src/lib/api/*)                            │   │
│  │ signedFetch() — automatically signs all mutations    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Edge                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │love-ledger   │  │contract-     │  │governance-       │   │
│  │Worker        │  │engine Worker │  │engine Worker     │   │
│  │ • /balance   │  │ • /contract  │  │ • /proposals     │   │
│  │ • /transfer  │  │ • /initiate  │  │ • /vote          │   │
│  │ • /stake     │  │ • /sign      │  │ • /delegate      │   │
│  └──────┬───────┘  │ • /activate  │  │ • /tally         │   │
│         │          │ • /fulfill   │  │ • /resolve       │   │
│         │          │ • /dissolve  │  └────────┬─────────┘   │
│         │          └──────┬───────┘           │              │
│         │                 │                   │              │
│         ▼                 ▼                   ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │love-ledger   │  │contracts-db │  │governance-db     │   │
│  │(D1)          │  │(D1)         │  │(D1)              │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User action** in React surface
2. **API client** (`src/lib/api/*.ts`) constructs payload
3. **signedFetch** signs payload with user's private key
4. **Worker** verifies signature via `src/lib/edge/verify.ts`
5. **D1** executes query (atomic batch for mutations)
6. **Response** returns to frontend

## Security Model

- All mutations require Ed25519 signature (`X-Signature` header)
- DID extracted from payload, public key derived from `did:key:`
- `crypto.subtle.verify()` validates signature
- `401 Unauthorized` on missing/invalid signature
- Idempotency keys prevent double-spend / double-vote
