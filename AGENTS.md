# AGENTS.md — P31 Labs Design System

## Identity
You are operating inside the **P31 Labs** monorepo. The design system is the single source of truth for all P31 products: p31ca, phos, phosphorus31, willow, bonding, and the sovereign shell.

## Setup Commands
```bash
pnpm install              # Install dependencies
pnpm build                # Build all packages
pnpm test                 # Run test suites
pnpm typecheck            # TypeScript strict mode
pnpm gen:tokens           # Regenerate all token artifacts (CSS, TS, DTCG JSON)
```

### Design Portal (production/portals/design)
The design portal consumes the design system as a vendored tarball:
```bash
cd production/portals/design
pnpm sync:vendor          # Regenerate vendor tarball from canonical design-core
pnpm install              # Install with updated tarball
pnpm typecheck            # Verify types
pnpm test                 # Run tests
pnpm build                # Build for deploy
```

## Code Style
- TypeScript strict mode, no `any` without justification
- Single quotes, no semicolons
- Functional patterns where possible
- Compound component APIs over boolean props
- All colors must use `var(--p31-*)` tokens — zero hardcoded hex in production code
- Canvas/Three.js internals may use literals for performance

## Design Token Architecture

### Single Source of Truth
All visual decisions flow from **one file**:
```
packages/design-core/src/theming/theme-store.ts
```

### Token Tiers
1. **Primitives**: Raw OKLCH values (`color.palette.ocean.500`)
2. **Semantic**: Meaningful assignments (`color.surface.primary`)
3. **Component**: Component-specific (`button.primary.background`)

### Themes
- 5 worlds: `garden`, `ocean`, `aurora`, `zen`, `volt`
- 3 ages: `child`, `teen`, `adult`
- 2 sensory modes: `muted`, `warmLight`
- Total: 30 visual variants

### Generation
All artifacts are generated from `THEME_TOKENS`:
```bash
pnpm gen:tokens  # Emits CSS, TS, and W3C DTCG JSON
```
Outputs:
- `src/css/theme-{id}.css` — `[data-theme]` blocks
- `src/mcp/tokens-data.ts` — custom format for portal
- `src/mcp/tokens.dtc.json` — W3C Design Tokens Format Module 2025.10
- `src/mcp/tokens-dtc.ts` — TypeScript barrel

### Color Space
- **OKLCH** for all new tokens (perceptual uniformity, wide-gamut P3)
- Hex fallbacks generated automatically for legacy browsers
- Sensory transforms use pure OKLCH math (chroma scaling, hue blending)

## Component API Patterns

### Compound Components
Prefer composable APIs over configurable monoliths:
```tsx
<Card>
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>
```

### Controlled/Uncontrolled Duality
Components accept either `defaultValue` (uncontrolled) or `value` + `onChange` (controlled).

### Accessibility First
- WCAG 2.2 AA minimum, AAA where possible
- Touch targets ≥ 48px (WCAG 2.5.8 Enhanced)
- Focus indicators: 2px accent outline, 2px offset
- Skip navigation links on all pages
- `prefers-reduced-motion` respected
- ARIA labels on all icon buttons

## Testing
- **Vitest**: unit tests for stores, utilities, generators
- **Playwright**: visual regression, accessibility, E2E
- **axe-core**: automated WCAG validation in CI
- **Contrast**: APCA validation for glass + text pairs

## Design Gate
Before any deploy, verify:
- [ ] Zero hardcoded hex colors in production code (`grep -Er "#[0-9a-f]{6}" src --include="*.tsx" --include="*.css"`)
- [ ] All colors use `var(--p31-*)` tokens
- [ ] `pnpm gen:tokens` runs clean (no drift)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes

## MCP Server
The design system exposes an MCP server (`p31-design-mcp`) with tools for:
- Token discovery (`list_tokens`, `search_tokens`, `resolve_token`, `list_tokens_dtc`)
- Component metadata (`list_components`, `get_component`, `get_component_metadata`, `validate_component`)
- Code generation (`generate_component`, `convert_component`)
- CSS auditing (`audit_css`, `validate_parity`)
- Design principles (`get_ui_principles`, `get_review_rules`)
- Brand tokens (`resolve_brand`)
- Contracts (`list_contracts`, `get_contract`, `validate_contract`) — full contract for any component; `validate_contract` checks hex, rgba, inline styles, emoji icons, forbidden patterns
- Clarify (`clarify`) — detects semantic ambiguities (variant, surface type, message owner, spoon level, theme) before synthesis
- Visual verification (`verify`, `diff`, `screenshot`) via `vlm-diff-mcp` — DOM-first, VLM-gated, token-budgeted; run `node node_modules/vlm-diff/dist/mcp/server.js`
- Component preview (`ui://p31/component/:name` resources) — inline HTML previews of components with brand tokens
- Spec-driven generation (`propose_from_spec`) — one-pass spec→propose→validate→preview pipeline

## Chat surfaces

Any P31 surface that hosts a conversation uses `ChatShell` from
`@p31/design-core/compositions`. Do not reimplement the shell.

The contract:
- Layer 1 (viewport lock) is the consumer's job — `height: 100dvh; display: flex; flex-direction: column; overflow: hidden`.
- Layer 2 (header row) is ChatShell's `header` slot. Merge page chrome into the topbar; do not stack a second header.
- Layer 3 is the scrollable `children` plus the mobile `drawer`. The drawer auto-hides at container width ≥ 900px via `@container`.

Transient UI state is derived, never persisted:
- `isStreaming` = `global isStreaming && activeThreadId === thread.id`
- `isUnread` = `thread.updatedAt > thread.lastViewedAt`
- Persist only the source of truth: `lastViewedAt`, message `timestamp`, `updatedAt`.

Never persist a boolean like `isUnread` — it goes stale on refresh and requires manual clearing.

## Chrome Components (v2.3.0+)
The following compositions are now available in `@p31/design-core/compositions`:
- **ChatShell** — Three-layer chat surface (header slot + scrollable children + mobile drawer, auto-hides ≥900px container)
- **SectionStrip** — Desktop pill navigation strip (router-agnostic)
- **CommandPalette** — Keyboard-first command palette (⌘K)
- **Chameleon** — Adaptive theme controls (brand × world × age × sensory)
- **PageHeader** — Inner-page hero: eyebrow, gradient title, lede

## Governance
- Token ownership: `@p31/design-core` maintainers
- Component lifecycle: propose → review → build → document → release → measure
- Deprecation: 3-month warning, `$deprecated` flag in DTCG JSON
- Semantic versioning: MAJOR.MINOR.PATCH

## Protection Systems — Mandatory Pre-Operation Checks

Before any destructive git operation (`git checkout HEAD --`, `git reset --hard`, `git clean -fd`), a running agent MUST:
1. Call `soulsafe_tagout` with the task surface — if it returns "not your call", hand off to the owner immediately.
2. Call `soulsafe_severity` with the finding — if severity is critical or high, halt and hand off.

SOULSAFE is registered in the runtime and available as an MCP server. No mechanical hook is required.

## Links
- Design portal: https://design.p31ca.org
- W3C DTCG spec: https://design-tokens.github.io/community-group/format/1.0.0
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MCP protocol: https://modelcontextprotocol.io
