# P31 Sovereign Stack — Runbook Index

**Status:** Proposed for review
**Generated:** 2026-09-28

A runbook is the procedure a gate's remediation points at. It is the "what to do when the gate fires" document. **A gate + runbook is the minimum resilient pair** — a gate alone is a Wye topology (one severance and it floats).

The canonical runbook template (six sections) lives at `/home/p31/production/runbooks/RUNBOOK-TEMPLATE.md`:
**When to use / Prerequisites / Steps / How to verify / Common pitfalls / Owner + last verified**.

---

## 1. Design domain

| Runbook | Guards gate | Status | Location |
|---|---|---|---|
| RUNBOOK-canonical-source | canon-purity, token-audit | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-gate-self-test | self-test | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-baseline-approval | image-distinctness | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-ratchet-wiring | acceptance-ratchet | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-generated-artifact | (canon mirror) | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-config-blast-radius | (config change) | ✅ Exists | `/home/p31/production/runbooks/` |
| RUNBOOK-root-cause-proof | (lesson proof) | ✅ Exists | `/home/p31/production/runbooks/` |

## 2. Monetization domain

| Runbook | Guards gate | Status |
|---|---|---|
| RUNBOOK-monetization-entitlement | entitlement-preflight | ✅ Exists (`domains/monetization/runbooks/`) |
| RUNBOOK-monetization-ledger | revenue-ledger-integrity | ✅ Exists (`domains/monetization/runbooks/`) |

## 3. Justice domain

| Runbook | Guards gate | Status |
|---|---|---|
| RUNBOOK-justice-evidence | evidence-chain-verify | ✅ Exists (`domains/justice/runbooks/`) |
| RUNBOOK-justice-escrow | escrow-multisig | ✅ Exists (`domains/justice/runbooks/`) |

## 4. Audit domain

| Runbook | Guards gate | Status |
|---|---|---|
| RUNBOOK-audit-chain | audit-chain-verify | ✅ Exists (`domains/audit/runbooks/`) |
| RUNBOOK-audit-reconcile | audit-cross-domain-reconcile | ✅ Exists (`domains/audit/runbooks/`) |

## 5. Govern domain (the runtime)

| Runbook | Guards gate | Status |
|---|---|---|
| RUNBOOK-gate-self-test | govern-self-test | ✅ Exists (production repo, via `resolutionRoot`) |
| RUNBOOK-canonical-source | govern-validate | ✅ Exists (production repo, via `resolutionRoot`) |
| RUNBOOK-ratchet-wiring | govern-ratchet | ✅ Exists (production repo, via `resolutionRoot`) |

## 6. Forge domain

| Runbook | Guards gate | Status |
|---|---|---|
| RUNBOOK-forge-pipeline | token-audit, system-test | ✅ Exists (`domains/forge/runbooks/`) |

---

## 6. The runbook gap — resolved

The four monetization/justice runbooks were originally "fixed" in the lessons by changing their prevention string from `gate:entitlement-preflight` to `RUNBOOK-monetization-entitlement + gate:entitlement-preflight` — but the runbooks did not exist. That was green-by-syntax: the Wye check no longer fired because the string contained a `+`, not because the resilient pair was real.

**Status (2026-09-28): resolved.** The four runbooks now exist on disk at `domains/{monetization,justice}/runbooks/`, each following the production six-section template and citing the actual NC corruption class it guards. The path-aware validator (`validateConstitutionAt`) now fails validation on any remediation or runbook reference whose file does not exist, so green-by-syntax can no longer pass.

## 7. Path resolution

Runbook paths in the constitutions resolve against a declared base. The runtime now supports an optional `resolutionRoot` field (schema 0.3.x): when absent, paths resolve against `constitutionRoot` (the constitution's own directory); when present, against `resolve(constitutionRoot, resolutionRoot)`.

- **design**: `resolutionRoot: "../../../../../production"` — runbooks live in the production repo's runbook library.
- **govern**: `resolutionRoot: "../../../production"` — same library.
- **monetization / justice / audit**: no `resolutionRoot` — runbooks live next to their constitution (`domains/{domain}/runbooks/`).

The path-aware validator (`validateConstitutionAt`) and `docs-check` both use this rule, so a runbook reference that does not resolve is a validation failure, not a convention.