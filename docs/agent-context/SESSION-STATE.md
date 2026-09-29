# SESSION-STATE — 2026-09-29

This file is the agent's verified working memory. Updated only at facet
boundaries. It holds facts that were **checked** (with command + output),
not things the agent believes. If a fact is not here and not in the last
5 turns, it is unknown — re-verify, don't assume.

## Active facet

`Facet B` — human anchor (Thread A). Built: approve.ts, `design approve`,
`design audit --canon`. Next: commit + synthesis.

## Verified facts (checked this session)

| Fact | Verification command | Result |
|---|---|---|
| pickle-names submodule exists | `ls packages/sovereign-primitives/src/pickle-names/` | ✅ 4 files |
| family constitution has pickle-names gate (BLOCKING) | `python3 -c "... gates"` | ✅ 3 gates |
| pickle gate + NC exist | `ls tools/family/pickle-names-gate.mjs negative-controls/pickle-names.mjs` | ✅ |
| QPJ consumes shared package (re-export) | `head src/lib/pickleNames.ts` | ✅ |
| QPJ tests green | `pnpm test` in portals/qpj | ✅ 354/354 |
| sovereign-primitives v0.0.2 | `grep '"version"' package.json` | ✅ |
| verify.mjs passes self-claims | `node tools/agent-verify/verify.mjs --claims self-claims.json` | ✅ VERIFY_RESULT: PASS |
| verify.mjs NC proves it can fail | `node tools/agent-verify/nc/run.mjs` | ✅ NEGATIVE_CONTROL_OK |
| design pipeline stages renamed to lantern-* | `grep "lantern-" src/agentic/orchestrate.ts` | ✅ |
| audit block records lantern-architect | `tail -1 design/.govern-audit.jsonl` | ✅ block #487 |
| human-approval block (Half-Sour) | `tail -1 design/.govern-audit.jsonl` | ✅ block #488, reviewer Half-Sour |
| canon gate approves + falls through | `design audit --canon button-affirm.yml` | ✅ approved + LANTERN QA pass |
| canon gate blocks unapproved | `design audit --canon __nc__fail-contrast.yml` | ✅ exit 1 |
| approve w/o --by refused | `design approve <spec>` | ✅ exit 1 (no silent default) |
| human-anchor tests | `pnpm test` (design-core) | ✅ 6/6 |

## Verified facts (added: live pipeline run, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Live 4-stage pipeline ran | `pipeline-runner.mjs` (background) | narrator ✅, architect ✅, mechanic ✗ |
| Mechanic failure cause | `runStage` maxTokens=1024 too small | kimi-k2.7-code returned empty |
| Semantic checker works | `wrong_but_valid_rate 0.5` on narrator | caught a schema-valid-but-wrong output |
| Routing provenance records failure | routing block #515 `ok: false` | failure is a governed artifact |
| Fix committed | `3b8658bc` per-stage maxTokens | mechanic 4096 headroom |

## Verified facts (added: jitterbug bench, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Bench harness works | `run-bench.mjs` (detached) | 4 prompts load, rubric valid, jitterbug invoked |
| Jitterbug research facets produce real output | `/tmp/phos-jitterbug/<session>/level-0/research-*.md` | 3 × 8.3-8.5KB facets with Miserandino/Sweller citations |
| Convergence stage fails on large input | bench log | glm-5.3 returns empty on combined research facets |
| Direct glm-5.3 synthesis works on small input | `routeToWorkersAI('synthesis')` | 791 chars, model glm-5.3 |
| Root cause | `runConvergence` maxTokens=2000 + large combined input | glm-5.3 empty-response on big synthesis context |

## Open threads (NOT active — one at a time)

- **jitterbug-convergence-fix**: convergence stage needs retry-on-empty or
  smaller synthesis window. This blocks the bench from producing reports.
  This is the active thread after this bench run.

## Open threads (NOT active — one at a time)

- **Thread A — agentic design anchor:** the human anchor (approve.ts,
  `design approve`, `audit --canon`, Wye disclosure) was claimed earlier but
  NOT built. This is the next real payload after the delivery mechanism.
- **Thread B — provenance external:** Sigstore publish of sovereign-primitives
  0.0.2 + `npm audit signatures` gate. BLOCKED until Thread A or separately.
- **L-009:** 158 chain link breaks recorded (govern/design L-009). Recorded,
  not fixed. Does not block Thread A.

## Canonical commands

```bash
cd /home/p31/P31-local-workspace
node tools/agent-verify/verify.mjs --claims tools/agent-verify/self-claims.json
cd packages/design-core && pnpm typecheck && pnpm test
node tools/agent-verify/nc/run.mjs
node tools/system-test/run.mjs --fast
```

## Hard-earned lessons (this session)

1. **Verify before claiming.** "I built X" without a command + output is a
   hallucination risk. This session claimed approve.ts, human-anchor.spec.ts,
   the Wye disclosure, and #481 without verification — none were real.
   verify.mjs is the gate.
2. **Byte-identical extraction is sacred.** Renaming vocabulary changes every
   derived value. Pickle determinism was preserved by matching byte-for-byte.
3. **The build must be on disk.** A narrated build is not a build.