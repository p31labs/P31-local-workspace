# InterfaceDescription Schema

The `@p31/interface-generator` package produces `InterfaceDescription` objects that drive the adaptive UI layer across all P31 faces (PHOS, bonding, auth, etc.).

## InterfaceDescription

```typescript
interface InterfaceDescription {
  layout: 'single-column' | 'two-column' | 'grid' | 'focus-mode' | 'guided';
  density: 'minimal' | 'moderate' | 'detailed' | 'exhaustive';
  navigation: 'sidebar' | 'top-tabs' | 'breadcrumb' | 'contextual' | 'hidden';
  interactions: 'direct-manipulation' | 'guided' | 'exploratory' | 'batch';
  feedback: 'subtle' | 'explicit' | 'adaptive' | 'none';
  widgets: Widget[];
  nextStep?: { label: string; action: string; dataBinding?: string };
  crisisMode: boolean;
}
```

| Field | Description |
|-------|-------------|
| `layout` | Grid/flex strategy for widget arrangement |
| `density` | Information density level (user-overridable via density store) |
| `navigation` | Navigation pattern for the surface |
| `interactions` | Primary interaction model |
| `feedback` | How the UI communicates state changes |
| `widgets` | Ordered list of Widget objects to render |
| `nextStep` | Optional suggested next action (rendered as a pill) |
| `crisisMode` | When `true`, the renderer shows only CrisisOverlay (breathing + exit) |

## Widget

```typescript
interface Widget {
  type: WidgetType;
  id: string;
  title?: string;
  dataBinding: string | null;
  props?: Record<string, any>;
  size?: 'small' | 'medium' | 'large' | 'full';
  order?: number;
}
```

| Field | Description |
|-------|-------------|
| `type` | Widget type (see below) |
| `id` | Unique identifier within the description |
| `title` | Optional label shown above the widget |
| `dataBinding` | Key path into the viewData payload, or `null` for static widgets |
| `props` | Arbitrary widget-specific configuration |
| `size` | Grid span hint (`full` = all columns, `large` = 2 cols) |
| `order` | Optional sort hint (lower = earlier) |

## WidgetType

| Type | Renders | Data Binding |
|------|---------|-------------|
| `stat-card` | Single large number | Value to display |
| `metric-grid` | 2-column key:value grid | Object of key-value pairs |
| `table` | Rows of cells | Array of row objects |
| `alert-list` | Key-value alert list | Object of alerts |
| `node-grid` | 3-column grid of nodes | Array of node objects |
| `transaction-feed` | List of transactions | Array of transaction objects |
| `deadline-list` | List of deadlines with status | Array of deadline objects |
| `queue-panel` | Pending count display | Numeric count |
| `entanglement-graph` | Graph visualization placeholder | Array of node/edge data |
| `action-button` | Clickable action pill | Optional label override |
| `text-block` | Static or bound text | Text content |
| `spacer` | Vertical spacing | None (static) |

## Generators

### `generateInterface(input: GeneratorInput)`
Full generator using passport, viewData, signals, role, and spoons. Used by PHOS surfaces.

### `generateInterfaceFromIntent(intent: GenerationIntent)`
Lightweight generator from natural language prompt. Used by `?gen=1&intent=` URL param and the prompt bar.

## Auth Integration

The auth worker (`apps/auth`) provides JWT identity for UIG flows:

```
POST /auth/login  → { token, userId, pseudonym }
GET  /auth/verify → { valid, userId, pseudonym }
POST /auth/refresh → { token }
```

Any face can call `/auth/login` to get a JWT, then pass it in `Authorization: Bearer <token>` headers for authenticated UIG generation.
