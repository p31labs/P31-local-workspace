# Loom — standards conformance

The Loom implements, or deliberately exceeds, four external standards. This
file records which, to what version, and where the Loom sits relative to the
requirement — so a future contributor can see at a glance whether a "fix" is
actually a regression against a standard.

## WCAG 2.2 — target size

| Criterion | Level | Requirement | Loom |
|---|---|---|---|
| 2.5.8 Target Size (Minimum) | AA | 24×24 CSS px | Exceeded |
| 2.5.5 Target Size (Enhanced) | AAA | 44×44 CSS px | Exceeded |

The Loom's family floor is **48×48** (`--p31-touch-min`), with child/elder
targets at **56px** (`--p31-touch-recommended`) and **64px**
(`--p31-touch-large`). This is above WCAG AAA and above Apple's 44pt and
Material's 48dp guidance.

**Do not "correct" these down.** The W3C Mobile Accessibility Task Force
polled on 4 March 2026 on raising the AA minimum from 24px, with an action
item to draft a larger size plus touch-vs-pointer notes. The direction of the
standard is up, not down. The Loom is already where the standard is heading.

One audit to run when touching the buttons: the instrument chrome's 44px
floors (`.loom-*`, `.jb-*`) are deliberate — they serve the fourth audience,
not the three humans, and they sit above the 24px AA floor. The 48px family
floor applies to anything a child or elder touches.

## WCAG 2.2 — reduced motion

`prefers-reduced-motion: reduce` is honored by collapsing `--motion-scale`
to `0.01`, **never** by setting `animation: none`. This is deliberate and
load-bearing: the chapter phase machines are driven by `animationend`, so
`animation: none` would silently stall every chapter at its celebrating
phase. The reduced-motion e2e spec proves every phase still lands.

The test pattern that guards it (Playwright 1.61.1+): `emulateMedia({ reducedMotion: 'reduce' })`
**before** `goto`, then assert `matchMedia('(prefers-reduced-motion: reduce)').matches`
from inside the page. `test.use({ reducedMotion })` silently no-ops; do not
rely on it.

## DTCG — design tokens

The canon emits a DTCG-shaped export at `packages/canon/tokens/tokens.dtc.json`,
pinned to `$schema: "https://design-tokens.org/schemas/format/2025.10"`.

DTCG's first stable version (2025.10) shipped October 2025. Per the DTCG FAQ,
it is *"safe to use"* — many tools and organizations already implement it. It
is not on the W3C Standards Track (it is a Community Group report), which
means the format is stable for production but may still evolve. The canon's
`verify:parity` gate and Style Dictionary validation are the guardrails
against that evolution. `gen:tokens` regenerates `packages/canon/dist/tokens.css`, the DTCG
export, and the typed `P31TokenName` contract from `packages/canon/src/theming/theme-store.ts` — the
single source of truth.

## AAF — agent accessibility

The Loom implements Mozilla's Agent Accessibility Framework proposal:
`data-agent-*` attributes on interactive elements, plus a manifest at
`apps/loom/public/.well-known/agent-manifest.json`.

The AAF runtime contract:
- **Discover** actions and fields from `data-agent-*` attributes.
- **Validate** inputs against the manifest's JSON Schema.
- **Enforce** safety policies (block high-risk actions without confirmation).
- **Execute** through the real DOM.

The manifest's `danger` and `confirm` fields are what the runtime enforces.
`loom.propose` and `loom.traverse` carry `"surfaced": "agent-side"` — they are
agent verbs that never appear as `data-agent-action` in the DOM, and the
annotation tells the audit and any scanning model that their absence is
intentional.

The `port-audit` script is the CI gate: it fails if any `data-agent-action` in
the source is missing from the manifest, or if the manifest's structure drifts
from the documented shape.
## Related Documents

- `../README.md` — what the Loom is; every conformance claim here is about this app
- `./DECISIONS.md` — why each conformance posture was chosen (004: reduced motion, 003: sound)
- `./HUMAN_TEST_PLAN.md` — the test that checks conformance against real humans
- `./PORTING_AGENT_BRIEF.md` — the method that keeps these claims true

- `./MAP.md` — the doc index; where this page sits

- `./SECURITY.md` — the deployed perimeter and the COPPA/EAA posture that conformance feeds
