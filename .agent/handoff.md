# Handoff — Cycle 2.7a

## Cycle 2.7a — Committed
- `37eae2c` cycle2.7a: fix runtime — bundle skills at build time instead of readFileSync
- `e81546c` chore: add CI drift check for skills manifest
- `3a41b11` fix: correct integration test — setTimeout, URL, proc.kill
- `ea8508f` fix: correct integration test (tool call params, response paths, ready detection, fixture config)

## Cycle 2.7a — Verified
- [x] TypeScript clean for new/changed code (8 pre-existing errors unrelated)
- [x] `build.mjs` generates `src/generated/skills.json` (1 skill: p31-standards)
- [x] 8 vitest unit tests pass (`src/skills.test.ts`)
- [x] Integration test passes against isolated fixture — `PASS: skills endpoint verified via JSON-RPC` + `PASS: list_skills verified via JSON-RPC` (exit 0)
- [x] CI drift check gate committed (e81546c)

## Cycle 2.7a — Not Verified
- CI drift check not yet executed in CI (committed gate exists in e81546c)

## Cycle 2.7a — Evidence
- `.agent/tasks/cycle2.7a/evidence.md` — all 7 criteria PASS

## Cycle 2.8 — Completed
- `2a94265` ci: add production gates (hex scan + v:gate)
- `.github/workflows/p31-production.yml` created
- Hex gate: scans `portals/` for hardcoded hex (excludes node_modules, dist, .wrangler, vendor)
- v:gate: asserts @p31/design-core 2.3.0 + @p31/ui 1.3.1 from vendor tarballs
- Note: existing hardcoded hex found in `portals/children/src/components/` — gate will fail until those are fixed

## Open Questions for William
- The 400+ insertions in `workers/design-mcp/src/index.ts` — in progress or abandoned?
- The `data.ts` exports mismatch — whose change caused it?
- If in progress: those changes belong on a separate branch (e.g., `feat/design-mcp-expansion`)
- If abandoned: revert them — they have been carried since before Cycle 2.5
