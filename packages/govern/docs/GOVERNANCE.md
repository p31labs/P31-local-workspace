# P31 Sovereign Stack — Enterprise Governance Overview

**Status:** Proposed for review
**Version:** 0.3.1 (pending schema bump for `resolutionRoot`)
**Owner:** P31 Labs
**Review cadence:** 24 clean cycles (abdication), human sign-off required
**Generated:** 2026-09-28

---

## 1. What this governs

The P31 Sovereign Stack is seven governed domains — **design, monetization, justice, audit, forge, family, and govern** (the runtime itself) — composed under one enterprise constitution. Each domain declares its own gates, ratchets, runbooks, and lessons in a `constitution.json` that conforms to the P31 constitution schema. The enterprise spec (`specs/enterprise.govern.yaml`) declares seven enterprise domains (design, monetization, justice, audit, forge, family, govern), five inter-domain contracts, and the cross-cutting audit configuration. All seven are fully governed: every domain carries a four-party K₄ review with BLOCKING gates.

The runtime (`@p31ca/govern`) is the seam: the same seven primitives — canonical source, gates, negative controls, ratchets, runbooks, lessons, fleet — apply to every domain. A domain that does not validate is not a domain.

## 2. The four-party review (K₄)

Every BLOCKING domain requires a four-party review: **user** (consumes the guarantees), **issuer** (issues gates and contracts), **ledger** (records audit events — a system credential), and **court** (independent arbitration). Four distinct parties, not four distinct labels. The review is the enforcement of co-equality: no single party can sever the domain.

| Domain | user | issuer | ledger | court |
|---|---|---|---|---|
| design | design-consumer | p31-governance-issuer | genesis-chain | design-reviewer |
| monetization | monetization-consumer | monetization-engineer | monetization-genesis-chain | monetization-reviewer |
| justice | justice-participant | justice-engineer | justice-genesis-chain | justice-reviewer |
| audit | audit-consumer | audit-runtime | enterprise-genesis-chain | audit-reviewer |
| forge | forge-consumer | forge-runtime | forge-genesis-chain | forge-reviewer |
| govern | govern-consumer | govern-runtime | genesis-chain | govern-reviewer |
| family | child | family-guardian | family-genesis-chain | p31-family-reviewer |

**Known tensions:**
- **Resolved (2026-09-29):** the design domain's issuer was `design-core`, which is also a gate owner — a K₄ conflict. Built up by naming a distinct governance-layer issuer: `p31-governance-issuer` issues the constitution and approves governance contracts, while `design-core` remains the gate owner/maintainer. Four parties are now genuinely distinct.
- **Resolved (2026-09-29):** the family domain's court was vacant (K₃). Built up by naming `p31-family-reviewer` — a governance-layer reviewer distinct from the family-guardian — and promoting both CRADLE gates to BLOCKING. Family is now fully governed and a member of the enterprise timeline (318 blocks reconciled).

## 3. The negative-control contract

A gate is furniture unless it can prove it can fail. Every gate carries a negative control: a fixture or mutation that must make the gate exit non-zero. The strong contract: **the NC must exit 0 and emit the literal string `NEGATIVE_CONTROL_OK`**. Exit 0 without the marker = the NC did nothing. Exit non-zero = the NC or gate is broken.

As of the current wave, all five design gates, all three monetization gates, and both justice gates have fixture-write NCs that exercise the **gate command** (not the detection logic directly). The gate scripts emit `GATE_PASS` / `GATE_FAIL` / `GATE_UNRUNNABLE` markers, making PASS-vs-SKIP distinguishable.

## 4. The Genesis chain

Each domain writes only to its own `.govern-audit.jsonl` chain. The enterprise timeline (`specs/enterprise-audit.jsonl`) is built by mirroring: `govern reconcile <enterprise.yaml>` reads every domain chain tail and appends mirror blocks for any `currentHash` not already present. The enterprise chain is never written to directly by a domain. This is the decoupled design.

The audit domain's own chain is excluded from its orphan-blocks ratchet: the reconciler cannot be its own orphan (infinite regress). The court vertex of K₄ is the check on the reconciler, not the reconciler's own ledger. This exclusion is documented as a time-bound exception in the audit constitution's `aspirational[]`.

**Cadence note:** the audit domain's orphan-blocks ratchet measures reconciliation lag. It is expected to be non-zero immediately after any domain audit and returns to baseline after `govern reconcile`. The correct CI cadence is `reconcile → audit → reconcile`.

## 5. What is enforced, and what is declared

| Domain | Gates | State | Self-test | Audit |
|---|---|---|---|---|
| design | 5 | BLOCKING | 5/5 proven | GOVERNED |
| monetization | 3 | BLOCKING | 3/3 proven | GOVERNED |
| justice | 2 | BLOCKING | 2/2 proven | GOVERNED |
| audit | 2 | BLOCKING | 2/2 proven | GOVERNED (after reconcile) |
| forge | 2 | BLOCKING | 2/2 proven | GOVERNED |
| govern | 5 | BLOCKING | 5/5 proven | GOVERNED |
| family | 2 | BLOCKING | 2/2 proven | GOVERNED |

**Honest boundary:** the monetization and justice gate commands now invoke real canonical logic and are driven by `--state` fixtures in the NCs. However, the count sources for their ratchets (`stale-payment-debt`, `unresolved-cases`) return `{"count": 0}` because the D1/Durable Object stores are not reachable from the local runtime. The ratchets are wired, not yet enforcing against production debt. Disclosed in KNOWN_GAPS G1.

## 6. The enterprise contracts

The five inter-domain contracts, as enforced by `govern compose` (the composer refuses a contract whose provider gate is not BLOCKING):

| Contract | Provider | Consumers | Provider gate | Enforced |
|---|---|---|---|---|
| documents-are-canonical | forge | design, monetization, justice, audit | system-test | ✅ |
| design-tokens-stable | design | monetization, justice, audit | canon-purity | ✅ |
| entitlement-events-recorded | monetization | justice, audit | revenue-ledger-integrity | ✅ |
| evidence-custody-verified | justice | monetization, audit | evidence-chain-verify | ✅ |
| runtime-validates-domains | govern | design, monetization, justice, audit | govern-self-test | ✅ |

---

## 7. Document hierarchy

This overview is the **policy** layer. The compliance mapping (`COMPLIANCE.md`) is the **standard** layer. The runbook index (`RUNBOOKS.md`) is the **procedure** layer. The evidence register (`EVIDENCE.md`) is the **evidence** layer. The known-gaps ledger (`KNOWN_GAPS.md`) is the **meta** layer. Each lower layer must operate within the scope of the layers above it.