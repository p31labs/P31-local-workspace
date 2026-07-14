# P31 Scaling Roadmap

Post-pilot planning for scaling P31 from 18 families to broader adoption.

## Phase 1: Pilot Completion (Q3 2026)

| Milestone | Target | Status |
|-----------|--------|--------|
| 18 families onboarded | 2026-08-15 | 🔲 In progress |
| ≥5 families complete onboarding | 2026-08-30 | 🔲 Pending |
| Feedback collected | 2026-09-01 | 🔲 Pending |
| NGI submissions received | 2026-09-15 | 🔲 Pending |

## Phase 2: Healthcare Integration (Q4 2026)

| Milestone | Description | Timeline |
|-----------|-------------|----------|
| FHIR integration | EHR data exchange via HL7 FHIR R4 | 3 months |
| Clinician credentials | VCs for healthcare providers | 3 months |
| Care coordination | Cross-institutional care records | 3 months |

## Phase 3: Federated Identity (Q1 2027)

| Milestone | Description | Timeline |
|-----------|-------------|----------|
| `did:web` federation | Full did:web resolution with service endpoints | 2 months |
| EU Digital Identity Wallet | Interoperability with eIDAS 2.0 wallets | 3 months |
| Cross-platform VCs | Verifiable Credentials across P31 instances | 3 months |

## Phase 4: Community Growth (Q1-Q2 2027)

| Milestone | Description | Timeline |
|-----------|-------------|----------|
| 100 families | Expand pilot to 100 families | 3 months |
| Self-hosting guides | NixOS module + Docker + manual | 2 months |
| Developer SDK | `@p31/sdk` for third-party integrations | 3 months |

## Phase 5: Scale (Q2-Q3 2027)

| Milestone | Description | Timeline |
|-----------|-------------|----------|
| 500 families | Regional expansion | 3 months |
| School partnerships | Integration with school care systems | 3 months |
| 1,000 families | National pilot programme | 3 months |

## Technical Dependencies

| Dependency | Status | Risk |
|------------|--------|------|
| Cloudflare Workers Free Plan | 10 D1 cap, 5 cron cap | Medium — may need paid plan |
| Base Sepolia testnet | Stable | Low — testnet for pilot |
| @noble/post-quantum v0.6.1 | Stable | Low — audited library |
| NGI funding | Pending submission | Medium — depends on acceptance |

## Funding Strategy

| Source | Amount | Purpose |
|--------|--------|---------|
| NGI TALER | €15,000 | LOVE→Taler bridge, pilot rollout |
| NGI Fediversity | €25,000 | ActivityPub bridge, NixOS module |
| NGI Zero Commons | €50,000 (max) | Open-source infrastructure |
| Phase 2 funding | TBD | Healthcare integration |
