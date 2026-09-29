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

## Verified facts (added: convergence resilience, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Root cause = output stalling (reasoning budget burn) | web research: arXiv "When Agents Go Quiet", cloudflare/ai PR e9b2a9a, penny#812 | GLM allocates completion budget to CoT first, emits empty |
| Router did NOT forward reasoning_effort | `grep reasoning_effort router.mjs` | absent before fix |
| 5-layer convergence architecture | `node --check convergence/*.mjs` | 8 files syntax OK |
| Layer unit tests pass (no LLM) | `__test*` hooks | 5/5 PASS + 2 NCs |
| Live: exact bench failure now converges | `gracefulConvergence` + `convergeWithChain` | full-synthesis, 3034 chars, 22.7s |
| Verify suite | `verify.mjs --claims self-claims.json` | PASS 16/16 |

## Verified facts (added: inference-speed baseline, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| TTFT/TPS telemetry live | `dispatchLLM(...,{returnModel:true})` | ttft_ms/tps/total_ms/cached_prompt_tokens in return + event bus |
| x-session-affinity LANDED | `grep sessionId router.mjs` | header sent when opts.sessionId set |
| Cached tokens = 0 on deepseek-v4-flash + glm-5.3-flash | live 2-call affinity test | 20-40% prefill claim NOT verifiable on these models |
| glm-5.3 accrues ~27 cached tok/call automatically | bench telemetry | prompt repeatability drives cache, not affinity header |
| Batch API ABSENT | probed ai/v1/batch, ai/batch, ai/v1/chat/batches | code 7000 "No route for that URI" |
| Speed baseline | bench jitterbug leg, 64 calls / 1828s | research facets ~51s/call (dominant), convergence ~13s, judge ~36s |
| Score variance | same judge, 2 runs | mean 0.719 vs 0.604 — judge noisy run-to-run |

## Verified facts (added: parallel paths B/C, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Judge deterministic at temp 0 | 2 consecutive judge calls | identical JSON verdicts |
| Semantic cache exact+semantic tiers | `__testSemanticCache` | 3/3 unit + 3 NC PASS |
| ParaCascade high-complexity parallel | live convergeWithChain | mode=parallel, GLM won, 9.3s / 111.6 tps |
| ParaCascade low-complexity early-route | live convergeWithChain | mode=early-route, glm-5.3-flash, 1219 chars |
| Complexity heuristic | `__testComplexity` | easy->low, hard->high + 2 NC |
| Full convergence suite | node hooks | 6/6 PASS after B+C |
| N=3 bench running | /tmp/bench-n3.out | prompt 1 scored 0.500 at temp 0 (run 1) |

## Open threads (NOT active — one at a time)

- **path-d-probe-run**: run probe-models.mjs after N=3 bench finishes (rate
  contention). Then decide the research-model swap (gated on probe + rubric
  spot-check).
- **path-e-compression-loss**: after Path A variance data lands — measure
  facets->synthesis direct vs facets->briefs->synthesis, score with temp-0
  judge, per-criterion diff.

## Open threads (NOT active — one at a time)

- **speed-rank-3**: faster research-tier model to attack the ~150s/prompt
  facet stage (dominant measured cost). Needs a catalog probe for a
  lower-latency research model + before/after on the baseline.

## Open threads (NOT active — one at a time)

- **bench-frontier**: run the frontier leg (`--models glm-5.3,deepseek-v4-pro`)
  now that jitterbug produces scored output. Requires judge calibration first
  (human-coded tranche, trust bar agreement>=0.80 / kappa>=0.60).
- **judge-calibration**: hand-score 8-12 criteria across 2 reports to calibrate
  deepseek-v4-flash judge before scores are authoritative.

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