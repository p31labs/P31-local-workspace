# Template A: Developer Hub Landing (Fortress)

> `p31ca.org` homepage — technical hub: dark, high-contrast, density-packed. Crown mark, product grid, agent mesh, research publications, call-to-action. Developer-facing, maximal content per viewport.

## Visual Theme

Dark, high-contrast, technical. Cyan primary accent with violet/emerald/gold support colors. Dense information architecture — 7 sections on one page: Hero, Architecture, Products, Family, Agent Mesh, Research, CTA. Every card is glass-subtle with colored accent borders.

## Color Palette

```yaml
accent:
  primary: var(--p31-accent)            # #00F0FF — cyan
  violet: var(--p31-accent-violet)      # #A78BFA
  gold: var(--p31-accent-gold)          # #FBBF24
  green: var(--p31-accent-green)        # #34D399
  red: var(--p31-accent-red)            # #FB7185
  iris: var(--p31-accent-iris)          # #818CF8
surface:
  void: var(--p31-void)                 # #0A0A0F
  glass-subtle: rgba(255,255,255,0.03)
  glass-card: var(--p31-glass-surface)  # rgba(255,255,255,0.04)
  glass-strong: rgba(255,255,255,0.08)
text:
  primary: #F5F5F7
  secondary: rgba(245,245,247,0.5)
  tertiary: rgba(245,245,247,0.3)
  muted: rgba(245,245,247,0.2)
borders:
  glass: rgba(255,255,255,0.08)
  hover: rgba(255,255,255,0.15)
```

## Typography

```yaml
hero:
  title: 96px (text-8xl), font-extrabold, tight tracking
  title-accent: gradient from-cyan-400 via-indigo-400 to-violet-400, bg-clip-text
  subtitle: text-lg, white/50, max-w-xl
section-headers:
  label: 10px, font-mono, tracking-[0.2em], uppercase, white/20
  heading: text-3xl md:text-4xl, font-bold, #F5F5F7
  description: text-sm, white/40
card:
  title: text-sm/base font-bold
  body: text-xs, white/40-50
body: font-family Inter
mono: font-family JetBrains Mono
```

## Layout

```yaml
structure:
  - AppShell (layout wrapper)
  - SectionHero: Crown + H1 + subtitle + CTA buttons + EIN
  - Architecture: Tetrahedral Mesh overview + 4 vertex cards
  - Products: 8-card grid (2x4), colored left-border accents
  - Family: Grandparent agents (2-col) + children (2-col)
  - Agent Mesh: 8-card grid (4-col), colored borders + tool counts
  - Research: 6 papers in 3-col grid
  - CTA: glass-strong panel, 3 buttons
  - Footer
max-width: 7xl (1280px)
section-spacing: space-y-6 to space-y-10
```

## Components Used

| Component | Import | Purpose |
|-----------|--------|---------|
| `AppShell` | `../layouts/AppShell.astro` | Page layout, meta, nav |
| `Crown` | `@p31ca/ui/chrome/Crown` | Brand mark in hero (size lg) |
| `SectionHero` | `@p31ca/ui/templates/SectionHero` | Hero section wrapper |
| `SectionFeatures` | `@p31ca/ui/templates/SectionFeatures` | Feature grid (4-col) |
| `Footer` | `@p31ca/ui/templates/Footer` | Standard footer |
| Glass classes | `@p31ca/design-core/css/glass.css` | `.glass-card`, `.glass-subtle`, `.glass-strong` |
| Buttons | `@p31ca/design-core/css/glass.css` | `.btn-primary`, `.btn-secondary`, `.btn-ghost` |

## Tokens Used

```yaml
color: --p31-accent, --p31-accent-violet, --p31-accent-gold, --p31-accent-green, --p31-accent-red
surface: --p31-glass-bg, --p31-glass-surface, --p31-glass-border
text: #F5F5F7, white/20-50 opacity variants
animation: fadeIn keyframes (0.3-0.4s, stagger 0.06-0.1s)
```

## Behavioral Rules

1. **Density-first** — The Fortress homepage is dense. 7 sections, 30+ cards. Not minimal — maximal content with glass hierarchy to manage cognitive load.
2. **Colored accents per card** — Each card in a grid uses a unique accent color (cyan, violet, emerald, gold) for its border/title/accent bar. This creates visual differentiation in dense grids.
3. **Animated stagger** — Cards use `animation: fadeIn 0.4s ease-out ${i * 0.08}s both` for staggered reveal. Respects spoon-aware motion.
4. **Product cards have color-coded dots** — Small 1.5px dots with glow (box-shadow) matching the card's accent color.
5. **Agent cards show tool counts** — Each agent card displays a colored tool count badge (rounded, accent-tinted bg).
6. **Mono labels** — Section headers use 10px JetBrains Mono, uppercase, tracking-[0.2em] — a technical/dashboard aesthetic.
7. **EIN in hero** — Legal name + EIN in mono subtitle below hero CTA.
8. **No SpoonDial visible** — Developer hub assumes moderate-to-high spoons (3+). No spoon adjustment UI.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| 7 sections on one page | Developer audiences browse dense information. Glass hierarchy prevents overwhelm |
| Every card is glass | Consistent depth model. No flat containers |
| Color-coded card borders | Each domain (products, agents, research) gets a color-family accent strip |
| Agent mesh at card-level detail | Developers evaluate tools by reading tool names. Cards show 3 tools + "+N more" |
| Gradient hero title | Distinguishes the "your brain" phrase — the core differentiator — from the rest |
| Family section with named agents | Humanizes the technical infrastructure. BOB and MARGE are real grandparents |
| Research with status badges | Color-coded (green=published, gold=in review, cyan=preprint) |

## Agent Generation Rules

1. Start with `<AppShell title="P31 Labs — ...">`
2. Hero: `<SectionHero>` with centered `<Crown size="lg">`, H1 with gradient accent span, subtitle, CTA row
3. Architecture: 4 `<a class="glass-card">` in `<SectionFeatures columns={4}>`, each with icon + name + tagline + description
4. Products: 8 `<a class="glass-subtle">` in `<SectionFeatures columns={4}>`, each with color-coded left border and dot
5. Agents: 8 `<div class="glass-card">` in 4-col grid, each with colored border, initial letter icon, tool count badge, and tool chip tags
6. Research: 6 `<a class="glass-subtle">` in 3-col grid, with status badges using conditional colors
7. CTA: `<div class="glass-strong">` with heading, description, 3 buttons
8. Footer: `<Footer copyright="© 2024–2025 P31 Labs, Inc." />`
9. Use inline `style=""` for per-card accent colors (they vary per card)
10. Use `link-glow` class on all card links for hover glow effect
11. Apply `fadeIn` stagger animation with `animation-delay: ${i * 0.08}s`

## Source File
`apps/p31ca/src/pages/index.astro` (397 lines)
