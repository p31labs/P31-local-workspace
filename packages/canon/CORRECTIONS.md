# @p31/canon — session corrections & changelog

This file is the durable record of canon-intent fixes. Trust the byte
counts here over any session/transcript narrative; the walkers in
`scripts/validate-contracts.mjs` and `canon-mcp` agree with the numbers.

## 2026-09-19 — Fix 5 was real work; the "no-op retraction" is WRONG

A prior session retracted Fix 5 claiming "themes.<id>.* was never stripped,
restoring it was a phantom — no code change needed." **That retraction is
false.** Verified this turn against one absolute path
`packages/canon/tokens/tokens.dtc.json`:

- File was **34,961 bytes** with both `themes` and `p31` top-level blocks.
- Whole-tree walk (root-anchored, no `p31` anchor): **290 leaves =
  261 `themes.*` + 29 `p31.*`**, `CONVERGE: true`.
- `listTokens` (server.ts) walks the whole tree and flags
  `contractResolvable` on `p31.*` only. `validate-contracts` root-walks and
  hard-gates `p31.*` namespace + resolvability.

The DTCG intentionally carries **both** namespaces: `p31.*` (contract-resolved
semantic primitives) and `themes.<id>.*` (per-theme informational palettes for
designers/Figma). Do NOT strip `themes.*` — a future "optimization" that
removes it breaks 261 leaf tokens and the 290-leaf convergence.

Ground-truth regate: `node scripts/gen-tokens.mjs` then
`node scripts/validate-contracts.mjs` must both exit clean against this file;
`packages/canon-mcp` must build (`tsc`) exit 0.

## 2026-09-19 — Semantic tokens were DTCG-only; the runtime CSS tier was missing

Phase 2 (canon-react Button) precondition caught a real gap: `dist/tokens.css`
contained only the 29 palette/primitives per theme and NO semantic tier.
`grep -o '\-\-p31-[a-z-]*action[a-z-]*' packages/canon/dist/tokens.css` returned
zero matches, but Button.css reads `var(--p31-color-action-primary)`. In a
browser the button would render transparent/zero-padding; jsdom cannot see it.

- **Root cause:** `gen-tokens.mjs` emitted CSS only from `THEMES[id].tokens`
  (palette keys like `--p31-accent`). `SEMANTIC_MAP` (`color.action.*`,
  `space.inline.*`, `font.size.*`, `motion.*`) materialized only into the DTCG
  `p31.*` tree — a naming layer for contracts/Figma, never a runtime rule.
- **Fix (gen-tokens.mjs):** every CSS block now ALSO emits `--p31-<dashed
  path>` per `SEMANTIC_MAP` slot, resolved per theme via `resolveSlot`.
  `:root` = DEFAULT_THEME; each `[data-theme]` = its own values. The whole
  file is wrapped in `@layer p31.tokens` with a one-time layer-order
  declaration (`p31.tokens, p31.reset, p31.base, p31.layout, p31.components,
  p31.utilities`) so consumers can override from unlayered CSS and utilities
  can beat components.
- **tokens.dtc.json is byte-stable** — 34,961 bytes, 290 leaves (261 themes.* +
  29 p31.*). The fix touches CSS emission only.
- **Exports exception (generate-exports.mjs):** the walker excludes `.css` by
  design, so `./tokens.css → ./dist/tokens.css` is derived as one deliberate,
  ghost-gated artifact (emitted only when `dist/tokens.css` exists;
  `gen:tokens` runs before `gen:exports` in the build chain). Do NOT strip it;
  without it no consumer can import the runtime tokens CSS.
- **validate-contracts.mjs:** shipped-package resolution moved from
  `root/node_modules` to `workspaceRoot/node_modules` so `status: 'shipped'`
  can resolve sibling workspace packages (canon-react) — pnpm links them at
  workspace-root `node_modules` only once `linkWorkspacePackages` is set.
