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

## Verified facts (added: Path E harness + purpose sourcing, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Compression harness self-test | `__testDiagnose` + `--dry-run` | 5-criterion rubric, 120 map + 38 reduce pairs walk clean |
| Facet/brief pairing | checkpoint regex parse | 39/40 checkpoints, session/level/facet correlation verified |
| Cost model | `__testCost` + live telemetry | glm out $4.40/M vs gemma $0.30/M; cumulative $0.3765 USD |
| Purpose targets sourced | review applied | 0.70 (rubric pass line) not 0.80; 3x = hypothesis-to-measure |
| N=3 bench run 1 | /tmp/bench-n3.out | 0.500 / 0.690 / 0.722 so far (temp-0 judge) |

## Verified facts (added: review flags addressed, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Judge rule in runbook §9 | `grep "judge rule" AGENT-RUNBOOK.md` | calibrate-before-trust gate added |
| sessionId flows to telemetry | live dispatchLLM | `session_id: calib-test-2` in event |
| Cost scoped to session | `telemetryCostUsd(path, sessionId)` | filter added, verified |
| diagnose --since version window | `--since 17:00` | 36 map pairs (current runs) vs 120 full |
| Preservation calibration harness | `--harvest` + calibrate | 13-pair/65-verdict tranche, math verified |
| N=3 run 2 prompt 1 | /tmp/bench-n3.out | 0.806 vs 0.500 run 1 — same-prompt variance 0.306 CONFIRMED |

## Verified facts (added: N=3 run 1 + rename hazard, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Run 1 complete (temp-0 judge) | runs/2026-09-29-N1-fixed/results.json | mean 0.718, pass@k 50% — 0.500/0.690/0.722/0.958 |
| Run 2 in progress | /tmp/bench-n3.out | 0.806 (p1), 0.714 (p2) |
| Rename hazard found+fixed | wrapper 'latest' pick | run 1 was mislabeled N1 (held compression-report); moved real data to N1-fixed |
| Same-prompt variance | run2 p1 0.806 vs run1 p1 0.500 | 0.306 — pipeline variance, temp-0 judge alone insufficient |

## Finding: run 2 LOST to a directory collision (2026-09-29, my error)

Sequence: run 1 completed -> saved to N1-fixed. I moved 2026-09-29 -> N1-fixed
at 17:42 WHILE run 2 (started 17:35) was running. Run 2's bench had created
runs/2026-09-29/ at start; my move removed it. At 17:49 run 2 finished and
tried to write results.json -> ENOENT (dir gone). Run 2 crashed, scores lost
(stdout only: 0.806 p1 / 0.714 p2 / 0.278 p3; p4 never scored).

Compounding: the wrapper's mtime-based 'latest' pick then renamed the
compression/ dir (newest, from my 17:43 pairs.json write) to 2026-09-29-N2.
So N2 contains my compression diagnostics, not run 2. Recoverable.

Root cause: I edited the runs/ directory mid-benchmark. The discipline
violation is mine. The wrapper's mtime-based rename is fragile and should be
replaced (fixed-name OUT dir + explicit N suffix, no 'latest' guessing).

Current status: run 3 in progress (fresh 2026-09-29/). Will complete cleanly.
Effective N after run 3 = N1 + N3 (N=2), plus run 2's partial stdout.
Do NOT touch runs/ until run 3 completes.

## Verified facts (added: DTCG token validation, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| design-core tokens.json was NOT DTCG-valid | `dtokens check` | 1494 schema errors (CSS-string $value) |
| Converter produces valid DTCG | `dtokens check tokens.dtc.json` | PASSED, exit 0 (163 leaves) |
| CSS-function values excluded from interchange | converter design | 20 calc/var/blur leaves stay in CSS layer |
| canon/tokens.dtc.json also NOT DTCG-valid | `dtokens check` | 4427 schema errors — needs canon converter |
| Validation gate wired | `npm run gate` (design-core) | includes tokens:validate |
| Unitless line-height -> DTCG number | converter | lineHeight 1.2 -> $type number (dimension rejects unit:'') |

## Verified facts (added: canon DTCG, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| canon tokens.dtc.json DTCG-valid | `dtokens check` | PASSED exit 0 (was 4427 errors) |
| gen-tokens.mjs emits structured DTCG | regenerate + check | CSS-string -> objects |
| Data bug caught: sunset violet hue 360 | theme-store.ts | fixed to 0 (invalid in OKLCH) |
| Contracts resolve after conversion | `validate-contracts.mjs` | PASSED |
| Parity (design-core drop-in) | `verify-token-parity.mjs` | 0 divergences |
| Both token sources strict-valid | validate.mjs --only | design-core + canon PASSED |

## Verified facts (added: forge bridge, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Forge bridge modules exist | `ls software/p31-forge/scripts/{extract,verify,render,run}-*.mjs` | 4 modules |
| extract works on real session | `node run-report.mjs --session 04311260` | 16 synthesis + 8 facet claims |
| verify renders honest verdicts | same | 1 verified (FIPS) / 15 unverified (Brief-N refs) |
| render produces report | same | /tmp/report/04311260.report.md (12KB) + booklet HTML (18.9KB) |
| Evidence appendix 7-field | report md tail | statement/source/date/boundary/pickle/verdict visible |
| Ledgers used as filter | verify-claims.mjs | VERIFIED_FACTS.md + CITATION_LEDGER.md |

## Verified facts (added: report design system, 2026-09-29)

| Fact | Verification command | Result |
|---|---|---|
| Double-wrap defect diagnosed (not backslash-escape) | grep '****' report.md | 0 after Layer-1 fix |
| Brief-N category error | extract regex (Brief N removed) | 16 evidence blocks -> 1 (FIPS) |
| Styled report vocabulary | render-report.mjs renderHtml() | cover/methodology/striking/table all present |
| Report gate passes | check-report.mjs | exit 0 on session 04311260 |
| Gate negative controls | NC-wall (16 blocks), NC2 (****) | both exit 1 |
| PDF render | render-pdf.mjs via chromium | 102KB PDF |
| Reference bar | /home/p31/P31 Labs — ATS Accelerator 2026.pdf | 477KB, 14 pages |

## Open threads (NOT active — one at a time)

- **report-vs-ats-comparison**: open /tmp/report/04311260.report.pdf next to
  the ATS reference. The test: does a reader learn the finding (three layers
  of defense-in-depth) in 10 seconds? Compare typographic hierarchy.
- **live-jitterbug-wiring**: run-report reads existing sessions; wiring a
  prompt-in-report-out flow (run jitterbug then report) is the full product.
- **template-reuse**: the renderHtml design vocabulary (cover/methodology/
  table) could be extracted to a reusable template for the p31-deliverable
  skill's report type.

## Open threads (NOT active — one at a time)

- **report-style**: the HTML is the booklet default; scene-palette custom CSS
  (dark cover, warm content, print stylesheet) is the polish that makes it
  read like a paid product. The skill §6 print CSS is the spec.
- **facet-retrieval**: PwC found more retrieval makes citations worse, not
  better — so no retrieval. Facet sources are internal; the honest render
  marks them unverified. If external URLs are added to facets later, the
  verify stage can fetch them.
- **forge-vs-jitterbug**: the bridge reads jitterbug artifacts; wiring it to
  run a LIVE jitterbug run (prompt in, report out) is the full product.

## Open threads (NOT active — one at a time)


- **DESIGN.md**: the missing Layer-2 agent contract (research: prose rules = 0%
  compliance; DESIGN.md = machine-enforced). Write from tokens + canon decisions.
- **catalog A/B**: measure P31's bad-component rate (ungoverned vs catalog-
  governed) — the number nobody has.
- **MCP deploy**: mcp.design.p31ca.org is not live (000). Deploy http-worker.

## Open threads (NOT active — one at a time)

## Open threads (NOT active — one at a time)

- ~~n3-bench-finish~~ DONE — see WP-N3-VARIANCE.md: mean 0.646 ± 0.179.
- **preservation-judge-handscore**: fill 65-verdict preservation-sheet.json
  (human step), run calibrate-preservation.mjs.
- **path-e-live-run**: after N=3 + preservation judge calibrated.
- **path-d-probe-run**: after N=3.
- **cost-parity-measure**: jitterbug vs frontier quality-per-dollar (session-
  scoped) from N=3 telemetry.

## Open threads (NOT active — one at a time)

- **preservation-judge-handscore**: fill the 65-verdict
  preservation-sheet.json (human step), run calibrate-preservation.mjs, pass
  trust bar before Path E rates are authoritative.
- **path-e-live-run**: `diagnose-compression.mjs --since <window>` after N=3.
- **path-d-probe-run**: `probe-models.mjs` after N=3.
- **cost-parity-measure**: jitterbug vs frontier quality-per-dollar from N=3
  telemetry (session-scoped now) + cost.mjs.

## Open threads (NOT active — one at a time)

- **path-e-live-run**: `node convergence/diagnose-compression.mjs` (live
  temp-0 judge) after the N=3 bench finishes — inference contention gate.
  Output: map_loss_rate + reduce_loss_rate + per-criterion.
- **path-d-probe-run**: `node tools/jitterbug-bench/probe-models.mjs` after
  the N=3 bench finishes. Then the research-model swap decision (gated on
  probe + rubric spot-check).
- **cost-parity-measure**: compute jitterbug vs frontier quality-per-dollar
  from the N=3 telemetry + cost.mjs — resolves the 3x hypothesis.

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