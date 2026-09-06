# P31 Design System — Governance & Maturity Model

## Token Taxonomy (W3C DTCG-aligned)

| Tier | Description | Where | Example |
|------|-------------|-------|---------|
| **Primitive** | Raw values (hex, px, ms) | `@p31/design-core/css/base.css` `:root` | `--p31-accent: #00F0FF` |
| **Semantic** | Purpose-bound tokens that reference primitives | App `@theme` blocks | `--color-quantum-cyan: var(--p31-accent)` |
| **Component** | Inline style overrides on specific components | Skins (`@p31/skin-*/index.css`) | `--p31-nav-h: 46px` |

Rule: **No hardcoded hex, px, or rgba in `@p31/ui` components.** Use `var(--p31-*)` tokens. Every value traces back to `design-core`.

## Component Maturity Model

| Stage | Criteria | Badge |
|-------|----------|-------|
| **Alpha** | API unstable, known bugs, limited adoption | 🟡 Alpha |
| **Beta** | API stable, adopted by 1+ app, tests pending | 🟠 Beta |
| **Stable** | API locked, adopted by 2+ apps, tests passing | 🟢 Stable |
| **Deprecated** | Scheduled for removal, migration path documented | 🔴 Deprecated |

### Current State

| Component | Maturity | Adopted By |
|-----------|----------|------------|
| AppNav | Stable | PHOS, WILLOW |
| SiteNav | Stable | phosphorus31, p31ca |
| BrandMark | Stable | All 4 apps |
| SpoonDial | Stable | All 4 apps |
| SovereigntyStrip | Stable | All 4 apps |
| CompanionPanel | Stable | All 4 apps |
| Footer | Stable | phosphorus31 |
| GlassCard | Stable | All 4 apps |
| GlowButton | Stable | All 4 apps |
| SkipLink | Stable | All 4 apps |
| StatusBar | Stable | WILLOW |
| SpoonOrbit | Stable | phosphorus31, p31ca |
| K4Hero | Beta | bonding |
| Starfield | Stable | All 4 apps |
| CrisisOverlay | Stable | All 4 apps |

## Contribution Workflow

1. **Propose**: Open an issue describing the component or change.
2. **Build**: Create the component in `@p31/ui` with token-first styling.
3. **Document**: Add a `.stories.tsx` file and a catalog entry in `components.ts`.
4. **Adopt**: Wire into at least one app to validate.
5. **Promote**: After adoption by 2+ apps, move from Alpha → Beta → Stable.

## Versioning (Changesets)

- Run `pnpm changeset` to create a change entry.
- Each change gets a semver bump: `patch` (bug fix), `minor` (new component or token), `major` (breaking change).
- CI auto-generates CHANGELOG and bumps workspace versions.
- Apps pin their `@p31/*` deps to `workspace:*` — one install updates all.

## Review Process

- All `@p31/ui` changes must typecheck (`npx tsc --noEmit`) in PHOS + WILLOW.
- All `@p31/design-core` changes must build in all 4 apps.
- Breaking changes require a migration guide in the changelog.
- Token additions require a catalog entry update.

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-18 | All token mapping in @theme blocks uses `var(--p31-*)` | Single source of truth. One change propagates to all apps. |
| 2026-07-18 | Spoon store key is `p31:spoons` (shared across all apps) | Consistent spoon state when navigating between apps. |
| 2026-07-18 | Crisis mode never persists across page reload | Safety: intentional action only. `readSp()` defaults to 3. |
