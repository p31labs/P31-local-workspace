# The P31 Universal Governance Guide

> This document is written **after** the runtime, so it documents what is
> enforced rather than what is intended. The runtime is the load-bearing
> artifact. A domain that conforms to `constitution.schema.json` is governed
> without building its own enforcement. This guide describes the seam; the
> schema types it; the constitutions are its data.

## What this is

P31 has three governance domains — design, monetization, justice — each with
its own vocabulary, failure modes, and regulatory surface. The same governance
primitives recur in every domain. The universal runtime abstracts them so that
**governing a new domain is declaring a constitution, not porting a system.**

This is a governance seam: a contract every domain implements, returning the
same shape so governance never drifts across domains.

## The runtime

```
govern validate <constitution.json>                     # does the domain conform to the schema?
govern self-test <constitution.json>                    # every gate proves it can fail
govern ratchet <constitution.json>                      # every ratchet is enforced
govern audit  <constitution.json> [--capacity N]        # full pass → Genesis Block audit event
govern diagnose <constitution.json>                     # flag floating-neutral (Wye) topologies
govern abdicate <constitution.json> <cycles> [signoff]  # review cadence terminal state
govern init <domain> [targetDir]                        # scaffold a conformant empty constitution
```

A pass emits a structured audit event. A fail emits a violation + a required
remedy. Every domain returns the same shape. The runtime is portable — relative
paths resolve against the constitution's directory (`constitutionRoot`), never
a hardcoded `/home/p31/...`.

## The seven primitives

1. **Canonical source** — one artifact is the truth; mirrors are generated.
   The parity gate makes staleness a build failure.
2. **Gate** — deterministic pass/fail with `state`, `owner`, `scope`,
   `remediation`, and a required `negativeControl`.
3. **Negative control** — every gate must prove it can fail. A gate that
   passes its own negative control is `GATE IS FURNITURE`.
4. **Ratchet** — shrink-only debt baseline: prevent growth, lock the gain.
5. **Runbook** — six-section compounding procedure with owner + last-verified.
6. **Lesson** — incident → proven (or explicitly *unproven*) root cause →
   prevention that resolves to a real runbook or gate.
7. **Fleet registration** — every rule names its enforcement moment.

## The negative-control contract

The strong contract the runtime enforces: a negative control must **exit 0 AND
emit the literal `NEGATIVE_CONTROL_OK` marker** to prove its gate can fail.

- Exit 0 without the marker → the control did nothing → **furniture**.
- Exit non-zero → the control is broken → the gate cannot be trusted.

The schema's `negativeControl.expected` is `proof-marker` to match what is
enforced. A gate whose negative control cannot prove it fails is furniture.

## The four-party review (K₄)

A `BLOCKING` domain requires the four-party review topology: **User, Issuer,
Ledger, Court**. This is the classical CBS analogue of the tetrahedron — the
deployable primitive.

The Scutum Fidei argument: only four vertices guarantee co-equality. Three
parties collapse to K₃ — planar, no enclosed volume. Two is a line. One is a
point. The topology is what prevents any single party from dominating.

`OBSERVATIONAL` domains may declare a single review credential during
bootstrapping. The four-party requirement is earned, not asserted — it is
required by the validator once a domain's gates are BLOCKING.

**SIC-POVM is research-only** (see `docs/SIC-POVM_RESEARCH.md`). The quantum
measurement is *not* a deployed primitive. The K₄ geometry — equiangularity,
isostatic rigidity, informational completeness — is the design principle the
classical CBS attestation implements. Do not claim SIC-POVM deployment.
Also: **K₄ is planar** (Paper IV correction) — rigidity rests on volumetric
enclosure (β₂=1), not non-planarity.

## The OQE principle

From Paper XIX (SOULSAFE): *"Claims that cannot be traced to OQE are
classified as aspirational and must be clearly labeled as future work."*

Every canonical source, every gate, and every lesson's root cause carries an
`oqe` reference from the seven evidence classes: `test-suite`, `compiler`,
`deploy-log`, `primary-source`, `doi`, `api-response`, `legal-record`. A claim
without traceable evidence is not deleted — it is labeled `aspirational` in the
constitution's `aspirational[]` array. The runtime refuses `valid: true` if any
required OQE is missing.

## The Genesis Block audit trail

`auditLog.chainName` names a domain's chain (the runtime stays generic; the
constitution names it — `"genesis"` matches Paper XII's Genesis Block contract).
Every audit event is appended to a JSONL hash chain:

```
blockNumber, ISO-8601 timestamp, eventType (genesis|audit), payload, prevHash, currentHash
```

SHA-256 over the canonical JSON. Block 0 is the genesis block with a 64-zero
`prevHash`; every subsequent block links to its predecessor's `currentHash`. The
trail is tamper-evident — a claim without an anchored verdict is not a claim.

## Abdication

Paper XXV: *"if it requires the creator to maintain it, it has failed."* After
N clean review cycles (`review.abdication.afterCleanCycles`), a domain becomes
**eligible** to abdicate — governance transitions to self-sustaining. The
transition **always requires explicit human sign-off**
(`requiresHumanSignoff: true` is a schema constant): the Centaur boundary — the
runtime does the work, the human retains final authority.

```
govern abdicate <constitution.json> 12 p31@labs   # eligible + signed → abdicated
govern abdicate <constitution.json> 3             # not eligible (needs 12) or missing signoff → refused
```

## The floating-neutral diagnostic

`govern diagnose <constitution>` flags single-point-of-failure topology. A
domain with a single gate, a single review owner, or a single canonical source
with no mirrors is a **Wye** (star) topology — sever the hub and the domain
floats. The remediation is the **Wye → Delta** transformation: distribute the
reference points so no single severance collapses the system.

```
govern diagnose <constitution.json>   # exits non-zero when Wye risks exist
```

## The capacity model (the spoon dial)

`govern audit --capacity <0-5>` applies the spoon dial to the runtime itself.
At low capacity (`≤1`), only critical violations are emitted to the console;
the full set is always recorded on the Genesis chain. This is the Centaur
boundary: the runtime does the bulk work, the human declares their capacity,
the runtime adapts.

No framework in the enterprise governance landscape has a capacity axis. This
is the P31 moat.

## The enforcement chain (same for every domain)

```
CANON → GENERATE → PARITY → NEGATIVE → RATCHET → REGISTER → REVIEW
```

| Stage | Design | Monetization | Justice |
|---|---|---|---|
| **Canon** | `theme-store.ts` | entitlement x402.ts + revenue-ledger schema | evidence-chain schema + custody rules |
| **Generate** | tokens.css, DTCG | API docs, pricing pages | case metadata, audit log |
| **Parity** | token-parity gate | ledger-vs-summary | custody-chain verify |
| **Negative** | nan.css fixture | fake ledger entry | tampered hash |
| **Ratchet** | orphan allowlist (15) | stale-payment count | unresolved case count |
| **Register** | `gate:self-test` | entitlement-preflight | custody + dual-signature |
| **Review** | K₄ four-party | revenue sign-off | legal review |

## The bootstrapping rule

A new domain enters as **declared** (a valid constitution) but **not yet
governed**. Its gates start `OBSERVATIONAL`; they graduate to `WARNING` when
their first negative control passes; they graduate to `BLOCKING` when the
canonical source has a parity gate and the review declares the four-party K₄.
Governance is earned by proof, not asserted by declaration. `govern audit`
fails honestly until the domain is governed — this is a feature, not a defect.

## The meta-governance layer

- **Who checks the thing that checks?** `govern self-test` runs every gate's
  negative control. The runtime's own negative control (a furniture gate must
  be caught) is verified via `test/negative-controls/`.
- **Who prevents weakening?** Ratchets run from a base-branch copy. The
  anti-gaming check rejects diffs that weaken a gate.
- **Who keeps it from rotting?** `lastVerified` on every runbook + a named
  cadence owner + the `abdication` end state.

The runtime governs itself (`constitution.json`): three BLOCKING gates
(self-test, validate, ratchet), a four-party K₄ review, and the `known-gaps`
ratchet seeded from `KNOWN_GAPS.md` — its own debt, shrink-only, floor locked.

## Compliance backbone

| NIST AI RMF | Runtime mechanism |
|---|---|
| Govern | `govern audit` passing on the domain's constitution |
| Map | the parity gate confirming canonical vs mirror |
| Measure | the ratchet's prevent-growth + lock-the-gain |
| Manage | the negative controls proving each gate can fail |

ISO 42001 provides the certifiable AIMS; the EU AI Act's Articles 13–15 map to
the audit chain, the human sign-off points, and the negative-control discipline.

## The anti-pattern catalog

| Anti-pattern | Fix (itself negative-controlled) |
|---|---|
| Green-by-absence | the negative control |
| Furniture | the fleet registration + enforcement moment |
| Hand-edited mirror | the canonical source + the generator |
| Asserted root cause | the OQE requirement |
| Unanchored verdict | the Genesis Block hash-chain audit trail |
| Weakened gate | the anti-gaming ratchet |
| Unapproved baseline | the human approval gate |
| Config blast radius | the blast-radius check |
| Floating neutral | `govern diagnose` + the Wye → Delta remediation |

## Instantiate a new domain

```bash
govern init <domain> [targetDir]   # scaffold a conformant empty constitution
```

1. Declare the canonical source (+ OQE).
2. Declare the gates (each with a `negativeControl` + `oqe`).
3. Set the ratchets (baseline + count source).
4. Write the runbooks; seed the lessons (each with `oqe`).
5. Declare the four-party K₄ review for BLOCKING, or a single owner for
   OBSERVATIONAL.
6. `govern audit <constitution>` — it fails honestly until the domain is
   governed.

The skeleton doesn't change. The flesh does.