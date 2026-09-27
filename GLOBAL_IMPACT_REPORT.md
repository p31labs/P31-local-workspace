# P31 Labs — Global Impact Report

*July 2026 · citation-backed*

## Executive Summary

P31 Labs builds a production-verified, agent-native, neuroinclusive platform for
neurodivergent individuals and families. It bridges sovereign identity,
spoon-aware design, and a non-extractive L.O.V.E. economy, built on **verified
open standards** and shipped as live open-source packages. This report summarizes
the architecture, standards compliance, and global impact, grounded in sources
checked against authoritative registries and specifications.

## 1. Standards Compliance (verified)

| Standard | Use in P31 | Verification |
|----------|------------|--------------|
| **ERC-5192** (Minimal Soulbound NFTs) | `LOVESBT.sol` soulbound badges (fully ERC-5192 compliant — implements `locked()`, `Locked` event, `supportsInterface(0xb45a3c0e)`); `CognitivePassport.sol` fully compliant & deployed (Base Sepolia, `0xa4bfb18fa7c5265e25b9a8915d1196a18d52299e`) | [`eips.ethereum.org/EIPS/eip-5192`](https://eips.ethereum.org/EIPS/eip-5192) — finalized, interface `0xb45a3c0e` |
| **DID Core v1.0** | Pluggable identity module (`packages/auth`) | [W3C Recommendation](https://www.w3.org/TR/did-core/) (2022-07-19); IANA registers `did.json` well-known |
| **WebAuthn** | Planned identity binding | IANA Well-Known URI registry — `webauthn` registered (W3C, 2026-01-23) |
| **WCAG 2.2** | Design system, motion scaling, focus, ARIA | [W3C Recommendation](https://www.w3.org/TR/WCAG22/) (2024-12-12); levels A/AA/AAA |
| **MCP** (Model Context Protocol) | 6 MCP servers — Oasis CLI 11, Component Registry 5, LOVE Ledger 3, PHOS Forge 29, Cognitive Prosthetic 47, Cognitive Comms 20 (**115 tools**) | [modelcontextprotocol.io](https://modelcontextprotocol.io) — real protocol, supported by Claude, ChatGPT, VS Code, Cursor |
| **A2UI v0.9** | Agent-facing UI exchange via `toA2UI` adapter + `A2UIRenderer` (L4.2/L4.3); `InterfaceDescription` → A2UI message (root id `root`, `component` discriminator, `version:"v0.9"`) | [a2ui.org/specification/v0_9/](https://a2ui.org/specification/v0_9/) — wire schema v0.9 (emitted by `a2ui-core 0.1.1` / `a2ui-agent-sdk 0.4.0`) |
| **A2A AgentCard** | Agent discovery via `/.well-known/agent-card.json` | IANA Well-Known URI registry — `agent-card.json` registered (A2A / Linux Foundation, 2025-08-01) |
| **GNU Taler** | Planned for privacy-preserving LOVE issuance | [taler.net](https://taler.net) — real GNU project (integration tracked, not yet built) |

> **Correction:** An earlier draft claimed the IETF is standardizing
> `/.well-known/agents.json`. The IANA Well-Known URI registry (last updated
> 2026-07-01) has **no `agents.json` entry**. P31's legacy `agents.json` is a
> custom schema retained for backward compatibility; the registered standard for
> agent discovery is `agent-card.json` (A2A). P31 now serves both.

## 2. Published Packages (live on npm, verified)

| Package | Version | Description |
|---------|---------|-------------|
| `andromeda-cli` | 1.1.2 | CLI with `--agent` JSON mode + MCP server (agent-native, neuroinclusive) |
| `@p31ca/agent-engine` | 0.1.0-alpha.0 | Core engine for personalized AI agents in the P31 ecosystem |
| `@p31ca/game-engine` | 0.1.0-alpha.0 | Geodesic building game engine (Maxwell rigidity, 7 seed challenges) |

All packages were verified present on the npm registry. (Note: `@p31ca/cli` is a
documentation artifact with no in-repo implementation — not listed here.)

## 3. Agent-Native Infrastructure

- **115 MCP tools** across 6 servers (Oasis CLI 11, Component Registry 5, LOVE Ledger 3, PHOS Forge 29, Cognitive Prosthetic 47, Cognitive Comms 20).
- **`andromeda` CLI** installable via `npm i -g andromeda-cli`; supports `--agent` JSON output.
- **Agent discovery**: `/.well-known/agent-card.json` (A2A standard) + legacy `/.well-known/agents.json`.
- **Edge-aware commands**: `status`, `surfaces`, `love`, `deploy`.

### 3.1 MCP Monetization (x402)

- **x402 gateway** — Cloudflare Worker (`mcp-x402-gateway`) issues `402` + verifies payment via an x402 facilitator, then routes paid `tools/call` to a supervised Node stdio↔HTTP bridge spanning all 6 MCP servers (unified tool catalog).
- **Pricing tiers** mirrored in the Cloudflare Gateway config ($0.05 premium / $0.25 premium-high) with WAF + edge rate-limit.
- **Status**: L3.2 Worker validated (local `tsc --noEmit` clean + `wrangler deploy --dry-run` green); L3.4 bridge 7/7 local tests green; production deploy pending secrets + go-ahead.

## 4. Neuroinclusive Design

- **Spoon-aware motion** — `data-spoons` (0–5) scales animation, UI complexity, and LLM prompts.
- **Crisis Mode invariant** — at spoon 0, only a breathing overlay renders (no UI chrome).
- **WCAG 2.2 AAA (automated audit verified, 2026-07-11)** — `scripts/audit-wcag.mjs` (axe-core 4.11, `wcag2aaa` tag) returns **0 blocking violations** (critical/serious) across all 4 faces: phos, auth, status, design-hub (bonding also 0). Contrast ≥7:1, focus indicators, skip links, ARIA labels, `prefers-reduced-motion` all pass programmatic AAA rules. Manual COGA review (simplification, progressive disclosure, user-controlled adaptation) is ongoing — not yet claimed as full conformance.
- **TRIPER certification** — 12 MVP suites / 84 axis-tests green (`node tests/triper/triper-runner.mjs --cert`), rebuilt 2026-07-11.

## 5. L.O.V.E. Economy

- **Off-chain primary** — LOVE balances live in the D1-backed `love-ledger` Cloudflare Worker.
- **On-chain attestation** — ERC-5192 soulbound badges (`LOVESBT`) + `GenesisSpark`.
- **Two-pool model** — 50% Sovereignty (immutable) + 50% Performance (care-score-modulated).
- **Worker hardening (implemented, tests green)** — opt-in Bearer (HS256) auth, 1-earn/day
  rate limit, per-user nonce replay protection, and D1-batch atomic earns.
- **Privacy accounting** — GNU Taler blind signatures planned for unlinkable LOVE issuance.

## 6. Global Reach & Accessibility

- **Pay What You Want, $0 minimum** — accessible regardless of income.
- **Open-source (AGPL-3.0)** — every line public, forkable, auditable; network-use copyleft protects the neurodivergent assistive-tech commons.
- **Edge-deployed** — Cloudflare Workers for low-latency global delivery.
- **Local-first AI** — on-device inference option, no mandatory cloud dependency.

## 7. Future Directions

| Item | Status |
|------|--------|
| DID:key + WebAuthn binding | Pluggable module; integrate into `identity.ts` |
| GNU Taler integration | Planned for `love-ledger` |
| Worker hardening — production enablement | Code complete; enable via `LOVE_REQUIRE_AUTH` + `wrangler secret put LOVE_AUTH_SECRET` |
| ASSETS 2026 submission | Email draft pending |
| DNS ownership TXT | Record ready for Cloudflare dashboard |
| L5 Creation Economy | Scaffolded — intent-driven, dual-settlement (LOVE/x402) worker model; concept in `L5-CREATION-ECONOMY.md` |

## 8. Conclusion

P31 Labs is a sovereign, neuroinclusive, agent-native platform built on verified
standards and live open-source packages. It empowers neurodivergent families
with tools for identity, care accounting, and assistive technology — while
maintaining privacy, accessibility, and sovereignty.
