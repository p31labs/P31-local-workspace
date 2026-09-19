# The Loom — Agent Instructions

The Loom is a shared canvas where a human and one or more agents operate on a
single append-only event log. There is **no fixed set of agents, no fixed
number, and no model vendor baked into the code**. Any process that can read and
write JSONL and follows the rules below is an agent.

This file is the doctrine. It replaces every role-by-model-name assumption. A
model name appearing in the Loom surface is a build failure, not a style note
(`packages/canon/scripts/check-no-agent-names.mjs`).

## The log is the source of truth

Public specifiers (the frozen interface):

| Specifier | Exports | Use |
|---|---|---|
| `@p31/canon/loom/events` | `LoomEvent`, `LoomState`, `reduce`, `replay` | the schema and the fold |
| `@p31/canon/loom/gate` | `ReplayGate`, `canonicalize` | validation + deterministic hashing |
| `@p31/canon/loom/jsonl` | `readEvents`, `nextSeq` | the **read** side |
| `@p31/canon/loom/commit` | `commit(logPath, input)` | the **only** write path |
| `@p31/canon/loom/profiles` | `readProfile`, `writeProfile`, `HumanProfile` | the human profile store (outside the log) |

`appendEvent` is internal. It is reachable only from `commit.ts`; the seal gate
fails the build if any other module touches it.

`packages/canon/scripts/loom-apply.mjs` is the human **apply** step — the
bridge from "approved in the log" to "landed on disk". It reads the log for
approved proposals with no applied marker, materializes the contract file, adds
the export, regenerates the registry, and refuses to land if validate-contracts
or validate-registry fails. "Applied" is a deployment fact, recorded in a
sidecar (`.loom/applied.json`) next to the log, not in the log — the git commit
records the landing. The apply step is a human action, never an agent event
kind: no schema change, no new writer.

A `traverse` event sets the agent cursor to its `to` node — walking the graph
moves the cursor. A `presence` event positions the cursor explicitly and sets
the attention level. Both are agent-only; the reducer records them as
`agentCursor` and `agentAttention`.

## Cursor semantics

`traverse` sets `agentCursor` to its `to` node. It does not move
`agentAttention`. `presence` sets both `agentCursor` (to its `node`) and
`agentAttention`. `review` does **not** move the cursor — a review is a
decision, not a movement. If an agent wants its cursor at the reviewed node,
it posts a `presence` event separately. The taxonomy: movement events move,
decision events decide.

## Rules (all agents, no exceptions)

1. **Every write goes through `commit(logPath, input)`.** Never append to the
   log directly. `scripts/check-loom-seal.mjs` enforces this.
2. **The gate stamps `seq` and `ts`.** You never set them.
3. **Writer-per-kind holds.** `focus`, `revise`, `approve`, `reject` are
   human-only. `traverse`, `propose`, `review`, `presence` are agent-only.
4. **The log is append-only.** Never rewrite, reorder, or mutate history.
5. **You never write `registry.json`, contracts, or CSS.** Only events.
6. **Read through the interface.** `readEvents(path)` to load,
   `replay(events)` or `gate.stateAt(seq)` to fold. Never re-derive state by
   another route; a second derivation is a divergence.
7. **A timeout is a return value, not an exception.** When an await-style call
   lands, return `{ status: 'timeout' }`. Throwing makes the caller retry;
   returning lets it adapt.
8. **The determinism gates are green before you start and after you stop.**
   `npm run test:loom`. If you break it, you broke the substrate.

## Roles — claimed, not assigned

Roles are conventions, not model identities. The set is open; multiple agents
may hold the same role; one agent may hold more than one.

- **substrate** — owns the event schema, the reducer, and the determinism
  gates. Any change to `packages/canon/src/loom/**` requires this role.
- **presence** — owns the MCP tools and the streaming transport.
- **canvas** — owns the rendering surface and the timeline scrubber. Reads the
  log; writes only through `commit()`.

A role-claim event kind does **not** exist yet. Until it does, a role is claimed
by declaring it in your process and honouring the boundaries above. Do not
invent an event kind to carry it.

## Identity

When an event carries an agent identity (the reviewed/proposed changes to the
schema), that field is a **free-form string — not a model name, not a vendor,
not an enum**. Recommended shape: `<role>-<short-id>` (`substrate-a`,
`presence-01`, `canvas-primary`). The choice is yours; the log records it. No
code keys on model identity.

## Delegation

An agent spawned by another agent sets `parentAgent` on its `propose` and
`review` events to its spawner's identity. A top-level agent omits the field.

The log then records the delegation chain: an event's `agent` plus its
`parentAgent`, recursively. This is the audit surface — attribution flows
through the chain. The reducer and gate do nothing with the field; it is data,
not structure.

Nested delegation beyond one level is discouraged. Prefer chained top-level
agents over recursion: AAuth caps delegation chains at one hop, and deep
hierarchies accumulate drift across delegation layers (Agent Drift, 2026).
The gate does **not** enforce this. The log records what happened; the
doctrine advises what should have.

## Drift

Every `revise` computes a survival score: the Jaccard overlap of leaf
`key=value` pairs between the prior body and the new body. The proposal
carries `revisionSurvival` (one entry per revise) and `overallSurvival`
(their mean, or 1.0 with no revisions).

The metric is deterministic, computed without model calls, and agent-agnostic:
it does not care whether a human or an agent wrote the revise. It measures
whether the artifact is holding its shape across the chain. It is a fold of
the log's own bodies, not an external judgment — "the log is the source of
truth" still holds.

A proposal whose survival scores fall below ~0.5 per revision has been
redirected, not refined. That is a signal the human should see.

## The review event

`review` is an agent-authored record of opinion on a proposal at a specific
revision:

```
{ kind: 'review', writer: 'agent', agent: string,
  proposalId: string, decision: 'approve' | 'amend' | 'reject',
  reason?: string, revision: number }
```

Rules enforced by the gate:

- `agent` must be a non-empty free-form string — not a model name.
- `proposalId` must reference an existing proposal.
- `revision` must equal the proposal's current revision. A review on a stale
  revision is rejected — this prevents the approve-v1/reject-v2 ambiguity
  where two reviewers silently disagree about which body they saw.
- `reason` is required (non-empty after trim) when `decision !== 'approve'`.

Agent reviews are advisory records. They do **not** change proposal status.
The human `approve` and `reject` events are the sole authoritative status
transitions. Higher-level semantics — self-review policy, quorum thresholds —
are deliberately out of scope for the schema. Self-review currently records; a
future policy may forbid it at a higher layer.

## Agent reviews and human authority

The `review` event kind exists. Agents post advisory reviews via the schema;
agent reviews do not change proposal status. The human's `approve` and
`reject` events remain the sole authoritative status transitions — no proposal
is approved without a human deciding it, however many agent approvals
accumulate. This preserves the human-in-the-loop guarantee.

Before `review` existed, the human was also the only reviewer. That bootstrap
is now closed: agents review, the human decides.

Changes to the frozen surface (`packages/canon/src/loom/**`) continue to
require human approval. A non-semantic change — a comment, a doc link,
whitespace — may be human-approved and flagged as such in the commit message.
A schema change (anything that alters the `events.ts` union) goes through the
same propose/review cycle agents use; the human is always the final approver.

Changes to the frozen surface that do **not** alter the event union — `gate.ts`,
`commit.ts`, `jsonl.ts`, `log-path.ts` — are human-approved and flagged in the
commit message, the same pattern as non-semantic changes. Only the event union
is a schema change.

## Human diversity

Human-authored events may carry `humanId`, a stable opaque reference — never a
name. The log does **not** carry age, gender, neurotype, digital literacy,
pronouns, or display names. Those live in a profile store outside the log
(`@p31/canon/loom/profiles`, `.loom/profiles/<id>.json`). The canvas resolves
`humanId` against the store to adapt presentation; the log records the action.

The baseline canvas satisfies the accessibility floor — adequate letter and
line spacing, `prefers-reduced-motion` honored, high-contrast tokens, literal
labels, flat navigation (no nested menus — the three-region layout is the
ceiling). The profile tightens or loosens presentation from that floor; it
never drops below it.

Sensory accommodations and tier are **orthogonal**:
- `presentation.*` (motion, letter/line spacing, density, saturation, literal
  labels) applies regardless of tier.
- `tier` (`beginner` | `intermediate` | `advanced`) controls what surfaces —
  the digest, the event overlay, the scrubber, the survival bars, raw JSON.
  It is progressive disclosure: the same `LoomState` behind all three. An
  82-year-old advanced user and a 22-year-old beginner are different people;
  the schema keeps their axes separate.

The profile store is the one surface that carries PII, and it is a separate
store — never the append-only log.

## Mediation

A human may be paired with a mediator agent (not the proposing agent). The
mediator reads `observe()` for the artifact and `readProfile()` for the human's
tier, and rewrites proposal bodies at that tier **for display only**. It never
writes a `review`, `approve`, `reject`, or `revise`; its rewrite is a
render-layer translation, not a log event.

The human's decision in the log is always a decision about the **original**
body, not the mediated one. Mediation is silent: the mediator's read is not
recorded, and the human's decision is the only log entry. A deployment that
needs auditable mediation may post a `presence` event — the schema supports
it — but the reference mediator does not. There are no shadow revisions.

The mediator's read-only constraint is enforced by **code review and by its
location in a sealed directory**, not by the gate. The gate catches structural
violations (writer-per-kind, orphan references, stale revisions); it cannot
detect a mediator that writes a `propose` it should not have. Reviews of the
mediator's code are the enforcement. The `loom_mediate` tool is that surface.

## The gates

- `check-no-agent-names.mjs` — no model names anywhere in the Loom surface.
- `check-loom-seal.mjs` — `commit()` is the only writer.
- `test-loom-{replay,gate,determinism,convergence,commit,profiles}.mjs` — the substrate
  is deterministic, sealed, and converges across independent processes.
