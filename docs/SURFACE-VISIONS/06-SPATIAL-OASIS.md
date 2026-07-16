# Spatial Oasis — Design Vision

## Identity

- **Name:** P31 // Spatial Oasis
- **URL:** `site/` (deployed to Cloudflare Pages)
- **Tagline:** "Sovereign AI for Neurodivergent Families"
- **Audience:** General public, developers, potential contributors
- **Purpose:** Public landing page, marketing, Genesis Gate fundraising, brand experience
- **Tech:** Static HTML with inline CSS + vanilla JS (no framework)

---

## Layout System

- **Container:** Full viewport, vertically stacked sections
- **No max-width constraint** — sections fill viewport width
- **Section spacing:** Varies per section (`py-20` to `py-24`)
- **Position:** `relative` body with `overflow-x: hidden`
- **Display:** `flex, flexDirection: column`
- **Single-page:** All content on one HTML page

---

## Color Palette

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Background | `--bg-void` | `#030305` | Page void (DEEPER than canonical `#0A0A0F`) |
| Primary accent | `--quantum-cyan` | `#00f0ff` | CTAs, highlights |
| Secondary accent | `--quantum-violet` | `#b53cff` | Decorative, badges |
| Tertiary accent | `--quantum-gold` | `#ffd700` | Special elements |
| Quaternary accent | `--quantum-green` | `#00ff66` | Success indicators |
| Text bright | `--text-bright` | `#ffffff` | Headings (PURE WHITE — diverges from canonical `#F5F5F7`) |
| Text muted | `--text-muted` | `#8b9bb4` | Body text |
| Text dim | `--text-dim` | `#4a5b78` | Low-emphasis |
| Glass background | `--glass-bg` | `rgba(10,12,28,0.35)` | Panel backgrounds (DIVERGES from canonical) |
| Glass border | `--glass-border` | `rgba(0,240,255,0.15)` | Panel borders (cyan-tinted) |

### Spoon-Driven Overrides

| Spoons | `--glow-intensity` | `--particle-opacity` | `--blur-intensity` | `--anim-speed` |
|--------|-------------------|---------------------|-------------------|---------------|
| 5 (max) | 1 | 0.9 | 16px | 20s |
| 3 (standard) | 0.4 | 0.3 | 12px | 40s |
| 1 (low) | 0 | 0 | 4px | 99999s |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Hero title | Inter | `clamp(2rem, 5vw, 3.5rem)` | 700 | `#ffffff` |
| Hero subtitle | Inter | `1.1rem` | 400 | `#8b9bb4`, line-height: 1.6 |
| Section title | Inter | `2rem` | 700 | `#ffffff` |
| Code | JetBrains Mono | `0.85rem` | 400 | Terminal output |
| Label | Inter | `0.7rem` | 600 | `uppercase, letter-spacing: 0.1em, #4a5b78` |
| Button text | Inter | `0.85rem` | 600 | On CTAs |

---

## Component Inventory

### Spatial Grid (Background)
```
position: fixed, inset: -50%
background-image:
  radial-gradient(circle, rgba(181,60,255,0.12) 0%, transparent 40%)
  linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px)
  linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
background-size: 100% 100%, 60px 60px, 60px 60px
animation: gridShift var(--anim-speed) linear infinite
will-change: transform
pointer-events: none
```

### K4 Tetrahedron (Hero)
```
ViewBox: 0 0 300 300
Size: 280px (responsive via CSS)
6 animated edges with stroke-dasharray cycling
4 vertex nodes with superposition gradient + chromatic aberration filter
3 orbital ellipses rotating at 12s/18s/24s
Particle dots traveling along edges
Filters: k4-glow-cyan, k4-glow-violet, k4-chromatic
```

### Glass Panel
```css
--glass-bg: rgba(10,12,28,0.35)
--glass-border: rgba(0,240,255,0.15)
backdrop-filter: blur(var(--blur-intensity))
border-radius: var(--radius-lg) /* 12px */
```

### CTA Button (Primary)
```
background: var(--quantum-cyan)
color: var(--bg-void)
font-weight: 700
padding: 14px 28px
border-radius: var(--radius-lg) (12px)
box-shadow: 0 0 30px rgba(0,240,255,0.3)
hover: transform translateY(-2px), box-shadow intensifies
```

### CTA Button (Secondary)
```
background: transparent
border: 2px solid var(--quantum-cyan)
color: var(--quantum-cyan)
hover: background: rgba(0,240,255,0.1)
```

### Spark Ignite Button
```
Special animated button for Genesis Gate
Glowing border animation
Hover: pulse effect
```

### Particles (Canvas)
```
<canvas id="particles">
Animated particle system
Opacity: var(--particle-opacity)
GPU-accelerated
```

### Fireworks Canvas
```
<canvas id="fireworks-canvas">
Celebration effects for genesis events
```

### Terminal (Xterm.js)
```
Live terminal emulator
Font: JetBrains Mono
Theme: dark (matching --bg-void)
Interactive: type commands
```

### Unicorn Silhouette
```
Decorative SVG element
Animation: float via var(--unicorn-float)
Opacity: rainbow-opacity
```

### Rainbow Halo
```
Gradient ring around unicorn
Animation: rotate
Opacity: var(--rainbow-opacity)
```

---

## Glass/Visual Language

- **Glass blur:** `var(--blur-intensity)` — spoon-controlled (4-16px)
- **Border radius:** `12px` (`var(--radius-lg)`)
- **Glass background:** `rgba(10,12,28,0.35)` — DIVERGES from canonical `rgba(255,255,255,0.04)`
- **Glass border:** `rgba(0,240,255,0.15)` — cyan-tinted, NOT white-tinted
- **Saturation boost:** `var(--saturation-boost)` (0.8-1.4) — enhances colors at higher spoons
- **Glow intensity:** `var(--glow-intensity)` (0-1) — controls ambient glow strength

---

## Motion

### Spoon-Controlled Animations

| Element | Animation | Speed Variable |
|---------|-----------|---------------|
| Spatial grid | `gridShift` (translateY 60px loop) | `--anim-speed` |
| K4 tetrahedron | Edge dash cycling, vertex pulsing | `--core-speed` |
| Unicorn | Float | `--unicorn-float` |
| Particles | Drift | `--particle-opacity` |
| Rainbow | Rotate | `--anim-speed` |

### Key Animations

```css
@keyframes gridShift { 0% { transform: translateY(0) } 100% { transform: translateY(60px) } }
@keyframes unicornFloat { ... }
@keyframes rainbowRotate { ... }
```

### Prefers-Reduced-Motion

```css
@media (prefers-reduced-motion: reduce) {
  .spatial-grid, .k4-mesh, .k4-glow, .k4-node.shimmer,
  .k4-edge.entangled, .unicorn-silhouette, .rainbow-halo,
  .flowchart-arrow { animation: none; }
  #particles, #fireworks-canvas { opacity: 0 !important; }
  .spark-ignite-btn { animation: none; }
}
```

---

## Content Sections (Page Anatomy)

1. **Hero** — K4 tetrahedron + title + subtitle + CTA buttons
2. **Features** — Grid of capability cards
3. **Terminal** — Live Xterm.js terminal emulator
4. **Architecture** — System diagram / flowchart
5. **Genesis Gate** — Fundraising/ignition section with spark button
6. **Community** — Discord / GitHub / Ko-fi links
7. **Footer** — Minimal footer

---

## Interactive States

- **CTA hover:** `translateY(-2px)`, glow intensifies, shadow increases
- **Button hover:** Background brightens, border lightens
- **Terminal:** Full interactive CLI (Xterm.js)
- **Spark button:** Animated glow, click triggers fireworks
- **Links:** `color: var(--quantum-cyan)`, hover brightens

---

## Accessibility

- **Skip link:** Present
- **Reduced motion:** All animations disabled via `prefers-reduced-motion`
- **Reduced glow:** `--glow-intensity: 0` at spoons=1
- **Keyboard:** All buttons keyboard-accessible
- **Color contrast:** `#ffffff` on `#030305` ≈ 21:1 (passes AAA)

---

## Gemini Prompt Notes

- Spatial Oasis is the **most visually aggressive** surface — deep void, cyan-tinted glass, extensive animations
- The background void is `#030305` (DEEPER than canonical `#0A0A0F`) — intentional for the "spatial" feel
- Glass uses cyan-tinted borders (`rgba(0,240,255,0.15)`) — NOT white-tinted like other surfaces
- The spatial grid background is a key visual element — fixed position, animated translateY
- K4 tetrahedron is 280px with extensive SVG filters (chromatic aberration, glow, superposition gradient)
- Xterm.js terminal is a live interactive element — include the CDN links
- Spoon-controlled CSS variables drive the entire visual intensity
- This is a **marketing/brand experience** — prioritize visual impact and wow factor
- The unicorn + rainbow elements are decorative whimsy — include them
