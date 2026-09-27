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

## Open — offline-first persistence (researched, trigger-gated)

**The question.** The family test may show that the static demo is not enough
— the child asks "where did my thing go." If it does, a static deploy needs a
real log without a backend.

**The research settled the engine.** An empirical 2026 comparison of six sync
engines (Zero, PowerSync, ElectricSQL, Yjs, Automerge, ShareDB) found that
**relational engines win on "The Long Now"** (durable local storage, filtered
replication); CRDT engines win on multi-writer collaboration. The Loom's log
is append-only and single-writer-per-session (the gate enforces it) — that is
the **relational** case, not the CRDT case. The candidate is **Zero**
(Rocicorp, 1.0 released mid-2026): relational, no conflict resolver needed
(the server owns the write order), optimistic writes with synchronous
in-memory reads. PowerSync is the alternative only if the Loom ever needs
multi-writer (it does not today); ElectricSQL is read-path only — wrong shape.

**The architecture (the candidate).** A two-layer log, the offline-first
pattern:
- **Client log** in IndexedDB (via Zero) drives the UI immediately and
  locally. Appends are optimistically applied; reads never wait on the
  network.
- **Server log** (D1) is authoritative. Sync runs over the existing SSE
  stream (`last-event-id` resume is already in the middleware); the server's
  `seq` is the conflict arbiter. The `prev_hash` chain (#008) continues to
  hold on both sides — the server recomputes and verifies.

**The tradeoffs, named so the decision is cheaper when the trigger fires.**
- **Conflict resolution for a two-writer log.** The Loom's gate assigns
  `seq`; Zero's server-owned write order removes the conflict resolver. If a
  client logs offline then reconnects, the server replays and re-links the
  chain.
- **The sync protocol.** Push-on-connect, pull-on-reconnect, with the
  `last-event-id` SSE pattern already in the middleware as a model.
- **First load with no server.** The client must distinguish "empty log"
  from "server unreachable" — show the demo seed only when there is no local
  log at all.

**The trigger condition.** The family test (see `HUMAN_TEST_PLAN.md`)
showing that non-persistence is a problem worth solving. Until then, the
static demo is the honest state, and IndexedDB is premature.

**Do not start this without the trigger.** It touches the canon's gate and
the middleware — the two things the docs agree not to touch casually. When it
starts, Zero is the researched first choice.
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

## 010 — The SBT anchor: witness, never re-derive

**Decision.** `POST /api/loom/anchor/sbt` witnesses a QPJ SBT block into the
Loom's D1 `sbt_anchors` table, making the portal's client-side (localStorage)
hash chain server-authoritative. The Loom does **not** recompute the block's
hash — QPJ hashes with insertion-order `JSON.stringify`; the Loom uses RFC
8785 JCS; they would disagree. The block's own `hash` is an opaque witness
value, and the per-DID linkage (block N's prevHash must equal the anchored
hash of block N-1) is what turns the local chain into a provable one.

**Why.** The production portal's SBT chain is forgeable — anyone can edit
localStorage. Anchoring each block's hash server-side, linked per-DID, means
a rewritten block breaks the chain the next time the portal tries to anchor,
and the Loom can prove it. This is the convergence the 2026 scan called for:
the Loom is the trust layer the older portals lacked.

**Consequences.** The anchor is idempotent (a retried block returns
`inserted: false`, not 409 — only a *different* genesis is a replay). CORS is
a locked allowlist (`LOOM_CORS_ORIGINS`, defaulting to the seven `*.p31ca.org`
portals + localhost) — CORS is browser-enforced only and is NOT auth; the
real control is Cloudflare Access + the linkage check. AAF `anchor.sbt`
(`danger: low`) registers the surface; the port-audit stays at 0 missing.

## 011 — Code names: pickle names, never raw DIDs

**Decision.** Every family-facing and agent-facing surface names a person by a
stable pickle code name (`@p31/canon/loom/codename`) — a deterministic
`prefix·suffix` derived from the DID/humanId — never the raw DID. The LOVE
care proof now carries `codename` alongside `did`.

**Why.** Ported from QPJ's pickle-name generator (the QPJ portal's
portals/qpj/src/lib/pickleNames.ts file, where it names the tetrahedron mesh
vertices — a sibling repo, not a resolvable Loom path). The log, companion
view, and any agent should be able to name a family member without exposing
the DID. The codename is privacy-preserving by construction (deterministic,
never contains the seed) and collision-avoiding (exclude set). Same person →
same name, in the Loom and in QPJ.

**Consequences.** `careProofOf` derives `codename` from `did`. The
privacy-safe proof-shape gate now includes it (and asserts it never leaks the
DID). A future MCP surface names tools by codename, not DID.

## 012 — Scope is the privacy boundary; enforcement lives at the read path

**Decision.** Every event is `personal`, `shared`, or `session` (reserved —
allowed by the type, no writers yet; two scopes is a real decision, three is a
bet). The gate enforces *shape* (personal must carry a humanId; shared must
not — a family record carries the family, not an individual). Visibility is
enforced at the **read path always** — `/events` and the SSE stream filter at
the query, never by asking a model to "ignore" the private ones. Provenance
redacts personal records the caller cannot read while preserving the chain
link. The write path binds a personal event's humanId to the authenticated
principal **when Access is on**; in the interim it trusts `X-Human-Id` (a
promise, documented in SECURITY.md).

**Why.** The family-memory research is unambiguous: *"If the system fetches
everybody's memories and asks the model to ignore the private ones, isolation
has already failed."* Scope must live where the data is read, not in a prompt
or a client-side filter. The child's color picks are personal; the orb, an
approval, and the family artifact are shared — the artifact derives from the
agent's `propose` (shared), not the private focus, so the companion view still
works. Agent events are shared by co-presence, not by writer-per-kind (that
rule is about who writes; scope is about who reads).

**Consequences.** Legacy rows (pre-scope, shared with a humanId) replay through
`normalizeLegacyScope`, which strips the humanId in memory — the stored `data`
is part of the hash chain and never mutated. `session` is reserved: when a
live-only signal (presence is the candidate) needs it, it gets a writer and the
reasoning that justifies it.

## 013 — The family view: one short shared page

**Decision.** `?mode=family` is one page the whole household (and their agents)
reads together: the shared artifact, the care circle, the last shared moments,
and a receipt with provenance + Undo. It reads **shared-scope only** — the
scoped read (#012) already filtered personal records out before the component
saw them, and the component refuses to render one as defense in depth.

**Why.** The family-memory pattern is explicit: "one short page everyone
reads, one write path, provenance always recorded." The companion view is the
elder's window; the chapters are the child's arc; the family view is the
surface the whole household opens together. The receipt is the proof surface:
"prove what happened" links to `/provenance/:seq`, and Undo is an **event**,
never a delete — the log is append-only and tamper-evident, so reversal
appends a compensating event (`family-undo-{seq}`) that provenance shows in
order.

**Consequences.** The launchpad gains a third door (`family.open`, 48px).
Personal events never reach the surface (the read path + the component both
guard it). The care circle shows presence, never a score. The receipt's
provenance link doubles as the trust-layer demo: one tap from a family page to
the verifiable chain.

## 014 — Lumi's memory is a fold, not a store

**Decision.** Lumi's persistent memory is **derived** from the log, never
stored separately. `@p31/canon/loom/memory` folds the scoped shared events
into four tiers — episodic (recent events), semantic (colors picked, nodes
focused), procedural (approved proposals), narrative (one plain sentence) —
deterministically. `GET /api/loom/memory` returns the fold; the launchpad shows
the narrative line when there is prior work.

**Why.** A Durable Object memory store was the initial candidate and rejected:
the log IS the memory substrate, and a separate store would be a second source
of truth that could drift from the prev_hash chain. The fold is deterministic
(same events → same memory) and edge-safe, so the Worker, the dev middleware,
and a test always agree. No LLM on the critical path — AI phrasing is a gated
later increment.

**Consequences.** Memory respects scope: the fold reads shared-only, so a
personal record's content never surfaces. The launchpad line never
auto-advances (the child still taps Start). The "welcome back" increment — Lumi
offers to continue via the existing propose gate, the child approves — builds
on this fold. That keeps co-presence: memory exists, but nothing appears
without a tap.

## 015 — The canon tiers are consumer-pulled

**Decision.** The canon's tiering follows the four-tier model (tokens →
semantic components → product slots → eject), but the full tiers are built only
when a real consumer exists. The seam (a typed adapter contract) + the Loom as
the reference adapter are the current work; product slots and eject wait for a
portal that imports `@p31/canon`.

**Why.** There are two design systems — `@p31/canon` (the Loom's) and
`@p31ca/design-core` (what the portals consume). Tiering the canon is only
meaningful if a portal actually consumes it; today there is no second
consumer. Building full product slots speculatively would be a library that
sits unused. The family pilot is the likely first pull.

## 016 — The family test is a pilot platform, not a one-off

**Decision.** The family test runs as a **platform**: three identities (child /
elder / caregiver), a live shared D1 log, a `FAMILY_PILOT.md` protocol with a
capture sheet (timing rows + verbatim quotes), and a seed/reset script. It
requires Cloudflare Access ON first — scope is a promise, not proof, until an
identity is real.

**Why.** The scripted walkthrough produced evidence, not the thing that
matters: a 7-year-old's first tap and a 70-year-old's confusion. A platform
makes the test repeatable across sessions and families, feeds verbatim results
into `HUMAN_TEST_PLAN.md`, and is the first real consumer of the canon's tiers.

## Related Documents

- `../README.md` — what the Loom is; every decision here shapes this app
- `./STANDARDS.md` — the conformance each decision enables
- `./AUDIT_STANDARDS.md` — the audit-trail positioning #008 enables
- `./LOVE_INTEGRATION.md` — the care-economy bridge #009 decides
- `./HUMAN_TEST_PLAN.md` — the trigger for the open persistence question
- `./CONCEPTS.yml` — the concept registry the decisions define

- `./MAP.md` — the doc index; where this page sits
