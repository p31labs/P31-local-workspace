# Handoff — Cycle 2.7a

## Committed
- `37eae2c` cycle2.7a: fix runtime — bundle skills at build time instead of readFileSync
- `e81546c` chore: add CI drift check for skills manifest
- `3a41b11` fix: correct integration test — setTimeout, URL, proc.kill

## Verified
- [x] TypeScript clean for new/changed code (8 pre-existing errors unrelated)
- [x] `build.mjs` generates `src/generated/skills.json` (1 skill: p31-standards)
- [x] 8 vitest unit tests pass (`src/skills.test.ts`)
- [x] Integration test passes against isolated fixture (`skills-worker.ts`) — `PASS: skills endpoint verified via JSON-RPC` + `PASS: list_skills verified via JSON-RPC`
- [x] CI drift check gate committed (e81546c)

## Not Verified
- CI drift check not yet executed in CI (committed gate exists in e81546c)

## Next Action
Cycle 2.8: Extend hex/boundary gates to /home/p31/production

## Open Questions for William
- The 400+ insertions in `workers/design-mcp/src/index.ts` — in progress or abandoned?
- The `data.ts` exports mismatch — whose change caused it?
- If in progress: those changes belong on a separate branch (e.g., `feat/design-mcp-expansion`)
- If abandoned: revert them — they have been carried since before Cycle 2.5
