# The Loom

The Loom is a design system shown as a live conversation between a human and
an agent. A child, a builder, and a grandparent share one append-only log; the
agent (Lumi) reacts to what they do, and what they build together is real.

**One sentence:** the Loom is a warm, tested arc where a 7-year-old taps, a
10-year-old decides, and a 70-year-old finds the same shared thing they made —
built on a single event log that is the only thing that must survive.

## The three people it is for

- **A 7-year-old.** Chapters 1–2: meet Lumi, make something happen. One action,
  one celebration. No reading required to get started.
- **A 10-year-old.** Chapters 3–5: Lumi proposes, the child decides, the child
  authors their own idea, and the workshop opens.
- **A 70-year-old.** The companion view: the same log, calmer. One sentence per
  screen, a visible Back, a quiet door on the launchpad — no graph, no counts,
  no timers.

## What this is not

- **Not a general-purpose design system.** The canon (`@p31/canon`) is the
  design system; this app is one consumer of it. It exercises the canon's
  tokens, contracts, and gate, but it does not own them.
- **Not a persisted product yet.** The static build serves a pre-seeded demo
  journey (`events.seed.json`); a live, shared, persistent log needs the
  backend (`/api/loom/event`). See `docs/DECISIONS.md` entry 007 and the Open
  section.
- **Not a kids' tutorial app.** The chapters are a vehicle for the co-presence
  loop — human and agent, one log — not an educational game. The arc is
  short on purpose.
- **Not the instrument's replacement.** The instrument view (the full
  constellation graph, token counts, traces) still exists as a mode; the child
  arc is the path to it, not a substitute for it.
- **Not a finished AAF implementation.** It uses the `data-agent-*` + manifest
  pattern and a validation gate, but the manifest is the Loom's own surface,
  not Mozilla's runtime's final form.

## Run it

```bash
pnpm install
pnpm --filter @p31/loom dev        # http://localhost:5191
```

The dev server runs the `/api/loom/event` middleware: a live, persistent,
append-only log. `?mode=` switches the surface:
`launchpad` (default), `canvas`, `instrument`, `jitterbug`, `creative`,
`workshop`, `companion`.

## Test it

```bash
pnpm --filter @p31/loom test        # 59 unit tests
pnpm --filter @p31/loom test:e2e    # the full Playwright e2e suite
pnpm --filter @p31/loom port-audit  # inventory: tokens / AAF / event kinds / raw values
```

The e2e suite is the contract — the chapter phase machines, the reduced-motion
guard, the elder's door, the full human-agent arc. If a test fails, the
feature is wrong, not the test.

## Build and deploy

```bash
pnpm --filter @p31/loom build       # dist/ — static, serves events.seed.json
pnpm --filter @p31/loom preview     # serve dist locally
```

A static deploy is a **demo**: it renders a pre-seeded journey, and choices do
not persist. For a real family session, run the dev server on a LAN device, or
deploy the backend with the app. See `docs/DECISIONS.md`.

## How the pieces fit

- **The log** (`@p31/canon/loom/events` + the gate) is the source of truth.
  Every visible state is a pure fold over it. Nothing is stored anywhere else.
- **The chapters** (`ChildChapter`, `BuilderChapter`, `CreativeChapter`,
  `WorkshopChapter`) are phase machines driven by `animationend` — reduced
  motion collapses the duration, never the state machine.
- **The companion view** reads the same log, calmer.
- **The canon** (`packages/canon`) owns tokens (DTCG 2025.10), contracts, and
  the writer-per-kind gate. The app only consumes.

## Related Documents

- `docs/STANDARDS.md` — where the Loom sits against WCAG 2.2, DTCG, and AAF
- `docs/DECISIONS.md` — the decisions behind the shape, and what's still open
- `docs/HUMAN_TEST_PLAN.md` — the protocol for the test no suite can run
- `docs/PORTING_AGENT_BRIEF.md` — how to port any future app into the canon shape
- `docs/MAP.md` — the documentation index; the one screen that shows how the corpus connects
