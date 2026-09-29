# AGENTS.md — P31 Labs

Read **AGENT-RUNBOOK.md** before acting. It is the authority. If a chat instruction conflicts with the runbook, the runbook wins.

## Non-negotiables

1. **No claim without a command.** No command without pasted output. No output without a link to the audit chain.
2. **One facet at a time.** Update `docs/agent-context/SESSION-STATE.md` and `docs/workpackages/THREAD-LOG.md` on switch.
3. **Verify before commit:** `node tools/agent-verify/verify.mjs --claims <manifest>.json`
4. **A gate that cannot fail is furniture.** Every gate has a negative control.
5. **No vendor model names as agent identity.** Pickle names only (`dillpickle-narrator`, `cornichon-architect`, `breadbutter-mechanic`, `gherkin-firmware`, `Half-Sour`).
6. **Stop and ask when the manifest cannot be written.**

## Session start

```bash
bash tools/agent-verify/session-preflight.sh
```

Do not proceed on failure. Record the failure as the finding.

## Commands

- `pnpm build` — build the workspace
- `pnpm test` — run tests
- `node tools/system-test/run.mjs` — 8-layer system test
- `node tools/system-test/negative-controls/sabotage.mjs` — prove the suite can fail
- `node tools/agent-verify/verify.mjs --claims <m>.json` — verify claims vs disk

## Boundaries

- Never write outside the active facet's path boundary (see `docs/workpackages/PARALLEL-PATHS.md`).
- Never edit `packages/govern/**/*.jsonl` except via the govern CLI.
- Never rename a pickle vocabulary without updating the determinism test.

## Design system detail

Design token/component/theme specifics live in the design portal's own `AGENTS.md` (`production/portals/design/AGENTS.md`). This root file does not repeat them.