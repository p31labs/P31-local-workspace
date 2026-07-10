# PHOS-Sovereign: Cognitive Portability Through Edge-Native Mesh Federation

**Call:** NGI Fediversity, 11th Open Call
**Requested:** €25,000
**Duration:** 9 months
**License:** AGPL-3.0 (software), CC-BY-4.0 (documentation)
**Organization:** P31 Labs, Inc. — 501(c)(3) tax-exempt Georgia Domestic Nonprofit (EIN 42-1888158)

## Abstract

PHOS (Phosphorus Human Operating Surface) is a deployed, multi-node cognitive OS (22 functional cognitive surfaces, running across 7 production Cloudflare Pages sites and 8+ active edge nodes). PHOS operates strictly as a general wellness and communication support platform within pre-market, non-clinical parameters, featuring zero telemetry. PHOS-Sovereign extends it with: (1) data decoupling via a standardized `.phos` export format, (2) a NixOS module for declarative deployment, (3) an ActivityPub bridge for Fediverse federation.

## Compare with Existing / Historical Efforts

| Approach | Model | Cognitive Portability | Self-Hosting | Fediverse Bridge | P31 Differentiator |
|----------|-------|----------------------|--------------|------------------|-------------------|
| Nextcloud / Homelab | File sync | No | Yes | No | — |
| Mastodon / ActivityPub | Social media | No | Yes | Yes | — |
| NixOS | Reproducible builds | No | Yes | No | — |
| **PHOS-Sovereign** | **Cognitive proxy** | **Yes (.phos export)** | **Yes (NixOS module)** | **Yes (ActivityPub)** | **Combines all three with an accessibility model** |

Self-hosting (Nextcloud/Homelab) and Fediverse (Mastodon/ActivityPub) exist, but none couple cognitive portability — accessibility profiles, memory structures, spoon-state — to declarative, edge-native deployment. NixOS gives reproducible builds but no accessibility model. **PHOS-Sovereign adds the standardized `.phos` export, a NixOS module, and an ActivityPub bridge** that shares care state (spoon levels, sanctuary mode), not just posts.

## Significant Technical Challenges

1. **CRDT sync across edge nodes with intermittent connectivity** — PHOS uses a local-first sync layer; the ActivityPub bridge extends it with a federation layer for offline-tolerant replication.
2. **Standardizing the `.phos` export format** — the Cognitive Passport schema defines the portable profile; the `.phos` format is a JSON + hash-chain package separating user data, accessibility profiles, and interface state from any single host.
3. **NixOS module reproducibility on constrained hardware** — targets low-resource edge nodes (Raspberry Pi 4, ESP32-S3 with LoRa); reproducible builds with rollback support and minimal attack surface.
4. **Selective disclosure in the ActivityPub bridge** — share spoon-state without doxxing, reusing the Cognitive Passport's selective-disclosure engine.

## Ecosystem & Engagement

- **NixOS community** — the module is designed for contribution and extension; submission to Nixpkgs planned.
- **Fediverse / ActivityPub developers** — the bridge uses standard ActivityPub vocabulary; P31 will publish a spec for "care state" extensions.
- **NLnet / NGI Fediversity** — submitted to the current Fediversity open call; P31 is active in the Fediverse community.
- **Neurodivergent advocacy & open-source community** — 22 Zenodo papers, 7 production sites, ORCID 0009-0002-2492-9079; all code MIT-licensed at `github.com/p31labs/P31-local-workspace`.

Validation via the live 22-surface PHOS deployment across 7 sites.

## Technical Approach

1. **Data Decoupling** — Standardized `.phos` export format that separates user data, accessibility profiles, and interface state from any specific hardware or hosting provider. Ensures cognitive prosthetics remain functional even if cloud connectivity is severed.

2. **NixOS Module** — Declarative deployment module that allows users to self-host their PHOS environment with a single configuration file. Reproducible builds, rollback support, minimal attack surface.

3. **ActivityPub Bridge** — Fediverse federation layer that enables controlled sharing of cognitive state (spoon levels, availability, sanctuary mode) across trusted family networks without central infrastructure.

## Our Live Footprint (Verified)

- 7 production Cloudflare Pages sites (canonical: ARTIFACTS.md)
- 8+ active Cloudflare Workers (from a fleet of 30 unique Workers)
- 22 functional cognitive surfaces (verified in phos/src/lib/sound.ts)
- Core BONDING engine: 95 passing automated tests
- Real-time health score: 16/20

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

*Rates: ~€60/hour estimated (below commercial rates); all work performed by P31 Labs employees.*

## Generative AI Disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting. All technical content was directed and reviewed by William R. Johnson based on P31 Labs' existing PHOS architecture and family mesh infrastructure. A full prompt provenance log is maintained at `docs/grants/prompt-provenance-log.md`.

## Supporting Evidence (Verified Open-Access Portfolio)

- **Paper XII — The Sovereign Stack: Open-Source Hardware–Software Architecture for Neurodivergent Assistive Technology** — `10.5281/zenodo.19782969` (published 2026-04-26; v2 with corrected live metrics in progress). Directly underpins the PHOS architecture, Node Zero prosthetic, and BONDING engine referenced above.
- **The Tetrahedron Protocol: A Grand Unified Theory of Structural Resilience** — `10.5281/zenodo.19004485` (2026-01-26, v2)
- **P31 Labs Genesis Whitepaper** — `10.5281/zenodo.19411363` (2026-04-04, v1)
- Full portfolio: 22 open-access Zenodo deposits under ORCID 0009-0002-2492-9079
