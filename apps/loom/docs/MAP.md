# Loom — documentation map

One screen. Where every doc lives, what it's for, and how they connect.

## The docs

| Doc | For | Read it when |
|---|---|---|
| [`README.md`](../README.md) | A visitor landing in the app cold | You want to know what the Loom is, who it's for, and how to run it |
| [`STANDARDS.md`](./STANDARDS.md) | A reviewer checking conformance | You're about to change a target size, a motion rule, or an AAF attribute |
| [`DECISIONS.md`](./DECISIONS.md) | A future contributor | You're wondering why something is the way it is, or what's still open |
| [`HUMAN_TEST_PLAN.md`](./HUMAN_TEST_PLAN.md) | Whoever is running the family test | You're about to put the app in front of a human |
| [`PORTING_AGENT_BRIEF.md`](./PORTING_AGENT_BRIEF.md) | Whoever is porting a new app into the canon | You're starting a new app that consumes `@p31/canon` |
| [`AUDIT_STANDARDS.md`](./AUDIT_STANDARDS.md) | An auditor, a procurement reviewer, a standards-body reader | You want the Loom's log positioned against GAR / AAT / EU AI Act |
| [`LOVE_INTEGRATION.md`](./LOVE_INTEGRATION.md) | Anyone bridging the Loom and the care economy | You're wiring identity / care proof / the cross-anchor |
| [`ACCESS_RUNBOOK.md`](./ACCESS_RUNBOOK.md) | Whoever flips the API gate from OFF to ON | You have 5 minutes and the Zero Trust dashboard |
| [`CONCEPTS.yml`](./CONCEPTS.yml) | The concept registry | You want the canonical definition of the log, the gate, Lumi, the artifact… |
| [`PORTING_INVENTORY.md`](./PORTING_INVENTORY.md) | — | Generated. Do not read; the generator reads it. |
| [`DOCS_INVENTORY.md`](./DOCS_INVENTORY.md) | — | Generated. Do not read; the generator reads it. |

## How the pieces fit

```mermaid
graph LR
  README[README] --> STANDARDS
  README --> DECISIONS
  README --> HUMAN_TEST_PLAN
  README --> PORTING_AGENT_BRIEF

  STANDARDS -.conformance.-> DECISIONS
  HUMAN_TEST_PLAN -.trigger.-> DECISIONS
  PORTING_AGENT_BRIEF -.method.-> STANDARDS

  DECISIONS --> |"001 log-as-truth"| LOG[the log]
  DECISIONS --> |"002 snapshots"| SEED[the seed]
  DECISIONS --> |"003 sound"| SOUND[sound opt-in]
  DECISIONS --> |"004 reduced motion"| MOTION[phase machine]
  DECISIONS --> |"005 stylesheet"| CSS[single layered sheet]
  DECISIONS --> |"006 two doors"| COMPANION[the companion view]
  DECISIONS --> |"007 static demo"| PERSIST[persistence - open]
  DECISIONS --> |"008 tamper-evident"| CHAIN[the prev_hash chain]
  DECISIONS --> |"010 SBT anchor"| SBTANCHOR[the SBT anchor]
  DECISIONS --> |"011 code names"| CODENAME[pickle code names]
  DECISIONS --> |"012 scope"| SCOPE[the privacy boundary]
  DECISIONS --> |"013 family view"| FAMILY[one short shared page]
  STANDARDS -.audit trails.-> CHAIN
  CHAIN -.cross-anchor.-> LOVE[the LOVE care ledger]
  SBTANCHOR -.witnesses.-> QPJ[the QPJ portal chain]
  CODENAME -.names.-> LOVE
  SCOPE -.enforced at read.-> CHAIN
  FAMILY -.reads shared only.-> SCOPE
  FAMILY -.provenance one tap.-> CHAIN
  AUDIT[AUDIT_STANDARDS] -.positions.-> CHAIN
  AUDIT -.positions.-> LOVE
  LOVE_INTEGRATION[LOVE_INTEGRATION] --> LOVE
```

## The concept graph

The concepts below recur across the docs and the code. Their canonical
definitions live in [`CONCEPTS.yml`](./CONCEPTS.yml); the weave inserts a link
wherever they appear bare.

- **the log** — the append-only event log; the source of truth every visible
  state folds over. Canonical: `DECISIONS.md` #001.
- **the gate** — the canon's writer-per-kind check. Canonical:
  `packages/canon/src/loom/gate.ts`.
- **Lumi** — the agent's face. Canonical: `apps/loom/src/components/Lumi.tsx`.
- **the companion view** — the elder's window. Canonical: `DECISIONS.md` #006.
- **the canon** — the design system the Loom consumes. Canonical:
  `packages/canon/src/theming/theme-store.ts`.
- **the phase machine** — `waiting → celebrating → celebrated`, driven by
  `animationend`. Canonical: `DECISIONS.md` #004.
- **the artifact** — what the child and Lumi made. Canonical:
  `apps/loom/src/components/MadeArtifact.tsx`.
- **the seed** — `events.seed.json`, the static deploy's demo seed. Canonical:
  `DECISIONS.md` #002.
- **the prev_hash chain** — the log's tamper-evidence layer: each record links
  to the one before it; `/verify` recomputes and names any break. Canonical:
  `packages/canon/src/loom/hash-chain.ts`, `DECISIONS.md` #008.
- **the cross-anchor** — the Loom's `/verify` head committed into the LOVE
  ledger's SHA-256 chain as a `LOOM_HEAD` entry; one provable root. Canonical:
  `packages/canon/src/loom/anchor.ts`, `AUDIT_STANDARDS.md` §5.
- **the care proof** — the privacy-preserving read: what the LOVE ledger
  attests (careScore, verified, pools) without the care events. Canonical:
  `packages/canon/src/loom/love.ts`, `LOVE_INTEGRATION.md` Tier 2.
- **the SBT anchor** — the QPJ portal's client-side SBT chain, witnessed by
  the Loom (per-DID linkage, opaque hash). Canonical:
  `packages/canon/src/loom/anchor.ts`, `DECISIONS.md` #010.
- **code names** — the stable pickle `prefix·suffix` derived from a
  DID/humanId; how the Loom names people without exposing DIDs. Canonical:
  `packages/canon/src/loom/codename.ts`, `DECISIONS.md` #011.
- **the scope boundary** — `personal` / `shared` / `session` (reserved):
  visibility enforced at the read path, never by asking a client to "ignore"
  private records. Canonical: `DECISIONS.md` #012, `SECURITY.md`.
- **the family view** — one short shared page: the artifact, the care circle,
  the last shared moments, provenance one tap away. Canonical:
  `apps/loom/src/components/FamilyView.tsx`, `DECISIONS.md` #013.

## Related Documents

- `../README.md` — the front door; read this map as its companion index
- `./STANDARDS.md` — the conformance the whole corpus claims
- `./DECISIONS.md` — the decisions the concepts above resolve to
- `./HUMAN_TEST_PLAN.md` — the test that decides whether the design works
- `./PORTING_AGENT_BRIEF.md` — the method for the next app
- `./AUDIT_STANDARDS.md` — the audit-trail positioning
- `./LOVE_INTEGRATION.md` — the care-economy bridge
- `./ACCESS_RUNBOOK.md` — the gate-flip procedure
- `./CONCEPTS.yml` — the registry this page renders
- `./SECURITY.md` — the security, privacy, and conformance posture
