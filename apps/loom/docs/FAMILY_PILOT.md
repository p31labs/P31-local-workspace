# Family test pilot — the platform

The Loom's real test: a 7-year-old, a 10-year-old, a 70-year-old, and a live
log. The scripted walkthrough (`e2e/human-walkthrough.spec.ts`) is evidence;
this platform is how the real session runs. It is a platform, not a one-off —
the same protocol, identities, and capture sheet repeat across sessions and
families.

## The prerequisite (non-negotiable)

**Cloudflare Access must be ON.** Scope is a promise, not proof, until the
caller has an identity (`DECISIONS.md` #012). The pilot measures privacy; it
cannot measure a promise. Configure Access first — `ACCESS_RUNBOOK.md` is the
5-minute procedure. The gate is live code awaiting `CLOUDFLARE_ACCESS_AUD`.

## The three identities

Each person gets a real Access account (or, in the interim, a distinct
`?id=` / `X-Human-Id` per role, clearly labelled as the interim). Distinct
humanIds make scope meaningful — the child's personal color picks stay
personal, the shared artifact is visible to all.

| Role | What to hand them | The URL |
|---|---|---|
| The 7-year-old | The URL, and nothing else | `https://loom-8z0.pages.dev` |
| The 10-year-old | The URL, and nothing else | `https://loom-8z0.pages.dev/?id=ten` |
| The 70-year-old | The URL, and nothing else | `https://loom-8z0.pages.dev/?id=elder` |

No instructions, no "tap the button." The question is whether the first tap is
self-evident.

## The capture sheet

Timing rows come from the log (each event's `ts`); verbatim quotes come from
the observer. **Quotes only** — "The child looked confused" is an
interpretation; "Is it doing something?" is data.

| Moment | Timing (from log) | Verbatim quote |
|---|---|---|
| First paint | launchpad loaded | — |
| The first tap | first `focus` event | |
| Chapter 1 — "Say hello" | `focus` on orb | |
| Chapter 2 — the orb | `focus` + celebrate | |
| Chapter 3 — the decision | `propose` → `approve`/`reject` | |
| Chapter 4 — the color pick | `propose` (color) → `approve` | |
| Chapter 5 — the artifact | `focus` on `artifact` | |
| The elder's door | `companion.open` | |
| The companion view | `companion.view` → `companion.next` | |
| The family view | `family.open` | |
| **Reload — persistence** | does the artifact survive? | "Where did my thing go?" |
| **Reload — memory** | does the launchpad line appear? | |

## The three outcomes

1. **Completes unassisted** — the design works; note timing + hesitation, do
   not iterate to "fix" it.
2. **Completes with one prompt** — the prompt is the finding; the missing
   affordance is named.
3. **Does not complete** — the first abandoned step is the finding; everything
   after it is untested.

## Seed / reset

A fresh family needs a prior artifact for the elder to find and Lumi to
remember. `scripts/seed-family.mjs` pre-populates a clean family log; the
reset wipes it between sessions. (Script lands with the pilot commit.)

## Writing results

Record verbatim quotes + timing into `HUMAN_TEST_PLAN.md` under a dated
heading — one heading per session, quotes only. The next hand-off reads them
before touching the design.

## Honest limits

- The pilot measures the design, not the deployment. A static demo or a
  missing identity makes the persistence findings about the demo, not the
  design.
- Three sessions may not generalize. Run more families if the platform
  supports it — that is why it is a platform.

## Related Documents

- `./HUMAN_TEST_PLAN.md` — the protocol this platform operationalizes
- `./ACCESS_RUNBOOK.md` — the prerequisite (Access ON)
- `./DECISIONS.md` — #012 (scope), #014 (memory), #016 (the pilot)
- `./MAP.md` — the doc index; where this page sits