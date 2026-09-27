# Integration Candidates for production/portals

**Audit date:** 2026-07-30
**Target:** `/home/p31/production/portals/` (7 active portals, Cloudflare Pages)
**Workspace:** `/home/p31/P31-local-workspace` (P31 Andromeda monorepo)

---

## 1. Current Production Portal Map

| Portal | Subdirectory | Domain | Source App | HTML Entry | Status |
|--------|-------------|--------|------------|-----------|--------|
| Children | `children` | willow.p31ca.org | willow | `willow-portal.html` | Built (72 KB, static HTML) |
| Parent | `parent` | tetra.p31ca.org | tetra-ops | `tetra-ops.html` | Built (63 KB, static HTML) |
| Teen | `teen` | sixseven.p31ca.org | (unclear) | `p31-portal.html` | Built (94 KB, static HTML) |
| Meatspace | `meatspace` | meatspace.p31ca.org | bonding MVP | `meatspace-bonding-mvp.html` | Built (56 KB, static HTML) |
| Developer | `developer/p31ca` | p31ca.org | p31ca | `index.html` | Built (13 MB dist) |
| Institutional | `institutional/phosphorus31` | phosphorus31.org | phosphorus31 | `index.html` | Built (71 KB static HTML) |
| Design | `design/deploy` | design.p31ca.org | design portal (React) | `index.html` | Built (240 KB dist, uses @p31ca/ui + @p31ca/design-core) |

**Shared infrastructure:** `production/shared/` (worker, manifest, quantum-hud.js, state-sync.js, components.css)
**Shared assets:** `production/assets/` (p31-ui.umd.js, p31-ui.umd.css, components.css, icons, webmcp-registry)

---

## 2. Tier 1 — Ready for Immediate Integration

### 2.1 `bonding` (apps/bonding) ⭐ HIGHEST PRIORITY
- **Why:** Already has a bonding MVP in the meatspace portal (7 bonding references). The full app at `apps/bonding` is a complete React/TSX app with `BondingUIGSurface.tsx`, `WalletConnect.tsx`, `TrustBadge.tsx`, `LoveBalance.tsx`, `identity.ts`, `love.ts`.
- **Build status:** Built (`dist/` = 1.8 MB, 68 deployable files)
- **Has:** wrangler.toml, vite.config.ts, vitest.config.ts, tsconfig.json, src/App.tsx, src/main.tsx
- **Uses workspace pkg:** No direct @p31ca/ui or @p31ca/design-core dependency yet
- **Integration path:** Replace the bonding MVP in `meatspace/meatspace-bonding-mvp.html` with a dynamic integration of the full bonding app. The bonding app's `data-brand="meatspace"` already matches the portal's brand.
- **Effort:** Low — swap static HTML for a portal integration pattern similar to the design portal

### 2.2 `wiliow` (apps/willow) — Already a portal
- **Why:** Deployed as `children/willow-portal.html`. Has `features/portal/PortalScreen.tsx` (81 lines) and `features/portal/CaregiverPortal.tsx` (97 lines) with full spoon system, mood, persona, game navigation (binding, breath, jitterbug, memory).
- **Build status:** Built (`dist/` = 644 KB)
- **Portal mode:** Static HTML export, not a live React app
- **Integration path:** The design portal (`production/portals/design/`) demonstrates how to integrate willow as a live React portal using `@p31ca/ui`'s `GreyRock` and `NeuroAdapter` components. Willow could be integrated the same way to make the children portal dynamic rather than static HTML.
- **Effort:** Medium — requires wiring willow's portal screens into the design portal's React shell

### 2.3 `tetra-ops` (apps/tetra-ops) — Already a portal
- **Why:** Deployed as `parent/tetra-ops.html`. Has 91 source files including spoonStore, telemetryStore, notificationStore, starfieldStore, healthStore, tetraClient, mapTopology. Has a dashboard, arcade, bonding, market, play, profile navigation tabs.
- **Build status:** Built (`dist/` = 1.5 MB)
- **Portal mode:** Static HTML export
- **Integration path:** Same as willow — integrate the tetra-ops features into the parent portal dynamically via the design portal's React shell pattern
- **Effort:** Medium

### 2.4 `phosphorus31` (apps/phosphorus31) — Already a portal
- **Why:** Deployed as `institutional/phosphorus31/index.html`. Astro-based site with 18 source files, layouts, crisis island component, get-involved page.
- **Build status:** Built (`dist/` = 2.4 MB, 162 files)
- **Portal mode:** Static Astro build
- **Integration path:** Could be integrated as a tab/page within a unified portal shell rather than a standalone portal
- **Effort:** Low — already deployable, could add A2UI component support

### 2.5 `p31ca` (apps/p31ca) — Already a portal
- **Why:** Deployed as `developer/p31ca/index.html`. The most complex portal with 1,113 files, 4 Cloudflare Workers (fhir, glass-box-ws, sync, passkey), 13 MB dist.
- **Build status:** Built and deployed
- **Portal mode:** Static Astro build with workers
- **Integration path:** Already serves as the developer portal. Could extend with more A2UI component interactions
- **Effort:** Low for enhancement, high for restructuring

---

## 3. Tier 2 — Good Candidates Requiring Some Work

### 3.1 `phos` (apps/phos)
- **Why:** The ecosystem super-app with 103 feature directories including bonding, dashboard, arcade, ecosystem, passport, market, forge, and more. The teen portal (`p31-portal.html`) already references bonding and market navigation patterns that phos implements.
- **Build status:** Built (`dist/` = 1.1 MB, but 2.9 GB total with Rust Tauri build artifacts)
- **Portal mode:** Astro + Tauri desktop + Workers
- **Integration path:** Extract phos's portal-ready web features (bonding surface, dashboard surface, passport generator, ecosystem) into the teen portal. The phos features are already using `data-a2ui-component` attributes.
- **Effort:** High — phos is a monolithic app; extracting features for portal integration requires significant refactoring
- **Recommendation:** Start with phos's `features/bonding` and `features/dashboard` components as they are the most portal-aligned

### 3.2 `@p31ca/ui` (packages/ui) — Infrastructure
- **Why:** The design portal (`production/portals/design/`) already demonstrates the pattern: it uses `@p31ca/ui/adaptive/GreyRock`, `@p31ca/ui/adaptive/NeuroAdapter`, `@p31ca/design-core/css/all.css`. This is the proven integration pattern.
- **Current version:** v1.3.0 (103 files, 3.3 MB)
- **Build status:** Has build scripts (`build:umd`, `build`) but no dist yet at package level
- **Integration path:** All new portals should adopt the design portal's pattern of using `@p31ca/ui` components with `GreyRock` + `NeuroAdapter` wrappers
- **Effort:** Low to adopt; the pattern already exists in the design portal

### 3.3 `design` portal (production/portals/design/) — Proven Pattern
- **Why:** This is the only portal that uses live React with @p31ca/ui and @p31ca/design-core. It demonstrates the exact integration pattern: `GreyRock` for adaptive rendering, `useNeuroAdapter` for spoon-based cognitive load, `@p31ca/design-core/css/all.css` for design tokens.
- **Status:** Built (240 KB dist), has `deploy` script targeting Cloudflare Pages project `design-hub`
- **Integration path:** Use this as the template for all future portal integrations. Other portals should migrate from static HTML to this React-based pattern.
- **Effort:** Reference implementation — use as-is for new portal components

### 3.4 `growth-dashboard` (apps/growth-dashboard)
- **Why:** Dashboard app with React/Vite, 26 files, uses @p31ca/ui workspace dependency. Has charts (TrendChart, SourceChart, StatusChart, MetricsCards, PilotTable, SyncStatus).
- **Build status:** Built (`dist/` = 744 KB)
- **Portal mode:** Vite + Wrangler, deployable
- **Integration path:** Could be integrated as a dashboard widget/tab in the teen or parent portal
- **Effort:** Medium — needs A2UI component wrapping to fit portal shell

### 3.5 `@p31/spaceship-earth` (packages/spaceship-earth)
- **Why:** Full Astro app with webgpu, landing page, workers, scripts. Has `astro-landing` sub-app. Could serve as a landing/entry portal.
- **Build status:** Has dist, scripts include `sync:p31ca` and `deploy`
- **Effort:** Medium

### 3.6 `counterscale` (apps/counterscale) — Infrastructure
- **Why:** Comprehensive pnpm monorepo with monitoring/analytics server, CLI, and tracker. The server package has full React app with routes, analytics, and components.
- **Portal path:** Could provide the analytics/monitoring backend for all portals
- **Effort:** High — requires extracting portal-facing components from the monorepo

---

## 4. Tier 3 — Foundation/Infrastructure Packages

These workspace packages should be available to all portals:

| Package | Version | Portal Role |
|---------|---------|-------------|
| `@p31ca/ui` | 1.3.0 | Component library (GreyRock, NeuroAdapter, A2UI) |
| `@p31ca/design-core` | 2.1.0 | Design tokens & CSS (`css/all.css`) |
| `@p31/shared` | 0.0.1 | Shared utilities (580 files) |
| `@p31/skin-willow` | 1.0.0 | CSS theming for willow portal |
| `@p31/skin-tetra` | 1.0.0 | CSS theming for tetra portal |
| `@p31/skin-phos` | 1.0.0 | CSS theming for phos portal |
| `@p31/skin-apex` | 1.0.0 | CSS theming |
| `@p31/skin-system` | 1.0.0 | CSS theming system |
| `@p31/design-validator` | 0.1.0 | Validation for design tokens |
| `@p31/bonding` | 0.1.0 | Shared bonding library (also an app) |
| `@p31/sovereign` | 0.0.2 | Sovereign infrastructure |

---

## 5. Portal Gap Analysis

| Current Portal | What It Has | What It's Missing | Best Candidate to Fill Gap |
|---------------|-------------|-------------------|--------------------------|
| children (willow) | Willow portal, bonding, mood, games | Dynamic React, A2UI components | Integrate willow as live React (design portal pattern) |
| parent (tetra-ops) | Dashboard, arcade, bonding, market, play | Dynamic React, A2UI components | Same as above |
| teen (p31ca) | Home, catalog, dashboard, play, profile, bonding | Dynamic React, A2UI components | phos features (dashboard, bonding) |
| meatspace (bonding MVP) | Bonding MVP only | Full bonding app, other features | `apps/bonding` full app |
| developer (p31ca) | Full p31ca with workers | A2UI component interactivity | @p31ca/ui components for portal shell |
| institutional (phosphorus31) | Astro site | Dynamic React, A2UI components | Integrate @p31ca/ui pattern |
| design (React) | @p31ca/ui + @p31ca/design-core working portal | Template for other portals | Use as the template pattern |

---

## 6. Recommended Integration Roadmap

### Phase 1 — Adopt the design portal pattern
1. Use `production/portals/design/` as the template for all portals
2. Each portal should use `@p31ca/ui/adaptive/GreyRock` + `useNeuroAdapter` + `@p31ca/design-core/css/all.css`
3. The design portal is already deployed and working — it's the reference implementation

### Phase 2 — Replace static HTML portals with dynamic React
1. **bonding** → Replace `meatspace/meatspace-bonding-mvp.html` with the full bonding app integrated via the design portal pattern
2. **willow** → Replace `children/willow-portal.html` with a live React portal using the design portal pattern
3. **tetra-ops** → Replace `parent/tetra-ops.html` with a live React portal

### Phase 3 — Extract phos features for teen portal
1. Pull `phos/src/features/bonding/BondingSurface.tsx` into the teen portal
2. Pull `phos/src/features/dashboard/DashboardSurface.tsx` into the teen portal
3. Pull `phos/src/features/arcade/ArcadeSurface.tsx` into the teen portal

### Phase 4 — Add missing portal integrations
1. **auth** portal — for authentication across portals
2. **gateway** portal — for API gateway/proxy functionality
3. **status** portal — for system status monitoring

---

## 7. Key Integration Patterns

The design portal (`production/portals/design/`) demonstrates the pattern:

```tsx
// App wrapper pattern (from design portal's main.tsx)
import { GreyRock } from '@p31ca/ui/adaptive/GreyRock';
import { useNeuroAdapter } from '@p31ca/ui/adaptive/NeuroAdapter';
import '@p31ca/design-core/css/all.css';
import '@p31ca/ui/chrome.css';

function AdaptiveRoot({ children }) {
  useNeuroAdapter({ emitInterval: 2000 });
  return <GreyRock passport={null}>{children}</GreyRock>;
}
```

### A2UI Component Attributes Used in Portals
All portal HTML files use `data-a2ui-component` attributes:
- `Portal` — main portal container
- `Toast` — notification toast
- `Starfield` — animated background
- `CrisisOverlay` — crisis intervention overlay
- `SpoonDial` — cognitive load dial
- `JitterbugCanvas` — interactive animation canvas
- `MeshCanvas` — 3D mesh visualization
- `TabBar` — navigation tabs
- `Navigation` — navigation component

---

## 8. Broken/Problematic Items

| Item | Issue | Action Needed |
|------|-------|---------------|
| `apps/design-tokens` | Broken symlink → `software/design-tokens` (directory missing) | Recreate `software/design-tokens` or remove symlink |
| `apps/design-hub` | Empty placeholder (0 files, only `.wrangler/`) | Populate or remove |
| `apps/storybook` | Stub (1 file: `wrangler.toml`) | Populate or remove |
| `apps/archive` | Single HTML file, deprecated | Remove if no longer needed |
| `apps/app-builder`, `game-builder`, `website-builder` | Minimal wrangler setups | Either build out or remove |
| `shared/` in `packages/` | No clear purpose defined in package.json | Document |
| `skin-*` packages | CSS-only, no build scripts, no dependencies | Verify they're referenced by apps |
