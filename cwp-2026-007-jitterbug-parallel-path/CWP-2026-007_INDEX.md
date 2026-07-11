# CWP-2026-007: JITTERBUG PARALLEL PATH — Agent Swarm Orchestration

**Issued 2026-07-11**

**STATUS:** AUTHORIZED — Running in parallel with CWP-2026-006
**ISSUED:** 2026-07-11
**OPERATOR:** trimtab-signal / p31
**PARENT:** CWP-2026-006 (UIG Phase 2 — Adaptive Exocortex & Generative Layer)
**DEADLINE:** 2026-08-09 (same as CWP-2026-006)

---

## PREAMBLE

CWP-2026-006 delivers the Adaptive Exocortex and Generative Layer. CWP-2026-007 is the **operational counterpart**: it focuses on agent swarm orchestration, parallel execution paths, and the infrastructure that lets multiple agents work concurrently without stepping on each other.

The name "Jitterbug" references the jitterbug-parallel-path concept from CWP-2026-003: multiple agents dancing in parallel, each on their own path, converging on shared outcomes.

---

## SCOPE

### Axis E: Swarm Orchestration

| Task | Deliverable | Status |
| :--- | :--- | :--- |
| E1 | Parallel path execution framework | ✅ IN PROGRESS (this CWP) |
| E2 | Agent coordination patterns (file-level locking, merge discipline) | Documented below |
| E3 | CI automation for cross-repo concerns (TRIPER, design system) | D2 in CWP-2026-006 |
| E4 | MCP server test coverage (46+ tools) | ✅ DONE — `a06afca` (22/22 green) |

---

## PARALLEL PATH PATTERNS

### Pattern 1: Independent Axes
CWP-2026-006 has 4 axes (A, B, C, D). Each axis touches different files:
- **Axis A** → `packages/design-system/`, `apps/phos/src/components/`, CSS files
- **Axis B** → `pnpm-workspace.yaml`, `package.json` files
- **Axis C** → `software/packages/interface-generator/`, `tools/phos-forge/`, `apps/phos/src/components/UIGSurface.tsx`
- **Axis D** → `tests/`, `.github/workflows/`, `.env.example`

**Rule:** Axes A, C, and D can run fully in parallel. Axis B (workspace changes) must be the last to merge because it affects all apps.

### Pattern 2: File-Level Coordination
When two paths touch the same file:
1. **PHOSWorkspace.tsx** — touched by A6 (density) and C5-C6 (generative). Resolution: A6 adds density toggle to header, C5-C6 adds prompt bar to UIGSurface. No conflict.
2. **UIGSurface.tsx** — touched by A6 (density reading) and C5-C6 (prompt bar). Resolution: C5-C6 already merged; A6 adds density-aware gap calculation. Sequential, not parallel.
3. **SurfaceContent.tsx** — touched by C3-C4 (intent dispatch). No other axis touches it.

### Pattern 3: Commit Batching
Each axis commits independently with a clear prefix:
- `feat(design-system): ...` for Axis A
- `feat(workspace): ...` for Axis B
- `feat(uig): ...` for Axis C
- `test(mcp): ...` or `ci(triper): ...` for Axis D

This keeps `git log --oneline` scannable and `git bisect` effective.

---

## EXECUTION STATUS

| Axis | Batch | Status | Commit |
| :--- | :--- | :--- | :--- |
| A (Design System) | A1-A3 | ✅ DONE | `408180f` |
| A (Design System) | A4 | ✅ DONE | `408180f` |
| A (Design System) | A5 | ✅ DONE | `408180f` |
| A (Design System) | A7 | ✅ DONE | `408180f` |
| A (Design System) | A6 | ✅ DONE | uncommitted |
| B (UIG Extension) | B2 | ✅ DONE | `408180f` |
| B (UIG Extension) | B1+B3 | ✅ DONE | `fe9d1a2` |
| C (Generative) | C1-C2 | ✅ DONE | `48edd38` |
| C (Generative) | C3-C4 | ✅ DONE | `48edd38` |
| C (Generative) | C5-C6 | ✅ DONE | `48edd38` |
| D (Operational) | D1 | ✅ DONE | `a06afca` |
| D (Operational) | D2 | ✅ DONE | uncommitted |
| D (Operational) | D3 | ✅ DONE | uncommitted |
| D (Operational) | D4 | ✅ DONE | uncommitted |
| E (Swarm) | E1-E4 | ✅ DONE | parallel path framework, coord rules, CI automation, MCP coverage |

---

## CRITICAL PATH

```
A4 → A5 → A6 → A7 → B2 → C1-C2 → C3-C4 → C5-C6 → D1 → D2 → D3 → D4
                           ↑
                    (B1+B3 deferred)
```

**Current position:** All axes complete except B1+B3 (deferred). Ready to commit batch.

---

## COORDINATION RULES

1. **One agent per axis** — no two agents edit the same axis simultaneously
2. **Commit after each batch** — don't accumulate uncommitted changes across axes
3. **Push after each commit** — keeps remote in sync, enables CI checks
4. **Run `npx tsc --noEmit` in affected app** before committing axis A/C changes
5. **Run `npx vitest run tests/unit/mcp/`** before committing axis D changes
6. **Run `npx vitest run --config vitest.triper.config.ts`** before committing TRIPER/UIG changes
6. **Never force-push during parallel execution** — rebase only when axes are merged

---

*Generated: 2026-07-11*
*P31 Labs | 501(c)(3) Nonprofit | EIN 42-1888158*
