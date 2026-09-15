# Cycle 2.7a — Verification Spec

## Claim
Replace readFileSync/readdirSync runtime file access with a build-generated skills manifest imported as a bundled JSON module.

## Acceptance Criteria
- [ ] `list_skills` and `get_skill` read from `src/generated/skills.json` imported as a module, not from filesystem
- [ ] `get_skill` returns structured error (`{ error, status: 'error' }`) for unknown skills instead of throwing
- [ ] `build.mjs` generates `src/generated/skills.json` from `skills/` directory
- [ ] `src/index.ts` contains zero `readFileSync`/`readdirSync`/`node:fs`/`node:path` references related to skills loading
- [ ] Vitest unit tests pass (8 tests in `src/skills.test.ts`)
- [ ] Integration test (`verify-skills-endpoint.mjs`) passes against isolated Worker fixture at `skills-worker.ts` importing real `./src/generated/skills.json`
- [ ] CI drift check passes (build.mjs output matches committed skills.json)

## Frozen
Do not modify this spec during implementation. Changes to acceptance criteria require a new spec version.
