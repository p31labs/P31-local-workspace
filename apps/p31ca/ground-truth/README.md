# P31 ground truth (p31ca)

**Single routable contract** for `p31ca.org` in a world of many agents and systems. `p31.ground-truth.json` is the spine; if it disagrees with `public/_redirects`, `scripts/hub/registry.mjs`, or the pinned files below, `npm run verify:ground-truth` fails (also runs via `prebuild`).

**Multi-root home:** a copy of this text also belongs in the narrative map — see root `P31-ROOT-MAP.md` and `AGENTS.md` (read order).

## When to edit `p31.ground-truth.json`

- You change **`public/_redirects`** — update `edgeRedirects` in lockstep.
- You change a **registry** `appUrl` for a listed invariant id — update JSON and registry in one commit.
- You bump **Three.js** in `dome.astro` or `observatory.html` — update `threejs` and any matching `tech` line in the registry.
- You change a **dome** entry that has a `fileSnippets` row (e.g. noscript back link) — update `fileSnippets` in the same commit.

## Not covered here (yet)

- Every hub product line item (still owned by `scripts/hub/registry.mjs` + generators).
- `phosphorus31.org` deploy or routes.
- Live mesh KV (use real bindings, do not guess).

## Where CI enforces this

- **Every p31ca `astro build`:** `prebuild` runs `verify:ground-truth` first.
- **`p31ca Hub` GitHub Action:** `npm run hub:ci` → `build` → same chain.
- **Andromeda `monorepo-verify` + `pnpm run quality`:** deploy-target guard, `verify:ground-truth` at the root, and **Turbo `build` includes the hub** (see `software/pnpm-workspace.yaml`). The VS Code extension under `extensions/p31ca` is package **`p31-centaur-ede`**, so it no longer collides with npm name `p31ca` for the hub.
