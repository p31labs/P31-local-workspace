# RUNBOOK-forge-pipeline

## When to use
A forge gate fires: `token-audit` (raw hex/rgba in portal source) or `system-test` (manifest drift, API contract break, build failure, or acceptance gap).

## Prerequisites
- You can run the portal gate: `cd production/portals/forge && pnpm gate`
- You can run the system test: `pnpm system-test`
- You can run the meta-gate: `node tests/acceptance/gate-self-test.mjs`

## Steps
1. Run the meta-gate: `node tests/acceptance/gate-self-test.mjs` — identifies which gate is furniture.
2. Run the failing gate directly to see the real error.
3. token-audit failure: find the raw hex/rgba in `src/`, replace with an OKLCH token. The canonical scanner roots at the portal cwd and walks `src/`.
4. system-test failure: check each phase — manifest integrity (a pack's `source` must exist), API contract (worker shape), build, acceptance.
5. Re-run the meta-gate + system test — both must pass.
6. Run the NCs: `node tests/acceptance/negative-controls/*.mjs` — each emits `NEGATIVE_CONTROL_OK`.

## How to verify
- `node tests/acceptance/gate-self-test.mjs` → 2/2 gates proven able to fail, exit 0.
- `pnpm system-test` → all 6 phases green, exit 0.

## Common pitfalls
- **Path-rooting**: token-audit audits the portal's `src/` only when run with cwd = the portal dir. Running it from elsewhere audits the wrong tree.
- **NC path drift**: NCs live in `tests/acceptance/negative-controls/`; the registry `command` must resolve there. Moving them breaks the meta-gate.
- **Manifest swap**: the system-test NC swaps the real manifest and restores it in `finally` — never edit `src/data/manifest.json` by hand; regenerate via `pnpm manifest`.

## Owner + last verified
`Owner: forge-portal` · `Last verified: 2026-09-28`