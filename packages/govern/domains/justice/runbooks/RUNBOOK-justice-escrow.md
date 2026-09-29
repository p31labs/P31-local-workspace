# RUNBOOK-justice-escrow

## When to use
The `escrow-multisig` gate fires: an escrow is RELEASED with fewer than 2 distinct signer DIDs, a duplicate signer was recorded, or an unauthorized (outsider) signer appears in the approvals.

## Prerequisites
- The canonical source is reachable: `/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts` (`EscrowEngineDO`).
- You can run the gate: `node scripts/gates/escrow-multisig.mjs [--state <path>]`.
- You can run the negative control: `node scripts/nc/escrow-multisig.mjs`.

## Steps
1. Run the gate: `node scripts/gates/escrow-multisig.mjs --state <state>`.
2. Read the `GATE_FAIL` marker — it names the escrow and the violation (single-signer release / duplicate signer / outsider 403).
3. Determine whether the state is corrupt (escrow released without consensus) or a stale snapshot.
4. If corrupt: the escrow must not be considered settled; re-open it under the 2-of-3 rule; ensure the release path requires two distinct authorized DIDs.
5. Re-run the gate — `GATE_PASS`. Run the NC — `NEGATIVE_CONTROL_OK`.

## How to verify
- `node scripts/gates/escrow-multisig.mjs --state <clean>` → `GATE_PASS: escrow-multisig`, exit 0.
- `node scripts/nc/escrow-multisig.mjs` → `NEGATIVE_CONTROL_OK`, exit 0.

## Common pitfalls
- **Duplicate signers collapse to one.** The canonical dedup collapses the same DID twice to one distinct signer, so the gate reports a single-signer release. The consensus rule is still violated; the marker wording reflects the dedup.
- **Storage only persists LOCKED or RELEASED.** `PENDING_CONSENSUS` is response-only; a stored status that is neither LOCKED nor RELEASED is flagged by the gate.
- **Honesty boundary.** The canonical source trusts `signerDid`; it does not cryptographically verify the signer signed. This gate proves the 2-of-3 consensus rule is enforced on stored state, not that signers cryptographically signed.

## Owner + last verified
`Owner: justice-engineer` · `Last verified: 2026-09-28`