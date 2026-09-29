# P31 Sovereign Stack — Enterprise Compliance Mapping

**Status:** Proposed for review
**Generated:** 2026-09-28
**Source:** `specs/enterprise.govern.yaml` via `govern compose`

> This is the artifact that names every contract, its provider gate, its state, and its enforcement moment. Do not edit by hand — edit the enterprise spec and re-run `govern compose`.

---

## 1. The inter-domain contracts

| Contract | Provider | Consumers | Provider gate | Gate state | Enforced? |
|---|---|---|---|---|---|
| documents-are-canonical | forge | design, monetization, justice, audit | system-test | BLOCKING | ✅ |
| design-tokens-stable | design | monetization, justice, audit | canon-purity | BLOCKING | ✅ |
| entitlement-events-recorded | monetization | justice, audit | revenue-ledger-integrity | BLOCKING | ✅ |
| evidence-custody-verified | justice | monetization, audit | evidence-chain-verify | BLOCKING | ✅ |
| runtime-validates-domains | govern | design, monetization, justice, audit | govern-self-test | BLOCKING | ✅ |

**What "enforced" means here:** the provider gate is BLOCKING (the composer refuses a contract on a non-BLOCKING gate), the gate has a fixture-write NC that proves it can fail, and the gate command invokes real canonical detection logic. It does **not** mean the gate has been run against live production state — the `--state` fixtures are the proof of failure, not a live DB query.

## 2. Regulatory mapping

### NIST AI RMF

| Function | Enterprise mechanism |
|---|---|
| **Govern** | The enterprise constitution — 5 inter-domain contracts, all BLOCKING. |
| **Map** | The canonical source (`enterprise.govern.yaml`) + the mirror references. |
| **Measure** | The `cross-domain-violations` ratchet (baseline 0) + the per-domain audits. |
| **Manage** | The contract runbooks + the four-party K₄ review. |

### ISO/IEC 42001

The enterprise maintains a certifiable AIMS (AI Management System) via:
- **Documented policy** — this constitution + the 7 domain constitutions
- **Defined roles** — the four-party K₄ review (user, issuer, ledger, court)
- **Documented processes** — the runbooks (each gate's remediation points at one)
- **Evidence discipline** — the OQE requirement on every gate

### EU AI Act

| Article | Enterprise mechanism |
|---|---|
| **Art 13 (Transparency)** | The Genesis Block audit chain (`genesis`) — every action is traceable. |
| **Art 14 (Human oversight)** | The `review` block — abdication requires human sign-off; gates cannot self-promote to BLOCKING. |
| **Art 15 (Accuracy/robustness)** | The inter-domain contracts + the cross-domain ratchet + the negative controls. |

## 3. Evidence classes

Every gate's `oqe.evidenceClass` names the class of evidence that justifies it. The runtime recognizes seven classes:

| Class | Meaning | Example in this stack |
|---|---|---|
| `primary-source` | The canonical file itself | `theme-store.ts` (design), `ledger.ts` (monetization), `index.ts` (justice) |
| `test-suite` | A passing test suite | `src/govern.test.ts` (23/23) |
| `deploy-log` | A deployment record | justice evidence chain (J-001 root cause) |
| `api-response` | A live endpoint response | entitlement preflight (live check) |
| `doi` | A published identifier | reserved for research-track claims |
| `legal-record` | A court-admissible record | evidence-chain entries (dual-signed) |
| `compiler` | Compiler output | `tsc --noEmit` clean |

## 4. Cross-cutting governance

- **Identity:** `packages/canon/src/theming/theme-store.ts` (role-typed; DIDs pending — human move)
- **Capacity:** spoon-dial (0–5) — at capacity 0 all mutation surfaces render read-only
- **Audit:** `genesis` chain via `jsonl-hash-chain` sink, reconciled by `govern reconcile`

## 5. Known disclosure

The monetization and justice **gates** are enforced (fixture-write NCs, real canonical logic). Their **ratchets** (`stale-payment-debt`, `unresolved-cases`) are wired but return `{"count": 0}` because the D1/Durable Object stores are not reachable from the local runtime. The ratchets measure local-only state until a live read-only summary endpoint is configured. See KNOWN_GAPS G1.