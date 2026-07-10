# @p31/interface-generator

P31 Universal Interface Generator (UIG) — turns a **Cognitive Passport** + **view data** +
**spoon state** into a declarative `InterfaceDescription` that any renderer can consume.

One generator, many faces: a single adaptive engine powers every P31 surface (jitterbug-pwa,
PHOS, bonding, p31ca, and agent-facing MCP tools).

## Install

```bash
pnpm add @p31/interface-generator
```

Peer deps: `react` + `react-dom` (for `InterfaceRenderer`/`CrisisOverlay`). The pure generator
(`@p31/interface-generator/generator`) has **no** React dependency and is safe to import in
Workers / Node / MCP servers.

## Usage

```ts
import { generateInterface } from '@p31/interface-generator/generator';

const description = generateInterface({
  passport: null,                 // normalized v4.1 subset (or null)
  viewData: { ... },              // payload that drives widgets
  role: 'coordinator',            // coordinator | researcher | participant | grant-reviewer
  spoons: 3,                      // 0–5 cognitive spoon level
});
```

### React rendering

```tsx
import { InterfaceRenderer, CrisisOverlay } from '@p31/interface-generator';

if (description.crisisMode) return <CrisisOverlay />;   // spoons === 0: breathing only
return <InterfaceRenderer description={description} data={viewData} />;
```

## InterfaceDescription schema

| Field         | Values |
|---------------|--------|
| `layout`      | `single-column` \| `two-column` \| `grid` \| `focus-mode` \| `guided` |
| `density`     | `minimal` \| `moderate` \| `detailed` \| `exhaustive` |
| `navigation`  | `sidebar` \| `top-tabs` \| `breadcrumb` \| `contextual` \| `hidden` |
| `interactions`| `direct-manipulation` \| `guided` \| `exploratory` \| `batch` |
| `feedback`    | `subtle` \| `explicit` \| `adaptive` \| `none` |
| `widgets`     | `Widget[]` (see types) |
| `nextStep`    | `{ label, action }` — present when spoons ≤ 2 |
| `crisisMode`  | `true` only when `spoons === 0` |

### Widget

```ts
interface Widget {
  type: 'stat-card' | 'metric-grid' | 'table' | 'alert-list' | 'node-grid'
       | 'transaction-feed' | 'deadline-list' | 'queue-panel'
       | 'entanglement-graph' | 'action-button' | 'text-block' | 'spacer';
  id: string;
  title?: string;
  dataBinding: string | null;   // path into the payload, or null for static
  props?: Record<string, any>;
  size?: 'small' | 'medium' | 'large' | 'full';
  order?: number;
}
```

## Spoon rules (deterministic, COGA-aligned)

- **spoons 0** → `crisisMode`, `focus-mode`, breathing overlay only (no chrome).
- **spoons 1–2** → `single-column`, `minimal`/`moderate` density, `hidden` nav, ≤ 3 widgets,
  `nextStep` shown.
- **spoons 3** → `two-column`, `moderate`, `sidebar`, all widgets.
- **spoons 4–5** → `grid`, `detailed`/`exhaustive`, `sidebar`/`top-tabs`.

Motion is handled by the renderer via the `data-spoons` attribute (see `DESIGN.md`); the generator
never emits animation, only the spoon level that drives it.

## Server-side endpoint

`jitterbug-api` exposes `POST/GET /uig/generate` (public) accepting
`{ role, spoons, passport?, viewData? }` and returning `{ description, meta }`. Useful for agents
and non-React consumers (e.g. the `uig-generate-dashboard` MCP tool in `tools/phos-forge`).

## Roadmap

- Phase 1: PHOS `SurfaceContent` switch → `InterfaceRenderer`.
- Phase 2: p31ca arcade spoon-aware layouts.
- Phase 3: MCP tool (done: `uig-generate-dashboard`).
- Phase 4: bonding / HUD via `InterfaceRenderer`.
- Phase 5 (future): LLM rewrite of `InterfaceDescription` with hard safety constraints
  (crisis override, motion scaling, required widgets always present).
