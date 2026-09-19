# The Loom vs Claude Design — Strategy

**Date:** 2026-09-19
**Status:** Research complete. Moves sequenced. Move 1 is the only unblocked commit.

## The conclusion in one sentence

The Loom is **not** competing with Claude Design. It is competing with the
governance layer Claude Design lacks — and the field (agentic-spec, tidy-core,
design-anchor, Supernova Contexts) is converging on exactly what the Loom
already builds, minus the one thing none of them have: an append-only,
deterministic, replayable event log.

## What Claude Design is (researched)

Launched 2026-04-17 on Opus 4.7 (visual reasoning 82%, vs 69% for 4.6), 1M+
users week one. It is a **prototyping engine**, not an image generator: it
outputs live HTML/CSS/React, reads a codebase + design files during onboarding
to build a design system, and hands off to Claude Code as a bundle. June 2026
added GitHub design-system import, locked admin-approved systems, canvas
editing, and nine tool connectors (Adobe, Canva, Gamma, Lovable, Miro, Replit,
Vercel, Wix).

## Where Claude Design fails (documented, primary sources)

1. **Output convergence.** "The output keeps looking the same way no matter who
   I'm building for… the UI is technically correct, the UX isn't." Same
   hero-features-pricing-FAQ skeleton; missing empty/error/loading states.
2. **It assembles, it doesn't design.** "No prioritisation. No trade-offs. No
   opinion." (open-design #501)
3. **No UX knowledge.** "DESIGN.md tells the agent which colors and fonts the
   brand uses but never tells it *how* to design."
4. **Token burn.** 80% of a weekly Pro quota in 25 minutes; still not fixed
   after the June "token-burning problem" patch.
5. **No self-observation.** "No mechanism for the agent to view what it actually
   produced" — users paste ~19 screenshots to show the agent its own work.
6. **Great at systems, average at design.** "Models can't hold a messy product
   in their head, so they compensate by enforcing structure."
7. **No governance history.** No record of why a decision was made, what it
   superseded, or whether anyone adopted it. This is why tidy-core exists: to
   "prove what happened."

## What the Loom already has that Claude Design structurally cannot

| Capability | Claude Design | The Loom |
|---|---|---|
| Deterministic replay | No | 3-process byte-identical convergence |
| Multi-agent | Single Opus model | Agent-agnostic protocol |
| Human authority by schema | Model owns output | Only human approve moves status |
| Drift measurement | No | `revisionSurvival` Jaccard |
| Delegation chains | No | `parentAgent` |
| Seal (single write path) | No | `commit()` + gate |
| Accessibility floor + tiers | No | reduced-motion, profiles, mediation |
| Audit trail | No | Append-only log |

## Definition of "meets or exceeds"

Not "prettier layouts" — the Loom will not and should not try to beat Opus on
rendering. The Loom's output is a **governed design system**, and it must be:

- **Complete** — every CSS class family has a contract, not just Button + Badge.
- **Grounded** — `tokenContract` references only tokens the CSS actually consumes;
  honest caveats where it doesn't.
- **Validated** — every contract passes validate-contracts/registry/parity.
- **Auditable** — every contract has a log entry: who proposed, reviewed, approved,
  and how much survived revision.
- **Self-healing** — detects drift (uncontracted class, undeclared token, stale
  caveat) and proposes its own next work.
- **Multi-model** — different agents routed to different task types; the log
  records which agent did what.

## The four moves

### Move 1 — The apply loop (now)
The Loom proposes; a human approves; **nothing lands**. The Badge contract was
written by hand after the agent proposed it. Close the gap with
`packages/canon/scripts/loom-apply.mjs`:

- Read `.loom/events.jsonl`; find proposals with an `approve` event and no
  applied marker.
- Emit the contract file + add the export to `index.ts` + regenerate the registry.
- Record the apply in a sidecar `.loom/applied.json` (proposal id → file hash) —
  a deployment fact, not an artifact fact, so it lives outside the log like
  the profile store. The git commit records the landing.
- Refuse to apply if validate-contracts or validate-registry would fail.

**Gate:** fresh log → agent proposes Badge → approve → `loom-apply` → contract
file exists + validate-contracts green.

### Move 2 — Contract coverage agent (next week)
Badge was the first. 119 CSS classes, 1 contracted component. Extend
`loom-contract-agent.mjs` to rank uncontracted families by signal (tone modifiers,
token consumption, cross-file usage), propose batched with `parentAgent`, and
emit a coverage report ("N of 119 classes contracted").

**Gate:** proposes for `.glass-card`, `.feature-card`, `.trust-item`, `.topbar`;
skips `.btn` (aliased to Button); human approves three; `loom-apply` lands them;
registry shows 5 components.

### Move 3 — The quality benchmark (two weeks)
Evidence for "meets or exceeds." Same task to the Loom agent and to a direct
Opus prompt: "given this CSS + token list, produce a contract for the
undocumented class family." Compare on token grounding, caveat honesty, prop
completeness, determinism (run twice), and cost.

Hypothesis: the Loom loses on visual creativity, wins on grounding, honesty,
determinism, and cost. That is the pitch.

### Move 4 — The ingestion pipeline (three weeks)
Claude Design's killer feature is ingestion from arbitrary repos. Build an
adapter that turns a foreign design system (GitHub repo, Figma export, CSS,
tokens.json) into a Loom-compatible registry; the coverage agent then runs
against it unchanged. This turns the Loom from "the canon's governance layer"
into "a governance layer for any design system."

## What to explicitly NOT do

- **No rendered canvas** competing with Opus (82% visual reasoning vs a graph).
- **No model dependency in the fold.** The moment a model call enters the fold,
  "if it's in the log, it replays" becomes false. Keep generation deterministic
  and rule-based; use models only as optional proposers validated by the same
  gates.
- **No editor.** Claude Design spent a year on canvas editing and it is still
  clunky. The Loom's canvas is a review surface, not an authoring surface.
- **No connector parity.** Nine connectors is not the game. The output is a
  contract file + a log entry, both exportable by definition.

## The honest position

Claude Design generates UI. The Loom generates the design system that makes the
UI safe to ship. The pitch writes itself once Move 2 lands: **"Claude Design
generates the UI. The Loom generates the contract that makes it safe."**

Start with Move 1. It is one commit and it closes the gap between "the Loom can
propose" and "the Loom can deliver."
