# P31 Maturity Model (PMM)

**Date:** June 15, 2026 — Updated with v1.1 refinements
**Status:** v1.1 — Live standard
**Scope:** Every file, app, feature, and artifact in the P31 ecosystem
**Schema:** `PMM_SCHEMA=1.1`

A unified, glanceable grading scale that tells you exactly where an artifact stands without reading its source.

---

## Growth Stages

Every P31 artifact is at one of five growth stages, using the existing P31 plant metaphor:

```
🌱 SEED     ─→  🌿 SPROUT  ─→  🌳 SAPLING  ─→  🌸 BLOOM  ─→  🍎 FRUIT
  idea          scaffold        functional      production     sovereign
```

| Stage | Badge | Meaning | Risk |
|-------|-------|---------|------|
| **SEED** | `🌱` | Concept only. Placeholder, empty file, `// TODO`, or `throw new Error('Not implemented')`. | Do not rely on. Do not deploy. |
| **SPROUT** | `🌿` | Structure exists. Stub functions, return null/empty, mock data. Might compile. No real logic. | Usable as reference. Not functional. |
| **SAPLING** | `🌳` | Core path works. Real implementation with edge cases missing. Minimal tests (<50% cov). Basic docs. | Functional but fragile. Manual deploy. |
| **BLOOM** | `🌸` | Production quality. Full test coverage (≥50%), CI/CD, documented, dependency-scanned. | Reliable. Deploy with confidence. |
| **FRUIT** | `🍎` | Sovereign. Self-healing, monitored, auto-recovery, zero-downtime deploys, full OQE. | Autonomous. Operator can ignore it. |

The **overall stage** is the lowest dimension score (weakest-link model). A file with CODE:4, TEST:1 is SEED, not BLOOM.

### Exemption Flag

Intentionally ephemeral files (temp scripts, scratchpads, one-off migrations) may flag `[EXEMPT: DOCS]` or `[EXEMPT: SEC]` to indicate a dimension is intentionally absent. This is noted in the label:

```
🌱 [SEED] scripts/migrate-temp.mjs
  CODE:2 · TEST:1 · DOCS:1[EXEMPT] · OPS:1 · SEC:1
  → One-off migration script. No docs needed.
```

Exemptions are **never** granted for CODE or TEST — every artifact that ships must implement and test.

---

## Five Dimensions

Each artifact is scored 1-5 across five dimensions. The stage is determined by the **minimum** score.

### CODE — Implementation Completeness

| Level | Criteria | Examples |
|-------|----------|---------|
| 1 | Placeholder: empty file, `// TODO`, commented-out code, `throw new Error()` | `firmware/node-one/stubs/` |
| 2 | Scaffold: function signatures, type definitions, return defaults/null. Compiles but does nothing useful. | Config files, type-only modules |
| 3 | Core paths work: primary use case runs end-to-end. Error handling for happy path only. | `deployment.ts` at 3% (structure exists, minimal logic tested) |
| 4 | Complete: all paths implemented, input validation, error recovery, logging. | `agent-engine.ts` at 81% |
| 5 | Hardened: optimized, stress-tested, no known bugs, graceful degradation under load. | — |

### TEST — Test Coverage & Quality

| Level | Criteria | Examples |
|-------|----------|---------|
| 1 | No test file exists. Or test file exists but all fail. | Most `software/packages/node-zero/src/` files |
| 2 | Minimal tests (<5 assertions). Only happy path. Tests are commented out or skipped. | — |
| 3 | Core paths tested. 15-50% statement coverage. Some edge cases. | `p31-delta-hiring` at 19% |
| 4 | Comprehensive. >50% coverage. Edge cases, error states, integration tests. CI enforces minimum. | `agent-engine` at 57% |
| 5 | Full coverage. >80% stmts. Property-based/fuzz tests. Performance regression tests. CI fails on regression. | — |

### DOCS — Documentation

| Level | Criteria | Examples |
|-------|----------|---------|
| 1 | No documentation. File exists with zero comments. No README. | Most `software/packages/node-zero/src/` |
| 2 | README with one-liner purpose statement. No usage examples. | — |
| 3 | README with usage, API surface, install instructions. Inline comments for complex logic. | `agent-engine/README.md` |
| 4 | Architecture docs, decision records (ADRs), typed API docs. Runbook for operations. | `admin/SOULSAFE_v1.0.md` |
| 5 | Full spec, troubleshooting guide, disaster recovery, design rationale, video walkthrough. | — |

### OPS — Operations & Deployability

| Level | Criteria | Examples |
|-------|----------|---------|
| 1 | Cannot deploy. No build script, no config, no deploy mechanism. | `firmware/` stubs |
| 2 | Manual deploy possible (copy files, install deps by hand). | Most `software/packages/` |
| 3 | Scripted deploy (shell script, wrangler CLI). Deploy takes <5 commands. | `p31ca.org` (wrangler deploy) |
| 4 | CI/CD pipeline. Auto-deploys on merge. Rollback capability. | `bonding.p31ca.org` |
| 5 | Monitoring, alerts, auto-recovery, zero-downtime deploy, canary releases. | `command-center` worker |

### SEC — Security Posture

| Level | Criteria | Examples |
|-------|----------|---------|
| 1 | No review. Secrets might be present. No input validation. | — |
| 2 | Known vulnerabilities unaddressed (outdated deps, `npm audit` warnings ignored). | — |
| 3 | Dependencies scanned (`pnpm audit` clean). Secrets scanned. Basic input validation. For frontend: audit excludes dev deps (`--omit=dev`) since dev-only vulns never ship. | — |
| 4 | SAST/DAST run. CSP headers. XSS/CSRF protection. Rate limiting. | `p31ca.org` |
| 5 | Formal security review. Penetration tested. Bug bounty ready. Audit trail. | — |

---

## Glanceable Label Format

Every artifact gets a label at top of its README or file header:

```
PMM_SCHEMA=1.1
🌳 [SAPLING] p31/agent-engine
  CODE:3 · TEST:3 · DOCS:2 · OPS:1 · SEC:2
  → Weakest: OPS (manual deploy only)
```

Single file:

```
PMM_SCHEMA=1.1
🌿 [SPROUT] firmware/BLE/stubs/gatt-server.c
  CODE:2 · TEST:1 · DOCS:1[EXEMPT] · OPS:1 · SEC:1
  → Stub only. Not functional.
```

---

## Current Baseline (June 15, 2026 — v1.1)

Applied to the major codebase areas:

| Artifact | Stage | CODE | TEST | DOCS | OPS | SEC | Notes |
|----------|-------|------|------|------|-----|-----|-------|
| `agent-engine` | 🌳 SAPLING | 3 | 3 | 2 | 1 | 2 | Strong core, poor ops |
| `shared/ui/p31-shared` | 🌸 BLOOM | 4 | 4 | 2 | 3 | 3 | Tested UI, partial coverage |
| `shared/trust` | 🌳 SAPLING | 3 | 3 | 2 | 1 | 2 | EigenTrust works, tests fixed |
| `p31-delta-hiring` | 🌳 SAPLING | 3 | 2 | 3 | 2 | 2 | Working but minimal tests |
| `bonding` | 🌸 BLOOM | 4 | 4 | 3 | 4 | 3 | Production game |
| `firmware/` stubs | 🌱 SEED | 1 | 1 | 1 | 1 | 1 | All stubs |
| `p31ca.org` | 🌸 BLOOM | 4 | 3 | 3 | 4 | 3 | Live site |
| `command-center` worker | 🌸 BLOOM | 4 | 2 | 3 | 4 | 3 | Live monitoring |
| Root vitest config | 🌿 SPROUT | 3 | 1 | 1 | 2 | 1 | Meta-suite, no own tests |
| CI pipeline | 🌿 SPROUT | 2 | 1 | 1 | 1 | 1 | Just created, untested |

---

## Quick Assessment Checklist

To grade any file or feature in <30 seconds:

1. **Does it compile/build?** No → SEED. Yes → continue.
2. **Does it have any implementation beyond stubs?** No → SPROUT. Yes → continue.
3. **Does it have test files?** No → SAPLING max. Yes → check coverage.
4. **Does it have a README?** No → subtract 1 from DOCS.
5. **Can it be deployed?** Not at all → max OPS 1. Manual → 2. Script → 3. CI → 4.
6. **Overall = lowest dimension score.**

---

## Relationship to Existing Systems

| Existing System | Maps To | Notes |
|----------------|---------|-------|
| SOULSAFE WCD-06 | BLOOM gate | WCD-06 APPROVED = artifact must be BLOOM or FRUIT |
| Launch Readiness (0-100) | SAPLING/BLOOM boundary | 85+ = BLOOM threshold |
| Seed/Sprout/Sapling (BONDING) | Direct match | Same naming, now extended to Bloom/Fruit |
| REFLEX/PATTERN/FULL (spoons) | Operator state, not artifact | Independent scale |
| OQE requirement | FRUIT gate | OQE required for FRUIT, recommended for BLOOM |
| OSSF Scorecard | SEC dimension | Maps to SEC 3-4 |

---

## Promotion Rules

Move an artifact up one stage only when ALL dimensions meet the next level:

- **SEED → SPROUT:** Any real code beyond stubs (CODE:2+)
- **SPROUT → SAPLING:** Core path functional (CODE:3) + at least one test exists (TEST:2+)
- **SAPLING → BLOOM:** Full implementation (CODE:4) + ≥50% coverage (TEST:4) + docs (DOCS:3) + scripted deploy (OPS:3) + deps scanned (SEC:3)
- **BLOOM → FRUIT:** All dimensions ≥4 + CI/CD (OPS:4) + monitoring + full OQE

---

## Usage

Add the PMM label to:
- Every `README.md` (top of file)
- Every WCD (in the header metadata)
- Every CWP (in the status section)
- Pull request descriptions (to show impact on grade)

Run `scripts/grade-artifact.sh <path>` for automated scoring of a given path.
