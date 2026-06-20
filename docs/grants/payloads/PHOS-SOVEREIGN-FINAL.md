# PHOS-Sovereign: Cognitive Portability Through Edge-Native Mesh Federation

**Call:** NGI Fediversity, 11th Open Call
**Requested:** €25,000
**Duration:** 9 months
**License:** AGPL-3.0 (software), CC-BY-4.0 (documentation)
**Organization:** P31 Labs, Inc. — 501(c)(3) tax-exempt Georgia Domestic Nonprofit (EIN 42-1888158)

## Abstract

PHOS enables cognitive portability — personalised accessibility accommodations, memory structures, and interface constraints that migrate seamlessly across hardware without leaving a cloud footprint. The system operates as a general wellness and communication support platform within pre-market, non-clinical parameters.

PHOS (Phosphorus Human Operating Surface) is a deployed, multi-node cognitive OS (22 functional cognitive surfaces, running across 7 production Cloudflare Pages sites and 8+ active edge nodes). PHOS operates strictly as a general wellness and communication support platform within pre-market, non-clinical parameters, featuring zero telemetry. PHOS-Sovereign extends it with: (1) data decoupling via standardized .phos export format, (2) NixOS module for declarative deployment, (3) ActivityPub bridge for Fediverse federation.

## Our Live Footprint (Verified)

- 7 production Cloudflare Pages sites (canonical: ARTIFACTS.md)
- 8+ active Cloudflare Workers (from a fleet of 30 unique Workers)
- 22 functional cognitive surfaces (verified in phos/src/lib/sound.ts)
- Core BONDING engine: 95 passing automated tests
- Real-time health score: 16/20

## Technical Approach

1. **Data Decoupling** — Standardized .phos export format that separates user data, accessibility profiles, and interface state from any specific hardware or hosting provider. Ensures cognitive prosthetics remain functional even if cloud connectivity is severed.

2. **NixOS Module** — Declarative deployment module that allows users to self-host their PHOS environment with a single configuration file. Reproducible builds, rollback support, minimal attack surface.

3. **ActivityPub Bridge** — Fediverse federation layer that enables controlled sharing of cognitive state (spoon levels, availability, sanctuary mode) across trusted family networks without central infrastructure.

## Why P31 Labs

P31 Labs is driven by direct execution, not academic abstraction. Founded by Will Johnson, an AuDHD engineer and former DoD civilian. As a single father to two neurodivergent children (S.J. and W.J.), PHOS was built from scratch over 16+ months as a single father managing AuDHD and hypoparathyroidism. Features like spoon-aware UI degradation, GRAY_ROCK mode, and SANCTUARY mode derive directly from the daily operational requirements of a neurodivergent household navigating severe systemic barriers. We are building the tools we needed to survive.

## Budget

| Category | Amount |
|----------|--------|
| Engineering (edge federation, CRDT sync, NixOS module) | €15,000 |
| Documentation & Open-Source Commons | €5,000 |
| Community Engagement & Support | €3,000 |
| Legal & Compliance (general wellness safe-harbor) | €2,000 |
| **Total** | **€25,000** |
