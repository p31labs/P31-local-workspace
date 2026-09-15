# Next Action

## Cycle 2.7a — Complete
- Integration test: **PASS** (both checks)
- Evidence: `.agent/tasks/cycle2.7a/evidence.md`
- Commits: `37eae2c`, `e81546c`, `3a41b11`, `ea8508f`, `5c22256`, `9095904`

## Cycle 2.8 — Complete
- CI workflow: `.github/workflows/p31-production.yml` (hex scan + v:gate)
- Commit: `2a94265`
- Note: existing hardcoded hex in `portals/children/src/components/` will fail the new gate

## Open Questions for William
- [ ] 400+ insertions in `workers/design-mcp/src/index.ts` — in progress or abandoned?
- [ ] `data.ts` exports mismatch (TOKENS_DTC, COMPONENT_DEFS, CATALOG) — whose change caused it?
- [ ] If in progress: those changes belong on a separate branch (e.g., `feat/design-mcp-expansion`)
- [ ] If abandoned: revert them — they have been carried since before Cycle 2.5
