import{t as e}from"./jsx-runtime-CGlKWo3u.js";import{n as t}from"./lib-CnqBG6y5.js";import{s as n}from"./dist-CL1Y-wr4.js";var r=e();function i(e){let i={blockquote:`blockquote`,code:`code`,h1:`h1`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...t(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n,{title:`Design System/Components`}),`
`,(0,r.jsx)(i.h1,{id:`component-catalog`,children:`Component Catalog`}),`
`,(0,r.jsx)(i.p,{children:`P31 design system components are the building blocks of all P31 surfaces. Every component is neuroinclusive by design — respecting spoon levels, glassmorphism, and quantum-cyan accent rules.`}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`core-components`,children:`Core Components`}),`
`,(0,r.jsxs)(i.p,{children:[`These components live in `,(0,r.jsx)(i.code,{children:`packages/design-core/src/generated/`}),` and are the single source of truth.`]}),`
`,(0,r.jsx)(i.h3,{id:`crown`,children:`Crown`}),`
`,(0,r.jsx)(i.p,{children:`The P31 Crown mark — a 200×168 SVG icon symbolizing cognitive sovereignty. Acts as the site-wide brand mark and navigation anchor.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`ViewBox:`}),` `,(0,r.jsx)(i.code,{children:`0 16 200 168`})]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Accessibility:`}),` Includes `,(0,r.jsx)(i.code,{children:`<title>`}),` and `,(0,r.jsx)(i.code,{children:`<desc>`}),` elements`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Variants:`}),` Icon-only (full P31 tetrahedral mark)`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { Crown } from '@p31/design-core/generated/Crown'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`glasscard`,children:`GlassCard`}),`
`,(0,r.jsx)(i.p,{children:`The canonical glassmorphic card container. Wraps content with the P31 glass aesthetic.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Glass tier:`}),` Standard (`,(0,r.jsx)(i.code,{children:`.glass-panel`}),` base)`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Hover:`}),` Lifts 2px, border brightens`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { GlassCard } from '@p31/design-core/generated/GlassCard'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`button`,children:`Button`}),`
`,(0,r.jsx)(i.p,{children:`Three-variant button component with quantum-cyan primary accent.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Variants:`}),` `,(0,r.jsx)(i.code,{children:`primary`}),` | `,(0,r.jsx)(i.code,{children:`secondary`}),` | `,(0,r.jsx)(i.code,{children:`ghost`})]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Sizes:`}),` `,(0,r.jsx)(i.code,{children:`sm`}),` | `,(0,r.jsx)(i.code,{children:`md`}),` | `,(0,r.jsx)(i.code,{children:`lg`})]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Accessibility:`}),` `,(0,r.jsx)(i.code,{children:`min-height: 44px`}),`, `,(0,r.jsx)(i.code,{children:`min-width: 44px`}),`, focus-visible ring`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { Button } from '@p31/design-core/generated/Button'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`spoondial`,children:`SpoonDial`}),`
`,(0,r.jsx)(i.p,{children:`Cognitive load indicator and adjustment control. Shows current spoon level (0–5) with mode switching.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Modes:`}),` Full dial, compact icon, hidden (crisis)`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { SpoonDial } from '@p31/design-core/generated/SpoonDial'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`crisisoverlay`,children:`CrisisOverlay`}),`
`,(0,r.jsx)(i.p,{children:`Full-screen breathing overlay for crisis mode (spoons = 0). Only exit control is visible.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Behavior:`}),` Renders when `,(0,r.jsx)(i.code,{children:`data-spoons="0"`})]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Controls:`}),` Escape key, "I'm ready" button`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { CrisisOverlay } from '@p31/design-core/generated/CrisisOverlay'`})]}),`
`]}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`ui-chrome-components`,children:`UI Chrome Components`}),`
`,(0,r.jsxs)(i.p,{children:[`These components live in `,(0,r.jsx)(i.code,{children:`packages/ui/src/chrome/`}),` and are available via `,(0,r.jsx)(i.code,{children:`@p31/ui/chrome`}),`.`]}),`
`,(0,r.jsx)(i.h3,{id:`sitenav`,children:`SiteNav`}),`
`,(0,r.jsx)(i.p,{children:`Primary navigation with candy-pill segments and active state detection.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Features:`}),` Route-based active highlighting, tetrahedral nav structure`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { SiteNav } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`brandmark`,children:`BrandMark`}),`
`,(0,r.jsx)(i.p,{children:`App-specific brand identity with icon + name + tagline.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Props:`}),` `,(0,r.jsx)(i.code,{children:`appName`}),`, `,(0,r.jsx)(i.code,{children:`tagline`}),`, `,(0,r.jsx)(i.code,{children:`icon`})]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { BrandMark } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`footer`,children:`Footer`}),`
`,(0,r.jsx)(i.p,{children:`Standard P31 site footer with links, copyright, and mesh status.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { Footer } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`skiplink`,children:`SkipLink`}),`
`,(0,r.jsx)(i.p,{children:`WCAG 2.2 skip-navigation link for keyboard users.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Behavior:`}),` Hidden until focused, then visible at top of page`]}),`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { SkipLink } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`sovereigntystrip`,children:`SovereigntyStrip`}),`
`,(0,r.jsx)(i.p,{children:`Top-of-page status bar showing sovereignty status and quantum mesh health.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { SovereigntyStrip } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.h3,{id:`glowbutton`,children:`GlowButton`}),`
`,(0,r.jsx)(i.p,{children:`Animated glow-effect button for high-emphasis actions.`}),`
`,(0,r.jsxs)(i.ul,{children:[`
`,(0,r.jsxs)(i.li,{children:[(0,r.jsx)(i.strong,{children:`Import:`}),` `,(0,r.jsx)(i.code,{children:`import { GlowButton } from '@p31/ui/chrome'`})]}),`
`]}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`generated-components-full-list`,children:`Generated Components (Full List)`}),`
`,(0,r.jsx)(i.p,{children:`15 auto-generated components with Storybook stories:`}),`
`,(0,r.jsxs)(i.p,{children:[`| Component | Description |
|-----------|-------------|
| `,(0,r.jsx)(i.code,{children:`Crown`}),` | P31 Crown SVG mark |
| `,(0,r.jsx)(i.code,{children:`GlassCard`}),` | Glass card container |
| `,(0,r.jsx)(i.code,{children:`GlassPanel`}),` | Glass panel container |
| `,(0,r.jsx)(i.code,{children:`GlassSubtle`}),` | Subtle glass overlay |
| `,(0,r.jsx)(i.code,{children:`GlassStrong`}),` | Strong glass overlay |
| `,(0,r.jsx)(i.code,{children:`Button`}),` | Primary/secondary/ghost button |
| `,(0,r.jsx)(i.code,{children:`SpoonDial`}),` | Spoon level indicator |
| `,(0,r.jsx)(i.code,{children:`SpoonMeter`}),` | Spoon level meter bar |
| `,(0,r.jsx)(i.code,{children:`CrisisOverlay`}),` | Crisis mode breathing overlay |
| `,(0,r.jsx)(i.code,{children:`CandyHeader`}),` | Candy-pill navigation header |
| `,(0,r.jsx)(i.code,{children:`ThemeToggle`}),` | Light/dark theme switch |
| `,(0,r.jsx)(i.code,{children:`Starfield`}),` | Animated background starfield |
| `,(0,r.jsx)(i.code,{children:`StatusBadge`}),` | Status indicator badge |
| `,(0,r.jsx)(i.code,{children:`HonestLabel`}),` | Ethical disclosure label |
| `,(0,r.jsx)(i.code,{children:`TetraGrid`}),` | Tetrahedral grid layout |`]}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`astro-templates`,children:`Astro Templates`}),`
`,(0,r.jsxs)(i.p,{children:[`Layout templates in `,(0,r.jsx)(i.code,{children:`packages/ui/src/templates/`}),` that control page structure:`]}),`
`,(0,r.jsxs)(i.p,{children:[`| Template | Description |
|----------|-------------|
| `,(0,r.jsx)(i.code,{children:`Page.astro`}),` | Page shell with max-width and spacing |
| `,(0,r.jsx)(i.code,{children:`Header.astro`}),` | Page header with optional nav slot |
| `,(0,r.jsx)(i.code,{children:`TetraNav.astro`}),` | Fixed top navigation with tetrahedral links |
| `,(0,r.jsx)(i.code,{children:`SectionHero.astro`}),` | Hero section with title |
| `,(0,r.jsx)(i.code,{children:`SectionFeatures.astro`}),` | Feature grid section |
| `,(0,r.jsx)(i.code,{children:`Footer.astro`}),` | Standard page footer |`]}),`
`,(0,r.jsxs)(i.blockquote,{children:[`
`,(0,r.jsxs)(i.p,{children:[(0,r.jsx)(i.strong,{children:`Governance Rule:`}),` Templates control layout (`,(0,r.jsx)(i.code,{children:`gap`}),`, `,(0,r.jsx)(i.code,{children:`padding`}),`, `,(0,r.jsx)(i.code,{children:`max-width`}),`). Components NEVER declare `,(0,r.jsx)(i.code,{children:`margin`}),`, `,(0,r.jsx)(i.code,{children:`transform`}),`, or `,(0,r.jsx)(i.code,{children:`position`}),`. Only templates control positioning.`]}),`
`]}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`import-patterns`,children:`Import Patterns`}),`
`,(0,r.jsx)(i.pre,{children:(0,r.jsx)(i.code,{className:`language-tsx`,children:`// From design-core (canonical source)
import { Crown } from '@p31/design-core/generated/Crown';
import { GlassCard } from '@p31/design-core/generated/GlassCard';
import { Button } from '@p31/design-core/generated/Button';

// From ui/chrome (application chrome)
import { SiteNav, BrandMark, Footer } from '@p31/ui/chrome';

// From ui/templates (Astro-only)
import Page from '@p31/ui/templates/Page.astro';
import TetraNav from '@p31/ui/templates/TetraNav.astro';
`})}),`
`,(0,r.jsx)(i.hr,{}),`
`,(0,r.jsx)(i.h2,{id:`agent-prompt-rules`,children:`Agent Prompt Rules`}),`
`,(0,r.jsx)(i.p,{children:`When generating UI, agents MUST follow these invariants:`}),`
`,(0,r.jsxs)(i.ol,{children:[`
`,(0,r.jsxs)(i.li,{children:[`Check `,(0,r.jsx)(i.code,{children:`data-spoons`}),` — disable motion at spoons ≤ 1`]}),`
`,(0,r.jsxs)(i.li,{children:[`Use exactly `,(0,r.jsx)(i.strong,{children:`one`}),` cyan accent per screen`]}),`
`,(0,r.jsxs)(i.li,{children:[`Never pure white text (`,(0,r.jsx)(i.code,{children:`#FFFFFF`}),`) or pure black backgrounds (`,(0,r.jsx)(i.code,{children:`#000000`}),`)`]}),`
`,(0,r.jsxs)(i.li,{children:[`All cards use `,(0,r.jsx)(i.code,{children:`.glass-card`}),` or `,(0,r.jsx)(i.code,{children:`.glass-panel`})]}),`
`,(0,r.jsxs)(i.li,{children:[`All buttons use `,(0,r.jsx)(i.code,{children:`.btn-primary`}),`, `,(0,r.jsx)(i.code,{children:`.btn-secondary`}),`, or `,(0,r.jsx)(i.code,{children:`.btn-ghost`})]}),`
`,(0,r.jsx)(i.li,{children:`Every component must work across spoons 0–5`}),`
`,(0,r.jsx)(i.li,{children:`Touch targets ≥ 48px`}),`
`]})]})}function a(e={}){let{wrapper:n}={...t(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(i,{...e})}):i(e)}export{a as default};