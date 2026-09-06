# Architecture Decision Log (ADL)

## ADL-001: Macro-Shells Own the Viewport

- **Status:** Active
- **Date:** 2026-07-25
- **Decision:** Only macro-shells (`<LandingShell>`, `<WorkspaceShell>`, `<ConversationShell>`) are permitted to own viewport dimensions, global scrolling, and primary z-index stacking contexts.
- **Rationale:** Prevents headers, sidebars, and child components from fighting for viewport control and causing visual fractures across apps (Willow "left dump", Phos sidebar misalignment, p31ca duplicate nav).
- **Constraint:** Child components inside a shell cannot declare `height: 100vh`, `height: 100dvh`, or global `overflow: hidden`.
- **Consequences:** All page roots MUST be one of the three shells. Raw `<div>`, `<main>`, or `<header>` at page root is forbidden.

## ADL-002: Off-Canvas Drawers Are Decoupled from Flex Flow

- **Status:** Active
- **Date:** 2026-07-25
- **Decision:** Off-canvas navigation drawers and mobile menus must never render as direct flex children of a layout shell.
- **Rationale:** Flex parents will attempt to layout drawers within the normal document flow, causing unstyled links to dump onto the screen (Willow mobile nav failure).
- **Constraint:** All drawers must use `position: fixed` with an elevated z-index (`--p31-z-nav-drawer`) or be rendered via a React Portal directly to `document.body`.
- **Implementation:** `SiteNav` uses `createPortal(drawerContent, document.body)` with `typeof document !== 'undefined'` guard.

## ADL-003: Header Height Is Strictly Bounded

- **Status:** Active
- **Date:** 2026-07-25
- **Decision:** The `<SiteNav>` header wrapper must enforce a fixed maximum height and include `shrink-0` and `w-full`.
- **Rationale:** Prevents headers from being stretched by flex parents, which caused ballooning in Willow where the header expanded to fill the top third of the screen.
- **Constraint:** Inline elements (logos, dials) must be wrapped in containers with `align-items: center` to prevent flex-stretching.
- **Implementation:** `className="sticky top-0 ... shrink-0"` with `max-h-14` / `h-14` or `var(--p31-nav-h, 48px)`.

## ADL-004: Z-Index Token System

- **Status:** Active
- **Date:** 2026-07-25
- **Decision:** All z-index values must use the token system defined in `packages/design-core/src/css/tokens.css`.
- **Rationale:** Prevents z-index collisions between nav, drawers, modals, tooltips, and toasts across multiple apps sharing the same design system.
- **Token Hierarchy:**
  - `--p31-z-base: 0`
  - `--p31-z-nav: 40`
  - `--p31-z-nav-drawer: 50`
  - `--p31-z-modal: 60`
  - `--p31-z-tooltip: 70`
  - `--p31-z-toast: 80`
  - `--p31-z-max: 9999`
