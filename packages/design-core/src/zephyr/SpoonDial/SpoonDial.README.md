# SpoonDial (Zephyr)

A range slider for energy/spoon level (0–5) with visual dot indicators.

## Usage

```html
<z-range is="p31-spoon-dial" value="3"></z-range>
```

Or load the standalone component:

```html
<script type="module" src="./SpoonDial.zephyr.html"></script>
<z-range
  id="spoon-dial"
  min="0"
  max="5"
  step="1"
  value="3"
  data-mcp-tool="spoonDial"
  data-mcp-type="control"
>
</z-range>
```

## Props

| Attribute | Type   | Default | Description              |
|-----------|--------|---------|--------------------------|
| value     | number | 3       | Current spoon level 0–5  |
| min       | number | 0       | Minimum value            |
| max       | number | 5       | Maximum value            |
| step      | number | 1       | Step increment           |

## Behavior

- **0–1**: Crisis colors (red glow, `rgba(251,113,133,0.9)`)
- **2–3**: Standard energy (cyan, `--p31-accent-cyan`)
- **4–5**: Full energy (violet, `--p31-accent-violet`)

## MCP Integration

| Attribute          | Value                |
|--------------------|----------------------|
| data-mcp-tool      | spoonDial            |
| data-mcp-type      | control              |
| data-mcp-range     | 0,5                  |
| data-mcp-current   | <current value>      |
| data-mcp-target    | spoon-dial           |

## Styling

Uses P31 design tokens via CSS variables:

- `--z-range-track-height`, `--z-range-track-bg`
- `--z-range-thumb-size`, `--z-range-thumb-bg`
- `--z-range-fill-bg`
- `--p31-text-secondary`
- `--p31-accent-cyan`, `--p31-accent-violet`, `--p31-glass-border`
