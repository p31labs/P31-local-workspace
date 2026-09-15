# Next Action

## Run isolated integration test against skills fixture
```bash
node workers/design-mcp/scripts/verify-skills-endpoint.mjs
```
Expected: PASS output with "skills endpoint verified via JSON-RPC" and "list_skills verified via JSON-RPC"
If blocked: the fixture at `skills-worker.ts` imports real `./src/generated/skills.json` and bypasses the data.ts exports mismatch

## Open Questions
- [ ] Ask William: 400+ insertions in `workers/design-mcp/src/index.ts` — in progress or abandoned?
- [ ] Ask William: `data.ts` exports mismatch (TOKENS_DTC, COMPONENT_DEFS, CATALOG) — whose change caused it?
