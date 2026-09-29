# RUNBOOK-justice-evidence

## When to use
The `evidence-chain-verify` gate fires: an evidence entry's chainHash no longer matches a SHA-256 recompute of its payload, a prevHash does not link the prior chainHash, or a dual signature (Ed25519 + ML-DSA-65) is truncated below its length guard.

## Prerequisites
- The canonical source is reachable: `/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts`.
- You can run the gate: `node scripts/gates/evidence-chain-verify.mjs [--state <path>]`.
- You can run the negative control: `node scripts/nc/evidence-chain.mjs`.

## Steps
1. Run the gate: `node scripts/gates/evidence-chain-verify.mjs --state <state>`.
2. Read the `GATE_FAIL` marker — it names the entry (`e1`, `e2`) and the class: chainHash mismatch, truncated signature, or broken link.
3. Determine whether the tampering is real (an entry was modified after deposit) or a stale state snapshot.
4. If real: trace to the deposit that produced the entry; re-deposit with correct hashes; confirm the case's chain relinks.
5. Re-run the gate — `GATE_PASS`. Run the NC — `NEGATIVE_CONTROL_OK`.

## How to verify
- `node scripts/gates/evidence-chain-verify.mjs --state <clean>` → `GATE_PASS: evidence-chain-verify`, exit 0.
- `node scripts/nc/evidence-chain.mjs` → `NEGATIVE_CONTROL_OK`, exit 0.

## Common pitfalls
- **Honesty boundary.** The canonical source length-checks the dual signatures (Ed25519 ≥128 hex, ML-DSA-65 ≥6600 hex); it does not perform cryptographic verification. This gate proves chain-integrity and signature-guard, NOT crypto verification. Do not overclaim.
- **A truncated signature that is still a valid length.** The length guard is the only check; a real crypto break would not be caught here. Flag this to the court vertex, not the gate.

## Owner + last verified
`Owner: justice-engineer` · `Last verified: 2026-09-28`