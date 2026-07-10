# L.O.V.E.-Ledger: Zero-Knowledge Micro-Payments for the Invisible Care Economy

**Call:** NGI TALER, 13th Open Call
**Requested:** €15,000
**Duration:** 9 months
**License:** AGPL-3.0 (software), CC-BY-4.0 (documentation)
**Organization:** P31 Labs, Inc. — 501(c)(3) tax-exempt Georgia Domestic Nonprofit (EIN 42-1888158)

## Abstract

P31 Labs builds the open-source bridge software between the $470B informal care economy and GNU Taler. We do not act as a financial custodian. Instead, we provide a lightweight, local-first ledger that enables privacy-preserving micro-payments for care work (executive function support, emotional labour, household tasks) entirely within the family perimeter. This project validates the integration of Taler with our Sovereign Stack, ensuring that care compensation does not rely on predatory data-harvesting.

## Compare with Existing / Historical Efforts

| Approach | Model | Privacy | Court-Admissible? | P31 Differentiator |
|----------|-------|---------|-------------------|-------------------|
| PayPal / Ko-fi / GoFundMe | Full financial surveillance | No | No (receipts only) | — |
| Cryptocurrency (BTC/ETH) | Public ledger | No (pseudonymous) | No (no custody chain) | — |
| x402 (Linux Foundation) | HTTP-402 stablecoin payments | No (settlement visible) | No (API billing) | P31 uses x402 for API/MCP billing, not care flows |
| GNU Taler (reference) | Blind signatures | Yes | No (no care accounting) | — |
| **LOVE-Ledger + Taler** | **Blind signatures + hash chains** | **Yes** | **Yes (E-IDAS 2.0)** | **Combines Taler privacy with care-admissible accounting** |

Existing care compensation runs through PayPal/Ko-fi (full financial surveillance), GoFundMe (platform-custodial), or volatile crypto. GNU Taler provides buyer anonymity + merchant transparency + near-zero fees but ships only a reference merchant/Exchange stack. **LOVE-Ledger is the missing non-custodial bridge** that embeds Taler in the PHOS family mesh and cognitive-prosthetic layer — keeping settlement outside P31's perimeter to avoid custodial triggers.

## Significant Technical Challenges

1. **Operating a Taler merchant backend without becoming a money transmitter** — P31 is a 501(c)(3) nonprofit; the Taler integration is structured as a care-grant/donation path, not a commercial exchange. Legal review in progress.
2. **Bridging Taler to a local-first, often-offline PHOS mesh** — the LOVE-Ledger worker (`love-ledger.p31ca.org`) acts as the Taler merchant adapter, caching transactions and syncing when connectivity returns.
3. **Reconciling Taler's merchant transparency with family-perimeter privacy** — Taler merchants see amount/date but not payer identity; the LOVE-Ledger hash-chain layer proves care occurred without exposing its emotional content.
4. **'Send LOVE' UX at spoon-level 0** — the Cognitive Passport engine adapts UI by spoon level; at spoon 0 it reduces to a single zero-friction "Send LOVE" button.

## Ecosystem & Engagement

- **GNU Taler community** — P31 operates a deployed Taler bridge (`taler-exchange-bridge`, wired to `exchange.demo.taler.net`) and the `taler-bridge-billing` worker. Code is open-source and contributes back to the Taler ecosystem.
- **NLnet / NGI TALER** — submitted to the current TALER open call; P31 is an active participant in the Taler community.
- **Care-economy orgs** — joint application with Stimpunks Foundation (in-repo `stimpunks-application.md`); networks include neurodivergent advocacy groups and family-court support contexts.
- **Neurodivergent advocacy & open-source community** — 22 Zenodo papers, 7 production sites, ORCID 0009-0002-2492-9079; all code MIT-licensed at `github.com/p31labs/P31-local-workspace`.

## Architecture

PHOS Family Mesh → LOVE-Ledger Module (Open-Source Bridge) → Taler Merchant Backend → Taler Wallet → Banking settlement.

*Note: P31 Labs develops the non-custodial bridge software, not the financial settlement layer, avoiding custodial regulatory triggers.*

## Our Live Footprint (Verified)

- 7 production Cloudflare Pages sites
- 8+ active Workers (from a fleet of 30 unique Workers)
- 22 functional cognitive surfaces
- Core BONDING engine: 95 passing automated tests
- Real-time health score: 16/20

## Why P31 Labs

The L.O.V.E. protocol was born in the crucible of managing disability, a complex family court case, and a household with zero income. Bank transfers are invasive and informal arrangements create burnout. We understand firsthand that caregivers need frictionless, privacy-preserving micro-payments that do not rely on predatory data-harvesting or financial surveillance.

## Budget

| Category | Amount |
|----------|--------|
| Engineering (Taler integration, local ledger) | €8,000 |
| Documentation & Open-Source Commons | €3,000 |
| Community Engagement & Support | €2,000 |
| Legal & Compliance | €2,000 |
| **Total** | **€15,000** |

*Rates: ~€60/hour estimated (below commercial rates); all work performed by P31 Labs employees.*

## Generative AI Disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting. All technical content was directed and reviewed by William R. Johnson based on P31 Labs' existing L.O.V.E. protocol and family mesh infrastructure. A full prompt provenance log is maintained at `docs/grants/prompt-provenance-log.md`.

## Supporting Evidence (Verified Open-Access Portfolio)

- **Paper XII — The Sovereign Stack: Open-Source Hardware–Software Architecture for Neurodivergent Assistive Technology** — `10.5281/zenodo.19782969` (published 2026-04-26; v2 with corrected live metrics in progress). Directly underpins the LOVE-Ledger hash-chain and Taler bridge.
- **The Tetrahedron Protocol: A Grand Unified Theory of Structural Resilience** — `10.5281/zenodo.19004485` (2026-01-26, v2)
- **P31 Labs Genesis Whitepaper** — `10.5281/zenodo.19411363` (2026-04-04, v1)
- Full portfolio: 22 open-access Zenodo deposits under ORCID 0009-0002-2492-9079
