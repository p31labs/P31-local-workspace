# P31 Loom — Policy Tokens

> A design token is no longer an answer. It is a policy. A token that stores a
> fixed value silently assumes a rendering context that no longer exists.

Most design tokens are *values*: `--space-4: 16px` is true everywhere, for
everyone, forever. The Loom's presentation tokens are *policies*: they encode
an intent and resolve it against a context at render time.

## The policy tokens

| Token | Intent (what it encodes) | Resolution context |
|---|---|---|
| `--motion-scale` | "motion should be as fast as the user can tolerate" | OS `prefers-reduced-motion` → profile `motion` → URL `?motion=` |
| `--p31-layout-density-factor` | "space should be as tight as the user wants" | profile `density` → URL `?density=` (re-roots `--p31-layout-spacing-*`) |
| `--loom-letter-spacing` / `--loom-line-height` | "text should be readable to this reader" | profile `letterSpacing` / `lineSpacing` → URL `?spacing=` / `?line=` |
| `--p31-accent` + muted set | "color should be as vivid as this user wants" | profile `saturation` → URL `?saturation=` swaps to `--p31-color-accent-*-muted` |
| `literalLabels` (bool) | "labels should be plain language, not jargon" | profile `literalLabels` → URL `?literal=` |

None of these store a frozen output. `--motion-scale: 1` is the *default*, not
the *answer* — it resolves to `0.5` under a "reduced" profile, `0.01` under an
OS reduced-motion preference, and `1` for a user who asked for full motion.

## The resolution order

Every axis resolves through the same pipeline, highest priority first:

1. **OS preference** — `prefers-reduced-motion` is a hard floor, not a
   suggestion. `floorMotion()` in `src/lib/usePresentation.ts` caps the motion
   tier at `reduced` regardless of what the profile stores; a profile can only
   degrade further (`none`), never override the OS upward.
2. **Profile** — `packages/canon/src/loom/profiles.ts` `HumanProfile.presentation`
   is the stored preference (a separate store, *not* the event log).
3. **URL params** — `?density=` / `?motion=` / `?saturation=` / `?literal=` /
   `?spacing=` / `?line=` override the profile for the session, mirroring the
   existing `?tier=` affordance.
4. **Default** — the neutral baseline (`comfortable`, `full`, `normal`, `false`).

The resolved tiers surface once as `data-*` attributes on `.loom-shell` and a
React `PresentationContext`, so CSS and JS/canvas/WebGL consume the same value
without re-deriving it.

## What's proven

- `floorMotion()` is unit-tested (`src/lib/usePresentation.ts`).
- The `data-*` surface and the three persona scenarios are e2e-tested
  (`e2e/inclusive.spec.ts`).
- The mechanical floor is gated (`packages/canon/scripts/check-inclusive.mjs`),
  and its constants are `SYNC WITH`-linked to the agent's `get_design_md` floor.

## Honest limitations

The policy surface reaches the canvas. The color probe resolves inside
`.loom-shell` (`src/lib/tokens.ts` `resolveToken`), so muted accents reach both
the Instrument's 2D canvas and the Jitterbug's WebGL uniforms
(`resolveTokenRgb`); letter-spacing and literal-labels reach it too.

The one remaining gap: **density scales canvas text size, not canvas layout.**
`drawTrackedText` multiplies type size by `--p31-layout-density-factor`, so the
readout text grows or shrinks — but the readouts' *positions*, gaps, and bar
geometry are computed in `@p31/field`'s `layout.ts`, which has no density
concept. Under a density tier the text scales while its coordinates do not.
Closing that means teaching `projectInstrument` the density factor and adjusting
readout geometry — a `packages/field` change, not a Loom one, and its own slice.

## Why this matters

Four claims the Loom can make and prove:

1. The floor is enforced (mechanical gate, CI, linked constants).
2. The DOM is agent-legible (AAF attributes, served manifest).
3. The loop is provable (the DuetUI convergence e2e).
4. **The tokens are policies, not values** — this is the strongest claim, and
   the one no other design system in the current crop makes. `--motion-scale`
   and the four presentation axes shipped it, two commits before this doc named
   it.
