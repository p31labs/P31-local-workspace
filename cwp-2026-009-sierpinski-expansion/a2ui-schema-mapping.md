# L4.2 — `InterfaceDescription` → A2UI v0.9 Schema Mapping

**CWP-2026-009 / Axis L4 (Ecosystem Expansion).** Companion to `software/packages/interface-generator/SCHEMA.md`.
Status: ✅ **CONVERGED** — A2UI v0.9 schema inspected from the published `a2ui-core 0.1.1` / `a2ui-agent-sdk 0.4.0` (installed at `~/a2ui-app`). The pip *SDK* version is `0.4.0`; the *wire schema* it emits is **v0.9** (`https://a2ui.org/specification/v0_9/`). The P31 `InterfaceDescription` is a home-grown implementation of the same declarative model — so this is a convergence, not a rewrite.

> The real wire format differs from the earlier draft's guess: components are **discriminated by `component`** (not `type`), the message is **`createSurface` / `updateComponents` / `updateDataModel` / `deleteSurface`** (not a single `components[]` root), `version` is the **const string `"v0.9"`**, and exactly **one component must have `id: "root"`**.

---

## 1. Model alignment (why it's a convergence)

| Concept | P31 `InterfaceDescription` | A2UI v0.9 |
| :--- | :--- | :--- |
| UI contract | Declarative JSON, agent-authored | Declarative JSON, agent-authored |
| Leaf unit | `Widget` (`type` + `props` + `dataBinding`) | Component (`component` + type-specific props + `accessibility`) |
| Layout | `layout`, `density`, `navigation` | Root container `component` (Row/Column) + `createSurface.theme.density` |
| Interaction mode | `interactions`, `feedback` | Renderer resolves; agent can hint via props |
| Adaptive signal | `spoons` (0–5), `crisisMode` | **No native equivalent** → A2UI `extensions.p31` namespace |

---

## 2. `InterfaceDescription` → A2UI v0.9 message (one-to-one)

| P31 field | A2UI v0.9 target | Notes |
| :--- | :--- | :--- |
| `layout` | root container `component` | `single-column`/`focus-mode`/`guided`→`Column`; `two-column`/`grid`→`Row` |
| `density` | `createSurface.theme.density` | hint string (`minimal`/`moderate`/`detailed`/`exhaustive`) |
| `navigation` | (host chrome) | A2UI has no nav field; P31 surfaces it via host |
| `interactions`/`feedback` | renderer-resolved | no native field |
| `widgets[]` | `updateComponents.components[]` | one `Widget` → one A2UI `Component` (§3) |
| `nextStep` | trailing `Button` (or `action`) component | `{label, action, dataBinding?}` |
| `crisisMode` | **`extensions.p31.crisisMode`** | A2UI has no crisis concept → P31 custom extension |
| *(implicit)* `spoons` | **`extensions.p31.spoons`** | carried from `GeneratorInput`; renderer scales motion/contrast per `DESIGN.md` |

The emitted message shape (authoritative — from `a2ui/assets/0.9/server_to_client.json`):

```jsonc
{
  "version": "v0.9",                         // const string
  "createSurface": { "surfaceId": "p31-surface", "catalogId": "p31ca.org:a2ui", "theme": { "density": "moderate" }, "sendDataModel": false },
  "updateComponents": {
    "surfaceId": "p31-surface",
    "components": [
      { "id": "root", "component": "Column", "accessibility": { "label": "P31 Surface" }, "children": ["stat-...", "..."] },
      { "id": "stat-...", "component": "Card", "accessibility": { "label": "Participants" } }
    ]
  },
  "extensions": { "p31": { "crisisMode": false, "spoons": 3, "density": "moderate", "layout": "single-column", "widgets": [ /* P31 widget metadata */ ] } }
}
```

> `accessibility` is spelled with **one `c`** in the spec (`accessibility`). A2UI clients ignore unknown `extensions` namespaces, so `extensions.p31` is safe.

---

## 3. `WidgetType` → A2UI v0.9 `component`

Source of truth: `WIDGET_TO_A2UI` in `software/packages/interface-generator/src/adapters/a2ui.ts`.

| P31 `WidgetType` | A2UI `component` | Notes |
| :--- | :--- | :--- |
| `stat-card` | `Card` | |
| `metric-grid` | `Column` | grid of cards |
| `table` | `Card` | |
| `alert-list` | `List` | |
| `node-grid` | `Column` | |
| `transaction-feed` | `List` | |
| `deadline-list` | `List` | |
| `queue-panel` | `List` | |
| `entanglement-graph` | `Column` | |
| `action-button` | `Button` | |
| `text-block` | `Text` | |
| `spacer` | `Divider` | |

A2UI standard `component` names: `Text`, `Image`, `Icon`, `Video`, `AudioPlayer`, `Row`, `Column`, `List`, `Card`, `Tabs`, `Modal`, `Divider`, `Button`, `TextField`, `CheckBox`, `ChoicePicker`, `Slider`, `DateTimeInput`.

P31 widget semantics (original `type`/`dataBinding`/`size`/`order`/`props`) are preserved under `extensions.p31.widgets[]` so P31 renderers can recover them. A2UI components stay spec-clean.

---

## 4. Converter (implemented)

Lives in `software/packages/interface-generator/src/adapters/a2ui.ts` (exported as `toA2UI`, `validateA2UI`). Real, spec-grounded:

```ts
import type { InterfaceDescription, Widget } from '../types';

export function toA2UI(description: InterfaceDescription, spoons?: number): A2UIMessage {
  const root: A2UIComponent = {
    id: 'root',
    component: mapLayoutToContainer(description.layout), // Column | Row
    accessibility: { label: 'P31 Surface' },
    children: description.widgets.map((w, i) => w.id ?? `widget-${i}`),
  };
  const components = [root, ...description.widgets.map(widgetToA2UI)];
  const message: A2UIMessage = {
    version: 'v0.9',
    createSurface: { surfaceId: 'p31-surface', catalogId: 'p31ca.org:a2ui', theme: { density: description.density } },
    updateComponents: { surfaceId: 'p31-surface', components },
  };
  if (description.crisisMode || spoons !== undefined) {
    message.extensions = { p31: { crisisMode: description.crisisMode, spoons, density: description.density, layout: description.layout } };
  }
  return message;
}
```

`validateA2UI(msg)` checks `version === 'v0.9'`, a non-empty `components[]`, a `root` component, and that every referenced child id exists.

---

## 5. Round-trip & validation checklist

- [x] Every `WidgetType` has a non-null A2UI mapping (§3).
- [x] `crisisMode === true` → `extensions.p31.crisisMode` set; renderer (`A2UIRenderer.tsx`) applies `a2ui-crisis` + `data-spoons="0"`.
- [x] `spoons` encoded in `extensions.p31.spoons`; React renderer scales via `data-spoons` (mirrors `renderer.tsx` `CrisisOverlay`).
- [x] `dataBinding` path resolves against the same `viewData` payload the P31 renderer uses.
- [x] `nextStep.action` survives as a `Button` component (P31 action bus, not A2UI-native RPC).
- [x] `validateA2UI()` green in `adapters/a2ui.test.ts`.

## 6. Renderer (L4.3)

`software/packages/interface-generator/src/adapters/A2UIRenderer.tsx` consumes an `A2UIMessage`: resolves the `root` component, recursively renders children by `component` type (Column/Row→flex, Card→section, List→ul, Text→p, Button→button, Divider→hr), applies `accessibility.label` as `aria-label`, and honors `extensions.p31.crisisMode`/`spoons`. Covered by `adapters/A2UIRenderer.test.tsx` (server-rendered markup asserts `a2ui-surface` + widget labels + crisis class).

## 7. Vendored schema

`software/packages/interface-generator/src/adapters/a2ui.schema.json` — trimmed JSON Schema (draft 2020-12) of the P31-produced v0.9 message, for documentation/validation.
