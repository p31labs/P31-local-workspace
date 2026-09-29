# RUNBOOK-audit-reconcile

## When to use

Every domain's latest block is present in the enterprise timeline.

## Prerequisites

- You can run the gate command: `node scripts/audit-cross-domain-reconcile.mjs`.

## Steps

1. Run the gate: `node scripts/audit-cross-domain-reconcile.mjs`.
2. Read the failure output.
3. Fix the artefact — never weaken the gate.

## How to verify

`node scripts/audit-cross-domain-reconcile.mjs` exits 0.

## Common pitfalls

- **TODO**: fill in from the first real incident. Every mistake made once
  becomes a warning here.

## Owner + last verified

`Owner: <fill in>` · `Last verified: <fill in>`
