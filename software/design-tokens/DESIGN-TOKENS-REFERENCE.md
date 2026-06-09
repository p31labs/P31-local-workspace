# P31 design tokens — full reference

<!-- AUTO-GENERATED — do not hand-edit. Source: p31-universal-canon.json -->

**Schema:** `p31.universalCanon/1.0.0` · **Canon version:** `1.2.0` · **Generated:** `2026-05-22T20:15:22.561Z`

*P31 universal design canon — shared tokens, ring-local appearance*

Single source for typography, spacing, motion, and brand palette. Ring A (p31ca hub) defaults to appearance "hub" (dark). Ring D (phosphorus31.org) uses appearance "org" (light) via data-p31-appearance on <html> — same brand colors, inverted surfaces so it feels related but not identical. BONDING (bonding.p31ca.org) stays out of this file by operator policy.

**Regenerate:** from P31 home repo root, `npm run apply:p31-style` (keeps this file in sync) or `npm run generate:design-token-docs`.

---

## Rings

| Ring | Hosts (sample) | Default `appearance` | Notes |
| --- | --- | --- | --- |
| hub | p31ca.org, www.p31ca.org, *.p31ca.pages.dev | hub | Technical hub, static tools, Astro + Tailwind CDN pages. |
| org | phosphorus31.org, www.phosphorus31.org, api.phosphorus31.org | org | Public org narrative + MAP surfaces. Opt in with data-p31-appearance="org" (or server-render default). |

## Brand palette (shared across appearances)

*Brand anchors — appearances should keep these identical for cross-ring recognition.*

| Token | Hex (canonical) | CSS variable |
| --- | --- | --- |
| coral | `#cc6247` | `--p31-coral` (in :root) |
| teal | `#5DCAA5` | `--p31-teal` (in :root) |
| cyan | `#4db8a8` | `--p31-cyan` (in :root) |
| amber | `#cda852` | `--p31-amber` (in :root) |
| lavender | `#8b7cc9` | `--p31-lavender` (in :root) |
| phosphorus | `#3ba372` | `--p31-phosphorus` (in :root) |
| phosphor | `#00FF88` | `--p31-phosphor` (in :root) |
| fuchsia | `#e879f9` | `--p31-fuchsia` (in :root) |

## Typography

### Font stacks

| Role | Families (JSON order) | CSS variable |
| --- | --- | --- |
| sans | Atkinson Hyperlegible, sans-serif | `--p31-font-sans` |
| mono | JetBrains Mono, monospace | `--p31-font-mono` |

### Type scale (rem)

| Key | Value | CSS variable |
| --- | --- | --- |
| xs | 0.75rem | --p31-text-xs |
| sm | 0.875rem | --p31-text-sm |
| base | 1rem | --p31-text-base |
| md | 1.0625rem | --p31-text-md |
| lg | 1.125rem | --p31-text-lg |
| xl | 1.25rem | --p31-text-xl |
| 2xl | 1.5rem | --p31-text-2xl |
| 3xl | 1.875rem | --p31-text-3xl |
| 4xl | 2.25rem | --p31-text-4xl |

### Line height

| Key | Value | CSS variable |
| --- | --- | --- |
| tight | 1.25 | --p31-leading-tight |
| snug | 1.4 | --p31-leading-snug |
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
| 5 | 1.25rem | --p31-space-5 |
| 6 | 1.5rem | --p31-space-6 |
| 8 | 2rem | --p31-space-8 |
| 10 | 2.5rem | --p31-space-10 |
| 12 | 3rem | --p31-space-12 |
| 16 | 4rem | --p31-space-16 |
| 20 | 5rem | --p31-space-20 |
| 24 | 6rem | --p31-space-24 |
| px | 1px | --p31-space-px |

## Radius, shadow, motion, z-index, focus

### Border radius

| Key | Value | CSS variable |
| --- | --- | --- |
| none | 0 | --p31-radius-none |
| sm | 4px | --p31-radius-sm |
| md | 8px | --p31-radius-md |
| lg | 12px | --p31-radius-lg |
| xl | 16px | --p31-radius-xl |
| 2xl | 1.25rem | --p31-radius-2xl |
| full | 9999px | --p31-radius-full |

### Shadow

| Key | Value | CSS variable |
| --- | --- | --- |
| none | none | --p31-shadow-none |
| sm | 0 1px 2px rgba(0, 0, 0, 0.06) | --p31-shadow-sm |
| md | 0 4px 14px rgba(0, 0, 0, 0.08) | --p31-shadow-md |
| lg | 0 12px 40px rgba(0, 0, 0, 0.12) | --p31-shadow-lg |
| glowTeal | 0 0 24px rgba(37, 137, 125, 0.25) | --p31-shadow-glowTeal |

### Motion — duration (ms in CSS, emitted with `ms` suffix in file)

| Key | Value (ms) | CSS variable |
| --- | --- | --- |
| instant | 100 | --p31-duration-instant |
| fast | 150 | --p31-duration-fast |
| normal | 250 | --p31-duration-normal |
| slow | 400 | --p31-duration-slow |
| glacial | 800 | --p31-duration-glacial |

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
| hubRingColor | rgba(77, 184, 168, 0.55) | `--p31-focus-color-hub` |
| orgRingColor | rgba(37, 137, 125, 0.45) | `--p31-focus-color-org` |

## Appearances (hub vs org)

Brand accents must match the palette above; neutrals differ. Hub is default; org uses `data-p31-appearance="org"` on a root (usually `<html>`).

### `hub`

| Field | Value |
| --- | --- |
| `colorScheme` | dark |
| `themeColor` | #0f1115 |

**Surface colors (same keys as --p31-*)**

| Role | Hex | CSS variable |
| --- | --- | --- |
| void | #0f1115 | --p31-void |
| surface | #161920 | --p31-surface |
| surface2 | #1c2028 | --p31-surface2 |
| coral | #cc6247 | --p31-coral |
| teal | #5DCAA5 | --p31-teal |
| cyan | #4db8a8 | --p31-cyan |
| cloud | #d8d6d0 | --p31-cloud |
| amber | #cda852 | --p31-amber |
| lavender | #8b7cc9 | --p31-lavender |
| phosphorus | #3ba372 | --p31-phosphorus |
| paper | #f4f4f5 | --p31-paper |
| ink | #1e293b | --p31-ink |
| muted | #6b7280 | --p31-muted |
| phosphor | #00FF88 | --p31-phosphor |
| fuchsia | #e879f9 | --p31-fuchsia |

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
| `colorScheme` | light |
| `themeColor` | #f5f4f0 |

*Light, warm paper field; ink-forward text. Brand hues MUST match palette.* — only neutrals (void/surface/cloud/ink/muted/paper) differ from hub.*

**Surface colors (same keys as --p31-*)**

| Role | Hex | CSS variable |
| --- | --- | --- |
| void | #f5f4f0 | --p31-void |
| surface | #ffffff | --p31-surface |
| surface2 | #ebeae4 | --p31-surface2 |
| coral | #cc6247 | --p31-coral |
| teal | #5DCAA5 | --p31-teal |
| cyan | #4db8a8 | --p31-cyan |
| cloud | #1e293b | --p31-cloud |
| amber | #cda852 | --p31-amber |
| lavender | #8b7cc9 | --p31-lavender |
| phosphorus | #3ba372 | --p31-phosphorus |
| paper | #fdfcfa | --p31-paper |
| ink | #0f172a | --p31-ink |
| muted | #64748b | --p31-muted |
| phosphor | #00FF88 | --p31-phosphor |
| fuchsia | #e879f9 | --p31-fuchsia |

**Semantic**

| Key | Value | CSS variable |
| --- | --- | --- |
| borderSubtle | rgba(15, 23, 42, 0.09) | --p31-border-subtle (appearance block) |

**Glass**

| Key | Value | CSS variable |
| --- | --- | --- |
| border | rgba(15, 23, 42, 0.07) | --p31-glass-border |
| surface | rgba(255, 255, 255, 0.82) | --p31-glass-surface |

## Tailwind CDN bridge (hub)

`p31ca/public/p31-tailwind-extend.js` sets `window.P31_TAILWIND_EXTEND` with `fontFamily` and `colors` (Tailwind v3 `theme.extend` shape). **Color values** in JS are `var(--p31-<name>)` for each key under `appearances.hub.colors`.

## See also

- [`README.md`](./README.md) — how to change tokens
- [`PHOSPHORUS31-RING.md`](./PHOSPHORUS31-RING.md) — org / light skin on phosphorus31.org
- Home repo `docs/ETHICAL-STYLE-MAP.md` — voice, motion ethics, and psychology (complements this file)
