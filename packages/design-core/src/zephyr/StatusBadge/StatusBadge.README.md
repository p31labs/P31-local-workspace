# StatusBadge

Status indicator badge with 4 variants: online (green), offline (red), busy (amber), away (gray).

## Usage

```html
<!-- Online (default) -->
<z-badge data-status="online">
  <span slot="indicator" class="status-dot"></span>
  <span slot="label">Online</span>
</z-badge>

<!-- Offline -->
<z-badge data-status="offline">
  <span slot="indicator" class="status-dot"></span>
  <span slot="label">Offline</span>
</z-badge>

<!-- Busy -->
<z-badge data-status="busy">
  <span slot="indicator" class="status-dot"></span>
  <span slot="label">Busy</span>
</z-badge>

<!-- Away -->
<z-badge data-status="away">
  <span slot="indicator" class="status-dot"></span>
  <span slot="label">Away</span>
</z-badge>
```

## Variants

| `data-status` | Color                   | Description            |
|---------------|-------------------------|------------------------|
| `online`      | `--p31-accent-green`    | Active / connected     |
| `offline`     | `--p31-accent-red`      | Disconnected / down    |
| `busy`        | `--p31-accent-gold`     | Occupied / warning     |
| `away`        | `--p31-text-tertiary`   | Idle / do-not-disturb  |

## CSS Custom Properties

All tokens include fallback values:

| Property               | Fallback                    |
|------------------------|-----------------------------|
| `--z-badge-online`     | `#34d399`                   |
| `--z-badge-offline`    | `#fb7185`                   |
| `--z-badge-busy`       | `#fbbf24`                   |
| `--z-badge-away`       | `#94a3b8`                   |
| `--z-badge-bg`         | `rgba(255,255,255,0.06)`    |
| `--z-badge-color`      | `#F5F5F7`                   |

## MCP Attributes

The component exposes machine-readable metadata for AI tooling:

- `data-mcp-tool="statusBadge"`
- `data-mcp-type="status"`
- `data-mcp-target="status-badge"`
- `data-mcp-state` — reflects the current `data-status` value
