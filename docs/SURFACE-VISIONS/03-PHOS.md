# PHOS — Design Vision

## Identity

- **Name:** PHOS Ambient Workspace
- **URL:** `phos.p31ca.org`
- **Tagline:** "P³¹" (displayed as monospace at greeting)
- **Audience:** Neurodivergent users (primary), families, care coordinators
- **Purpose:** Personal assistant, cognitive prosthetic — care coordination, memory scaffolding, emotional regulation, activity management
- **Layout:** Full-screen SPA with surface router (no traditional page navigation)

---

## Layout System

- **Container:** Full viewport (`100vh`, `100vw`)
- **Surface router:** Component-based — surfaces rendered via `setSurface()` state
- **Sidebar:** Left sidebar (`PHOSSidebar`) — collapsible, glassmorphic
- **Main content:** Flexible, fills remaining viewport after sidebar
- **Magic Drawer:** Slide-out panel (`PHOSMagicDrawer`) for secondary tools
- **No max-width constraint** — content fills available space
- **Surface transitions:** Direct swap (no page transitions)

---

## Color Palette

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Background | `--phos-bg` | `#0A0A0F` | Full-page void |
| Surface | `--p31-surface` | `#12121A` | Sidebar, panels |
| Text | `--p31-text` | `#F5F5F7` | Primary text |
| Text muted | `--p31-text-muted` | `rgba(245,245,247,0.6)` | Secondary text |
| Text tertiary | `--p31-text-tertiary` | `rgba(245,245,247,0.3)` | Low-emphasis |
| Accent | `--phos-accent` | `#00F0FF` | Primary interactive |
| Glass surface | `--p31-glass-surface` | `rgba(255,255,255,0.04)` | Panel backgrounds |
| Glass border | `--p31-glass-border` | `rgba(255,255,255,0.08)` | Panel borders |
| Glass glow | `--phos-glow` | `radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 70%)` | Background ambient glow |
| Success | `--phos-success` | `#10b981` | Online/complete |
| Success soft | `--phos-success-soft` | `#34d399` | Gentle success |

### Theme Overrides

| Theme | `--phos-accent` | `--phos-border` | `--p31-surface` |
|-------|----------------|-----------------|-----------------|
| quantum (default) | `#00F0FF` | `rgba(255,255,255,0.08)` | `#12121A` |
| sanctuary | `#A78BFA` | `rgba(167,139,250,0.12)` | `#12121A` |
| crisis | `#FB7185` | `rgba(251,113,133,0.12)` | `#0A0A0F` |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Display | JetBrains Mono | `text-4xl` (36px) | 400 | `P³¹` greeting, monospace |
| Surface title | JetBrains Mono | `text-xs` (12px) | 400 | Surface names, labels |
| Button text | JetBrains Mono | `text-xs` (12px) | 400 | All buttons use mono |
| Spoon indicator | JetBrains Mono | `text-xs` (12px) | 400 | `spoons: N/5` |
| Body (in surfaces) | Inter | varies | 400 | Per-surface content |
| Code | JetBrains Mono | `text-xs` (12px) | 400 | Technical content |

**Note:** PHOS intentionally uses JetBrains Mono more heavily than other surfaces — it's the "developer workspace" aesthetic.

---

## Component Inventory

### GreetingSurface (Landing)
```
Full viewport, centered
K4 Hero SVG (from @p31ca/ui)
"P³¹" text: text-4xl, font-mono, text-emerald-400
"spoons: N/5" label: text-xs, font-mono, text-zinc-500
Buttons: "Enter" (emerald border/text), "Compass" (zinc border/text)
Ko-fi support link: pink-500/10 background, pink-400/70 text, rounded-full
```

### PHOSSidebar
```
position: left, fixed
background: var(--p31-glass-surface)
backdrop-filter: blur(12px)
border-right: 1px solid var(--p31-glass-border)
border-radius: rounded-2xl (16px)
Width: ~240px
Items: surface names as clickable links
Active: accent color highlight
```

### PHOSPromptBar (Input)
```
position: bottom, fixed
background: var(--p31-glass-surface)
backdrop-filter: blur(12px)
border: 1px solid var(--p31-glass-border)
border-radius: rounded-full (pill)
padding: p-2
Input: transparent background, no border
Send button: accent color on hover, 44x44px minimum touch target
```

### PHOSMagicDrawer (Slide-out)
```
position: right, slide-out panel
background: var(--p31-glass-surface)
backdrop-filter: blur(16px)
border-left: 1px solid var(--p31-glass-border)
Content wrapped in glass-text-scrim
Close button: 44x44px, aria-label="Close panel"
```

### CrisisMode Overlay
```
Full-screen overlay (no UI chrome)
Single circle: inhale → hold → exhale → hold (4s per phase)
Exit: Escape key or "I'm ready" button (resets spoons to 3)
NEVER renders interactive UI elements
```

### Glass Panel (Standard)
```css
.phos-glass {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}
```

### Glass Panel (Strong)
```css
.phos-glass-strong {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}
```

### Glass Pill
```css
.phos-pill {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.phos-pill:focus-within {
  border-color: var(--phos-accent);
  box-shadow: 0 0 20px color-mix(in srgb, var(--phos-accent) 15%, transparent);
}
```

---

## Glass/Visual Language

- **Glass blur:** `12px` (standard), `16px` (strong/magic drawer)
- **Border radius:** `24px` for panels, `9999px` for pills, `16px` for sidebar
- **Surface tint:** Optional `color-mix(in srgb, var(--phos-bg) 85%, transparent)` for text readability
- **Glow:** `--phos-glow` radial gradient at top of viewport
- **Text scrim:** `glass-text-scrim` class for glass panels containing body text — gradient overlay for contrast
- **GPU acceleration:** `will-change: transform, opacity; transform: translateZ(0); backface-visibility: hidden` on all animated elements

---

## Motion

### Spoon-Aware Tiers (from `motion.css`)

| Tier | Label | Duration | Transition |
|------|-------|----------|------------|
| 0 | Crisis | `0.01ms` | `0.01ms` |
| 1 | Low | `0.01ms` | `0.01ms` |
| 2 | Reduced | `2s` | `0.6s` |
| 3 | Standard | Component default | Component default |
| 4 | Enhanced | `0.75s` | `0.15s` |
| 5 | Maximum | `0.5s` | `0.1s` |

### Key Animations

```css
@keyframes breathe { 0%,100% { opacity:0.4; transform:scale(1) } 50% { opacity:0.6; transform:scale(1.02) } }
@keyframes glow-pulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
@keyframes quantum-drift { 0% { transform:translateY(0) translateX(0); opacity:0 } 10% { opacity:1 } 90% { opacity:1 } 100% { transform:translateY(-100vh) translateX(20px); opacity:0 } }
@keyframes quantum-ring { 0% { transform:scale(0.8); opacity:0.4 } 50% { transform:scale(1.1); opacity:0.8 } 100% { transform:scale(0.8); opacity:0.4 } }
@keyframes shimmer { 0% { background-position:-200% 0 } 100% { background-position:200% 0 } }
```

### Ambient Components (GPU-accelerated)

- `AtomOrbitals.tsx` — orbital particle animation
- `DustMotes.tsx` — floating dust particles
- `EmberParticles.tsx` — ember-like particles
- `HexRain.tsx` — hexagonal rain effect
- `PixelGrid.tsx` — subtle grid overlay
- `VagusBreath.tsx` — breathing circle for vagus nerve stimulation
- `VaultScanlines.tsx` — scanline effect

All use `will-change: transform, opacity; transform: translateZ(0); backface-visibility: hidden`.

---

## Surfaces (17+)

| Surface | Purpose | Visual Notes |
|---------|---------|-------------|
| Greeting | Landing/entry | K4 Hero + monospace title |
| Ignition | Main workspace | Full ambient experience |
| Compass | Care coordination | Navigation/planning |
| Compassionate | Emotional support | Gentle, warm |
| Bonding | Chemistry game link | Cross-app integration |
| Buffer | Communication shields | Defensive tools |
| Vault | Secure storage | Scanline effect |
| Grid | Data overview | Pixel grid |
| Node Zero | Core system | Minimal |
| Ledger | Financial/care records | Table-based |
| Hearth | Home/warmth | Warm tones |
| Settings | Configuration | Form-based |
| Warehouse | Archive/storage | Dense |
| Mint | Creation/genesis | Bright |
| Dispute | Conflict resolution | Structured |
| Forge | Building/creation | Industrial |
| Archive | Historical | Muted |
| Arcade | Games/play | Fun |
| Superposition | Quantum state | Experimental |
| Emergency | Crisis response | High-contrast |
| LedgerExport | Data export | Functional |

---

## Content Sections (Greeting Surface)

1. **K4 Hero** — animated tetrahedron SVG (from `@p31ca/ui`)
2. **Title** — `P³¹` in emerald monospace
3. **Spoon indicator** — `spoons: N/5`
4. **Enter button** — emerald accent
5. **Compass button** — zinc secondary
6. **Ko-fi support** — pink pill link

---

## Interactive States

- **Button hover:** `hover:bg-emerald-900/20` (Enter), `hover:bg-zinc-800` (Compass)
- **Pill focus-within:** border → accent color, box-shadow glow
- **Sidebar item hover:** accent color highlight
- **Magic Drawer:** slide-in from right, backdrop blur
- **Crisis mode:** no interaction except exit control

---

## Accessibility

- **Crisis mode invariant:** At `spoons === 0`, NO UI chrome — only breathing overlay + exit
- **Skip link:** Present in shell
- **ARIA labels:** All icon buttons have `aria-label`, SVGs have `aria-hidden="true"`
- **Touch targets:** Minimum 44x44px on all interactive elements
- **Keyboard:** Tab order logical, Escape closes Magic Drawer
- **Screen reader:** Chat messages use `aria-live="polite"`
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animations
- **Reduced transparency:** `@media (prefers-reduced-transparency: reduce)` disables backdrop-filter

---

## Gemini Prompt Notes

- PHOS is a **full-screen ambient workspace** — not a traditional website with pages
- The sidebar + main content + magic drawer layout is the canonical structure
- JetBrains Mono is used more heavily here than any other surface — it's the "developer workspace" feel
- The glass-text-scrim pattern is critical for text readability over animated backgrounds
- Crisis mode is a HARD INVARIANT — never render interactive UI at spoons=0
- Theme switching (quantum/sanctuary/crisis) changes accent color and border glow
- Ambient particles (dust, embers, hex rain) are GPU-accelerated and spoon-aware
- The surface router means there are no URL changes — all navigation is state-based
