# NGI / GNU Taler — LOVE Ledger Submission Prep

**Work Package:** P31-WP-PQ-2026-001 (pre/post-quantum crypto)
**Program:** NGI / GNU Taler — 14th Open Call
**Deadline:** 2026-08-01 (CEST)
**Status:** ✅ Package ready — final human action = submit on the NGI portal.

---

## Package contents

| Artifact | Path | Role |
|----------|------|------|
| Authoritative proposal | `grants/NGI-2026-PROPOSALS-DRAFT.md` | Consolidated NGI submission (per `AGENTS.md`) |
| LOVE-ledger component draft | `docs/NLNET_LOVE_LEDGER_GRANT_DRAFT.md` | Per-component narrative; §2.4 Crypto Security & Roadmap; Deliverable 6 + Post-Quantum timeline row added 2026-07-11 |
| Pre/Post-Quantum Work Package | `plans/P31-WP-PQ-2026-001_PRE_POST_QUANTUM_CRYPTO_SECURITY.md` | Three-layer crypto doctrine (CBS live, ML-KEM/ML-DSA designed, SIC-POVM research) |
| CBS live evidence | `AXIS-1_FINAL_DELIVERABLE.md` | Real Rust→WASM Clause Blind Schnorr, verified vectors, deployed |

---

## Live evidence (as of 2026-07-11)

- **Clause Blind Schnorr (CBS)** — deployed live at `https://love-ledger.p31ca.org`,
  `BLIND_MODE='taler'`, WASM `taler_cs.wasm` (CompiledWasm). Commit `ab7bff6`.
  Double-spend + nonce-reuse replays both 409-blocked. Smoke `CBS LIVE SMOKE: PASS`.
- **PQC server seal (ML-DSA-44 / L1, FIPS 204)** — live in the same worker since deploy
  `a43a70e6`. Each `love_chain` entry now carries a `signature_pqc` column
  (verified populated: 3,228 base64 chars = 2,420 raw bytes = ML-DSA-44 size).
  L1 chosen because Cloudflare Workers caps a text secret at **5.1 kB** (an L3 secret key
  is 5.4 kB base64 and is rejected); L1 is lattice-based (Shor-resistant) and ample
  for care-credit integrity.

---

## Crypto doctrine (one line)

**Pre-quantum (live):** CBS blind signatures + Ed25519 court-admissible receipts.
**Post-quantum (designed):** hybrid ML-KEM/ML-DSA (FIPS 203/204) via
`software/packages/quantum-core/src/pqc/fips203-204.ts`, symmetric primitives retained (Grover-safe).
**Quantum measurement (research):** SIC-POVM — explicitly *not* Worker-deployable; hardware track only.

---

## Human action required

1. Open the NGI / GNU Taler 14th Open Call application portal.
2. Attach / reference the authoritative proposal `grants/NGI-2026-PROPOSALS-DRAFT.md`
   (with the LOVE-ledger component draft + Work Package + AXIS-1 as supporting material).
3. Submit before **2026-08-01**.

> This agent cannot click "submit" on an external portal. Everything else in the package is
> authored, cross-linked, and verified against the live deployment.
