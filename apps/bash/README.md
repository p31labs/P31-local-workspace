# apps/_template — The P31 Site Starter Box 🧱

This is the **starter box** for every new P31 site. It already knows the
P31 design canon: spoon-aware motion, glass cards, the cyan→violet→green
`link-glow` hover, and the shared layout components.

## For a 7-year-old 🌟

We built a **box of LEGO blocks** for making websites. Every new site is
just snapping the same blocks together — so they all look like they belong
to the same family. You don't have to invent new colors. You just build. 🧩

## Quick start

```bash
# 1. Copy this folder to a new app
cp -r apps/_template apps/my-new-site

# 2. Edit package.json / wrangler.toml: replace TEMPLATE_PROJECT & TEMPLATE_DOMAIN
# 3. Build + deploy
cd apps/my-new-site
pnpm install
pnpm run build
npx wrangler pages deploy dist --project-name my-new-site --branch=main
```

## What's inside

- `src/layouts/Layout.astro` — the canonical shell (nav, starfield, crisis overlay, sovereignty chrome).
- `src/pages/index.astro` — example page using `Section`, `StatTiles`, `CardGrid` from `@p31ca/ui/layout`.
- `src/data/*.json` — content lives here; pages render it. No hard-coded text.
- `src/styles/global.css` — imports `@p31ca/design-core/css/all.css` (all tokens).

## The rules (so every site feels the same)

1. Import tokens only from `@p31ca/design-core`. Never override them.
2. Use `glass-card` / `glass-subtle` / `glass-panel` for surfaces.
3. Put `link-glow` on every clickable card/link.
4. Never use dynamic Tailwind classes (`text-quantum-${x}`) — use static literals.
5. Keep `data-spoons` and `data-size-class` on `<html>`.

**The cage holds. 863 Hz. K₄ is planar. β₂ = 1.**
