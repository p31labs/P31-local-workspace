# P31 design tokens — full reference

<!-- AUTO-GENERATED — do not hand-edit. Source: p31-universal-canon.json -->

**Schema:** `p31.universalCanon/2.0.0` · **Canon version:** `2.0.0` · **Generated:** `2026-07-15T23:27:57.841Z`

*P31 universal design canon — @p31/design-core v2.0.0 (mathematical foundation)*

All visual values derived from PHI (1.618), Perfect Fourth (1.333), 4-multiple grid, OKLCH color space, and musical tempo (120 BPM). Single source of truth. Every surface imports from design-core. Divergence is a type error.

**Regenerate:** from P31 home repo root, `npm run apply:p31-style` (keeps this file in sync) or `npm run generate:design-token-docs`.

---

## Rings

| Ring | Hosts (sample) | Default `appearance` | Notes |
| --- | --- | --- | --- |
| hub | p31ca.org, www.p31ca.org, *.p31ca.pages.dev, phosphorus31.org, www.phosphorus31.org | hub | Dark-only unified appearance. org appearance retired. |

## Brand palette (shared across appearances)

*DESIGN.md canonical colors — identical across all surfaces.*

| Token | Hex (canonical) | CSS variable |
| --- | --- | --- |
| coral | `#FB7185` | `--p31-coral` (in :root) |
| teal | `#34D399` | `--p31-teal` (in :root) |
| cyan | `#00F0FF` | `--p31-cyan` (in :root) |
| amber | `#FBBF24` | `--p31-amber` (in :root) |
| lavender | `#A78BFA` | `--p31-lavender` (in :root) |
| phosphorus | `#34D399` | `--p31-phosphorus` (in :root) |
| phosphor | `#00F0FF` | `--p31-phosphor` (in :root) |
| fuchsia | `#A78BFA` | `--p31-fuchsia` (in :root) |

## Typography

### Font stacks

| Role | Families (JSON order) | CSS variable |
| --- | --- | --- |
| sans | Inter, ui-sans-serif, system-ui, -apple-system, sans-serif | `--p31-font-sans` |
| mono | JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace | `--p31-font-mono` |

### Type scale (rem)

| Key | Value | CSS variable |
| --- | --- | --- |
| xs | 0.44rem | --p31-text-xs |
| sm | 0.56rem | --p31-text-sm |
| base | 1rem | --p31-text-base |
| md | 1rem | --p31-text-md |
| lg | 1.33rem | --p31-text-lg |
| xl | 1.78rem | --p31-text-xl |
| 2xl | 2.37rem | --p31-text-2xl |
| 3xl | 3.16rem | --p31-text-3xl |
| 4xl | 3.16rem | --p31-text-4xl |

### Line height

| Key | Value | CSS variable |
| --- | --- | --- |
| tight | 1.1 | --p31-leading-tight |
| snug | 1.2 | --p31-leading-snug |
| normal | 1.6 | --p31-leading-normal |
| relaxed | 1.75 | --p31-leading-relaxed |

### Letter spacing

| Key | Value | CSS variable |
| --- | --- | --- |
| tight | -0.02em | --p31-tracking-tight |
| normal | 0 | --p31-tracking-normal |
| wide | 0.08em | --p31-tracking-wide |
| caps | 0.12em | --p31-tracking-caps |

## Spacing

| Key | Value | CSS variable |
| --- | --- | --- |
| 0 | 0 | --p31-space-0 |
| 1 | 0.25rem | --p31-space-1 |
| 2 | 0.5rem | --p31-space-2 |
| 3 | 0.75rem | --p31-space-3 |
| 4 | 1rem | --p31-space-4 |
| 6 | 1.5rem | --p31-space-6 |
| 8 | 2rem | --p31-space-8 |
| 12 | 3rem | --p31-space-12 |
| 16 | 4rem | --p31-space-16 |
| 24 | 6rem | --p31-space-24 |
| px | 1px | --p31-space-px |

## Radius, shadow, motion, z-index, focus

### Border radius

| Key | Value | CSS variable |
| --- | --- | --- |
| none | 0 | --p31-radius-none |
| sm | 8px | --p31-radius-sm |
| md | 12px | --p31-radius-md |
| lg | 24px | --p31-radius-lg |
| xl | 24px | --p31-radius-xl |
| 2xl | 24px | --p31-radius-2xl |
| full | 9999px | --p31-radius-full |

### Shadow

| Key | Value | CSS variable |
| --- | --- | --- |
| none | none | --p31-shadow-none |
| sm | 0 1px 2px rgba(0, 0, 0, 0.06) | --p31-shadow-sm |
| md | 0 4px 14px rgba(0, 0, 0, 0.08) | --p31-shadow-md |
| lg | 0 12px 40px rgba(0, 0, 0, 0.12) | --p31-shadow-lg |
| glowTeal | 0 0 24px rgba(0, 240, 255, 0.25) | --p31-shadow-glowTeal |

### Motion — duration (ms in CSS, emitted with `ms` suffix in file)

| Key | Value (ms) | CSS variable |
| --- | --- | --- |
| instant | 63 | --p31-duration-instant |
| fast | 125 | --p31-duration-fast |
| normal | 250 | --p31-duration-normal |
| slow | 500 | --p31-duration-slow |
| glacial | 1000 | --p31-duration-glacial |

### Motion — easing

| Key | Easing | CSS variable |
| --- | --- | --- |
| standard | `cubic-bezier(0.4, 0, 0.2, 1)` | --p31-ease-standard |
| emphasized | `cubic-bezier(0.2, 0, 0, 1)` | --p31-ease-emphasized |
| decelerate | `cubic-bezier(0, 0, 0.2, 1)` | --p31-ease-decelerate |

### z-index

| Key | Value | CSS variable |
| --- | --- | --- |
| base | 0 | --p31-z-base |
| dropdown | 50 | --p31-z-dropdown |
| sticky | 100 | --p31-z-sticky |
| overlay | 200 | --p31-z-overlay |
| modal | 300 | --p31-z-modal |
| toast | 400 | --p31-z-toast |

### Focus ring

| Key | Value | CSS variable / note |
| --- | --- | --- |
| ringWidth | 2px | `--p31-focus-ring` |
| ringOffset | 2px | `--p31-focus-offset` |
| hubRingColor | rgba(0, 240, 255, 0.55) | `--p31-focus-color-hub` |
| orgRingColor | rgba(0, 240, 255, 0.45) | `--p31-focus-color-org` |

## Appearances (hub vs org)

Brand accents must match the palette above; neutrals differ. Hub is default; org uses `data-p31-appearance="org"` on a root (usually `<html>`).

### `hub`

| Field | Value |
| --- | --- |
| `colorScheme` | dark |
| `themeColor` | #0A0A0F |

**Surface colors (same keys as --p31-*)**

| Role | Hex | CSS variable |
| --- | --- | --- |
| void | #0A0A0F | --p31-void |
| surface | #12121A | --p31-surface |
| surface2 | #1C1C2A | --p31-surface2 |
| coral | #FB7185 | --p31-coral |
| teal | #34D399 | --p31-teal |
| cyan | #00F0FF | --p31-cyan |
| cloud | #A1A1AA | --p31-cloud |
| amber | #FBBF24 | --p31-amber |
| lavender | #A78BFA | --p31-lavender |
| phosphorus | #34D399 | --p31-phosphorus |
| paper | #F5F5F7 | --p31-paper |
| ink | #0A0A0F | --p31-ink |
| muted | #6b7280 | --p31-muted |
| phosphor | #00F0FF | --p31-phosphor |
| fuchsia | #A78BFA | --p31-fuchsia |

**Semantic**

| Key | Value | CSS variable |
| --- | --- | --- |
| borderSubtle | rgba(255, 255, 255, 0.06) | --p31-border-subtle (appearance block) |

**Glass**

| Key | Value | CSS variable |
| --- | --- | --- |
| border | rgba(255, 255, 255, 0.08) | --p31-glass-border |
| surface | rgba(255, 255, 255, 0.04) | --p31-glass-surface |

### `org`

| Field | Value |
| --- | --- |
| `colorScheme` | dark |
| `themeColor` | #0A0A0F |

*Org appearance retired — dark-only unified. Identical to hub.*

**Surface colors (same keys as --p31-*)**

| Role | Hex | CSS variable |
| --- | --- | --- |
| void | #0A0A0F | --p31-void |
| surface | #12121A | --p31-surface |
| surface2 | #1C1C2A | --p31-surface2 |
| coral | #FB7185 | --p31-coral |
| teal | #34D399 | --p31-teal |
| cyan | #00F0FF | --p31-cyan |
| cloud | #A1A1AA | --p31-cloud |
| amber | #FBBF24 | --p31-amber |
| lavender | #A78BFA | --p31-lavender |
| phosphorus | #34D399 | --p31-phosphorus |
| paper | #F5F5F7 | --p31-paper |
| ink | #0A0A0F | --p31-ink |
| muted | #6b7280 | --p31-muted |
| phosphor | #00F0FF | --p31-phosphor |
| fuchsia | #A78BFA | --p31-fuchsia |

**Semantic**

| Key | Value | CSS variable |
| --- | --- | --- |
| borderSubtle | rgba(255, 255, 255, 0.06) | --p31-border-subtle (appearance block) |

**Glass**

| Key | Value | CSS variable |
| --- | --- | --- |
| border | rgba(255, 255, 255, 0.08) | --p31-glass-border |
| surface | rgba(255, 255, 255, 0.04) | --p31-glass-surface |

## Tailwind CDN bridge (hub)

`p31ca/public/p31-tailwind-extend.js` sets `window.P31_TAILWIND_EXTEND` with `fontFamily` and `colors` (Tailwind v3 `theme.extend` shape). **Color values** in JS are `var(--p31-<name>)` for each key under `appearances.hub.colors`.

## See also

- [`README.md`](./README.md) — how to change tokens
- [`PHOSPHORUS31-RING.md`](./PHOSPHORUS31-RING.md) — org / light skin on phosphorus31.org
- Home repo `docs/ETHICAL-STYLE-MAP.md` — voice, motion ethics, and psychology (complements this file)
