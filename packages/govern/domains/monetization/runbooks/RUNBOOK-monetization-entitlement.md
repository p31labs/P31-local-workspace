# RUNBOOK-monetization-entitlement

## When to use
The `entitlement-preflight` gate fires: a state record shows a DID granted access to a paid tool that the real `EntitlementService.checkEntitlement` would deny (M-001 class — the portal hardcoded its own workers.dev origin, bypassing the portal worker and its RBAC).

## Prerequisites
- The canonical source is reachable: `/home/p31/p31-capital-machine/workers/entitlement/` (`service.ts`, `x402.ts`).
- You can run the gate: `node scripts/gates/entitlement-preflight.mjs [--state <path>]`.
- You can run the negative control: `node scripts/nc/entitlement-preflight.mjs`.

## Steps
1. Run the gate against the current state: `node scripts/gates/entitlement-preflight.mjs --state <state>`.
2. Read the `GATE_FAIL` marker — it names the DID and the denial reason ("Insufficient balance" / "Monthly allowance exceeded").
3. Determine whether the denial is correct (a grant that should never have been issued) or a false alarm (a grant that checkEntitlement now wrongly refuses).
4. If the grant was wrong: revoke it at the source, verify the entitlement worker's check route is the one the portal calls (not a hardcoded origin).
5. Re-run the gate — it must emit `GATE_PASS`.
6. Run the negative control — it must emit `NEGATIVE_CONTROL_OK` (proves the gate can still fail).

## How to verify
- `node scripts/gates/entitlement-preflight.mjs --state <clean>` → `GATE_PASS: entitlement-preflight`, exit 0.
- `node scripts/nc/entitlement-preflight.mjs` → `NEGATIVE_CONTROL_OK`, exit 0.

## Common pitfalls
- **A portal that bypasses the worker.** The M-001 root cause: the monetization portal hardcoded its own workers.dev origin for the live badge, so RBAC was never applied. The gate's scope includes client routes — check the origin the portal actually calls.
- **Treating a state snapshot as live.** The gate verifies a state snapshot against canonical logic; it does not query the live D1. A `GATE_PASS` on a snapshot is not a live-environment pass.

## Owner + last verified
`Owner: monetization-engineer` · `Last verified: 2026-09-28`