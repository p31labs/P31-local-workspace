# BONDING — Design Vision

## Identity

- **Name:** BONDING
- **URL:** `bonding.p31ca.org`
- **Tagline:** "Molecule-building chemistry game for neurodivergent children"
- **Audience:** Children (neurodivergent), families, co-parents separated by distance
- **Purpose:** Remote connection tool — build meaningful memories through collaborative molecule-building
- **Modes:** Splash (landing) + Generative (UIG chemistry game)

---

## Layout System

- **Container:** Full viewport (`minHeight: 100vh`)
- **Content max-width:** `maxWidth: 640px` centered
- **Content padding:** `padding: 24px`
- **Alignment:** `display: flex, flexDirection: column, alignItems: center, justifyContent: center`
- **No sidebar, no navbar** — single focused experience
- **Mode switch:** URL param `?gen=1` or `?intent=` triggers generative mode

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0a0e14` | Page void (slightly warmer than canonical `#0A0A0F`) |
| Text primary | `#e2e8f0` | Body text, UI elements |
| Accent | `#00F0FF` | Title, active states, primary CTA |
| Accent muted | `rgba(255,255,255,0.06)` | Inactive spoon buttons |
| Success | `#22c55e` | Online indicators |
| Danger | `#ef4444` | Destructive actions |
| Glass surface | `rgba(255,255,255,0.06)` | Button backgrounds |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Title | Inter | `32px` | 700 | `#00F0FF` color |
| Description | Inter | `14px` | 400 | `#cbd5e1` color |
| Button label | Inter | `13px` | 600 | System font |
| Spoon label | Inter | `12px` | 400 | Below spoon selector |

---

## Component Inventory

### K4 Hero (Splash Mode)
```
Position: above title
Component: <K4Hero /> from @p31ca/ui
Size: default (280px viewBox)
Animation: spoon-aware CSS from k4-hero.css
```

### Title Block
```
<h1>Bonding</h1>: fontSize: 32px, fontWeight: 700, marginBottom: 8, color: #00F0FF
<p>: fontSize: 14, color: #cbd5e1, marginBottom: 24
```

### Spoon Selector
```
role="radiogroup" aria-label="Spoons level"
Layout: flex, gap: 8, marginBottom: 32
6 buttons (0-5), each:
  minWidth: 48, minHeight: 48 (44px touch target)
  borderRadius: 8
  border: none
  cursor: pointer
  Active: background: #00F0FF, color: #0a0e14
  Inactive: background: rgba(255,255,255,0.06), color: #e2e8f0
```

### Enter Button (Splash → Generative)
```
background: rgba(0,240,255,0.15)
border: 1px solid rgba(0,240,255,0.3)
color: #00F0FF
borderRadius: 12px
padding: 12px 24px
font-weight: 700
cursor: pointer
hover: background: rgba(0,240,255,0.25)
```

### UIG Surface (Generative Mode)
```
Component: <BondingUIGSurface />
Full-width within maxWidth: 640px
Chemistry molecule building interface
Intent-driven: ?intent= param triggers specific molecule
```

### Skip Link
```
position: absolute, left: -9999, top: auto, width: 1, height: 1, overflow: hidden
onFocus: position: static, width: auto, height: auto
```

---

## Glass/Visual Language

- **No glassmorphism** — BONDING uses solid backgrounds, not glass panels
- **Background:** Solid `#0a0e14` (not glass)
- **Buttons:** Semi-transparent backgrounds with borders
- **Border radius:** `8px` for buttons, `12px` for enter button
- **No backdrop-filter** — this is intentional for child accessibility (reduced visual complexity)

---

## Motion

- **Imported:** `@p31/design-system/motion` (6-tier spoon-aware)
- **K4 Hero animations:** Spoon-aware CSS from `k4-hero.css`
- **Button transitions:** `transition: all 0.2s ease` (inherited from design system)
- **No ambient particles** — clean, focused interface for children
- **Reduced complexity:** Fewer visual elements than other surfaces — intentional for neurodivergent children

---

## Modes

### Splash Mode (Default)
```
URL: bonding.p31ca.org/
K4 Hero → Title → Description → Spoon Selector → Enter Button
Purpose: Landing, explain the game, set spoon level
```

### Generative Mode
```
URL: bonding.p31ca.org/?gen=1 or ?intent=molecule-name
Title + Description → UIG Surface
Purpose: Active molecule building
The K4 Hero is hidden in generative mode
```

---

## Interactive States

- **Spoon button active:** `background: #00F0FF, color: #0a0e14` (filled cyan)
- **Spoon button inactive:** `background: rgba(255,255,255,0.06), color: #e2e8f0`
- **Enter button hover:** `background: rgba(0,240,255,0.25)` (brighter)
- **Focus:** Standard browser focus rings (no custom focus styles currently)

---

## Accessibility

- **Skip link:** Present (`<a href="#main-content">`)
- **Touch targets:** 48x48px on spoon buttons (exceeds 44px minimum)
- **ARIA:** `role="radiogroup"` on spoon selector, `role="radio"` + `aria-checked` on each button
- **Keyboard:** Tab order logical, Enter/Space triggers buttons
- **Color contrast:** `#00F0FF` on `#0a0e14` ≈ 10.5:1 (passes AAA)
- **Reduced complexity:** Fewer visual elements — intentional for neurodivergent children

---

## Gemini Prompt Notes

- BONDING is a **child-facing game** — keep it simple, clean, and focused
- The background is `#0a0e14` (slightly warmer than the canonical `#0A0A0F`) — intentional
- No glassmorphism — solid backgrounds reduce visual complexity for children
- The spoon selector is a radiogroup with 48x48px buttons — large touch targets for children
- Two modes: splash (landing) and generative (game) — template the splash mode
- K4 Hero is from `@p31ca/ui` package — use the React wrapper `<K4Hero />`
- The enter button uses cyan accent with semi-transparent background
- Keep the layout centered and narrow (640px max) — focused, not sprawling
