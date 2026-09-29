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