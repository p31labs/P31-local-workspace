# L4.2 — `InterfaceDescription` → A2UI v0.9 Schema Mapping

**CWP-2026-009 / Axis L4 (Ecosystem Expansion).** Companion to `software/packages/interface-generator/SCHEMA.md`.
Status: 🟡 DRAFT mapping. Research (2026-07-11) confirms A2UI v0.9 is production-ready, declarative, framework-agnostic (React/Flutter/Lit/Angular renderers), with an Agent SDK on PyPI. The P31 `InterfaceDescription` is a **home-grown implementation of the same declarative model** — so this is a convergence, not a rewrite.

> ⚠️ **Verification note:** A2UI v0.9's exact wire field names were **not** fetchable in this environment (npm/PyPI registry unreachable). The mapping below uses A2UI's *documented model* (declarative `components[]` with `type`/`props`/`bindings`/`children`). Confirm the precise v0.9 field names against `a2ui-agent-sdk` (PyPI) when the registry is reachable — flagged `[VERIFY]` inline.

---

## 1. Model alignment (why it's a convergence)

| Concept | P31 `InterfaceDescription` | A2UI v0.9 |
| :--- | :--- | :--- |
| UI contract | Declarative JSON, agent-authored | Declarative JSON, agent-authored |
| Leaf unit | `Widget` (`type` + `props` + `dataBinding`) | Component (`type` + `props` + `bindings`) |
| Layout | `layout`, `density`, `navigation` | Document-level `layout`/`theme`/`density` |
| Interaction mode | `interactions`, `feedback` | Renderer resolves; agent can hint via `props` |
| Adaptive signal | `spoons` (0–5), `crisisMode` | **No native equivalent** → A2UI custom extension |

---

## 2. `InterfaceDescription` → A2UI Document (one-to-one)

| P31 field | A2UI v0.9 target | Notes |
| :--- | :--- | :--- |
| `layout` | `document.layout` | `single-column`→`stack`, `two-column`→`columns(2)`, `grid`→`grid`, `focus-mode`→`focus`, `guided`→`wizard` `[VERIFY]` |
| `density` | `document.density` | direct map: `minimal`→`compact`, `moderate`→`normal`, `detailed`/`exhaustive`→`comfortable` `[VERIFY]` |
| `navigation` | `document.navigation` | `sidebar`/`top-tabs`/`breadcrumb`/`contextual`/`hidden` → A2UI nav extension `[VERIFY]` |
| `interactions` | `document.interactionMode` | `direct-manipulation`→`direct`, `guided`→`guided`, `exploratory`→`explore`, `batch`→`batch` `[VERIFY]` |
| `feedback` | `document.feedback` | `subtle`/`explicit`/`adaptive`/`none` → A2UI feedback extension `[VERIFY]` |
| `widgets` | `document.components[]` | one `Widget` → one A2UI component (§3) |
| `nextStep` | trailing `action` component | `{ label, action, dataBinding? }` → `component(type:"action", props:{label, action, binding})` |
| `crisisMode` | **`document.extensions.p31.crisisMode`** | A2UI has no crisis concept → P31 custom extension namespace |
| *(implicit)* `spoons` | **`document.extensions.p31.spoons`** | carried from `GeneratorInput`; renderer scales motion/contrast per `DESIGN.md` |

---

## 3. `WidgetType` → A2UI component type

| P31 `WidgetType` | A2UI component `type` | `bindings` (from `dataBinding`) |
| :--- | :--- | :--- |
| `stat-card` | `stat` | `value ← dataBinding` |
| `metric-grid` | `keyValueGrid` | `items ← dataBinding` |
| `table` | `table` | `rows ← dataBinding` |
| `alert-list` | `alertList` | `items ← dataBinding` |
| `node-grid` | `cardGrid` | `nodes ← dataBinding` |
| `transaction-feed` | `feed` | `items ← dataBinding` |
| `deadline-list` | `timeline` | `items ← dataBinding` |
| `queue-panel` | `counter` | `value ← dataBinding` |
| `entanglement-graph` | `graph` | `nodes,edges ← dataBinding` |
| `action-button` | `action` | `label,action ← props`; optional `binding` |
| `text-block` | `text` | `content ← dataBinding ?? props.text` |
| `spacer` | `spacer` | none (static) |
| `size` (`small`/`medium`/`large`/`full`) | `component.size` | grid-span hint `[VERIFY]` |
| `order` | `component.order` | sort hint |

> All P31 widget `props` pass through verbatim as A2UI component `props`. `id` maps to A2UI `component.id`.

---

## 4. Converter sketch (TypeScript)

Lives in `software/packages/interface-generator/src/adapters/a2ui.ts` (added in L4.4). Signature only here — **do not implement against guessed A2UI types** until `a2ui-agent-sdk` is inspectable.

```ts
import type { InterfaceDescription, Widget } from "../types";
import type { A2UIDocument } from "a2ui-agent-sdk"; // [VERIFY] exact export name

export function toA2UI(id: InterfaceDescription, spoons: number): A2UIDocument {
  return {
    version: "0.9",
    layout: mapLayout(id.layout),            // §2
    density: mapDensity(id.density),
    components: [...id.widgets.map(toComponent), nextStepComponent(id.nextStep)],
    extensions: {
      p31: { crisisMode: id.crisisMode, spoons }, // §2 custom namespace
    },
  } as A2UIDocument;                         // [VERIFY] cast until SDK types confirmed
}

function toComponent(w: Widget): A2UIComponent {
  return {
    id: w.id,
    type: WIDGET_TO_A2UI[w.type],            // §3
    bindings: w.dataBinding ? { source: w.dataBinding } : undefined,
    props: w.props ?? {},
    size: w.size,
    order: w.order,
  } as A2UIComponent;                        // [VERIFY]
}
```

---

## 5. Round-trip & validation checklist

- [ ] Every `WidgetType` has a non-null A2UI mapping (§3).
- [ ] `crisisMode === true` → A2UI renderer shows **only** crisis overlay (mirrors `renderer.tsx` CrisisOverlay; `DESIGN.md` Crisis Mode invariant).
- [ ] `spoons` encoded in `extensions.p31.spoons`; React renderer already scales via `data-spoons` — verify A2UI React renderer honors it.
- [ ] `dataBinding` path resolves against the same `viewData` payload the P31 renderer uses (no schema drift).
- [ ] `nextStep.action` survives as a callable A2UI `action` (P31 action bus, not A2UI-native RPC).

## 6. Open items (resolve with PyPI SDK)

1. `[VERIFY]` exact A2UI v0.9 field names for `layout`/`density`/`navigation`/component `type`s — confirm against `a2ui-agent-sdk`.
2. Decide A2UI renderer target: reuse existing React renderer (adds A2UI parse path) vs. adopt A2UI's React renderer. Research says React renderer exists — convergence candidate.
3. `extensions.p31.*` must be a registered A2UI extension so non-P31 clients degrade gracefully (ignore unknown extension).
