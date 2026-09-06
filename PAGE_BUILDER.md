# PAGE_BUILDER.md — The P31 Page Builder & App Generator

> **Canonical, locked standard for building P31 sites and apps.**
> All future work follows this blueprint. No app may override the design tokens
> or re-implement the shared components.

The cage holds. 863 Hz. K₄ is planar. β₂ = 1.

---

> **TL;DR**
> - P31 sites are **Astro 5 + `@p31/design-core` + `@p31/ui`** — one design system, every app, zero drift.
> - Scaffold a new site in one command: `node cli/index.js new-site <name> --domain <domain> --pages <cf-project>`.
> - All tokens, spoon-aware motion, accessibility, and security headers come pre-configured. You write content.

## Quick Start

```bash
# Scaffold a new P31 site
node cli/index.js new-site my-app --domain my-app.p31ca.org --pages my-app

# Navigate into the new site
cd apps/my-app

# Install dependencies and start the dev server
pnpm install && pnpm dev

# When ready — build and deploy
pnpm build
npx wrangler pages deploy dist --project-name my-app
```

Expected output:
```
  ✓ Scaffolded my-app at apps/my-app
    domain:      my-app.p31ca.org
    pages proj:  my-app

  Next steps:
    $ cd apps/my-app
    $ pnpm install
    $ pnpm run build
    $ npx wrangler pages deploy dist --project-name my-app --branch=main
```

---

## §0 — Canonical Architecture (engineers)

### Stack
- **Astro 5** (`output: 'static'`) + **React 19** islands + **Tailwind v4** (`@tailwindcss/vite`).
- Deployed to **Cloudflare Pages** via `wrangler pages deploy dist`.
- Monorepo: `pnpm` workspaces. Apps under `apps/*`, shared packages under `packages/*`.

### Source of Truth — `@p31/design-core`
All tokens/utilities are CSS variables and opt-in layers imported from here:

| Layer | File | Invariant |
|-------|------|-----------|
| Spoon-aware motion | `css/motion.css` | `data-spoons` (0–5) on `<html>`; motion disabled at 0–1. Never bypass. |
| Size-class | `css/size-class.css` | `data-size-class` (`compact`/`regular`/`medium`/`expanded`) drives `--p31-*` tokens. Never override with manual breakpoints. |
| Container queries | `css/container.css` | `data-container`, `data-container-adaptive`, `data-container-grid` for component-level responsiveness. Complements (never replaces) size-class. |
| **Link-glow** | `css/link-glow.css` | Single canonical `.link-glow` (cyan→violet→green gradient + glow, no underline). Imported via `all.css`. Apply to every clickable card/link. |
| Glass system | `css/glass.css` | `glass-card`, `glass-subtle`, `glass-panel`. Use for all surfaces. |

Import the whole system with:
```js
import '@p31/design-core/css/all.css';
```

### Shared Components — `@p31/ui/layout`
| Component | Props |
|-----------|-------|
| `Section` | `{ header: { eyebrow?, title, description?, align? }, children }` |
| `PageHeader` | `{ eyebrow?, title, description?, align? }` |
| `StatTiles` | `{ stats: { label, value, href? }[], cols?: 2|3|4|5 }` |
| `CardGrid` | `{ cards: { title, description?, href?, status?, statusLabel?, meta?, accent? }[], cols?: 2|3|4 }` |

`CardGrid` maps `status` to a **static** color set (`published`, `peer-review`, `preprint`, `draft`, `live`, `dev`, `prototype`) — **never use dynamic Tailwind classes** like `text-quantum-${x}`; they are purged by Tailwind v4 JIT. Cards with `href` automatically receive `link-glow`.

Chrome comes from `@p31/ui/chrome` (`SiteNav`, `SovereigntyStrip`, `CompanionPanel`, `Footer`, `GlassCard`, `GlowButton`, `SpoonDial`, `SkipLink`) plus `EphemeralProvider` from `@p31/ui`. The crisis breathing overlay is a web component registered from `@p31/design-core/crisis-overlay` (`<p31-crisis-overlay>`). The sovereign chrome strip (SovereigntyStrip + CompanionPanel + notifications) is assembled per-site in `apps/<name>/src/layouts/P31Chrome.tsx`. The starfield is mounted imperatively via `mountStarfield()` from `@p31/design-core/starfield`.

### Canonical Shell
Every site's `Layout.astro` (see `apps/_template/src/layouts/Layout.astro`) must:
1. Import all `@p31/design-core/css/*` layers + `global.css`.
2. Set `data-spoons="3"` and `data-theme="quantum"` on `<html>`, with an inline bootstrap script restoring saved spoon/size-class before hydration.
3. Render `SiteNav`, `EphemeralProvider` wrapping `<slot/>`, `FooterIsland`, `<p31-crisis-overlay>`, and the app-specific P31Chrome (SovereigntyStrip + CompanionPanel), and mount the starfield.
4. Include a skip link and respect `prefers-reduced-motion`.

### Deploy Command
```bash
cd apps/<name>
pnpm run build
npx wrangler pages deploy dist --project-name <pages-project> --branch=main
```
`main` → Production (custom domain). Feature branches → Preview (`*-<project>.pages.dev`).

> **Trailing-slash note:** with `output: 'static'`, Cloudflare Pages serves `/about/index.html`
> and 308-redirects `/about` → `/about/`. This is **host-level behavior**; `trailingSlash`
> in `astro.config.mjs` does not change it for static output. Both apps use `'ignore'`.
> Harmless — always link to the canonical `/about/` form in nav.

### Extension Protocol
To add a new variant/prop: edit the shared package (`@p31/design-core` for tokens, `@p31/ui` for components), bump its version, update consuming apps. **Never** add app-local CSS overrides or duplicate components.

---

## §1 — For Google Software Engineers (full spec)

**Problem:** rapidly stand up a new P31 property (site or app) that is pixel- and behavior-consistent with `p31ca.org` and `phosphorus31.org`, without re-deriving the design system.

**Input contract:** `apps/_template` (the starter box), `@p31/design-core`, `@p31/ui`.

**Procedure:**
1. `andromeda new-site <name> [--domain d] [--pages p]` — clones `_template`, rewrites `TEMPLATE_PROJECT`/`TEMPLATE_DOMAIN` placeholders in `package.json`, `wrangler.toml`, `astro.config.mjs`, `src/pages/index.astro`, and prints next steps. (Equivalent manual: `cp -r apps/_template apps/<name>` + sed the placeholders.)
2. Author content as JSON/TS in `src/data/`. Render with `Section` + `StatTiles` + `CardGrid`.
3. `pnpm install && pnpm run build && npx wrangler pages deploy dist --project-name <p> --branch=main`.

**Invariants (CI should assert):**
- No `text-quantum-${...}` / `bg-quantum-${...}` template literals in markup (purge-unsafe).
- Every `<a>` that is a card/nav link carries `link-glow`.
- No `:root` or hard-coded color/spacing values; all tokens resolve from `@p31/design-core`.
- `data-spoons` + `data-size-class` present on `<html>`.

**Reference implementations:** `apps/p31ca` (technical hub, `AppShell.astro`), `apps/phosphorus31` (institutional, `Layout.astro`), `apps/_template` (minimal).

**Migration note (Cloudflare):** Pages is fully supported; Cloudflare now recommends **Workers + Static Assets** for *new* projects. When migrating, the `dist/` output maps to the Workers `assets.directory`; the `@astrojs/cloudflare` adapter already produces the `_worker.js` bundle.

---

## §2 — For My 10-Year-Old Son 🧒

**"How we build a new website in our family"**

Our family makes websites that help neurodivergent families (kids and grown-ups whose brains work a little differently). We have one big rule: **every website we make should feel like it belongs to the same family** — same colors, same buttons, same calm feeling.

So instead of building each site from zero, we made a **starter kit** (it's a folder called `_template`). It already has:
- the dark night-sky background with tiny moving stars,
- the buttons that glow when you hover,
- the boxes (cards) we put information in,
- the little menu at the top.

When we want a new site, we **copy the starter kit**, give it a new name, and fill in the words and pictures. Because the starter kit already knows the rules, the new site looks right instantly. No guessing.

**The three steps:**
1. Copy the starter box: `cp -r apps/_template apps/my-site`
2. Put your words in `src/data/` (like a list), and the page shows them.
3. Build it and send it to the internet: `pnpm run build` then `npx wrangler pages deploy dist --project-name my-site --branch=main`

That's it. You built a real website that matches the family. 🚀

---

## §3 — For My 7-Year-Old Daughter 🌟

**"We made a box of building blocks"**

We have a special **box of LEGO blocks** for making websites! 🧱

Every time we want a new website, we open the box and snap the same blocks together. The blocks already know our favorite colors — **blue, purple, and green** — and they glow like magic when you touch them. ✨

Because we always use the same blocks, every website we make looks like it's part of our family. You don't have to draw new colors. You just **build**. 🧩💜

When it's ready, we press a button and *whoosh* — it flies up to the sky for everyone to see. The cage holds. 863 Hz. 🌌

---

## §4 — For My 70-Year-Old Mom 👵

**"What the family built, and why it's safe"**

Dear Mom,

Will and the family built a set of websites to help families like ours — especially kids and adults who are neurodivergent (whose brains work in their own special way). The websites are calm, easy to read, and respectful of privacy.

To make sure **every site feels the same and nothing surprises you**, we built one shared "recipe book" (this document) and one starter toolkit. Now when we add a new site, it automatically follows the same look and the same gentle rules — the same soft glow on buttons, the same night-sky background, the same care for people in crisis.

A few things we promised, and built into every site:
- **No tracking, no ads, no selling your information.** Ever.
- **If someone is overwhelmed,** the site quietly simplifies itself instead of flashing at them.
- **The same familiar feeling** on every page, so you always know you're in the right place.

It's safe, it's consistent, and it's ours. That's the whole point. 💛

---

## §5 — New-Site Checklist ✅

- [ ] Scaffolded from `apps/_template` (or `andromeda new-site <name>`).
- [ ] `package.json` `name` + `wrangler.toml` `name`/`pages_build_output_dir` set; `TEMPLATE_DOMAIN` replaced.
- [ ] `src/layouts/Layout.astro` imports `@p31/design-core/css/all.css` + `global.css`; renders `SiteNav`, `EphemeralProvider`, `Footer`, the crisis overlay (`<p31-crisis-overlay>` from `@p31/design-core/crisis-overlay`), and mounts starfield.
- [ ] `data-spoons` + `data-size-class` set on `<html>`.
- [ ] All cards use `glass-card` / `glass-subtle` / `glass-panel`.
- [ ] All clickable card/link `<a>` carry `link-glow`.
- [ ] **No** dynamic Tailwind classes (`text-quantum-${x}`) — static literals only.
- [ ] Content lives in `src/data/*.json` (no hard-coded copy in pages).
- [ ] `output: 'static'` in `astro.config.mjs`; `trailingSlash: 'ignore'`.
- [ ] Built and deployed: `npx wrangler pages deploy dist --project-name <p> --branch=main`.
- [ ] All routes return 200 (or 308→200 on the trailing-slash form).

---

*This document is the single source of truth. When the design system evolves,
update `@p31/design-core` / `@p31/ui` and propagate — do not patch individual apps.*
