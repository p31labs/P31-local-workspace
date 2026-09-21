# The Loom — LOVE integration

The Loom and the LOVE care economy, bridged. Three surfaces, one promise:
the design system's provable log and the family's care ledger become one
story — and the Loom can show a verified caregiver's presence without ever
exposing the care events.

## What LOVE is (the repo's own system)

- **love-ledger** (`workers/love-ledger`, v1.4.0, live): off-chain D1
  two-pool wallet (sovereignty + performance), `care_score` with decay,
  HS256-JWT auth + nonce replay + rate limits, DO-atomic spend, and its own
  SHA-256 `love_chain` (`prev_hash → entry_hash`, genesis = 64 zeros).
- **LOVESBT.sol** — ERC-721 soulbound badge (careScore, trustTier, Oracle
  updatable), minted via `ledger-bridge /sbt/mint` (dry-run, Base Sepolia).
- **Identity** — `did:key:z…` from Ed25519; ledger-bridge verifies
  Ed25519/ML-DSA composite signatures over care proofs.
- **Published** — Paper XI (Zenodo, ORCID, DOI): biometric-consensus care
  economy; BONDING has 413 automated tests.

## Tier 1 — identity binding

`HumanProfile` (`@p31/canon/loom/profiles`) now carries `loveDid`. When a
profile binds a DID, the Loom resolves the family member's care presence via
`GET /api/loom/love/:did` (the client hook `useProfile` does this
automatically).

**Today**: `humanId` is client-asserted (`?id=`/localStorage). The `loveDid`
is a reference — the Loom reads care data but does not yet mint or sign. The
Access gate's `sub` is the future identity source; `LOVE_INTEGRATION.md`'s
auth section below is the bridge.

## Tier 2 — privacy-preserving care proof

`GET /api/loom/love/:did` returns what the ledger attests — `{ bound,
careScore, verified, sovereigntyPool, performancePool, totalEarned, updatedAt }`
— **without the care events**. `verified` is the derived verdict
(`careScore >= 0.5`, the ledger's CARE_THRESHOLD, mirrored in ProofOfCare.sol).
A ledger outage degrades to `bound: false`, never an error.

The proof is computed by the shared `@p31/canon/loom/love` module
(`careProofOf`) — a pure fold whose shape is structurally guaranteed to carry
verdicts + pools, never events. Registered in the AAF manifest as
`profile.love` (`danger: none`, `confirm: never`): an agent can ask "is this
a verified caregiver" without touching the log.

## Tier 3 — the cross-anchor (one provable root)

`GET /api/loom/anchor` computes the exact `LOOM_HEAD` entry the Loom's
`/verify` head would occupy in the LOVE chain, in that ledger's own
`chainAppend` format. See `AUDIT_STANDARDS.md` §5.

**Write path (next increment)** — appending the anchor to the live LOVE chain:

1. **love-ledger**: add a `POST /api/love/anchor` route that accepts
   `{ entryType, payload, prevHash }`, validates the caller (dedicated
   `LOOM_ANCHOR_TOKEN`, a long-lived service-to-service credential, distinct
   from `LOVE_AUTH_SECRET`), and appends via `chainAppend`.
2. **Loom**: `POST /api/loom/anchor` forwards the computed entry with the
   token; the write is idempotent (the `prevHash` is the chain head at compute
   time, so a retry after another anchor naturally re-links).
3. **Dashboard**: set `LOOM_ANCHOR_TOKEN` as a secret on the love-ledger worker
   and `LOVE_INTERNAL_TOKEN` on the Loom Pages project.

The token is the security decision: **not** the shared `LOVE_AUTH_SECRET` —
one long-lived credential, scoped to the Loom, revocable independently.

## Live status (verified 2026-09-21)

- `GET https://loom-8z0.pages.dev/api/loom/love/did:key:test` → `bound: true,
  careScore: 0.5, verified: true` against the live ledger.
- `GET https://loom-8z0.pages.dev/api/loom/anchor` → a valid `LOOM_HEAD`
  entry (dry-run) against the LOVE chain's current head.

## Honest caveats

1. **Soulbound is partial off-chain** — "no transfer endpoint" is the
   convention; crypto enforcement is "tracked, not implemented" in the
   love-ledger header. The on-chain SBT is genuinely soulbound, but minting
   is dry-run on testnet.
2. **LOVE chain is global** — one `love_chain` table, not per-DID. Fixing
   that is love-ledger work, not a Loom change.
3. **Anchor write awaits the token** — the compute is live; the commit is the
   documented next increment.
4. **Different canonicalization** — LOVE chains via string concat; the Loom
   uses RFC 8785 JCS. The anchor bridges them without unifying the ledger's
   internals; full unification is a deliberate future choice.

## Related Documents

- `./AUDIT_STANDARDS.md` — the record + field matrix + cross-anchor spec
- `./SECURITY.md` — the deployed perimeter + integrity
- `./DECISIONS.md` — #008 tamper-evident
- `docs/LOVE_LITEPAPER.md` (repo root) — the protocol's own words
- `P31_LOVE_ECONOMY_ANALYSIS.md` (repo root) — the implementation analysis