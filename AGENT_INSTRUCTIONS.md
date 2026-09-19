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

`appendEvent` is internal. It is reachable only from `commit.ts`; the seal gate
fails the build if any other module touches it.

## Rules (all agents, no exceptions)

1. **Every write goes through `commit(logPath, input)`.** Never append to the
   log directly. `scripts/check-loom-seal.mjs` enforces this.
2. **The gate stamps `seq` and `ts`.** You never set them.
3. **Writer-per-kind holds.** `focus`, `revise`, `approve`, `reject` are
   human-only. `traverse`, `propose`, `presence` are agent-only.
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

## What is not in the schema yet

Proposals and reviews are the intended lifecycle (propose → review → decide),
but the substrate's event union today is:
`focus`, `traverse`, `propose`, `revise`, `approve`, `reject`, `presence`.
There is no `review` event and no agent-identity field. They arrive when a lane
needs them — not before. Do not invent event kinds to pre-empt that.

## The gates

- `check-no-agent-names.mjs` — no model names anywhere in the Loom surface.
- `check-loom-seal.mjs` — `commit()` is the only writer.
- `test-loom-{replay,gate,determinism,convergence,commit}.mjs` — the substrate
  is deterministic, sealed, and converges across independent processes.
