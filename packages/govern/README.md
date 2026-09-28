# P31 Universal Governance Guide

> This is the documentation of the `@p31ca/govern` runtime — written LAST so it
> cannot drift from what the runtime enforces. The runtime is the load-bearing
> artifact; a domain that conforms to `constitution.schema.json` is governed
> without building its own enforcement. The guide describes the seam; the
> schema types it; the constitutions are its data.

## What this is

P31 has three governance domains — design, monetization, justice — each with its
own vocabulary, failure modes, and regulatory surface. But the same governance
primitives recur in every domain. The universal runtime abstracts them so that
**governing a new domain is declaring a constitution, not porting a system.**

The field converged on this: a "governance seam" that every domain implements,
where the interception contract returns the same shape so governance never
drifts across domains. `@p31ca/govern` is that seam.

## The runtime

```
govern validate <constitution.json>    # does the domain conform to the schema?
govern self-test <constitution.json>   # every gate proves it can fail
govern ratchet <constitution.json>     # every ratchet is enforced
govern audit  <constitution.json>      # full pass → structured audit event
govern init   <domain>                 # scaffold a conformant empty constitution
```

A pass emits a structured audit event. A fail emits a violation + a required
remedy. Every domain returns the same shape.

## The seven primitives

1. **Canonical source** — one artifact is the truth; mirrors are generated.
   The parity gate makes staleness a build failure.
2. **Gate** — deterministic pass/fail with `state` (OBSERVATIONAL/WARNING/
   BLOCKING), `owner`, `scope`, `remediation`.
3. **Negative control** — every gate must prove it can fail. A gate that
   passes its own negative control is GATE IS FURNITURE.
4. **Ratchet** — shrink-only debt baseline: prevent growth, and lock the gain
   when headroom exceeds the threshold.
5. **Runbook** — six-section compounding procedure with owner + last-verified.
6. **Lesson** — incident → proven (or explicitly "unproven") root cause →
   prevention that resolves to a real runbook/gate.
7. **Fleet registration** — every rule names its enforcement moment.

## The domain constitution

Every domain declares the same shape (`constitution.schema.json`). The
structure is identical; only the content changes:

```yaml
schema: https://p31ca.org/schemas/govern/constitution.schema.json
domain: <design | monetization | justice | ...>
canonicalSource: { path, description }
mirrors: [{ path, generatedFrom, parityGate }]
gates: [{ id, command, state, owner, scope, remediation, negativeControl, enforcementMoment }]
ratchets: [{ id, baseline, countSource, lockThreshold }]
runbooks: [{ id, path, owner, lastVerified }]
lessons: [{ id, rootCause, prevention }]
fleet: [{ rule, moment }]
review: { who, artifact, cadence, onFailure }
```

## The enforcement chain (same for every domain)

```
CANON → GENERATE → PARITY → NEGATIVE → RATCHET → REGISTER → REVIEW
```

| Stage | Design | Monetization | Justice |
|---|---|---|---|
| **Canon** | `theme-store.ts` | entitlement x402.ts + revenue-ledger schema | evidence-chain schema + custody rules |
| **Generate** | tokens.css, DTCG | API docs, pricing pages, x402 manifest | case metadata, audit log |
| **Parity** | token-parity gate | ledger-vs-summary check | custody-chain verification |
| **Negative** | nan.css fixture | fake ledger entry | tampered evidence hash |
| **Ratchet** | orphan allowlist (15) | stale-payment count | unresolved case count |
| **Register** | gate:self-test | entitlement-preflight | custody gate + dual-signature |
| **Review** | H1–H4 human gates | revenue sign-off | legal review |

## The bootstrapping rule

A new domain enters as **declared** (a valid constitution) but **not yet
governed**. Its gates start `OBSERVATIONAL`; they graduate to `WARNING` when
their first negative control passes; they graduate to `BLOCKING` when the
canonical source has a parity gate. Governance is earned by proof, not asserted
by declaration. `govern audit` fails honestly until the domain is governed —
this is a feature, not a defect.

## The meta-governance layer

- **Who checks the thing that checks?** `govern self-test` runs every gate's
  negative control. The runtime's own negative control (a furniture gate must
  be caught) is verified.
- **Who prevents weakening?** Ratchets run from a base-branch copy the agent
  cannot control; diffs that weaken a gate are rejected.
- **Who keeps it from rotting?** `lastVerified` on every runbook + a named
  cadence owner in each constitution's `review` block.

## Compliance backbone

| NIST AI RMF function | Runtime mechanism |
|---|---|
| Govern | `govern audit` passing on the domain's constitution |
| Map | the parity gate confirming canonical vs mirror |
| Measure | the ratchet's prevent-growth + lock-the-gain |
| Manage | the negative controls proving each gate can fail |

ISO 42001 provides the certifiable AIMS; EU AI Act Articles 13–15 map to the
audit chain, human sign-off points, and negative-control discipline.

## Anti-pattern catalog

| Anti-pattern | Fix (itself negative-controlled) |
|---|---|
| Green-by-absence | the negative control |
| Furniture | the fleet registration + enforcement moment |
| Hand-edited mirror | the canonical source + the generator |
| Asserted root cause | the reproduction requirement |
| Unanchored verdict | the `verifiedAt` field |
| Weakened gate | the anti-gaming ratchet |
| Unapproved baseline | the human approval gate |
| Config blast radius | the blast-radius check |

## Instantiate a new domain

1. `govern init <domain>` — scaffolds a conformant empty constitution.
2. Declare the canonical source + mirrors.
3. Declare the gates (each with a negative control).
4. Set the ratchets (baseline + count source).
5. Write the runbooks; seed the lessons.
6. Name the review owner + cadence.
7. `govern audit <domain>` — it fails honestly until the domain is governed.

The guide is the skeleton. Each domain grows its own flesh. The skeleton
doesn't change.