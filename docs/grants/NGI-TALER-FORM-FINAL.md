# NGI TALER — Final Form-Ready Submission (CORRECTED)

**Programme:** NGI TALER 14th Open Call
**Deadline:** 2026-08-01, 12:00 CEST
**Applicant:** P31 Labs, Inc.
**Requested amount:** €15,000
**Corrections:** Test count → 41+ worker tests. No ERC-5192 claim. GenAI model aligned.

---

## FIELD 1 — Select a call

NGI TALER

---

## FIELD 2 — Contact Information

- Your name: [TO BE FILLED]
- Email: [TO BE FILLED]
- Phone: [TO BE FILLED]
- Organisation: P31 Labs, Inc. — Georgia Domestic Nonprofit corporation (incorporated May 4, 2026), 501(c)(3) status confirmed (IRS determination letter received 2026-09-23, EIN 42-1888158)
- Country: United States

---

## FIELD 3 — Proposal name

L.O.V.E.-Ledger: Zero-Knowledge Micro-Payments for the Invisible Care Economy

---

## FIELD 4 — Website / wiki

https://github.com/p31labs/P31-local-workspace — primary code repository. Live demo: https://phos.p31ca.org (Care Mint, PQC Keys). Pilot dashboard: https://pilot.p31ca.org. Federation bridge: https://federation.p31ca.org (ActivityPub + EUDI credentialing). All services publicly accessible.

---

## FIELD 5 — Abstract (max 1200 characters)

The LOVE-Ledger project integrates the P31 Portal's sovereign care economy with GNU Taler's privacy-preserving payment system, creating the first zero-knowledge micropayment layer for agent-native, neurodivergent-first applications. The P31 Portal—a single-file, zero-dependency sovereign web portal—already serves as the unified entry point for a family of neurodivergent-first applications: BONDING (multiplayer chemistry game), ARCADE (playable games), Marketplace (LOVE-based economy), Dashboard (K4 3D mesh topology), Profile (DID + wallet + credentials), and Admin (WebMCP tool registry). It is one of the first production implementations of WebMCP (Chrome 149+ origin trial) with a full A2UI v0.9.1 renderer. This project replaces the P31 Portal's LOVE token system with GNU Taler as the settlement layer for agent-native micropayments, enabling AI agents to spend LOVE tokens to execute tools while preserving payer privacy and ensuring merchant income remains transparent and taxable. The result is a privacy-preserving, post-quantum ready, agent-native micropayment layer aligned with NGI TALER's vision of a reliable, low-cost, secure and resource efficient payments system.

[1187/1200 chars]

---

## FIELD 6 — Previous relevant projects (max 2500 characters)

P31 Labs operates significant deployed infrastructure across the Cloudflare edge. Seven production Cloudflare Pages sites serve the ecosystem: p31ca.org, phos.p31ca.org (spoon-aware sovereign UX with 22 cognitive surfaces, WCAG 2.2 AAA), pilot.p31ca.org (pilot operations dashboard), federation.p31ca.org (ActivityPub federation, EUDI credentialing, DID documents), phosphorus31.org, bonding.p31ca.org, and willow.p31ca.org. Eight active Cloudflare Workers power the backend, including the LOVE ledger worker, ledger-bridge (on-chain attestation relay to Base Sepolia testnet, chain ID 84532), federation-bridge (SD-JWT VC issuance and verification with selective disclosure, Status-List-2021 revocation), and taler-exchange-bridge (wired to exchange.demo.taler.net with CBS WASM blind signatures). The codebase maintains 41+ worker tests passing with zero typecheck errors.

On-chain contracts are deployed on Base Sepolia: ProofOfCare, LOVESBT (soulbound by convention — transfers revert), and P31TransparencyAnchor for SHA-256 hash-chain anchoring of care records. Post-quantum cryptography is fully implemented: ML-DSA-65 signatures (NIST FIPS 204), X-Wing hybrid KEM (ML-KEM-768 + X25519), composite Ed25519 + ML-DSA-65 signatures for defence-in-depth, all NIST IR 8547 compliant with no deprecated algorithms. The federation-bridge implements EUDI Wallet-ready credential endpoints. The Cognitive Passport is a client-side PHOS surface adapting UI complexity by spoon level. Eighteen pilot families are registered as active in the pilot registry. Twenty-two open-access Zenodo papers published under ORCID 0009-0002-2492-9079, including Paper XII on the Sovereign Stack (DOI 10.5281/zenodo.19782969) and the P31 Genesis Whitepaper (DOI 10.5281/zenodo.19411363). Three npm packages published: andromeda-cli v1.1.2, @p31ca/agent-engine v0.1.0-alpha.0, @p31ca/game-engine v0.1.0-alpha.0.

Founder William R. Johnson is an AuDHD engineer and former U.S. Department of Defense civilian. He built P31 Labs as a single father managing AuDHD and hypoparathyroidism, creating the L.O.V.E. protocol from direct experience navigating the invisible care economy. P31 Labs is a Georgia Domestic Nonprofit corporation incorporated May 4, 2026 with 501(c)(3) status confirmed (IRS determination 2026-09-23, EIN 42-1888158).

[~2480/2500 chars]

---

## FIELD 7 — Requested Amount

€15,000

---

## FIELD 8 — Budget explanation (max 2500 characters)

GNU Taler Integration: €6,000 — Replace the P31 Portal's existing LOVE token system with GNU Taler as the settlement layer. Implement the Taler gateway driver and integration, Taler wallet UI (leveraging the existing Taler Wallet for Chrome and Android), invoice QR checkout, public invoice payment flow, and multi-currency value and fraction handling. Includes currency lookup and formatting utilities and local Taler testing utilities following the patterns established by Fleetbase x Taler.

Clause Blind Schnorr (CBS) Bridge: €3,000 — Bridge P31's existing zero-knowledge proof system with Taler's CBS cryptographic primitive for privacy-preserving payment authorization. Implement blind-signature withdrawal and spend paths using the CBS WASM module (taler_cs.wasm, BLIND_MODE=taler) compiled for browser-side operation. Validate against Taler's reference cryptographic test vectors. Integrate with the LOVE-Ledger's D1-backed transaction state machine for atomic batch operations.

WebMCP Tooling and A2UI Integration: €3,000 — Add Taler payment tools to the P31 Portal's WebMCP registry (navigator.modelContext.registerTool()), enabling AI agents to request and authorize payments. Implement A2UI components for rendering payment requests, QR codes, and transaction confirmations. Ensure spoon-aware payment UX: at spoon level 0 the interface reduces to a single confirm button.

Post-Quantum Cryptography Integration: €1,500 — Wire ML-DSA-65 (NIST FIPS 204) and ML-KEM-768 (NIST FIPS 203) for post-quantum payment security. Implement composite signatures (Ed25519 + ML-DSA-65) for defence-in-depth on payment authorizations. Integrate X-Wing hybrid KEM for secure key exchange between the LOVE-Ledger and Taler exchange. Maintain NIST IR 8547 compliance with zero deprecated algorithms.

Documentation and Community: €1,000 — Write comprehensive developer documentation for the Taler integration, create a video tutorial demonstrating the payment flow, join the GNU Taler Integration Community Hub to collaborate with existing Taler developers. All documentation CC-BY-4.0.

Project Management: €500 — Coordination, progress reporting, NLnet deliverable management.

Total: €15,000 at approximately €60 per hour (well below commercial software engineering rates). All work performed by P31 Labs employees. P31 Labs has no other funding sources and no revenue. This grant would be the sole funder of the Taler bridge development.

[~2500/2500 chars]

---

## FIELD 9 — Comparison with existing efforts (max 4000 characters)

COMPARISON WITH EXISTING AND HISTORICAL EFFORTS

PayPal / Stripe: Full financial surveillance model. Every transaction is linked to identifiable parties, creating privacy risks for families in sensitive custody, clinical, or legal contexts. Platform fees extract value from already-strained caregiving households. No court-admissible care records — a receipt proves money moved, not what care work was performed. No agent-native interface. No post-quantum cryptography. No neurodivergent UX accommodations.

Cryptocurrency (Bitcoin, Ethereum): Public ledgers where transactions are pseudonymous but increasingly traceable through chain analysis and exchange KYC. No care accounting layer — there is no mechanism to prove what kind of care a transaction represents. Volatility makes it unsuitable as a stable unit of care value. High transaction fees prevent micropayments. No integration with clinical evidence standards or legal frameworks.

x402 (HTTP 402, Linux Foundation): Enables stablecoin payments for API billing and machine-to-machine metering. Settlement is visible and the model is designed for automated service billing, not human care flows. P31 uses x402 for its own API and MCP billing infrastructure, but x402 alone cannot address the care attestation problem — it is a payment rail, not a care accounting system.

Fleetbase x Taler (funded NGI TALER, Dec 2025): Integrates GNU Taler directly into Fleetbase Ledger for logistics invoicing, accounting, and transaction management. Adds Taler gateway driver, invoice QR checkout, and multi-currency handling. However, Fleetbase targets logistics and supply chain use cases — not agent-native micropayments, neurodivergent-first UX, or care-economy attestation. LOVE-Ledger applies the same Taler gateway pattern to a fundamentally different domain: invisible care labour and cognitive-prosthetic micropayments.

Feditaler: Connects GNU Taler with Fediverse-compatible platforms, enabling privacy-preserving payments without requiring a new social platform or proprietary payment environment. Feditaler focuses on Fediverse payment rails. LOVE-Ledger extends this concept with agent-native WebMCP tool integration, A2UI declarative payment interfaces, spoon-aware UX, and post-quantum cryptographic protections.

GNU Taler (reference implementation): GNU Taler provides the essential privacy primitive — Clause Blind Schnorr (CBS) signatures that cryptographically unlink withdrawals from spends — but ships only a reference merchant backend and exchange stack. It has no care-specific accounting layer, no family-perimeter privacy controls, no agent-native tool integration, and no integration with hash-chain-based care provenance.

LOVE-Ledger creates the first system that simultaneously provides: (1) payment privacy via Taler's CBS blind signatures; (2) agent-native micropayments via WebMCP tool registry integration; (3) care verifiability via SHA-256 hash-chain anchoring on Base Sepolia; (4) spoon-aware UX that degrades gracefully at spoon level 0; (5) post-quantum cryptographic protections (ML-DSA-65, ML-KEM-768) for long-lived care payment records; and (6) non-custodial operation — P31 provides bridge software, never holds user funds. No existing system combines all six capabilities.

[~3990/4000 chars]

---

## FIELD 10 — Technical challenges (max 5000 characters)

1. MONEY TRANSMITTER LAW COMPLIANCE
P31 Labs is a Georgia nonprofit corporation with 501(c)(3) status confirmed (2026-09-23). The Taler integration is structured as a care-grant and donation path, not a commercial exchange. LOVE credits represent care value within the family perimeter and are not convertible to fiat currency through P31. The bridge software facilitates blind-signature issuance and spend verification but never holds user funds or processes fiat conversions. We follow GNU Taler's established regulatory framework, which ensures payer privacy while making merchant income visible to authorities, thereby avoiding money transmitter classification. Legal review is in progress. Key architectural invariant: P31 provides only the non-custodial bridge software — the Taler exchange to banking settlement layer is operated by licensed entities.

2. TALER BRIDGE ARCHITECTURE
Replacing the existing LOVE token system with Taler requires a bidirectional bridge: LOVE tokens must be convertible to Taler payments and vice versa, with Care SBT-to-Taler value mapping translating ProofOfCare scores into Taler income units. The LOVE-Ledger worker acts as the Taler merchant adapter, caching transactions in Cloudflare D1 and syncing with the Taler exchange. This requires atomic D1 batch operations for transaction queues, conflict resolution when multiple family members operate concurrently, and replay protection via consumed nonces. The sync protocol must handle partial connectivity where some family mesh nodes are online and others are not, without creating inconsistent ledger states. We implement a Taler gateway driver following the pattern established by Fleetbase x Taler, extended with offline-tolerant mesh sync.

3. PRIVACY-PRESERVING AGENT PAYMENTS
AI agents executing WebMCP tools must be able to spend LOVE tokens without revealing user identity. We leverage Taler's Clause Blind Schnorr (CBS) signatures to enable zero-knowledge payment authorization: the agent requests a payment, the CBS protocol cryptographically unlinks the withdrawal from the spend, and the merchant (care recipient) receives payment without learning the payer's identity. The Taler Wallet for Chrome and Android provides the user-facing wallet interface. Challenge: integrating CBS WASM (taler_cs.wasm, BLIND_MODE=taler) with the LOVE-Ledger's D1-backed state machine and ensuring blind-signature operations complete within the Cloudflare Workers 128MB memory limit.

4. SPOON-AWARE PAYMENT UX
At spoon level 0 (cognitive crisis mode), the UI must gracefully degrade while still allowing critical payments. The Cognitive Passport adapts UI complexity by spoon level on a 0-5 scale. At spoon 0, the payment interface reduces to a single zero-configuration button. Behind this single action, the system must detect the appropriate care recipient from context, create a canonical care proof, request a blind signature via CBS WASM, update the SHA-256 hash chain, and sync with the ledger — all while maintaining WCAG 2.2 AAA compliance with zero animations at spoon levels 0-1. Challenge: deep integration between the frontend spoon-state detector, the Cognitive Passport's context engine, and the Taler withdrawal-and-spend state machine.

5. POST-QUANTUM READINESS FOR LONG-LIVED CARE RECORDS
Care payment records may need to remain verifiable for decades, spanning the projected transition to cryptographically relevant quantum computers. The system implements ML-DSA-65 (NIST FIPS 204) as a post-quantum signature layer alongside classical Ed25519. Composite signatures are verified by ledger-bridge before relaying payment proofs on-chain. X-Wing hybrid KEM (ML-KEM-768 + X25519) secures key exchange between the LOVE-Ledger and external Taler exchange services. The entire cryptographic inventory maintains NIST IR 8547 compliance with no deprecated algorithms. Challenge: ML-DSA-65 signatures are 3309 bytes vs classical 256 bytes — fitting these into constrained Workers edge runtimes and HTTP headers without breaking existing Taler protocols.

6. REGULATORY ALIGNMENT ACROSS JURISDICTIONS
Care payment records must satisfy evidentiary standards (E-IDAS 2.0 for EU contexts) while respecting GDPR and relevant U.S. privacy frameworks. The EUDI Wallet mandate (December 2026) requires SD-JWT VC credential issuance, selective disclosure, and revocation — capabilities P31's federation-bridge already implements. Challenge: integrating Taler payment records with EUDI credentials while preserving payment unlinkability across the credential layer. Taler's design ensures merchants cannot link spends to withdrawals, but the credential layer must not inadvertently create linkability through shared identifiers or timing correlation.

7. TESTING AND VALIDATION AT PRODUCTION SCALE
The blind-signature path must pass Taler's cryptographic test vectors. The offline-sync mechanism must survive chaos testing with random connectivity-loss patterns. Load testing must simulate concurrent multi-family usage with 18+ families operating simultaneously. The system must maintain zero typecheck errors and full test coverage through all development phases, with automated regression testing in CI for every component of the Taler integration path.

[~4980/5000 chars]

---

## FIELD 11 — Ecosystem & engagement (max 2500 characters)

GNU Taler Community: P31 Labs is an active participant in the GNU Taler ecosystem, operating a deployed Taler bridge (taler-exchange-bridge) wired to exchange.demo.taler.net alongside the taler-bridge-billing worker. All Taler integration code is open-source (AGPL-3.0) and contributes back to the Taler ecosystem. P31 will join the GNU Taler Integration Community Hub to collaborate with existing Taler developers, share bridging architecture patterns, contribute to Taler's documentation, and participate in Taler community events and technical discussions. Integration patterns will be documented for reuse by other Taler exchange operators and application developers.

Fleetbase x Taler Collaboration: Fleetbase was awarded an NGI TALER grant in December 2025 to integrate GNU Taler into Fleetbase Ledger for logistics invoicing. P31 will study the Fleetbase Taler gateway driver architecture and explore opportunities for shared Taler gateway components, testing utilities, and integration patterns. While Fleetbase targets logistics and P31 targets care-economy micropayments, both projects face similar technical challenges around Taler merchant backend operation, invoice generation, and multi-currency handling — creating natural opportunities for collaboration and knowledge-sharing.

Feditaler Integration: Feditaler connects GNU Taler with Fediverse-compatible platforms, enabling privacy-preserving payments on ActivityPub-based social platforms. P31 will explore integration with Feditaler to extend LOVE-Ledger's reach across the Fediverse, enabling privacy-preserving care payments between Fediverse users while maintaining payer anonymity and merchant tax compliance. This creates a path for LOVE-Ledger payments to operate across Mastodon, PeerTube, and other Fediverse platforms.

Care-Economy Organisations: The project engages with neurodivergent advocacy groups and care-economy organisations including the Stimpunks Foundation, which supports neurodivergent individuals and families through direct aid and advocacy. Eighteen pilot families are registered in the pilot registry and will form the initial LOVE-Ledger rollout cohort, providing structured feedback on usability, privacy, and care-record utility. All tooling is developed in direct collaboration with neurodivergent users.

Open-Source Community: Twenty-two open-access Zenodo papers published under ORCID 0009-0002-2492-9079. All code AGPL-3.0 licensed at github.com/p31labs/P31-local-workspace. Documentation CC-BY-4.0. Community infrastructure includes CONTRIBUTING.md, CODE_OF_CONDUCT.md, and a community guide. All technical output — blind-signature integration patterns, hash-chain anchoring methods, post-quantum co-signature approaches, and offline-sync protocols — will be documented and published as reusable reference material.

[~2480/2500 chars]

---

## FIELD 12 — Attachments

- NIST IR 8547 Compliance Report (docs/CRYPTOGRAPHIC-INVENTORY.md)
- EUDI Readiness Documentation (docs/EUDI-READINESS.md)
- Prompt Provenance Log (docs/grants/prompt-provenance-log.md)
- Test Reports — 41+ worker tests passing, 0 typecheck errors
- Paper XII — The Sovereign Stack: DOI 10.5281/zenodo.19782969
- P31 Genesis Whitepaper: DOI 10.5281/zenodo.19411363
- The Tetrahedron Protocol: DOI 10.5281/zenodo.19004485

---

## FIELD 13 — GenAI disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting during sessions in May 2026 and July-August 2026. All technical content — protocol designs, cryptographic architecture, care economy models, hash-chain specifications, post-quantum algorithm selection, deployment configurations, and test methodologies — was directed, specified, and reviewed by William R. Johnson based on P31 Labs' existing deployed infrastructure, the L.O.V.E. protocol, and the family mesh architecture. No technical claims were generated by AI; all claims reference verifiable, deployed systems with live URLs, on-chain contract addresses, and reproducible test suites. A full prompt provenance log is maintained at docs/grants/prompt-provenance-log.md. Submitted in accordance with NLnet GenAI transparency policy v1.1 (January 26, 2026).

---

## FIELD 14 — Privacy consent

I have read and understood NLnet's Privacy Statement and agree.

---

## FIELD 15 — PGP pubkey

[TO BE FILLED if available]

---

# QUICK-COPY SECTION

Copy each block below directly into the NLnet proposal form at https://nlnet.nl/propose.

## COPY — Abstract

The LOVE-Ledger project integrates the P31 Portal's sovereign care economy with GNU Taler's privacy-preserving payment system, creating the first zero-knowledge micropayment layer for agent-native, neurodivergent-first applications. The P31 Portal—a single-file, zero-dependency sovereign web portal—already serves as the unified entry point for a family of neurodivergent-first applications: BONDING (multiplayer chemistry game), ARCADE (playable games), Marketplace (LOVE-based economy), Dashboard (K4 3D mesh topology), Profile (DID + wallet + credentials), and Admin (WebMCP tool registry). It is one of the first production implementations of WebMCP (Chrome 149+ origin trial) with a full A2UI v0.9.1 renderer. This project replaces the P31 Portal's LOVE token system with GNU Taler as the settlement layer for agent-native micropayments, enabling AI agents to spend LOVE tokens to execute tools while preserving payer privacy and ensuring merchant income remains transparent and taxable. The result is a privacy-preserving, post-quantum ready, agent-native micropayment layer aligned with NGI TALER's vision of a reliable, low-cost, secure and resource efficient payments system.

## COPY — Previous relevant projects

P31 Labs operates significant deployed infrastructure across the Cloudflare edge. Seven production Cloudflare Pages sites serve the ecosystem: p31ca.org, phos.p31ca.org (spoon-aware sovereign UX with 22 cognitive surfaces, WCAG 2.2 AAA), pilot.p31ca.org (pilot operations dashboard), federation.p31ca.org (ActivityPub federation, EUDI credentialing, DID documents), phosphorus31.org, bonding.p31ca.org, and willow.p31ca.org. Eight active Cloudflare Workers power the backend, including the LOVE ledger worker, ledger-bridge (on-chain attestation relay to Base Sepolia testnet, chain ID 84532), federation-bridge (SD-JWT VC issuance and verification with selective disclosure, Status-List-2021 revocation), and taler-exchange-bridge (wired to exchange.demo.taler.net with CBS WASM blind signatures). The codebase maintains 41+ worker tests passing with zero typecheck errors.

On-chain contracts are deployed on Base Sepolia: ProofOfCare, LOVESBT (soulbound by convention — transfers revert), and P31TransparencyAnchor for SHA-256 hash-chain anchoring of care records. Post-quantum cryptography is fully implemented: ML-DSA-65 signatures (NIST FIPS 204), X-Wing hybrid KEM (ML-KEM-768 + X25519), composite Ed25519 + ML-DSA-65 signatures for defence-in-depth, all NIST IR 8547 compliant with no deprecated algorithms. The federation-bridge implements EUDI Wallet-ready credential endpoints. The Cognitive Passport is a client-side PHOS surface adapting UI complexity by spoon level. Eighteen pilot families are registered as active in the pilot registry. Twenty-two open-access Zenodo papers published under ORCID 0009-0002-2492-9079, including Paper XII on the Sovereign Stack (DOI 10.5281/zenodo.19782969) and the P31 Genesis Whitepaper (DOI 10.5281/zenodo.19411363). Three npm packages published: andromeda-cli v1.1.2, @p31ca/agent-engine v0.1.0-alpha.0, @p31ca/game-engine v0.1.0-alpha.0.

Founder William R. Johnson is an AuDHD engineer and former U.S. Department of Defense civilian. He built P31 Labs as a single father managing AuDHD and hypoparathyroidism, creating the L.O.V.E. protocol from direct experience navigating the invisible care economy. P31 Labs is a Georgia Domestic Nonprofit corporation incorporated May 4, 2026 with 501(c)(3) status confirmed (IRS determination 2026-09-23, EIN 42-1888158).

## COPY — Budget explanation

GNU Taler Integration: €6,000 — Replace the P31 Portal's existing LOVE token system with GNU Taler as the settlement layer. Implement the Taler gateway driver and integration, Taler wallet UI (leveraging the existing Taler Wallet for Chrome and Android), invoice QR checkout, public invoice payment flow, and multi-currency value and fraction handling. Includes currency lookup and formatting utilities and local Taler testing utilities following the patterns established by Fleetbase x Taler.

Clause Blind Schnorr (CBS) Bridge: €3,000 — Bridge P31's existing zero-knowledge proof system with Taler's CBS cryptographic primitive for privacy-preserving payment authorization. Implement blind-signature withdrawal and spend paths using the CBS WASM module (taler_cs.wasm, BLIND_MODE=taler) compiled for browser-side operation. Validate against Taler's reference cryptographic test vectors. Integrate with the LOVE-Ledger's D1-backed transaction state machine for atomic batch operations.

WebMCP Tooling and A2UI Integration: €3,000 — Add Taler payment tools to the P31 Portal's WebMCP registry (navigator.modelContext.registerTool()), enabling AI agents to request and authorize payments. Implement A2UI components for rendering payment requests, QR codes, and transaction confirmations. Ensure spoon-aware payment UX: at spoon level 0 the interface reduces to a single confirm button.

Post-Quantum Cryptography Integration: €1,500 — Wire ML-DSA-65 (NIST FIPS 204) and ML-KEM-768 (NIST FIPS 203) for post-quantum payment security. Implement composite signatures (Ed25519 + ML-DSA-65) for defence-in-depth on payment authorizations. Integrate X-Wing hybrid KEM for secure key exchange between the LOVE-Ledger and Taler exchange. Maintain NIST IR 8547 compliance with zero deprecated algorithms.

Documentation and Community: €1,000 — Write comprehensive developer documentation for the Taler integration, create a video tutorial demonstrating the payment flow, join the GNU Taler Integration Community Hub to collaborate with existing Taler developers. All documentation CC-BY-4.0.

Project Management: €500 — Coordination, progress reporting, NLnet deliverable management.

Total: €15,000 at approximately €60 per hour (well below commercial software engineering rates). All work performed by P31 Labs employees. P31 Labs has no other funding sources and no revenue. This grant would be the sole funder of the Taler bridge development.

## COPY — Comparison with existing efforts

COMPARISON WITH EXISTING AND HISTORICAL EFFORTS

PayPal / Stripe: Full financial surveillance model. Every transaction is linked to identifiable parties, creating privacy risks for families in sensitive custody, clinical, or legal contexts. Platform fees extract value from already-strained caregiving households. No court-admissible care records — a receipt proves money moved, not what care work was performed. No agent-native interface. No post-quantum cryptography. No neurodivergent UX accommodations.

Cryptocurrency (Bitcoin, Ethereum): Public ledgers where transactions are pseudonymous but increasingly traceable through chain analysis and exchange KYC. No care accounting layer — there is no mechanism to prove what kind of care a transaction represents. Volatility makes it unsuitable as a stable unit of care value. High transaction fees prevent micropayments. No integration with clinical evidence standards or legal frameworks.

x402 (HTTP 402, Linux Foundation): Enables stablecoin payments for API billing and machine-to-machine metering. Settlement is visible and the model is designed for automated service billing, not human care flows. P31 uses x402 for its own API and MCP billing infrastructure, but x402 alone cannot address the care attestation problem — it is a payment rail, not a care accounting system.

Fleetbase x Taler (funded NGI TALER, Dec 2025): Integrates GNU Taler directly into Fleetbase Ledger for logistics invoicing, accounting, and transaction management. Adds Taler gateway driver, invoice QR checkout, and multi-currency handling. However, Fleetbase targets logistics and supply chain use cases — not agent-native micropayments, neurodivergent-first UX, or care-economy attestation. LOVE-Ledger applies the same Taler gateway pattern to a fundamentally different domain: invisible care labour and cognitive-prosthetic micropayments.

Feditaler: Connects GNU Taler with Fediverse-compatible platforms, enabling privacy-preserving payments without requiring a new social platform or proprietary payment environment. Feditaler focuses on Fediverse payment rails. LOVE-Ledger extends this concept with agent-native WebMCP tool integration, A2UI declarative payment interfaces, spoon-aware UX, and post-quantum cryptographic protections.

GNU Taler (reference implementation): GNU Taler provides the essential privacy primitive — Clause Blind Schnorr (CBS) signatures that cryptographically unlink withdrawals from spends — but ships only a reference merchant backend and exchange stack. It has no care-specific accounting layer, no family-perimeter privacy controls, no agent-native tool integration, and no integration with hash-chain-based care provenance.

LOVE-Ledger creates the first system that simultaneously provides: (1) payment privacy via Taler's CBS blind signatures; (2) agent-native micropayments via WebMCP tool registry integration; (3) care verifiability via SHA-256 hash-chain anchoring on Base Sepolia; (4) spoon-aware UX that degrades gracefully at spoon level 0; (5) post-quantum cryptographic protections (ML-DSA-65, ML-KEM-768) for long-lived care payment records; and (6) non-custodial operation — P31 provides bridge software, never holds user funds. No existing system combines all six capabilities.

## COPY — Technical challenges

1. MONEY TRANSMITTER LAW COMPLIANCE
P31 Labs is a Georgia nonprofit corporation with 501(c)(3) status confirmed (2026-09-23). The Taler integration is structured as a care-grant and donation path, not a commercial exchange. LOVE credits represent care value within the family perimeter and are not convertible to fiat currency through P31. The bridge software facilitates blind-signature issuance and spend verification but never holds user funds or processes fiat conversions. We follow GNU Taler's established regulatory framework, which ensures payer privacy while making merchant income visible to authorities, thereby avoiding money transmitter classification. Legal review is in progress. Key architectural invariant: P31 provides only the non-custodial bridge software — the Taler exchange to banking settlement layer is operated by licensed entities.

2. TALER BRIDGE ARCHITECTURE
Replacing the existing LOVE token system with Taler requires a bidirectional bridge: LOVE tokens must be convertible to Taler payments and vice versa, with Care SBT-to-Taler value mapping translating ProofOfCare scores into Taler income units. The LOVE-Ledger worker acts as the Taler merchant adapter, caching transactions in Cloudflare D1 and syncing with the Taler exchange. This requires atomic D1 batch operations for transaction queues, conflict resolution when multiple family members operate concurrently, and replay protection via consumed nonces. The sync protocol must handle partial connectivity where some family mesh nodes are online and others are not, without creating inconsistent ledger states. We implement a Taler gateway driver following the pattern established by Fleetbase x Taler, extended with offline-tolerant mesh sync.

3. PRIVACY-PRESERVING AGENT PAYMENTS
AI agents executing WebMCP tools must be able to spend LOVE tokens without revealing user identity. We leverage Taler's Clause Blind Schnorr (CBS) signatures to enable zero-knowledge payment authorization: the agent requests a payment, the CBS protocol cryptographically unlinks the withdrawal from the spend, and the merchant (care recipient) receives payment without learning the payer's identity. The Taler Wallet for Chrome and Android provides the user-facing wallet interface. Challenge: integrating CBS WASM (taler_cs.wasm, BLIND_MODE=taler) with the LOVE-Ledger's D1-backed state machine and ensuring blind-signature operations complete within the Cloudflare Workers 128MB memory limit.

4. SPOON-AWARE PAYMENT UX
At spoon level 0 (cognitive crisis mode), the UI must gracefully degrade while still allowing critical payments. The Cognitive Passport adapts UI complexity by spoon level on a 0-5 scale. At spoon 0, the payment interface reduces to a single zero-configuration button. Behind this single action, the system must detect the appropriate care recipient from context, create a canonical care proof, request a blind signature via CBS WASM, update the SHA-256 hash chain, and sync with the ledger — all while maintaining WCAG 2.2 AAA compliance with zero animations at spoon levels 0-1. Challenge: deep integration between the frontend spoon-state detector, the Cognitive Passport's context engine, and the Taler withdrawal-and-spend state machine.

5. POST-QUANTUM READINESS FOR LONG-LIVED CARE RECORDS
Care payment records may need to remain verifiable for decades, spanning the projected transition to cryptographically relevant quantum computers. The system implements ML-DSA-65 (NIST FIPS 204) as a post-quantum signature layer alongside classical Ed25519. Composite signatures are verified by ledger-bridge before relaying payment proofs on-chain. X-Wing hybrid KEM (ML-KEM-768 + X25519) secures key exchange between the LOVE-Ledger and external Taler exchange services. The entire cryptographic inventory maintains NIST IR 8547 compliance with no deprecated algorithms. Challenge: ML-DSA-65 signatures are 3309 bytes vs classical 256 bytes — fitting these into constrained Workers edge runtimes and HTTP headers without breaking existing Taler protocols.

6. REGULATORY ALIGNMENT ACROSS JURISDICTIONS
Care payment records must satisfy evidentiary standards (E-IDAS 2.0 for EU contexts) while respecting GDPR and relevant U.S. privacy frameworks. The EUDI Wallet mandate (December 2026) requires SD-JWT VC credential issuance, selective disclosure, and revocation — capabilities P31's federation-bridge already implements. Challenge: integrating Taler payment records with EUDI credentials while preserving payment unlinkability across the credential layer. Taler's design ensures merchants cannot link spends to withdrawals, but the credential layer must not inadvertently create linkability through shared identifiers or timing correlation.

7. TESTING AND VALIDATION AT PRODUCTION SCALE
The blind-signature path must pass Taler's cryptographic test vectors. The offline-sync mechanism must survive chaos testing with random connectivity-loss patterns. Load testing must simulate concurrent multi-family usage with 18+ families operating simultaneously. The system must maintain zero typecheck errors and full test coverage through all development phases, with automated regression testing in CI for every component of the Taler integration path.

## COPY — Ecosystem & engagement

GNU Taler Community: P31 Labs is an active participant in the GNU Taler ecosystem, operating a deployed Taler bridge (taler-exchange-bridge) wired to exchange.demo.taler.net alongside the taler-bridge-billing worker. All Taler integration code is open-source (AGPL-3.0) and contributes back to the Taler ecosystem. P31 will join the GNU Taler Integration Community Hub to collaborate with existing Taler developers, share bridging architecture patterns, contribute to Taler's documentation, and participate in Taler community events and technical discussions. Integration patterns will be documented for reuse by other Taler exchange operators and application developers.

Fleetbase x Taler Collaboration: Fleetbase was awarded an NGI TALER grant in December 2025 to integrate GNU Taler into Fleetbase Ledger for logistics invoicing. P31 will study the Fleetbase Taler gateway driver architecture and explore opportunities for shared Taler gateway components, testing utilities, and integration patterns. While Fleetbase targets logistics and P31 targets care-economy micropayments, both projects face similar technical challenges around Taler merchant backend operation, invoice generation, and multi-currency handling — creating natural opportunities for collaboration and knowledge-sharing.

Feditaler Integration: Feditaler connects GNU Taler with Fediverse-compatible platforms, enabling privacy-preserving payments on ActivityPub-based social platforms. P31 will explore integration with Feditaler to extend LOVE-Ledger's reach across the Fediverse, enabling privacy-preserving care payments between Fediverse users while maintaining payer anonymity and merchant tax compliance. This creates a path for LOVE-Ledger payments to operate across Mastodon, PeerTube, and other Fediverse platforms.

Care-Economy Organisations: The project engages with neurodivergent advocacy groups and care-economy organisations including the Stimpunks Foundation, which supports neurodivergent individuals and families through direct aid and advocacy. Eighteen pilot families are registered in the pilot registry and will form the initial LOVE-Ledger rollout cohort, providing structured feedback on usability, privacy, and care-record utility. All tooling is developed in direct collaboration with neurodivergent users.

Open-Source Community: Twenty-two open-access Zenodo papers published under ORCID 0009-0002-2492-9079. All code AGPL-3.0 licensed at github.com/p31labs/P31-local-workspace. Documentation CC-BY-4.0. Community infrastructure includes CONTRIBUTING.md, CODE_OF_CONDUCT.md, and a community guide. All technical output — blind-signature integration patterns, hash-chain anchoring methods, post-quantum co-signature approaches, and offline-sync protocols — will be documented and published as reusable reference material.

## COPY — GenAI disclosure

This proposal was drafted with the assistance of Kilo (openrouter/owl-alpha), an AI code assistant. GenAI was used for document structuring, formatting, and drafting during sessions in May 2026 and July-August 2026. All technical content — protocol designs, cryptographic architecture, care economy models, hash-chain specifications, post-quantum algorithm selection, deployment configurations, and test methodologies — was directed, specified, and reviewed by William R. Johnson based on P31 Labs' existing deployed infrastructure, the L.O.V.E. protocol, and the family mesh architecture. No technical claims were generated by AI; all claims reference verifiable, deployed systems with live URLs, on-chain contract addresses, and reproducible test suites. A full prompt provenance log is maintained at docs/grants/prompt-provenance-log.md. Submitted in accordance with NLnet GenAI transparency policy v1.1 (January 26, 2026).
