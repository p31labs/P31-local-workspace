# RUNBOOK-audit-chain

## When to use

Every Genesis chain in every domain links block N to block N-1 with no gaps.

## Prerequisites

- You can run the gate command: `node scripts/audit-chain-verify.mjs`.

## Steps

1. Run the gate: `node scripts/audit-chain-verify.mjs`.
2. Read the failure output.
3. Fix the artefact — never weaken the gate.

## How to verify

`node scripts/audit-chain-verify.mjs` exits 0.

## Common pitfalls

- **TODO**: fill in from the first real incident. Every mistake made once
  becomes a warning here.

## Owner + last verified

`Owner: <fill in>` · `Last verified: <fill in>`
