# RUNBOOK-monetization-ledger

## When to use
The `revenue-ledger-integrity` gate fires: a revenue_events row cannot be reconciled, or the hash chain flags an orphan (the 93f4407d fork class — a forged duplicate row claiming the same prev_hash as the committed head).

## Prerequisites
- The canonical source is reachable: `/home/p31/p31-capital-machine/workers/revenue-ledger/ledger.ts`.
- You can run the gate: `node scripts/gates/revenue-ledger-integrity.mjs [--state <path>]`.
- You can run the negative control: `node scripts/nc/ledger-integrity.mjs`.

## Steps
1. Run the gate: `node scripts/gates/revenue-ledger-integrity.mjs --state <state>`.
2. Read the `GATE_FAIL` marker — it names the offending row (`forged-dup-row`) or the broken_at point in the chain.
3. If a forged row: confirm whether the real `UNIQUE(prev_hash)` index rejected it at insert (storage defense) or whether the index was dropped (schema-regression class — the gate then relies on `verifyHashChain` to flag the orphan).
4. Restore the UNIQUE index if it was dropped. Reconcile the ledger (compare D1 rows against the summary).
5. Re-run the gate — `GATE_PASS`. Run the NC — `NEGATIVE_CONTROL_OK`.

## How to verify
- `node scripts/gates/revenue-ledger-integrity.mjs --state <clean>` → `GATE_PASS: revenue-ledger-integrity`, exit 0.
- `node scripts/nc/ledger-integrity.mjs` → `NEGATIVE_CONTROL_OK`, exit 0.

## Common pitfalls
- **A summary computed off a corrupted chain is untrustworthy.** The gate's honest note: real `reconcile()` mirrors raw rows (no stored summary table), so chain integrity is the genuine detector for this corruption class.
- **Assuming the UNIQUE index is present.** The fork class is exactly the schema regression where the constraint was dropped. Always verify the index exists.

## Owner + last verified
`Owner: monetization-engineer` · `Last verified: 2026-09-28`