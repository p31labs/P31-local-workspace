# A2UI Catalog — P31 Quantum Design System

## Overview

The P31 design system publishes an **A2UI v0.9** (Agent-to-User Interface, Google/Linux Foundation, April 2026) component catalog at `/.well-known/a2ui-catalog.json` on all five consumer apps. This lets AI agents discover available UI components, their props, and supported actions at runtime.

## Catalog Schema (v0.9)

```json
{
  "$schema": "https://a2ui.dev/schemas/catalog.json",
  "version": "0.9",
  "metadata": {
    "name": "p31-quantum",
    "description": "P31 Labs Quantum Design System",
    "base_url": "https://p31ca.org",
    "apps": ["phos", "p31ca", "willow", "bonding", "phosphorus31"]
  },
  "components": []
}
```

### Component Entry

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Component name (PascalCase) |
| `description` | `string` | Human-readable description |
| `props` | `Record<string, PropDef>` | Component properties with type, default, and options |
| `actions` | `string[]` | Supported actions (click, focus, hover, change, update, toggle, navigate, dismiss, confirm, start, stop) |

### PropDef

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"string" \| "number" \| "boolean"` | Property value type |
| `default` | `any` | Optional default value |
| `options` | `any[]` | Optional enumerated values |
| `range` | `[number, number]` | Optional numeric range |

## Consumption from an Agent

### Discovery

An agent discovers the catalog via the well-known URL:

```
GET https://p31ca.org/.well-known/a2ui-catalog.json
GET https://phos.p31ca.org/.well-known/a2ui-catalog.json
GET https://willow.p31ca.org/.well-known/a2ui-catalog.json
GET https://bonding.p31ca.org/.well-known/a2ui-catalog.json
GET https://phosphorus31.org/.well-known/a2ui-catalog.json
```

### Using the Catalog

1. Fetch the catalog from any consumer app's `/.well-known/a2ui-catalog.json`
2. Select components based on `description` and `props`
3. Render UI by passing `props` and triggering `actions` via the app's agent integration layer

### Example (agent pseudo-code)

```
GET /.well-known/a2ui-catalog.json
→ Find component with name "GlassCard"
→ Check props: { color: "accent", padding: "lg", interactive: true }
→ Actions available: ["click", "focus", "hover"]
→ Render <GlassCard color="accent" padding="lg">content</GlassCard>
```

### A2UI Action Mapping

| Action | Components |
|--------|-----------|
| `click` | Button, GlassCard (interactive) |
| `focus` | Button, GlassCard (interactive) |
| `hover` | Button, GlassCard (interactive) |
| `change` | SpoonMeter, SpoonDial |
| `update` | SpoonMeter |
| `toggle` | ThemeToggle |
| `navigate` | CandyHeader |
| `dismiss` | CrisisOverlay |
| `confirm` | CrisisOverlay |
| `start` | Starfield |
| `stop` | Starfield |

## Available Components

| # | Component | Props | Actions |
|---|-----------|-------|---------|
| 1 | **GlassPanel** | `padding` (sm/md/lg) | — |
| 2 | **GlassCard** | `color` (accent/violet/gold/green/red), `padding` (sm/md/lg), `interactive` (bool) | click, focus, hover |
| 3 | **GlassStrong** | — | — |
| 4 | **GlassSubtle** | — | — |
| 5 | **Button** | `variant` (primary/secondary/ghost), `size` (sm/md/lg) | click, focus, hover |
| 6 | **SpoonMeter** | `current` (0–5), `interactive` (bool) | change, update |
| 7 | **TetraGrid** | — | — |
| 8 | **HonestLabel** | — | — |
| 9 | **StatusBadge** | `status` (live/beta/research) | — |
| 10 | **CrisisOverlay** | `message` (string), `buttonLabel` (string) | dismiss, confirm |
| 11 | **Starfield** | `count` (number), `speed` (number) | start, stop |
| 12 | **ThemeToggle** | — | toggle |
| 13 | **CandyHeader** | `brand` (p31ca/phosphorus) | navigate |
| 14 | **Crown** | `size` (xs/sm/md/lg), `brand` (p31ca/phosphorus) | — |
| 15 | **SpoonDial** | `spoons` (0–5) | change |

## Generation Pipeline

The catalog is generated from `design-system.json` (output of `cli/tokens/export-design-system.mjs`) by the build script at `scripts/generate-a2ui-catalog.mjs`. It runs automatically during the sovereign build process (`cli/tokens/build-sovereign.mjs` step 6/6).

```bash
# Regenerate catalog for all 5 apps
node scripts/generate-a2ui-catalog.mjs

# Regenerate catalog to a specific output directory
node scripts/generate-a2ui-catalog.mjs --out-dir apps/phos/public/.well-known
```
