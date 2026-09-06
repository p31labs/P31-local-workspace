import{t as e}from"./jsx-runtime-CGlKWo3u.js";import{n as t}from"./lib-CnqBG6y5.js";import{c as n,i as r,r as i,s as a}from"./dist-CL1Y-wr4.js";var o=e();function s(e){let s={blockquote:`blockquote`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,hr:`hr`,p:`p`,strong:`strong`,...t(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(a,{title:`Design System/Design Tokens`}),`
`,(0,o.jsx)(s.h1,{id:`design-tokens`,children:`Design Tokens`}),`
`,(0,o.jsxs)(s.p,{children:[`The P31 design system is mathematically grounded in quantum geometry. Every visual decision — font size, spacing, color, component dimension — flows from a single root: `,(0,o.jsx)(s.code,{children:`16px × (4/3)^n`}),`, timed to the 863 Hz Larmor frequency of phosphorus-31.`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`color-palette`,children:`Color Palette`}),`
`,(0,o.jsx)(s.p,{children:`All colors are defined in OKLCH space for perceptual uniformity, with hex fallbacks for legacy compatibility.`}),`
`,(0,o.jsx)(s.h3,{id:`accent-colors`,children:`Accent Colors`}),`
`,(0,o.jsxs)(r,{children:[(0,o.jsx)(i,{title:`Cyan`,subtitle:`Primary accent — oklch(65% 0.18 195)`,colors:{"#00F0FF":`var(--p31-color-cyan)`}}),(0,o.jsx)(i,{title:`Violet`,subtitle:`Secondary accent — oklch(65% 0.18 285)`,colors:{"#A78BFA":`var(--p31-color-violet)`}}),(0,o.jsx)(i,{title:`Amber`,subtitle:`Warmth, warning — oklch(65% 0.18 15)`,colors:{"#FBBF24":`var(--p31-color-amber)`}}),(0,o.jsx)(i,{title:`Emerald`,subtitle:`Success, growth — oklch(65% 0.18 105)`,colors:{"#34D399":`var(--p31-color-emerald)`}}),(0,o.jsx)(i,{title:`Red`,subtitle:`Error, urgency — oklch(65% 0.18 20)`,colors:{"#FB7185":`var(--p31-color-red)`}}),(0,o.jsx)(i,{title:`Iris`,subtitle:`Supporting accent — oklch(65% 0.18 270)`,colors:{"#818CF8":`var(--p31-color-iris)`}})]}),`
`,(0,o.jsx)(s.h3,{id:`surface-hierarchy`,children:`Surface Hierarchy`}),`
`,(0,o.jsxs)(r,{children:[(0,o.jsx)(i,{title:`Void`,subtitle:`Deepest background — var(--p31-void)`,colors:{"#0A0A0F":`--p31-void`}}),(0,o.jsx)(i,{title:`Void Deep`,subtitle:`Darker void — var(--p31-void-deep)`,colors:{"#050508":`--p31-void-deep`}}),(0,o.jsx)(i,{title:`Surface`,subtitle:`Base surface — var(--p31-surface)`,colors:{"#12121A":`--p31-surface`}}),(0,o.jsx)(i,{title:`Surface 2`,subtitle:`Raised surface — var(--p31-surface2)`,colors:{"#1C1C2A":`--p31-surface2`}}),(0,o.jsx)(i,{title:`Surface 3`,subtitle:`Highest surface — var(--p31-surface3)`,colors:{"#252535":`--p31-surface3`}})]}),`
`,(0,o.jsx)(s.h3,{id:`text-hierarchy`,children:`Text Hierarchy`}),`
`,(0,o.jsxs)(r,{children:[(0,o.jsx)(i,{title:`Text Primary`,subtitle:`var(--p31-text)`,colors:{"#F5F5F7":`--p31-text`}}),(0,o.jsx)(i,{title:`Text Secondary`,subtitle:`var(--p31-cloud)`,colors:{"#A1A1AA":`--p31-cloud (60% opacity)`}}),(0,o.jsx)(i,{title:`Text Tertiary`,subtitle:`var(--p31-text-tertiary)`,colors:{"rgba(245,245,247,0.3)":`--p31-text-tertiary (30% opacity)`}})]}),`
`,(0,o.jsx)(s.h3,{id:`semantic-aliases`,children:`Semantic Aliases`}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Maps To | Use Case |
|-------|---------|----------|
| `,(0,o.jsx)(s.code,{children:`--p31-semantic-success`}),` | `,(0,o.jsx)(s.code,{children:`var(--p31-color-emerald)`}),` | Success states, confirmations |
| `,(0,o.jsx)(s.code,{children:`--p31-semantic-warning`}),` | `,(0,o.jsx)(s.code,{children:`var(--p31-color-amber)`}),` | Warnings, cautions |
| `,(0,o.jsx)(s.code,{children:`--p31-semantic-error`}),` | `,(0,o.jsx)(s.code,{children:`oklch(65% 0.18 20)`}),` | Errors, destructive actions |
| `,(0,o.jsx)(s.code,{children:`--p31-semantic-info`}),` | `,(0,o.jsx)(s.code,{children:`var(--p31-color-cyan)`}),` | Informational messages |
| `,(0,o.jsx)(s.code,{children:`--p31-semantic-accent`}),` | `,(0,o.jsx)(s.code,{children:`var(--p31-color-cyan)`}),` | Primary accent reference |`]}),`
`,(0,o.jsxs)(s.blockquote,{children:[`
`,(0,o.jsxs)(s.p,{children:[(0,o.jsx)(s.strong,{children:`Rule:`}),` Never use pure white (`,(0,o.jsx)(s.code,{children:`#FFFFFF`}),`) or pure black (`,(0,o.jsx)(s.code,{children:`#000000`}),`). Always use token references.`]}),`
`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`typography`,children:`Typography`}),`
`,(0,o.jsx)(s.h3,{id:`fluid-type-scale`,children:`Fluid Type Scale`}),`
`,(0,o.jsxs)(s.p,{children:[`The scale follows `,(0,o.jsx)(s.code,{children:`V_n = 16px × (4/3)^n`}),`, ranging from step -1 (12px) to step +6 (90px).`]}),`
`,(0,o.jsx)(n,{fontSizes:[12,16,21,28,38,50,67,90],fontWeight:`normal`,sampleText:`Cognitive sovereignty through quantum design`}),`
`,(0,o.jsx)(s.h3,{id:`type-classes`,children:`Type Classes`}),`
`,(0,o.jsxs)(s.p,{children:[`| Class | CSS Variable | Approx Size | Weight | Line Height |
|-------|-------------|-------------|--------|-------------|
| `,(0,o.jsx)(s.code,{children:`.text-h1`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-4xl`}),` | 51px | 700 | 1.1 |
| `,(0,o.jsx)(s.code,{children:`.text-h2`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-3xl`}),` | 38px | 600 | 1.2 |
| `,(0,o.jsx)(s.code,{children:`.text-h3`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-2xl`}),` | 28px | 600 | 1.3 |
| `,(0,o.jsx)(s.code,{children:`.text-h4`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-xl`}),` | 21px | 600 | 1.3 |
| `,(0,o.jsx)(s.code,{children:`.text-body`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-base`}),` | 16px | 400 | 1.6 |
| `,(0,o.jsx)(s.code,{children:`.text-body-sm`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-sm`}),` | 14px | 400 | 1.6 |
| `,(0,o.jsx)(s.code,{children:`.text-label`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-xs`}),` | 12px | 500 | 1.0 |
| `,(0,o.jsx)(s.code,{children:`.text-code`}),` | `,(0,o.jsx)(s.code,{children:`--p31-text-sm`}),` | 14px | 400 | 1.6 |`]}),`
`,(0,o.jsx)(s.h3,{id:`glow-text-utilities`,children:`Glow Text Utilities`}),`
`,(0,o.jsxs)(s.p,{children:[`| Class | Effect |
|-------|--------|
| `,(0,o.jsx)(s.code,{children:`.glow-cyan`}),` | Cyan micro-glow (20px + 40px radius) |
| `,(0,o.jsx)(s.code,{children:`.glow-violet`}),` | Violet micro-glow |
| `,(0,o.jsx)(s.code,{children:`.glow-gold`}),` | Gold micro-glow |
| `,(0,o.jsx)(s.code,{children:`.glow-green`}),` | Emerald micro-glow |
| `,(0,o.jsx)(s.code,{children:`.glow-rose`}),` | Rose/red micro-glow |`]}),`
`,(0,o.jsx)(s.h3,{id:`font-families`,children:`Font Families`}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Font Stack |
|-------|-----------|
| `,(0,o.jsx)(s.code,{children:`--p31-font-family`}),` | Inter, ui-sans-serif, system-ui, -apple-system, sans-serif |
| `,(0,o.jsx)(s.code,{children:`--p31-font-mono`}),` | JetBrains Mono, ui-monospace, SF Mono, monospace |`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`modular-tetrahedral-scale`,children:`Modular Tetrahedral Scale`}),`
`,(0,o.jsxs)(s.p,{children:[`The fundamental scaling system: `,(0,o.jsx)(s.code,{children:`V_n = 16px × (4/3)^n`})]}),`
`,(0,o.jsxs)(s.p,{children:[`| Step | Formula | Value | Token | Example Use |
|------|---------|-------|-------|-------------|
| -1 | 16 × 0.75 | ~12px | `,(0,o.jsx)(s.code,{children:`--p31-scale-xs`}),` | Captions, compact padding |
| 0 | 16 × 1.0 | 16px | `,(0,o.jsx)(s.code,{children:`--p31-scale-sm`}),` | Body text, base grid unit |
| 1 | 16 × 1.333 | ~21px | `,(0,o.jsx)(s.code,{children:`--p31-scale-md`}),` | Small headings, button heights |
| 2 | 16 × 1.778 | ~28px | `,(0,o.jsx)(s.code,{children:`--p31-scale-lg`}),` | Medium headings, card padding |
| 3 | 16 × 2.370 | ~38px | `,(0,o.jsx)(s.code,{children:`--p31-scale-xl`}),` | Large headings, modal padding |
| 4 | 16 × 3.160 | ~50px | `,(0,o.jsx)(s.code,{children:`--p31-scale-2xl`}),` | Hero title min, header height |
| 5 | 16 × 4.214 | ~67px | `,(0,o.jsx)(s.code,{children:`--p31-scale-3xl`}),` | Display banners, major gaps |
| 6 | 16 × 5.619 | ~90px | `,(0,o.jsx)(s.code,{children:`--p31-scale-4xl`}),` | Mega displays, hero padding |`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`fluid-spacing-zero-breakpoint-clamp`,children:`Fluid Spacing (Zero-Breakpoint Clamp)`}),`
`,(0,o.jsxs)(s.p,{children:[`Spacing adapts to viewport width automatically using CSS `,(0,o.jsx)(s.code,{children:`clamp()`}),`. No breakpoint-specific overrides needed.`]}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Clamp Range | At 320px | At 768px | At 1440px |
|-------|------------|----------|----------|-----------|
| `,(0,o.jsx)(s.code,{children:`--p31-space-xs`}),` | 12px → 16px | ~13px | ~15px | 16px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-sm`}),` | 16px → 21px | ~17px | ~19px | 21px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-md`}),` | 21px → 28px | ~22px | ~25px | 28px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-lg`}),` | 28px → 38px | ~30px | ~35px | 38px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-xl`}),` | 38px → 50px | ~41px | ~47px | 50px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-2xl`}),` | 50px → 67px | ~54px | ~62px | 67px |
| `,(0,o.jsx)(s.code,{children:`--p31-space-3xl`}),` | 67px → 90px | ~72px | ~83px | 90px |`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`border-radius`,children:`Border Radius`}),`
`,(0,o.jsxs)(s.p,{children:[`Derived from the tetrahedral scale: `,(0,o.jsx)(s.code,{children:`radius = scale / 2`})]}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Value | Use Case |
|-------|-------|----------|
| `,(0,o.jsx)(s.code,{children:`--p31-radius-xs`}),` | ~6px | Small badges, chips |
| `,(0,o.jsx)(s.code,{children:`--p31-radius-sm`}),` | ~8px | Small buttons, inputs |
| `,(0,o.jsx)(s.code,{children:`--p31-radius-md`}),` | ~10.5px | Default buttons, cards |
| `,(0,o.jsx)(s.code,{children:`--p31-radius-lg`}),` | ~14px | Large cards, modals |
| `,(0,o.jsx)(s.code,{children:`--p31-radius-xl`}),` | ~19px | Hero sections, panels |
| `,(0,o.jsx)(s.code,{children:`--p31-radius-full`}),` | 9999px | Pill buttons, avatars |`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`breakpoints`,children:`Breakpoints`}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Width | Target |
|-------|-------|--------|
| `,(0,o.jsx)(s.code,{children:`--p31-bp-mobile`}),` | 0px | Phones |
| `,(0,o.jsx)(s.code,{children:`--p31-bp-tablet`}),` | 768px | Tablets |
| `,(0,o.jsx)(s.code,{children:`--p31-bp-desktop`}),` | 1024px | Laptops |
| `,(0,o.jsx)(s.code,{children:`--p31-bp-wide`}),` | 1440px | Desktops |
| `,(0,o.jsx)(s.code,{children:`--p31-bp-ultrawide`}),` | 1920px | Large screens |`]}),`
`,(0,o.jsx)(s.hr,{}),`
`,(0,o.jsx)(s.h2,{id:`root-constants`,children:`Root Constants`}),`
`,(0,o.jsxs)(s.p,{children:[`| Token | Value | Meaning |
|-------|-------|---------|
| `,(0,o.jsx)(s.code,{children:`--p31-base`}),` | 16px | Root grid unit |
| `,(0,o.jsx)(s.code,{children:`--p31-tetra`}),` | 1.3333 | Scale ratio (4/3) |
| `,(0,o.jsx)(s.code,{children:`--p31-phi`}),` | 1.618 | Golden ratio |
| `,(0,o.jsx)(s.code,{children:`--p31-larmor`}),` | 863 | P-31 Larmor frequency (Hz) |
| `,(0,o.jsx)(s.code,{children:`--p31-overlap`}),` | 0.3333 | SIC-POVM overlap (1/3) |
| `,(0,o.jsx)(s.code,{children:`--p31-k4`}),` | 4 | K₄ graph vertices |
| `,(0,o.jsx)(s.code,{children:`--p31-beta2`}),` | 1 | Planar embedding constant |`]})]})}function c(e={}){let{wrapper:n}={...t(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(s,{...e})}):s(e)}export{c as default};