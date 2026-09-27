# Template B: Institutional Landing (Garden)

> `phosphorus31.org` homepage — nonprofit institutional: light-on-dark editorial, emerald primary, mission-driven. Trust signals (EIN, ORCID, 501c3), pilot stats, impact numbers, transparent team section. Research organization facing.

## Visual Theme

Clean, trustworthy, editorial. Emerald (green) primary accent for growth and care. Amber secondary for warmth. The layout prioritizes text hierarchy — headings are big, body text is readable — with stats cards for social proof. No density; generous whitespace. This is the nonprofit's public face for donors, partners, and researchers.

## Color Palette

```yaml
accent:
  primary: var(--p31-color-emerald)     # oklch(65% 0.18 105) — #34D399
  amber: var(--p31-color-amber)         # oklch(65% 0.18 15) — #FBBF24
  cyan: var(--p31-color-cyan)           # oklch(65% 0.18 195) — #00F0FF
  violet: var(--p31-color-violet)       # oklch(65% 0.18 285) — #A78BFA
surface:
  void: var(--p31-void)                 # #0A0A0F
  card: var(--p31-surface-card)         # oklch(18% 0.015 240)
  border: var(--p31-surface-border)     # oklch(28% 0.02 240)
text:
  primary: var(--p31-text-primary)      # oklch(96% 0.005 240)
  secondary: var(--p31-text-secondary)  # oklch(75% 0.01 240)
  muted: var(--p31-text-muted)          # oklch(65% 0.01 240)
  subtle: var(--p31-text-subtle)        # oklch(45% 0.01 240)
borders:
  card: var(--p31-surface-border)
  pills: rgba(16,185,129,0.1) bg / rgba(16,185,129,0.2) border
```

## Typography

```yaml
hero:
  title: text-4xl md:text-6xl lg:text-7xl, font-extrabold
  accent-phrase: emerald color on "built for neurodivergent families"
  subtitle: text-base md:text-lg, text-secondary, max-w-2xl
section-headers:
  heading: text-2xl md:text-4xl, font-bold, text-primary
  description: text-sm/text-base, text-secondary, max-w-2xl
stats:
  number: text-3xl md:text-4xl, font-bold, font-mono
  label: text-xs, font-medium, text-muted
body:
  base: text-sm, leading-relaxed
  card-text: text-sm, text-muted
buttons:
  primary: px-8 py-3, rounded-full, font-semibold, text-sm
  secondary: px-8 py-3, rounded-full, font-semibold, text-sm, border
font-family: Inter (body), JetBrains Mono (stats, ORCID)
```

## Layout

```yaml
structure:
  - Layout (with JSON-LD, canonical, title, description)
  - Page wrapper (max-width lg, centered)
  - HERO: 501c3 badge pill + H1 + subtitle + live stats row + 3 CTAs
  - MISSION: 4 <details> accordion cards + Team + Transparency panels
  - IMPACT: 4 stat cards + 2 testimonials
  - PRODUCTS: 4 cards in SectionFeatures(grid)
  - RESEARCH: 3 cards in SectionFeatures(grid)
  - GET INVOLVED: 4 cards (Join Pilot, Donate, Volunteer, Partner)
  - FINAL CTA: emerald-bordered card with heart icon + 3 action buttons
  - Footer
max-width: --p31-max-width-lg
section-spacing: var(--p31-space-xl) top + bottom
```

## Components Used

| Component | Import | Purpose |
|-----------|--------|---------|
| `Layout` | `../layouts/Layout.astro` | Page shell with meta, JSON-LD |
| `Page` | `@p31ca/ui/templates/Page` | Content wrapper |
| `SectionHero` | `@p31ca/ui/templates/SectionHero` | Hero section |
| `SectionFeatures` | `@p31ca/ui/templates/SectionFeatures` | Grid sections |
| `Footer` | `@p31ca/ui/templates/Footer` | Page footer |

## Components NOT Used

- **No Crown** — institutional sites use the wordmark, not the SVG crown
- **No SiteNav** — this template uses the Layout's built-in nav
- **No SpoonDial** — nonprofit public face; spoon controls live inside PHOS

## Tokens Used

```yaml
color: --p31-color-emerald, --p31-color-amber, --p31-color-cyan, --p31-color-violet
surface: --p31-surface-card, --p31-surface-border, --p31-void
text: --p31-text-primary, --p31-text-secondary, --p31-text-muted, --p31-text-subtle
spacing: --p31-space-xs through --p31-space-xl
max-width: --p31-max-width-lg
```

## Behavioral Rules

1. **Trust signals above the fold** — 501c3 badge pill (animated emerald dot), EIN 42-1888158, ORCID link. All visible in the hero without scrolling.
2. **Live stats as social proof** — 4 stat cards (Pilot Families, LOVE Issued, Apps Live, Workers Live) in hero with mono numbers and muted labels.
3. **Mission accordions** — Mission/Vision/Values/Principles use `<details>` elements for progressive disclosure. Default: all collapsed except Mission.
4. **Transparency panel** — Separate card with EIN, Open Source badge, Privacy badge. Adjacent to Team card. Institutional trust architecture.
5. **Testimonials** — Two quoted testimonials from pilot families with initials and green/amber avatar circles.
6. **Status badges on products** — "Live", "Beta", "Research" badges with green/amber/violet styling.
7. **Emerald primary only** — The emerald accent drives ALL primary CTAs. Amber is for secondary emphasis. Cyan/violet are for variety in data cards.
8. **Pill CTAs** — All buttons use `rounded-full` (pill shape). More friendly and institutional than the sharp rectangles of the developer hub.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Emerald as primary accent | Green = growth, care, nonprofit, trust. Contrasts with the cyan-heavy developer hub |
| 501c3 badge pill in hero | Immediate trust signal for donors and partners |
| Live stats in hero | Social proof: "18 families trust this" is more powerful than a mission statement |
| `<details>` accordions for mission | Nonprofit visitors scan for credibility signals. Progressive disclosure lets them dig in if interested |
| Team + Transparency side by side | Personal + institutional trust in one glance |
| ORCID link visible | Academic credibility for researchers evaluating the organization |
| No Crown SVG | Institutional sites use text/wordmarks, not abstract icons |
| Pill buttons | Rounder, friendlier. Matches the nonprofit's approachable tone |

## Agent Generation Rules

1. Wrap page in `<Layout jsonLd={...} canonical="..." title="...">`
2. Use `<Page>` template wrapper
3. Hero: 501c3 badge pill → H1 with emerald accent span → subtitle → 4 stat cards → 3 pill CTAs
4. Mission: Section with heading + description → 4 `<details>` in 4-col grid
5. Team + Transparency: 2-col grid with equal-height cards
6. Impact: Heading + description → 4 stat cards (2x4 → 4-col) → 2 testimonials
7. Products: Heading + `<SectionFeatures columns={4}>` → 4 product cards with status badges
8. Research: Heading + `<SectionFeatures columns={3}>` → 3 research cards
9. Get Involved: 4 action cards (Join Pilot with emerald CTA, others with border-only CTAs)
10. Final CTA: emerald-bordered card with heart SVG icon → heading → description → 3 buttons (Ko-fi, GitHub, Discord)
11. Use `var(--p31-surface-card)` for all card backgrounds with `var(--p31-surface-border)` borders
12. All spacing uses `var(--p31-space-*)` token references
13. All colors use token references via `style=""` — no hardcoded hex except in gradient backgrounds

## Source File
`apps/phosphorus31/src/pages/index.astro` (363 lines)
