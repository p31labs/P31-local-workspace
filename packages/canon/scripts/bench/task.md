# Benchmark task — contract from CSS

**The fixed task.** Every runner — the Loom agent and the direct-model baseline —
receives the same inputs and produces the same shape of output.

## Inputs

1. A CSS file (or files) containing an undocumented component family — a base
   class plus two or more modifier variants.
2. A token list: either a DTCG tree or a flat `--token: value;` block.

## Prompt (verbatim, for the baseline)

> Given this CSS and this token list, produce a component contract for the
> undocumented class family. The contract must declare a `variant` enum
> covering every modifier, a `tokenContract` listing only tokens the CSS
> actually consumes (resolved against the token list), and a `caveat` naming
> any value the CSS hardcodes instead of consuming as a token.

## Output shape

A `ComponentContract`-shaped object: `name`, `layer`, `status`, `intent`,
`props`, `tokenContract`, `semanticParts`, `requiredAria`, `interactionStates`,
`caveats`, `sources`, `importStatement`, `antiExamples`.

## Scoring axes

1. **Token grounding** — every `tokenContract` entry resolves in the token list.
   A declared token that does not resolve is a point against.
2. **Caveat honesty** — does the output name the hardcoded values (e.g. a
   `rgba(...)` where a token should be)? A silent hardcode is a point against.
3. **Prop completeness** — does the `variant` enum cover every CSS modifier?
   A missed modifier is a point against.
4. **Determinism** — run the same runner twice on the same fixture; are the
   outputs byte-identical? (The Loom is deterministic by construction; a model
   baseline is not.)

## Fixtures

- `fixtures/badge` — canon Badge (tone variants).
- `fixtures/topbar` — canon Topbar (positional + variant modifiers).
- `fixtures/action` — canon a2-data-card-action (BEM `--` variants).
- `fixtures/foreign-avatar` — foreign Avatar (from Lane β).
- `fixtures/foreign-btn` — foreign Button (from Lane β, hardcoded `#ef4444`).
