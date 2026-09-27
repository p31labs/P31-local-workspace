# P31 UI Engineering Guardrails

Machine-executable rules for all AI agents interacting with the `@p31ca/ui` and `@p31ca/design-core` packages. Violations of these rules cause build failures, visual regressions, or monorepo breakage.

---

## 1. CSS Variable Fallbacks (NON-NEGOTIABLE)

**Never reference a CSS custom property without a fallback value.**

| Status | Example |
|--------|---------|
| ❌ INCORRECT | `padding-top: calc(var(--p31-nav-h) + 20px);` |
| ✅ CORRECT | `padding-top: calc(var(--p31-nav-h, 48px) + 20px);` |
| ❌ INCORRECT | `color: var(--p31-accent);` |
| ✅ CORRECT | `color: var(--p31-accent, #00F0FF);` |

**Rationale:** If a CSS variable fails to hydrate (SSR mismatch, async load order, missing import), the property evaluates to `0` or `inherit`, collapsing headers, hiding text, or producing `NaN` in `calc()` expressions.

---

## 2. Unbounded SVG Protection

**Never render raw SVG or icon components without a strict overflow-hidden bounding container.**

| Status | Example |
|--------|---------|
| ❌ INCORRECT | `<Crown className="absolute top-0 w-8 h-8" />` |
| ✅ CORRECT | `<span className="inline-flex items-center justify-center w-8 h-8 flex-shrink-0 overflow-hidden"><Crown /></span>` |

**Rationale:** SVGs scale intrinsically. Without a bounding container, an SVG nested in a flex context will expand to fill available space (blowing out the sidebar, navigation, or entire page).

---

## 3. Flex & Grid Overflow Prevention

**All flex containers must explicitly handle wrapping or min-width constraints.**

| Status | Example |
|--------|---------|
| ❌ INCORRECT | `<div className="flex items-center"><LongText /></div>` |
| ✅ CORRECT | `<div className="flex flex-wrap items-center min-w-0"><LongText className="truncate" /></div>` |

**Rationale:** Flex items default to `min-width: auto`, causing content to overflow the container rather than wrapping or truncating.

---

## 4. Monorepo Blast Radius Protocol

**Any modification to shared packages (`@p31ca/ui`, `@p31ca/design-core`) requires building ALL consumer apps before marking the task complete.**

Mandatory verification:
```bash
pnpm run -r build
```

Consumer apps that MUST build clean:
- `apps/p31ca` (filter: `p31ca`)
- `apps/phosphorus31` (filter: `planetary-planet`)
- `apps/phos` (filter: `phos`)
- `apps/willow` (filter: `willow`)
- `apps/bonding` (filter: `bonding`)

**When modifying `packages/ui/package.json` `exports`:** Do NOT manually edit the exports map. Use `pnpm run build` in the package, which auto-generates correct exports. Manual edits strip specifiers like `./layout`, breaking Astro/Vite resolvers across all consumers.

---

## 5. Three-Tier Token Architecture

Tokens flow through three strictly ordered tiers. Components MUST NOT skip tiers.

| Tier | Prefix | Used By | Example |
|------|--------|---------|---------|
| **Reference** (Raw Primitives) | `--p31-ref-*` | System tokens only | `--p31-ref-color-cyan` |
| **System** (Semantic Purpose) | `--p31-sys-*` | Component tokens, theming | `--p31-sys-accent` |
| **Component** (UI Usage) | `--p31-*` | Components, templates, layouts | `--p31-accent` |

**Components must NEVER reference `--p31-ref-*`** — always use `--p31-*` (which maps to `--p31-sys-*`, which maps to `--p31-ref-*`).

---

## 6. Token Source of Truth

The canonical token source is `packages/design-core/src/css/tokens.css`. Before generating or modifying any UI component, read this file. Never hardcode pixel values, hex colors, or `oklch()` directly in component styles.

```bash
# Token health check
node cli/validators/spatialValidator.mjs --tokens cli/tokens/tokens.yml --src apps/p31ca/src --health
```

---

## 7. DESIGN.md Contract Enforcement

DESIGN.md encodes non-negotiable invariants. Before generating UI, verify against these rules:

| Invariant | Check | Remedy |
|-----------|-------|--------|
| One primary accent per screen | Count `--p31-accent` usages | Replace extras with `--p31-accent-violet` |
| No pure white text | `color: #FFFFFF` or `color: white` | Use `--p31-text` / `--p31-text-primary` |
| No pure black backgrounds | `background: #000000` or `background: black` | Use `--p31-void` / `--p31-bg` |
| Glass containers only | `<div>` with bg but no glass class | Use `.glass-card` or `.glass-panel` |
| Spoon-aware motion | Component lacks `data-spoons` | Add `data-spoons` attribute handling |
| 48px touch targets | `min-height < 48px` on interactive elements | Bump to 48px |
| SVG bounding box | Raw SVG without `overflow-hidden` wrapper | Wrap in bounded container |
| CSS variable fallbacks | `var(--p31-*)` without fallback | Add explicit fallback value |

---

## 8. Visual Verification (Playwright)

**Before marking any UI refactor or layout change as complete:**
1. Launch a local browser via Playwright MCP.
2. Capture a full-page screenshot.
3. Visually verify:
   - No overlapping elements
   - No zero-height or zero-width containers
   - No SVG scale blowouts
   - Navbar and footer render correctly at desktop + mobile viewports
   - Glass panels have proper blur and borders
4. If any visual issue exists, fix it before declaring the task done.

---

## 9. Commit Message Protocol

| Prefix | When |
|--------|------|
| `feat:` | New components, features, tokens |
| `fix:` | Bug fixes, visual regression fixes |
| `refactor:` | Structural changes, token migrations |
| `design:` | DESIGN.md, tokens.css, theme changes |

Tag impacted apps: `[p31ca]`, `[phosphorus31]`, `[phos]`, `[willow]`, `[bonding]`, `[ui]`, `[design-core]`.

Example: `feat(ui): add crisis-overlay component [phos]`

---

## 10. Mandatory Macro-Shell Wrapping

Every route or page MUST use the correct canonical layout shell from `@p31ca/ui` as the root structural component:

| App | Shell | Import Path |
|-----|-------|-------------|
| `p31ca` | `<LandingShell>` | `import { LandingShell } from '@p31ca/ui'` |
| `phosphorus31` | `<LandingShell>` | `import { LandingShell } from '@p31ca/ui'` |
| `phos` | `<WorkspaceShell>` | `import { WorkspaceShell } from '@p31ca/ui'` |
| `willow` | `<ConversationShell>` | `import { ConversationShell } from '@p31ca/ui'` |

Raw `<div>`, `<main>`, or `<header>` at the page root is FORBIDDEN. Layout must be achieved within a shell.

## 11. Zero Page-Level Absolute/Fixed Positioning

`position: absolute`, `position: fixed`, and `float` are FORBIDDEN outside of pre-built overlay components (modals, toasts, dropdowns). All layout must use flex/grid inside a canonical shell.

## 12. Navigation Must Be Structured Data

Navigation links must be passed as typed arrays to `SiteNav` or a shell component's `navLinks` prop. Raw inline `<a>` tags or un-wrapped text links at the page root are FORBIDDEN. Each link must conform to `SiteNavLink`:

```typescript
interface SiteNavLink {
  href: string;
  label: string;
  external?: boolean;
}
```

---

## 13. Viewport Ownership

The root component MUST be one of the three macro-shells: `<LandingShell>`, `<WorkspaceShell>`, or `<ConversationShell>`.

- No component may set `height: 100vh`, `height: 100dvh`, or `overflow: hidden` outside of a macro-shell.
- The shell is the single source of truth for viewport dimensions and scroll behavior.
- Child components are bounded soldiers; they do not own the viewport.

## 14. Off-Canvas Drawer Isolation

Off-canvas drawers (mobile nav) MUST be `position: fixed` with `z-index` using the token system (`--p31-z-nav-drawer`).

- Drawers MUST be rendered via React Portal to `document.body` to escape flex containment.
- `transform: translateX(100%)` for closed, `translateX(0)` for open.
- Backdrop MUST be `absolute inset-0` inside the same portal container.

## 15. Header Height Consistency

The header wrapper (`<SiteNav>`) MUST have `shrink-0`, `w-full`, and a bounded height.

- Use `max-h-14` / `h-14` or `var(--p31-nav-h, 48px)` to prevent flex-stretching.
- The crown logo and spoon dial MUST have `align-items: center` to prevent vertical stretching.
- Mobile: show compact SpoonDial (`mode="compact"`). Desktop: show full `mode="icon"`.
- All z-index values MUST use token system (`--p31-z-nav`, `--p31-z-nav-drawer`), never hardcoded `z-50` / `z-40`.
