# P31 Sovereign Stack — Evidence Register

**Status:** Proposed for review
**Generated:** 2026-09-28

Every claim in this governance suite is backed by a runnable artifact. This register names the artifact, the command to run it, and the expected result. A claim without a traceable runnable artifact is aspirational (Paper XIX / SOULSAFE).

---

## 1. Runtime evidence

| Claim | Artifact | Command | Expected |
|---|---|---|---|
| Runtime tests pass | `dist/*.test.js` | `node --test dist/*.test.js` | 23/23 pass |
| Runtime compiles | `dist/` | `npx tsc --noEmit && npx tsc` | clean |
| Runtime self-governs | `constitution.json` | `govern self-test constitution.json` | 5/5 proven |
| Runtime ratchet at floor | `KNOWN_GAPS.md` | `govern ratchet constitution.json` | at baseline (0) |
| Loader works | `scripts/nc/_canonical.mjs` | `node scripts/nc/loader-self-test.mjs` | `NEGATIVE_CONTROL_OK` |

## 2. Domain evidence

| Claim | Constitution | Command | Expected |
|---|---|---|---|
| Design gates proven | `domains/design/` | `govern self-test domains/design/constitution.json` | 5/5 proven |
| Design governed | `domains/design/` | `govern audit domains/design/constitution.json` | GOVERNED |
| Monetization gates proven | `domains/monetization/` | `govern self-test domains/monetization/constitution.json` | 3/3 proven |
| Monetization governed | `domains/monetization/` | `govern audit domains/monetization/constitution.json` | GOVERNED |
| Justice gates proven | `domains/justice/` | `govern self-test domains/justice/constitution.json` | 2/2 proven |
| Justice governed | `domains/justice/` | `govern audit domains/justice/constitution.json` | GOVERNED |
| Audit gates proven | `domains/audit/` | `govern self-test domains/audit/constitution.json` | 2/2 proven |
| Audit governed | `domains/audit/` | `govern reconcile specs/enterprise.govern.yaml && govern audit domains/audit/constitution.json` | GOVERNED |
| Forge gates proven | `domains/forge/` | `govern self-test domains/forge/constitution.json` | 2/2 proven |
| Forge governed | `domains/forge/` | `govern audit domains/forge/constitution.json` | GOVERNED |
| Family gates proven | `domains/family/` | `govern self-test domains/family/constitution.json` | 2/2 proven |
| Family declared, not governed | `domains/family/` | `govern audit domains/family/constitution.json` | valid; K₃ (court vacant) |
| All domains valid | — | `govern validate` on each of the 7 constitutions | valid |

## 3. Enterprise evidence

| Claim | Artifact | Command | Expected |
|---|---|---|---|
| Enterprise reconciled | `specs/enterprise-audit.jsonl` | `govern reconcile specs/enterprise.govern.yaml` | exit 0, all domains mirrored |
| Enterprise composed | `specs/enterprise-constitution.json` | `govern compose specs/enterprise.govern.yaml` | 4/4 contracts enforceable |
| Registry drift check | `check-gate-registry-drift.mjs` | `node check-gate-registry-drift.mjs` | 5 portal + 5 govern gates agree |
| Design meta-gate | `gate-self-test.mjs` | `node gate-self-test.mjs` | 5/5 proven |
| Portal registry intact | `gates.json` | re-run meta-gate twice | no null NCs, no `.bak` residue |

## 4. The "run twice" discipline

Every NC and gate should be run **twice** in CI — once to prove it passes, once to prove it left no residue (temp dirs, corrupted registries, stale backups). The self-test NC regression (recursive restore clobber) was caught by running the meta-gate twice and inspecting `gates.json` integrity afterward.

## 5. Evidence-class provenance

| Evidence class | Where it appears |
|---|---|
| `primary-source` | canonical source files: `theme-store.ts`, `ledger.ts`, `index.ts` |
| `test-suite` | `src/govern.test.ts`, gate NCs |
| `deploy-log` | justice J-001 root cause |
| `api-response` | entitlement live check |
| `compiler` | `tsc --noEmit` clean |
| `legal-record` | evidence-chain dual-signed entries (structural; crypto verification pending — see KNOWN_GAPS) |