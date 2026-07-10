# NGI 2026 Grant Proposals — DRAFT

**Applicant:** P31 Labs (501(c)(3) pending; EIN 42-1888158)
**Total funding ask:** €40,000
**Submission deadline:** 1 August 2026
**Status:** Draft for internal calibration. All claims below are verifiably true as of this writing; Phase 2 items are roadmap, not delivered.

---

## (a) NGI TALER — 14th Open Call

**Project:** LOVE-Ledger — a court-admissible, privacy-respecting record of consent and value exchange.
**Funding ask:** €15,000

### Summary
LOVE-Ledger is a tamper-evident ledger for consent and value-exchange events, designed to give users a portable, verifiable proof trail that survives disputes. It underpins a creator-economy model where the platform takes zero fee (platformFee.rate === 0), keeping value with creators and users.

### What exists now (verifiable)
- **D1-backed ledger** with `prev_hash`/`entry_hash` columns forming a SHA-256 hash chain; chain integrity is externally auditable.
- **Read APIs:** `GET /chain` (full ordered hash chain) and `GET /export` (portable export) for court-admissible retrieval.
- **ERC-5192 compliance:** `LOVESBT.sol` implements `supportsInterface(0xb45a3c0e)` with `locked()` and the `Locked` event, marking consent/SBT records as soulbound and locked.
- **Cognitive Passport v4.1** schema with an audience matrix and Ed25519 / ML-DSA signing, providing the identity anchor the ledger binds events to.
- **Universal Interface Generator** (`@p31/interface-generator`) already integrated into PHOS, p31ca, bonding, and the `phos-forge` MCP tool, enabling spoon-aware UI via `data-spoons` (0–5) with a crisis mode at spoons 0 (breathing overlay only).

### Phase 2 roadmap (not yet delivered)
- WCAG 2.2 AAA pass (48px touch targets, skip-link, contrast pass).
- COGA implementation (simplification, progressive disclosure, user-controlled adaptation).
- A2UI / json-render alignment (declarative UI schema) and AttentionGuard-style behavioural adaptation.

### Relevance to NGI TALER
LOVE-Ledger directly serves TALER's privacy and user-sovereignty goals: zero-fee value exchange, cryptographic proof of consent, and a portable, court-admissible record that no single intermediary can rewrite. The hash-chain + SBT design keeps the user as the root of trust.

---

## (b) NGI Fediversity — 12th Open Call

**Project:** PHOS-Sovereign — a self-hostable, accessible sovereign interface layer for federated ecosystems.
**Funding ask:** €25,000

### Summary
PHOS-Sovereign extends the Universal Interface Generator into a deployable, sovereign front-end layer that any community can self-host, giving federated users a consistent, accessible, spoon-aware interface across services rather than fragmented per-app UIs.

### What exists now (verifiable)
- **Universal Interface Generator** (`@p31/interface-generator`) integrated into PHOS, p31ca, bonding, and the `phos-forge` MCP tool.
- **Spoon-aware UI** via `data-spoon` (0–5) with crisis mode at spoons 0 (breathing overlay only) — a concrete accessibility affordance for fluctuating capacity.
- **Cognitive Passport v4.1** schema + audience matrix + Ed25519 / ML-DSA signing for portable, signed user-context handoff across federated services.
- **ERC-5192 compliance:** `CognitivePassport.sol` implements `supportsInterface(0xb45a3c0e)` with `locked()` / `Locked`, so a user's passport record is soulbound and locked.
- **ERC-5192 + LOVE-Ledger linkage:** the same locked-SBT primitive secures both the passport and the ledger, giving a coherent trust model across the two NGI proposals.
- **WCAG 2.1 AA (partial):** `focus-visible`, `prefers-reduced-motion`, ARIA labels, and colour-contrast where applied — a documented baseline, not a full conformance claim.

### Phase 2 roadmap (not yet delivered)
- WCAG 2.2 AAA pass (48px touch targets, skip-link, full contrast pass).
- COGA implementation (simplification, progressive disclosure, user-controlled adaptation).
- A2UI / json-render alignment (declarative UI schema) and AttentionGuard-style behavioural adaptation.

### Relevance to NGI Fediversity
PHOS-Sovereign maps to Fediversity's mission of user-controlled, interoperable infrastructure: it is self-hostable, federates identity via the signed Cognitive Passport, and renders a single accessible interface across heterogeneous services — reducing vendor lock-in and capacity barriers for marginalised users.

---

## Cross-cutting notes (both proposals)
- **Org:** P31 Labs, 501(c)(3) pending, EIN 42-1888158.
- **Combined ask:** €40,000 (TALER €15k + Fediversity €25k).
- **Trust primitives shared:** Cognitive Passport v4.1 (Ed25519/ML-DSA) and ERC-5192 locked SBTs (interface `0xb45a3c0e`) underpin both ledgers and the interface layer.
- **Accessibility honesty:** WCAG 2.1 AA is partial and in place; AAA, COGA, and A2UI are explicitly Phase 2 and not claimed as done.
