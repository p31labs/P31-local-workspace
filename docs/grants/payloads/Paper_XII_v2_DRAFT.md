# Paper XII — The Sovereign Stack: Open-Source Hardware–Software Architecture for Neurodivergent Assistive Technology (v2 DRAFT)

**Authors:** William R. Johnson (ORCID 0009-0002-2492-9079)
**Affiliation:** P31 Labs, Inc. — 501(c)(3) tax-exempt Georgia Domestic Nonprofit (EIN 42-1888158)
**Series:** P31 Labs Research Series, Paper XII
**Resource type:** Working paper
**License:** Creative Commons Attribution 4.0 International (CC-BY-4.0)
**Status:** DRAFT for v2 upload to Zenodo `10.5281/zenodo.19782969` (replaces v1, published 2026-04-26)
**Triple-gated for factual accuracy.**

---

## Abstract

This paper documents the complete open-source hardware–software architecture of the P31 ecosystem — the "Sovereign Stack": a local-first, privacy-preserving, non-custodial assistive platform built for neurodivergent families. The stack couples a sovereign cognitive prosthetic (Node Zero), an educational chemistry engine (BONDING), and a Cloudflare Workers edge infrastructure into a single coherent system that remains functional even when cloud connectivity is severed. We describe the Node Zero prosthetic, the BONDING engine and its automated test suite, the edge-worker fleet, and the care-accounting and cognitive-portability layers (LOVE-Ledger and PHOS-Sovereign) that complete the sovereignty model. All components are open-source (MIT/Apache-2.0) and operate strictly as general wellness and communication support within pre-market, non-clinical parameters.

---

## 1. The Sovereign Stack Thesis

The Sovereign Stack returns digital autonomy to families as a basic civil right. It rejects surveillance-dependent platforms in favor of local-first, non-custodial infrastructure where the operator owns, controls, and comprehends their tools. The architecture is organized around three layers:

1. **Sovereign hardware** — Node Zero, a personal cognitive prosthetic.
2. **Sovereign software** — PHOS (Phosphorus Human Operating Surface), a spoon-aware cognitive OS of 22 functional surfaces.
3. **Sovereign economics** — LOVE-Ledger, a court-admissible care-accounting layer built on GNU Taler blind signatures.

---

## 2. Node Zero — The Cognitive Prosthetic

Node Zero is the reference sovereign hardware node. Verified bill-of-materials from the published v1 record:

- **ESP32-S3** — primary compute (low-power, Wi-Fi/BLE, Meshtastic-capable).
- **AXS15231B** — display controller driving the local tactile/visual surface.
- **SE050** — secure element for key custody and WebAuthn passkey storage.

Node Zero is designed for constrained, often-offline operation and serves as the physical anchor for the Cognitive Passport — the portable, spoon-aware user profile that migrates across hosts without leaving a cloud footprint.

---

## 3. BONDING — The Educational Chemistry Engine

BONDING is the deployed educational chemistry game that exercises the Sovereign Stack's local-first sync, rendering, and game-loop infrastructure.

- **Automated tests:** **95 passing** (corrected from the v1 figure of 413; the current audited suite is 95, per `npm run test` 2026-06-19).
- Runs entirely client-side; no telemetry.

> **Correction note:** v1 stated "413 automated tests." The authoritative, audit-gated count is **95**. v2 uses 95.

---

## 4. Cloudflare Workers Edge Infrastructure

The Sovereign Stack is fronted by a Cloudflare Workers + Pages deployment:

- **Production Cloudflare Pages sites:** 7 (canonical index: `ARTIFACTS.md`).
- **Active Workers:** **8+ active, from a fleet of 30 unique Workers** (corrected from the v1 figure of "10 deployed workers").
- **Functional cognitive surfaces:** 22 (verified in `phos/src/lib/sound.ts`).
- **Real-time health score:** 16/20.

> **Correction note:** v1 stated "10 deployed workers." The authoritative fleet count is **30 unique Workers, 8+ currently active**. v2 uses the fleet figure.

---

## 5. Sovereignty Layers — LOVE-Ledger & PHOS-Sovereign

Two submissions to NLnet's current open calls complete the sovereignty model:

- **LOVE-Ledger (NGI TALER)** — a non-custodial bridge embedding GNU Taler blind signatures in the PHOS family mesh, with a SHA-256 hash-chain care ledger (`love-ledger.p31ca.org`) that is court-admissible (E-IDAS 2.0). Keeps settlement outside P31's perimeter to avoid custodial triggers.
- **PHOS-Sovereign (NGI Fediversity)** — adds the standardized `.phos` export format (portable Cognitive Passport), a NixOS deployment module, and an ActivityPub bridge for sharing care state (spoon levels, sanctuary mode) across trusted family networks without exposing PII.

---

## 6. Verification & Live Metrics (Audited)

| Metric | Value | Source |
|--------|-------|--------|
| Production Cloudflare Pages sites | 7 | `ARTIFACTS.md` |
| Active Workers / fleet | 8+ / 30 | `P31-WIRING-DIAGRAM.md` |
| Functional cognitive surfaces | 22 | `phos/src/lib/sound.ts` |
| BONDING automated tests | 95 | `npm run test` (2026-06-19) |
| Real-time health score | 16/20 | `verify.sh` |
| Open-access Zenodo papers | 22 | ORCID 0009-0002-2492-9079 |

---

## 7. Related Works

- The Tetrahedron Protocol: A Grand Unified Theory of Structural Resilience — `10.5281/zenodo.19004485`
- The Tetrahedron Protocol: A Geometric Framework for Unified Systems Theory — `10.5281/zenodo.18627420`
- P31 Labs Genesis Whitepaper — `10.5281/zenodo.19411363`
- Additional P31 deposits — `10.5281/zenodo.19416491`, `10.5281/zenodo.19503542`

---

## Notes for upload (v2)

- Replace v1 PDF (`P31_Paper_XII_Sovereign_Stack.pdf`) with the regenerated v2.
- Keep DOI `10.5281/zenodo.19782969` (new version of same record).
- EIN 42-1888158 (matches published v1 metadata — no change needed).
- Update "Is part of" related works to include the LOVE-Ledger (NGI TALER) and PHOS-Sovereign (NGI Fediversity) proposals once submitted.
