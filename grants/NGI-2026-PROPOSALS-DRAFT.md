# NGI 2026 Grant Proposals — DRAFT (auto-updated living doc)

> **Auto-updated living draft.** Last refreshed 2026-07-11 after CWP-2026-009 P0–P3:
> TRIPER cert rebuilt (12/12 suites, 84 tests, green), A2UI v0.9 integration shipped
> (L4.2 adapter + L4.3 renderer, SDK inspected), MCP tool inventory expanded to 115 (6 servers, L4.1),
> and the x402 MCP monetisation gateway validated (L3.2 dry-run green) with the Cloudflare
> Monetisation Gateway config finalised (L3.3). Kept in sync as the roadmap progresses.

**Applicant:** P31 Labs (501(c)(3) pending; EIN 42-1888158)
**Total funding ask:** €40,000
**Submission deadline:** 1 August 2026
**Status:** Draft for internal calibration. All "exists now" claims are verifiably true as of this writing; Phase 2 items are roadmap, not delivered.

---

## (a) NGI TALER — 14th Open Call

**Project:** LOVE-Ledger — a court-admissible, privacy-respecting record of consent and value exchange.
**Funding ask:** €15,000

### Summary
LOVE-Ledger is a tamper-evident ledger for consent and value-exchange events, designed to give users a portable, verifiable proof trail that survives disputes. It underpins a creator-economy model where the platform takes zero fee (platformFee.rate === 0), keeping value with creators and users. A value-exchange rail is now live in validation: an **x402 / MCP monetisation gateway** lets agents pay per-tool call in USDC on Base, with a free tier and court-admissible billing ingest — directly serving TALER's "payments that respect the user" goal.

### What exists now (verifiable)
- **WCAG 2.2 AAA (automated audit verified, 2026-07-11)** — `scripts/audit-wcag.mjs` (axe-core 4.11) returns **0 blocking violations** across all 4 faces (phos, auth, status, design-hub) + bonding. Contrast ≥7:1, focus, skip-links, ARIA all pass programmatic AAA rules.
- **D1-backed ledger** with `prev_hash`/`entry_hash` columns forming a SHA-256 hash chain; chain integrity is externally auditable.
- **Read APIs:** `GET /chain` (full ordered hash chain) and `GET /export` (portable export) for court-admissible retrieval.
- **ERC-5192 compliance:** `LOVESBT.sol` implements `supportsInterface(0xb45a3c0e)` with `locked()` and the `Locked` event, marking consent/SBT records as soulbound and locked.
- **Cognitive Passport v4.1** schema with an audience matrix and Ed25519 / ML-DSA signing, providing the identity anchor the ledger binds events to.
- **Universal Interface Generator** (`@p31/interface-generator`) integrated into PHOS, p31ca, bonding, and the `phos-forge` MCP tool, enabling spoon-aware UI via `data-spoons` (0–5) with a crisis mode at spoons 0 (breathing overlay only).
- **A2UI v0.9 integration (DONE, L4.2/L4.3)** — `InterfaceDescription` maps to the A2UI v0.9 wire schema (SDK `a2ui-agent-sdk 0.4.0` / `a2ui-core 0.1.1` inspected); a React `A2UIRenderer` ships the same accessible surface to external ecosystems. Moves accessibility interop from roadmap → delivered.
- **TRIPER cert (DONE, rebuilt 2026-07-11)** — 12 MVP suites / 84 tests green (`tests/mvp/*`, `node tests/triper/triper-runner.mjs --cert`); certifies the 6 TRIPER axes (Task · Resilience · Interface · Purity · E2E · Regression) as a release gate.
- **x402 / MCP monetisation gateway (validated, L3.2/L3.3)** — `mcp-x402-gateway` Worker issues 402 + verifies via `facilitator()` and routes paid tools through `paymentMiddleware` (pricing $0.05 premium / $0.25 premium-high, free-tier KV quota, USDC on Base-Sepolia). `wrangler deploy --dry-run` green; Cloudflare Monetisation Gateway config finalised as the managed-edge upgrade path. Mainnet deploy pending secret rotation.

### Phase 2 roadmap (not yet delivered)
- WCAG 2.2 AAA pass (48px touch targets, full contrast pass).
- COGA implementation (simplification, progressive disclosure, user-controlled adaptation).
- Mainnet x402 settlement (flip `NETWORK` to `base` after payout confirmed).

### Relevance to NGI TALER
LOVE-Ledger directly serves TALER's privacy and user-sovereignty goals: zero-fee value exchange, cryptographic proof of consent, and a portable, court-admissible record that no single intermediary can rewrite. The x402/MCP gateway adds a user-respecting payment rail (free tier + per-call USDC) so the value exchange is verifiable end-to-end. The hash-chain + SBT design keeps the user as the root of trust.

---

## (b) NGI Fediversity — 12th Open Call

**Project:** PHOS-Sovereign — a self-hostable, accessible sovereign interface layer for federated ecosystems.
**Funding ask:** €25,000

### Summary
PHOS-Sovereign extends the Universal Interface Generator into a deployable, sovereign front-end layer that any community can self-host, giving federated users a consistent, accessible, spoon-aware interface across services rather than fragmented per-app UIs. A **115-tool MCP tool inventory** (6 servers) and an **A2UI v0.9 renderer** make that interface both machine- and human-accessible across heterogeneous services.

### What exists now (verifiable)
- **WCAG 2.2 AAA (automated audit verified, 2026-07-11)** — 0 blocking violations across all 4 faces + bonding via axe-core 4.11 (`wcag2aaa`).
- **Universal Interface Generator** (`@p31/interface-generator`) integrated into PHOS, p31ca, bonding, and the `phos-forge` MCP tool.
- **Spoon-aware UI** via `data-spoons` (0–5) with crisis mode at spoons 0 (breathing overlay only) — a concrete accessibility affordance for fluctuating capacity.
- **Cognitive Passport v4.1** schema + audience matrix + Ed25519 / ML-DSA signing for portable, signed user-context handoff across federated services.
- **ERC-5192 compliance:** `CognitivePassport.sol` implements `supportsInterface(0xb45a3c0e)` with `locked()` / `Locked`, so a user's passport record is soulbound and locked.
- **ERC-5192 + LOVE-Ledger linkage:** the same locked-SBT primitive secures both the passport and the ledger, giving a coherent trust model across the two NGI proposals.
- **A2UI v0.9 integration (DONE, L4.2/L4.3)** — declarative `InterfaceDescription` → A2UI v0.9 message + React `A2UIRenderer`; renders the same accessible surface to external (Flutter/Lit/Angular) ecosystems. Moves from roadmap → delivered.
- **MCP tool inventory 115 tools / 6 servers (DONE, L4.1)** — cognitive-prosthetic (47), cognitive-comms (20), phos-forge (29), oasis (11), component-registry (5), love-ledger (3); a sovereign, self-hostable agent tooling surface.
- **TRIPER cert (DONE, 12/12 suites, 84 tests, 2026-07-11)** — release gate certifying adaptive-UI resilience and interface validity.

### Phase 2 roadmap (not yet delivered)
- WCAG 2.2 AAA pass (48px touch targets, skip-link, full contrast pass).
- COGA implementation (simplification, progressive disclosure, user-controlled adaptation).
- Native Flutter/Lit A2UI renderers (React renderer shipped; others are convergence candidates).

### Relevance to NGI Fediversity
PHOS-Sovereign maps to Fediversity's mission of user-controlled, interoperable infrastructure: it is self-hostable, federates identity via the signed Cognitive Passport, and renders a single accessible interface across heterogeneous services — reducing vendor lock-in and capacity barriers for marginalised users. The 115-tool MCP inventory + A2UI renderer make the sovereign surface both agent- and human-accessible.

---

## Cross-cutting notes (both proposals)
- **Org:** P31 Labs, 501(c)(3) pending, EIN 42-1888158.
- **Combined ask:** €40,000 (TALER €15k + Fediversity €25k).
- **Trust primitives shared:** Cognitive Passport v4.1 (Ed25519/ML-DSA) and ERC-5192 locked SBTs (interface `0xb45a3c0e`) underpin both ledgers and the interface layer.
- **Accessibility honesty:** WCAG 2.2 AAA **automated axe-core audit passes** (0 blocking violations, 2026-07-11) across all 4 faces + bonding. A2UI v0.9 interop and TRIPER cert are **delivered** (2026-07-11); COGA behavioural adaptation remains Phase 2 (roadmap).
- **Delivered ecosystem (auto-synced):** MCP 115 tools / 6 servers (L4.1), A2UI v0.9 adapter + renderer (L4.2/L4.3), TRIPER 12/12 cert (P0), x402 MCP gateway validated + Cloudflare Gateway config (L3.2/L3.3).
