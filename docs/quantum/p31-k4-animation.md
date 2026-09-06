# P31 K₄ Tetrahedron Logo — Animation Specifications

## Overview

The K₄ (complete graph on 4 vertices, or regular tetrahedron) is P31's canonical logo. It appears across:
- Website hero sections
- Navigation bars
- BONDING loading screens
- Research publications
- Brand materials

The animation should feel **mathematical, alive, but never jarring**. It's a visual reminder of precision + warmth.

---

## Design Specifications

### Geometry

```
4 vertices (nodes)
6 edges (connections)
4 faces (implied)
Proportions: Regular tetrahedron
Size: Responsive (200px hero, 160px nav, 80px favicon)
```

### Vertex Positions (300×300 viewBox)

```
Top:           150, 50  (apex)
Bottom-left:   100, 230 (base)
Bottom-right:  200, 230 (base)
Center:        150, 150 (implied)
```

### Color Scheme

| Element | Color | Opacity | Gradient |
|---------|-------|---------|----------|
| Top vertex | Cyan (#00F0FF) | 1.0 | Radial fade |
| Bottom-left vertex | Violet (#A78BFA) | 1.0 | Radial fade |
| Bottom-right vertex | Green (#34D399) | 1.0 | Radial fade |
| Center vertex | Cyan-to-violet | 1.0 | Radial gradient |
| Edges | Mixed (0.3 opacity) | Variable | Stroke dash |
| Ambient glow | Cyan/violet | 0.15-0.4 | Blur filter |

---

## Animation Layers

### Layer 1: Edge Stroke Animation

**Purpose:** Draws edges in sequence, giving sense of construction

```xml
<line x1="150" y1="50" x2="100" y2="230" 
      stroke="rgba(0,240,255,0.3)" 
      stroke-width="2"
      stroke-dasharray="200" 
      stroke-dashoffset="0">
  <animate attributeName="stroke-dashoffset" 
           from="200" 
           to="0" 
           dur="3s" 
           repeatCount="indefinite"/>
</line>
```

**Timings:**
- Top-to-bottom-left: 3.0s (cyan)
- Top-to-bottom-right: 3.5s (violet, offset by 0.5s)
- Base (left-to-right): 2.5s (green, offset by 1.0s)
- Center axis (subtle): 1.5s, opacity 0.2

**Effect:** Edges draw themselves one after another, then fade and restart.

### Layer 2: Vertex Pulsing

**Purpose:** Gives life to the structure, suggests resonance

```xml
<circle cx="150" cy="50" r="6" 
        fill="url(#grad-cyan)" 
        filter="url(#glow-cyan)">
  <animate attributeName="r" 
           from="5" 
           to="7" 
           dur="2s" 
           repeatCount="indefinite"
           values="5; 7; 5"
           keyTimes="0; 0.5; 1"/>
</circle>
```

**Timings:**
- Top: 2.0s (start immediate)
- Bottom-left: 2.3s (offset by 0.3s, slightly faster)
- Bottom-right: 2.6s (offset by 0.6s, even faster)
- Center: 1.5s (fastest, tightest range 7-9)

**Effect:** Vertices "breathe" at different rates, suggesting independent resonance that harmonizes.

### Layer 3: Glow Filter

**Purpose:** Ambient energy, not distracting

```xml
<filter id="glow-cyan">
  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
  <feMerge>
    <feMergeNode in="coloredBlur"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

**Properties:**
- Blur: 3px (soft, not harsh)
- Opacity: 0.3-0.4 (subtle glow, not overwhelming)
- Color matches vertex (cyan for top, violet for left, green for right)

**Effect:** Each vertex glows in its own color, creating gentle ambient light.

### Layer 4: Orbital Animation (Optional)

**Purpose:** Add motion without chaos

```xml
<ellipse cx="150" cy="120" rx="80" ry="60" 
         fill="none" 
         stroke="rgba(0,240,255,0.1)" 
         stroke-width="1">
  <animateTransform
    attributeName="transform"
    type="rotate"
    from="0 150 120"
    to="360 150 120"
    dur="12s"
    repeatCount="indefinite"/>
</ellipse>
```

**Timings:**
- Orbit 1: 12s (slowest)
- Orbit 2: 18s (medium, offset by 2s)
- Orbit 3: 24s (slowest, offset by 4s)

**Effect:** Three orbital ellipses rotate at different speeds, like a compound harmonic motion.

---

## Animation Choreography

### Timeline (Unified 4-second loop, repeating)

```
Time  Description
0.0s  Edges start drawing (staggered)
0.0s  Vertices start pulsing (staggered)
0.0s  Orbits start rotating (continuous)
2.5s  Base edge finishes drawing
3.5s  All edges fully drawn
3.5s  Fade begins (edges become transparent)
4.0s  Loop restarts (edges reset to 0, vertices continue pulsing)
```

**Key:** Edges animate on 3-3.5s intervals; vertices pulse on 1.5-2.6s intervals; orbits rotate continuously. Everything restarts in harmony every 4 seconds.

---

## Responsive Sizing

| Context | Size | Edge Width | Vertex Radius | Glow Blur |
|---------|------|-----------|---------------|-----------|
| Hero section | 200×200px | 2px | 6px | 3px |
| Navigation | 160×160px | 1.5px | 5px | 2px |
| Favicon | 64×64px | 1px | 3px | 1px |
| Small card | 80×80px | 0.8px | 2px | 1px |

**CSS:**
```css
.k4-logo {
  width: clamp(80px, 25vw, 200px);
  height: clamp(80px, 25vw, 200px);
}

@media (max-width: 768px) {
  .k4-logo { width: 160px; height: 160px; }
}
```

---

## Accessibility

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .k4-logo * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

Users with motion sensitivity see a **static tetrahedron** (vertices glowing, edges visible, no movement).

### ARIA Labels

```html
<svg class="k4-logo" 
     role="img" 
     aria-label="P31 Labs K4 tetrahedron — animated logo">
  ...
</svg>
```

### Color Contrast

- Cyan (#00F0FF) on black: 12:1 (AAA)
- Violet (#A78BFA) on black: 5.2:1 (AA)
- Green (#34D399) on black: 6.8:1 (AA)

All sufficient for accessibility.

---

## Performance Optimization

### Use CSS `will-change`

```css
.k4-logo {
  will-change: transform;
}

.k4-logo circle {
  will-change: r, filter;
}

.k4-logo line {
  will-change: stroke-dashoffset;
}
```

### GPU Acceleration

- Use `transform` for large movements (not `x`/`y`)
- SVG filters (glow) are GPU-accelerated
- RequestAnimationFrame for canvas-based variations

### Performance Budget

- SVG file size: <5KB (uncompressed)
- Animation CPU: <2% idle
- Memory: <1MB
- FPS: 60 (on modern devices)

---

## Implementation Examples

### Example 1: Hero Logo (200px, Full Animation)

```html
<svg class="k4-logo" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradients and filters -->
    <radialGradient id="grad-cyan">
      <stop offset="0%" style="stop-color:#00F0FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#00F0FF;stop-opacity:0.3" />
    </radialGradient>
    <!-- ... other gradients ... -->
    
    <filter id="glow-cyan">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Edges -->
  <line x1="150" y1="50" x2="100" y2="230" 
        stroke="rgba(0,240,255,0.3)" 
        stroke-width="2"
        stroke-dasharray="200" 
        stroke-dashoffset="0">
    <animate attributeName="stroke-dashoffset" from="200" to="0" dur="3s" repeatCount="indefinite"/>
  </line>
  <!-- ... more edges ... -->

  <!-- Vertices -->
  <circle cx="150" cy="50" r="6" fill="url(#grad-cyan)" filter="url(#glow-cyan)">
    <animate attributeName="r" from="5" to="7" dur="2s" repeatCount="indefinite"/>
  </circle>
  <!-- ... more vertices ... -->
</svg>
```

### Example 2: Navigation Logo (160px, Subtle Animation)

```html
<svg class="k4-logo k4-logo--nav" 
     viewBox="0 0 300 300" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Same structure, but with reduced animation complexity -->
  <!-- Edges only (no orbits) -->
  <!-- Vertex pulsing is 1-2px instead of 2-3px -->
</svg>
```

### Example 3: Static Fallback (No Animation)

```html
<svg class="k4-logo k4-logo--static" 
     viewBox="0 0 300 300" 
     xmlns="http://www.w3.org/2000/svg">
  <!-- Edges fully drawn (stroke-dashoffset: 0) -->
  <!-- Vertices at default size -->
  <!-- Glow visible but no animation -->
  <!-- For: reduced-motion, low-power devices, print -->
</svg>
```

---

## Testing Checklist

- [ ] Animation is smooth (60 FPS) on desktop
- [ ] Animation is smooth (30+ FPS) on mobile
- [ ] Reduced motion setting works (static fallback)
- [ ] Responsive sizing works (80px to 200px)
- [ ] Contrast ratios pass WCAG AA
- [ ] ARIA label is present
- [ ] SVG file is <5KB
- [ ] Glow effect is visible on dark background
- [ ] Glow effect is subtle (not overwhelming)
- [ ] Edges draw in sequence (not all at once)
- [ ] Vertices pulse independently
- [ ] Animation loops without stuttering
- [ ] Animation works in all major browsers
- [ ] Animation works offline (no external resources)

---

## Common Mistakes to Avoid

❌ **Too much animation**
- All edges drawing simultaneously
- Vertices pulsing in unison
- Orbits spinning constantly
- Glow flashing on/off

✅ **Right amount**
- Staggered edge animations
- Independent vertex pulsing
- Orbits rotating at different speeds (if included)
- Subtle, constant glow

❌ **Colors too bright**
- Harsh glows
- Vertices too bright
- Overwhelming visual noise

✅ **Right brightness**
- Glow blur: 3px
- Vertex opacity: 0.3-0.4
- Edge opacity: 0.2-0.3
- Gentle, calming effect

❌ **Timing off**
- Animations restart abruptly
- Vertices and edges out of sync
- Loops at different intervals

✅ **Right timing**
- 4-second master loop
- Edges: 2.5-3.5s (within master)
- Vertices: 1.5-2.6s (independent, but harmonized)
- Orbits: 12-24s (slow, continuous)

---

## Brand Identity

The K₄ tetrahedron represents:

- **Structure:** Stability and precision (four vertices, six edges, planar)
- **Harmony:** Independent animation that works together
- **Resonance:** Pulsing, breathing, alive
- **Accessibility:** Beautiful, but not distracting; works with reduced motion

Every animation choice reinforces that P31 Labs is:
- Precise (mathematical, not arbitrary)
- Warm (glowing, breathing, alive)
- Respectful (accessible, not overwhelming)
- Thoughtful (every detail serves a purpose)

---

## SVG Template (Copy-Paste Ready)

See `/p31-k4-template.svg` for production-ready SVG with all animations baked in.

