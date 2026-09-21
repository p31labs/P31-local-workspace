# Loom — decision record

The decisions that shaped the Loom, with the reasoning, so a future
contributor can tell a deliberate choice from an oversight.

---

## 001 — Event log is the source of truth; state is derived

**Decision.** Every visible state is a pure function of the append-only event
log. No component owns domain state; every component reads the log.

**Why.** Replay, undo, and portability all require it. The log is the only
thing that must survive a version change; everything else is rebuildable.

**Consequences.** The four log scans (human count, latest proposal, artifact
color ×2) were consolidated into a single `useLoomProjection` hook memoized
by `events.length`. The log is immutable (`appendEvent` returns a new array),
so array identity is the correct memo key.

---

## 002 — Snapshots are an optimization, not an event kind

**Decision.** `view.save` is a bookmark a human marks, not a snapshot
mechanism. Log projections are memoized by `seq`; a materialized snapshot
would be a read-only auxiliary value, not an event.

**Why.** The event-sourcing research is explicit: *"Snapshots are an
optimisation for that replay, never a source of truth."* The invariant is
`state = events.reduce(applyEvent, initial)`. A snapshot that becomes an
event breaks that invariant.

**Status.** The log is small (a family's worth of events). Memoization is
sufficient. If replay time ever matters, a snapshot is a derived value
beside the log, not an entry in it.

**Naming.** The static deploy's `events.seed.json` is a build-time seed of
the demo journey — it is **not** a snapshot in the event-sourcing sense. The
filename says "seed," not "snapshot," so the two never collide.

---

## 003 — Sound is opt-in, off by default

**Decision.** `useLoomSound` reads `false` on first visit. A stored `'on'`
from a previous session is the only thing that turns it on. The
`prefers-reduced-motion` query is deliberately *not* used to decide the
default.

**Why.** The strictest interpretation of WCAG 1.4.2 (Audio Control) is no
auto-play at all — which sidesteps the criterion rather than satisfying it.
Sound is off until the child asks. Every cue has a visual equivalent; the
`play()` return value is never used to gate a visual.

---

## 004 — Reduced motion collapses duration, never disables animation

**Decision.** `prefers-reduced-motion: reduce` sets `--motion-scale: 0.01`.
It never sets `animation: none`.

**Why.** The chapter phase machines are driven by `animationend`. Setting
`animation: none` would silently stall every chapter at the celebrating
phase. Collapsing duration to near-zero lets `animationend` still fire, so
the celebrated phase lands with no separate code path. The reduced-motion
e2e spec guards against a future regression.

---

## 005 — Single layered stylesheet, not CSS Modules

**Decision.** `index.css` stays a single file wrapped in cascade layers
(`@layer reset, base, tokens, components, utilities, overrides`). No
per-component CSS modules, no selector migration, no `data-testid` layer.

**Why.** The chapter components share a common vocabulary (`.chapter-*`,
`.lumi-*`, `.made-*`). Under CSS Modules, that vocabulary would force a
shared module — one file with extra ceremony, not encapsulation. `@layer`
already solves the reason to want scoping. Class names stay stable, so the
e2e class selectors remain the test contract.

**Consequences.** If `index.css` crosses ~2000 lines, split by layer into
plain files (`base.css`, `chapters.css`, `chrome.css`, `companion.css`) —
still no hashing.

---

## 006 — The launchpad carries two doors

**Decision.** Start (primary, child's arc) and a quiet secondary link,
"See what you and Lumi made" (elder's companion view). The second is a link
in substance — no fill, no shadow — at 48px.

**Why.** The companion view existed but no visible affordance reached it.
An elder who has not been told the URL exists cannot find it. The quiet
secondary control is how the 70-year-old enters without entering the child's
arc.

---

## 007 — The static deploy is a demo, not persistence

**Decision.** The static build serves a pre-seeded `events.seed.json`. The
family member lands in the demo arc; their choices do not persist.

**Why.** A static site has no backend, and the Loom's log is
server-authoritative. A demo is honest; a static deploy that *looked* like
it persisted but silently discarded events would not be.

---

## Open — offline-first persistence (scoped, not decided)

**The question.** The family test may show that the static demo is not enough
— the child asks "where did my thing go." If it does, a static deploy needs a
real log without a backend.

**The architecture (the candidate).** A two-layer log, the offline-first
pattern:
- **Client log** in IndexedDB drives the UI immediately and locally. Appends
  are optimistically applied; reads never wait on the network.
- **Server log** is authoritative. Sync runs when the network is available;
  the client replays its pending events into the server, and the server's
  `seq` is the conflict arbiter.

**The tradeoffs, named so the decision is cheaper when the trigger fires.**
- **Conflict resolution for a two-writer log.** The Loom's gate assigns
  `seq`; a client log and a server log must reconcile who owns the cursor.
  Single-writer-per-session (the canon's existing rule) is the escape hatch:
  one active session owns the log, others read.
- **The sync protocol.** Push-on-connect, pull-on-reconnect, with the
  `last-event-id` SSE pattern already in the middleware as a model.
- **First load with no server.** The client must distinguish "empty log"
  from "server unreachable" — show the demo seed only when there is no local
  log at all.

**The trigger condition.** The family test (see `HUMAN_TEST_PLAN.md`)
showing that non-persistence is a problem worth solving. Until then, the
static demo is the honest state, and IndexedDB is premature.

**Do not start this without the trigger.** It touches the canon's gate and
the middleware — the two things the docs agree not to touch casually.
## 008 — The log is tamper-evident (prev_hash chain)

**Decision.** Every stored record carries a `prev_hash` — SHA-256 of the
previous record's RFC 8785 canonical preimage. The D1 row is
`(seq, ts, data, prev_hash)`; the genesis record's link is `''`. Rewriting,
reordering, or deleting any record breaks the chain at the next seq, and
`GET /api/loom/verify` returns exactly where.

**Why.** The log-as-runtime is only worth claiming if it is provable. The
IETF AAT draft specifies this exact pattern (`prev_hash` via RFC 8785); the
W3C AIVS group wants portable self-verifiable session proofs — `/verify` is
the first half of that. A single field, computed at append, turns the log from
*ordered* to *tamper-evident*.

**Where the hash lives.** The `prev_hash` sits on the *record* (the D1 row),
not inside the `LoomEvent` object. The canon's event union stays frozen — the
event is what it is; the chain is metadata about the storage, kept beside it.
The dev middleware mirrors D1 with a per-log chain sidecar (`.loom/*.chain.jsonl`),
and the e2e `e2e/trust-layer.spec.ts:32` proves a disk tamper breaks the chain.

**The documented gap.** Signatures (ECDSA P-256 per AAT) are not yet present.
The chain proves *something changed and where*; it does not yet prove *who
wrote* a given record beyond the gate's writer-per-kind field. Signature
support is the natural next increment.

## 009 — Identity is LOVE-bound; privacy is structural

**Decision.** A profile may carry a `loveDid` — the LOVE ledger identity. When
bound, the Loom resolves the family member's care proof via
`/api/loom/love/:did` and shows a gentle verified-caregiver presence. The
care proof is derived by `@p31/canon/loom/love` from the ledger's balance
shape — a pure fold whose output is **structurally** verdicts + pools, never
the care events.

**Why.** The log records actions + an optional `humanId`; it is not a person
record. Binding identity to the care economy gives the Loom a real identity
signal (care_score, verified status) and a privacy story: prove care without
exposing intimacy. The proof shape is gated at the module boundary, so the
"never the events" promise is enforced by construction, not by convention.

**Consequences.** `HumanProfile.loveDid` is optional; an unbinding profile is
anonymous. The `verified` threshold is 0.5, mirroring love-ledger's
CARE_THRESHOLD and ProofOfCare.sol. The cross-anchor (`/api/loom/anchor`)
extends the same trust story to the ledger's chain: the Loom's `/verify` head
committed as a `LOOM_HEAD` entry. The anchor write awaits a dedicated
service-to-service token (documented in `LOVE_INTEGRATION.md`); reads are live.

## Related Documents

- `../README.md` — what the Loom is; every decision here shapes this app
- `./STANDARDS.md` — the conformance each decision enables
- `./AUDIT_STANDARDS.md` — the audit-trail positioning #008 enables
- `./LOVE_INTEGRATION.md` — the care-economy bridge #009 decides
- `./HUMAN_TEST_PLAN.md` — the trigger for the open persistence question
- `./CONCEPTS.yml` — the concept registry the decisions define

- `./MAP.md` — the doc index; where this page sits
