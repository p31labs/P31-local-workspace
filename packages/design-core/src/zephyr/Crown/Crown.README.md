# Crown — Zephyr Port

A sovereignty/status badge using `<z-badge>` as the base component with `variant="crown"`. Displays an SVG crown icon with a role label and tooltip, used to indicate user role (Sovereign, Admin, Moderator, etc.).

## Zephyr Components Used

| Component     | Tag         | Role                                      |
|---------------|-------------|-------------------------------------------|
| Badge         | `<z-badge>` | Base container — renders as pill badge    |
| Icon slot     | `slot="icon"` | Crown SVG or emoji glyph                |
| Label slot    | `slot="label"` | Role text (e.g. "Sovereign")           |
| Tooltip slot  | `slot="tooltip"` | Hover/accessibility description       |

## P31 Token Mapping

Zephyr CSS custom properties are mapped to P31 tokens via the component's inline `<style>`:

| Zephyr Property              | P31 Token / Fallback                           |
|------------------------------|------------------------------------------------|
| `--z-badge-bg`               | `var(--p31-glass-bg, rgba(255,255,255,0.06))` |
| `--z-badge-border`           | `var(--p31-glass-border, rgba(255,255,255,0.1))` |
| `--z-badge-radius`           | `var(--p31-radius-full, 9999px)`              |
| `--z-badge-color`            | `var(--p31-accent-violet, #A78BFA)`           |
| Text color                   | `var(--p31-text-primary, #F5F5F7)`            |

All CSS variable references include explicit fallback values to prevent hydration failures or missing-import cascades.

## Agent API Usage

The component exposes MCP control via `data-mcp-*` attributes:

```html
<z-badge
  variant="crown"
  data-mcp-tool="crownDisplay"
  data-mcp-state="active"
  data-mcp-target="crown-badge"
>
```

### `getState`

```js
const state = Zephyr.agent.getState();
// Returns array of component states including crownDisplay with
// its current variant, state, and target.
```

### `act`

```js
const result = Zephyr.agent.act('z-badge', 'highlight');
// Highlights the crown badge component.
```

## Example

```html
<z-badge
  variant="crown"
  data-mcp-tool="crownDisplay"
  data-mcp-state="active"
  data-mcp-target="crown-badge"
>
  <span slot="icon">
    <svg viewBox="0 16 200 168" width="20" height="20">
      <!-- crown path data -->
    </svg>
  </span>
  <span slot="label">Sovereign</span>
  <span slot="tooltip">Full system access — sovereign role</span>
</z-badge>
```

## Requirements

- Zephyr Framework v1+ (loaded via CDN or npm)
- P31 design tokens available at the `:root` level
