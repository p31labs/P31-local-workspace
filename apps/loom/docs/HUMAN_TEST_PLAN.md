# Human test plan — the three humans the Loom is for

The Loom is complete, tested, and green. What has never happened is a human
using it. This is the protocol for the test that no suite can run.

## Why this test, and why now

The master prompt opens with three constraints — a 7-year-old, a 10-year-old,
a 70-year-old — and every chapter was designed against them. But a test suite
can only assert what was specified. The research on older-adult web use is
consistent: compliance with WCAG is not the same as usability. A 2025 study
with 60 participants aged 50–85 found that WCAG-compliant interfaces still
failed on *"reduced cognitive load, intuitive navigation, and adaptive
interfaces"* — the barriers that matter in practice are cluttered layouts and
inconsistent workflows, not missing ARIA attributes.

The Loom has opinions about all three of those. Whether the opinions are
right is an empirical question.

## Before the test: the scripted walkthrough

Run the scripted role walkthrough first — a Playwright pass that plays each
role with that role's presentation prefs (elder: `motion=reduced&density=spacious&literal=1`;
child: `literal=1`), walks the full arc, captures screenshots at each step,
and audits the DOM against the master prompt's hard rules. It is not a human,
but it is concrete evidence and it catches a broken step before a person sees
it. If the walkthrough fails, fix it; do not hand the app to a human with a
known broken path.

## The protocol

**Who.** One 7-year-old, one 10-year-old, one 70-year-old. Ideally not the
same session — a child watching an elder changes both of them.

**What to hand them.** The URL, and nothing else. No instructions, no "tap
the button." The question the design is trying to answer is whether the first
tap is self-evident.

**What to watch, and note:**

| Moment | What you're checking | The tell |
|---|---|---|
| First paint | Does the launchpad read as warm, or as a website? | A pause before any tap |
| The first tap | Does the child find Start without being told? | A hand hovering, then moving elsewhere |
| Chapter 1 | Does "Say hello" need reading, or does the icon carry it? | Eyes moving to text before the icon |
| Chapter 2 | Does the child understand the orb is tappable before Lumi says so? | A tap on the wrong thing first |
| Chapter 3 | Does "Not yet" read as a real button, or as a cancel? | A hesitation on the second option |
| Chapter 4 | Does the child know they can pick a color, or wait to be told? | A pause at the picker |
| Chapter 5 | Does the child tap the artifact on their own? | A look back at the screen for permission |
| The elder's door | Does the 70-year-old find "See what you and Lumi made"? | A scroll, or a tap on Start instead |
| The companion view | Does the elder read the sentence and tap "Show me"? | A pause at the empty state if the log is fresh |

**What to note, verbatim.** Every phrase the person says, not the behavior
you infer. "Is it doing something?" is data. "The child looked confused" is
an interpretation.

**What not to do.** Do not explain. Do not point. Do not say "tap the
button." If a person is stuck, let the stuckness last as long as it lasts,
then ask one question: "What are you looking for?" The answer is the finding.

## After the test

Three outcomes, all valid:

1. **The person completes the arc unassisted.** The design works. Note the
   timing and any moment of hesitation, but do not iterate to "fix" it.
2. **The person completes with one prompt.** The prompt is the finding.
   Whatever they needed to be told is the missing affordance.
3. **The person does not complete.** The first abandoned step is the finding.
   Everything after it is untested.

Write the notes into this file under a dated heading. The next hand-off reads
them before touching the design.

## Running a real session: demo vs live log

- **Static demo** (`dist/`): instant, zero infra, but pre-seeded and
  non-persistent. The family member lands in the demo arc.
- **Live log** (dev server or a deployed backend): a real, shared, persistent
  log per family member. This is the one that answers "does my thing persist
  and does the elder see it."

If the static demo is what you have, say so to yourself before the session:
a child who completes the arc and then reloads will find the demo journey
again, not their own. That is a finding about the demo, not the design — the
persistence question is separately tracked (see `DECISIONS.md`).

## Session log

_Add dated entries below. One heading per session. Verbatim quotes only._

### 2026-09-21 — Scripted walkthrough (evidence, not humans)

Ran `e2e/human-walkthrough.spec.ts` — three roles (child `literal=1`, builder
default, elder `motion=reduced&density=spacious&literal=1`), full arc, 18
screenshots (`test-results/human-walkthrough/`). All three completed the arc
unassisted by an agent; every beat asserted against the master prompt's hard
rules.

**Findings the walkthrough caught before a human did** (both fixed):
- `.chapter-next` — `font-size: 14px`, below the 16px family floor. Now 16px.
- `.shared-chip` ("You've done N things with Lumi") — `font-size: 15px`. Now 16px.

**What it could NOT prove**: the walkthrough is compliance, not usability. It
cannot tell us whether a 7-year-old's first tap is self-evident, whether a
70-year-old finds the elder's door without being told, or whether a child asks
"where did my thing go" on reload. Those are the questions only the humans can
answer. This file's protocol stands.

**Status**: the scripted gate is green; the real family test has not run.
The app is ready to hand over at `https://loom-8z0.pages.dev`.

The real test now runs as a **pilot platform** — three identities, a live
shared log, a capture sheet, and a seed/reset script. See `FAMILY_PILOT.md`
for the protocol; Cloudflare Access must be ON first (`ACCESS_RUNBOOK.md`),
because scope is a promise until the caller has an identity.
## Related Documents

- `../README.md` — how to run and deploy the app you are about to hand over
- `./DECISIONS.md` — entry 007 (the static demo) and the Open section (persistence)
- `./STANDARDS.md` — the conformance the test is checking against
- `./FAMILY_PILOT.md` — the platform that runs this protocol
- `./ACCESS_RUNBOOK.md` — the prerequisite (Access ON)

- `./MAP.md` — the doc index; where this page sits
