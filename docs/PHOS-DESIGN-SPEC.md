# PHOS Ambient Workspace — Complete Design Specification

**Version:** 2.0 (July 2026)
**Stack:** Astro 5 + React 19 + Tailwind CSS + Vite
**State:** @nanostores + @nanostores/persistent
**Package:** `@p31/design-core` (shared design tokens: base, glass, motion, typography CSS)
**Deployment:** Cloudflare Pages (phos.p31ca.org)

---

## 1. Architecture Overview

PHOS is a single-page ambient workspace served as an Astro 5 site (`client:only="react"`). The workspace shell (`PHOSWorkspace.tsx`) manages global state (spoons, density, identity, routing) and renders either a full-screen Crisis Overlay, the Passport Wizard (first-run onboarding), or the main WorkspaceShell.

```
index.astro
  └─ PHOSWorkspace (client:only="react")
       └─ CrisisOverlay (spoons === 0)
       └─ PassportWizard (unregistered)
       └─ WorkspaceShell
            ├─ UnifiedSpoonAwareStyles
            ├─ Starfield (ambient GPU particles)
            ├─ CommandPalette (⌘K surface switcher)
            ├─ PHOSMagicDrawer (telemetry/LLM config drawer)
            ├─ PHOSSidebar (surface navigation, 48px icons)
            ├─ <main>
            │    └─ SurfaceContent (lazy-loaded active surface)
            │         ├─ SurfaceRouter (URL ↔ surface ID mapping)
            │         └─ Individual surfaces (30+)
            ├─ PHOSPromptBar (chat input, voice, send)
            └─ MobileNav (bottom nav on <768px)
```

**Routing:** URL-based via `useRouting()` hook that manages `history.pushState`. Surfaces are keyed by `SurfaceId` enum and resolved through `SurfaceRouter.ts`.

---

## 2. Design System

### 2.1 Color Palette

All tokens are CSS custom properties in `@p31/design-core/css/base.css`, surfaced through `themes.css` and Tailwind config.

| Token | Hex | Usage |
|-------|-----|-------|
| `--p31-void` | `#0A0A0F` | Primary background |
| `--p31-surface` | `#12121A` | Card backgrounds |
| `--p31-surface2` | `#1C1C2A` | Nested surfaces |
| `--p31-cloud` | `#A1A1AA` | Muted body text |
| `--p31-text-primary` | `#F5F5F7` | Headings, body text |
| `--p31-text-secondary` | `rgba(245,245,247,0.6)` | Supporting text |
| `--p31-text-tertiary` | `rgba(245,245,247,0.3)` | Placeholders |
| `--p31-accent` | `#00F0FF` | **quantum-cyan** — single primary accent |
| `--p31-accent-violet` | `#A78BFA` | Secondary actions |
| `--p31-accent-gold` | `#FBBF24` | Achievements, donation |
| `--p31-accent-green` | `#34D399` | Success states |
| `--p31-accent-red` | `#FB7185` | Error states |
| `--p31-accent-iris` | `#818CF8` | Links |
| `--p31-glass-surface` | `rgba(255,255,255,0.04)` | Glass background |
| `--p31-glass-border` | `rgba(255,255,255,0.08)` | Glass border |
| `--p31-glass-border-hover` | `rgba(255,255,255,0.15)` | Glass hover border |
| `--p31-glass-surface-hover` | `rgba(255,255,255,0.06)` | Glass hover background |

**Color invariants:**
- Never pure white (`#FFFFFF`) for text — use `#F5F5F7`
- Never pure black (`#000000`) for backgrounds — use `#0A0A0F`
- One primary accent per view (`quantum-cyan`)
- Gold reserved for special signals only

### 2.2 Typography

Dual-typeface: **Inter** (UI/headings) + **JetBrains Mono** (code/terminal).

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `h1` | Inter | 48px | 700 | Page titles |
| `h2` | Inter | 32px | 600 | Section headings |
| `h3` | Inter | 24px | 600 | Sub-sections |
| `body` | Inter | 16px | 400 | Primary text |
| `body-sm` | Inter | 14px | 400 | Cards, supporting |
| `label` | Inter | 12px | 500 | Form labels, metadata |
| `code` | JetBrains Mono | 13px | 400 | Code blocks |

**Line-height:** body always `1.6`.
**Invariants:** Headings always Inter. Code always JetBrains Mono. Labels uppercase + 0.05em tracking.

### 2.3 Spacing

8px scale with 4px half-step, modulated by `--phos-spacing-multiplier` driven by `data-spoons` and `data-density`.

| Token | Value | CSS Var |
|-------|-------|---------|
| `xs` | 4px | `--phos-space-1` |
| `sm` | 8px | `--phos-space-2` |
| `md` | 16px | `--phos-space-4` |
| `lg` | 24px | `--phos-space-6` |
| `xl` | 40px | — |
| `xxl` | 64px | — |

Card padding always 24px. Page max-width 1200px desktop. Every spacing value is a multiple of 4 or 8.

### 2.4 Glassmorphism

**PHOS glass classes (globals.css):**

| Class | Blur | Radius |
|-------|------|--------|
| `.phos-glass` | 12px | 24px |
| `.phos-glass-strong` | 16px | 24px |
| `.phos-pill` | 12px | 9999px |

All glass panels with body text MUST use `.glass-text-scrim` wrapper — a `::before` pseudo-element with a semi-transparent gradient overlay to maintain WCAG 4.5:1 contrast:

```css
.glass-text-scrim::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--phos-bg) 60%, transparent) 0%,
    color-mix(in srgb, var(--phos-bg) 30%, transparent) 50%,
    color-mix(in srgb, var(--phos-bg) 60%, transparent) 100%);
  opacity: 0.85; border-radius: inherit; z-index: -1; pointer-events: none;
}
```

Reduced transparency fallback:
```css
@media (prefers-reduced-transparency: reduce) {
  .phos-glass, .phos-glass-strong, .phos-pill, .glass-text-scrim {
    backdrop-filter: none !important;
    background: color-mix(in srgb, var(--phos-bg) 85%, transparent) !important;
  }
}
```

### 2.5 Shapes

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0px | — |
| `sm` | 8px | Small decorative, scrollbar |
| `md` | 12px | Buttons, inputs |
| `lg` | 24px | Cards, panels, containers |
| `full` | 9999px | Pills, badges, avatars |

**Invariant:** Never mix sharp and rounded corners in same view.

### 2.6 Elevation

Default shadow: `0 8px 32px rgba(0,0,0,0.15)`.
Hover: `0 12px 48px rgba(0,0,0,0.25)`, `translateY(-2px)`.
No harsh shadows.

### 2.7 Motion & Spoon-Aware Animation

4 biological themes driven by `getThemeName(spoons)` in `lib/themeEngine.ts`:

| Spoons | Theme | Motion |
|--------|-------|--------|
| 0 | Crisis | All motion disabled — breathing overlay |
| 1 | Mycelial | All motion disabled |
| 2 | Tidal | Slowed (2s animation, 0.6s transition) |
| 3-4 | Quantum | Standard (defaults) |
| 5 | Helioveil | Fast (0.5s animation, 0.1s transition) |

Spoon levels are persisted via nanostores `persistentAtom` in `store/spoons.ts` (key `phos:spoons`). Surface `<html data-spoons="N">` drives global CSS attribute selectors.

All ambient animations GPU-accelerated:
```css
.phos-gpu {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

Keyframe animations (globals.css):
- `pulse` — orb scale pulse (3s)
- `breathe` — 6s breathing for crisis overlay
- `glow-pulse` — 3s glow oscillation
- `quantum-drift` — upward particle drift for starfield
- `quantum-ring` — 4s ring pulse
- `shimmer` — gradient sweep for loading (2s)

---

## 3. CrisisMode (Spoons === 0)

**Non-negotiable invariant:** At spoons 0, no UI chrome renders. Full-screen breathing overlay only.

- Single animated circle: inhale → hold → exhale → hold (4s per phase)
- Only exit control: **Escape key** or **"I'm ready"** button
- Reset: spoons back to 3
- Implemented in `@p31/interface-generator` package as `<CrisisOverlay onReady>`

---

## 4. Spoon-Driven Complexity Tiers

Information density adapts via `data-spoons` AND `data-density` (user-controllable):

| Spoons | Behavior |
|--------|----------|
| 0 | Crisis overlay; no UI |
| 1 | Minimal: emergency contacts only; all secondary features hidden |
| 2 | Compact: core features only; compact inputs, reduced detail |
| 3-4 | Standard: full feature set with progressive disclosure |
| 5 | Exhaustive: all features expanded; maximum detail density |

Density levels (`data-density`): `minimal` → `moderate` → `detailed` → `exhaustive`.
Persisted in `store/density.ts` (key `phos:density`).

---

## 5. Store Architecture (Nanostores)

| Store | File | Type | Persistence Key |
|-------|------|------|-----------------|
| `spoonsStore` | `store/spoons.ts` | `persistentAtom<SpoonsState>` | `phos:spoons` |
| `densityStore` | `store/density.ts` | `persistentAtom<DensityLevel>` | `phos:density` |
| `accessibilityStore` | `store/accessibility.ts` | `persistentMap` | `phos:accessibility:` |
| `identityStore` | `store/identity.ts` | `persistentMap<IdentityState>` | `phos:identity:` |

Subscribers update DOM attributes reactively:
- `spoonsStore` → `document.documentElement.dataset.spoons`
- `accessibilityStore` → `dataset.dyslexia`, `dataset.reducedMotion`, `documentElement.style.fontSize`
- `densityStore` → `<html data-density>`

---

## 6. Component Architecture

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| `PHOSWorkspace` | `components/PHOSWorkspace.tsx` | Root shell; state orchestration, crisis gate, passport gate |
| `WorkspaceShell` | (same file) | Main layout: sidebar, starfield, content area, prompt bar |
| `PHOSSidebar` | `components/PHOSSidebar.tsx` | Left nav: 48px icons for surface navigation |
| `PHOSPromptBar` | `components/PHOSPromptBar.tsx` | Chat input bar with send/voice buttons |
| `PHOSMagicDrawer` | `components/PHOSMagicDrawer.tsx` | Right slide-over drawer with LLM config + telemetry |
| `CommandPalette` | `components/CommandPalette.tsx` | ⌘K command menu for surface switching |
| `Starfield` | `components/Starfield.tsx` | GPU-accelerated ambient particle system |
| `CrisisOverlay` | `@p31/interface-generator` | Full-screen breathing overlay at spoons 0 |
| `MobileNav` | `components/MobileNav.tsx` | Bottom nav bar on screens <768px |
| `SurfaceContent` | `components/SurfaceContent.tsx` | Lazy-loaded surface router |

### Ambient Animations (`components/ambient/`)

| File | Effect | GPU? |
|------|--------|------|
| `AtomOrbitals.tsx` | Orbiting atomic particles | ✅ |
| `DustMotes.tsx` | Floating dust specks | ✅ |
| `EmberParticles.tsx` | Rising ember particles | ✅ |
| `HexRain.tsx` | Hex-grid digital rain | ✅ |
| `PixelGrid.tsx` | Grid of animated pixels | ✅ |
| `VagusBreath.tsx` | Large breathing shape | ✅ |
| `VaultScanlines.tsx` | Subtle CRT scanlines | ✅ |

### Forge Components (`forge/`)

| Component | Purpose |
|-----------|---------|
| `ForgeWorkspace.tsx` | Dockview-based IDE with 8 panels |
| `TerminalPanel.tsx` | xterm.js + Cloudflare Sandbox PTY |
| `MCPToolPanel.tsx` | 137 MCP tool browser with search |
| `ForgeStatusBar.tsx` | Gamification HUD: XP, LOVE, DORA, level, streak |

---

## 7. Surface System

### Surface IDs

Defined in `config/surfaces.ts`. ~30 surfaces registered:

| ID | Route | Surface | Type |
|----|-------|---------|------|
| CHAT | `/` | Chat interface | Core |
| FORGE | `/forge` | Dockview IDE workspace | Core |
| AGENT_COMMAND | `/agent-command-center` | Multi-agent dispatch | Core |
| OPERATIONS | `/operations` | DORA metrics dashboard | Core |
| ARTIFACT | `/artifact` | Achievement → 3D print | Core |
| ARTIFACT_GALLERY | `/artifact-gallery` | Physical artifact collection | Core |
| MEMBRANE | `/membrane` | Deploy verification | Core |
| DOCUMENTS | `/documents` | Gamified document editing | Core |
| MULTIPLAYER | `/multiplayer` | Yjs collaborative editing | Core |
| DEVICES | `/devices` | Device mesh management | Core |
| AGENT_SPACES | `/agent-spaces` | Shared agent contexts | Core |
| PASSPORT | `/passport` | DID identity + credential view | Core |
| PQC_KEYS | `/pqc-keys` | Post-quantum key management | Core |
| ... | ... | ... | ... |

### Surface Lifecycle

1. `useRouting()` hook maps `window.location.pathname` → `SurfaceId`
2. `SurfaceContent.tsx` switch-case lazy-loads the matching surface
3. `PHOSSidebar` highlights active surface; click updates both URL and ID
4. `CommandPalette` shows all surfaces filtered by search
5. Chat surface (`CHAT`) is the default at `/`

All surfaces receive props: `currentSurface`, `setSurface`, `spoons`, `theme`, `isGuest`, `isGenerative`, `intentPrompt`.

### Surface Convention

Each surface is a default-exported React component in `src/surfaces/`:
```tsx
export function SurfaceNameSurface() { ... }
export default SurfaceNameSurface;
```

Uses `phos-glass rounded-xl p-4` for card containers. Respects `data-spoons` motion scaling. No hardcoded white/black.

---

## 8. LLM & Sovereign Brain

| File | Purpose |
|------|---------|
| `hooks/useSovereignBrain.ts` | Orchestrates edge/local AI routing |
| `hooks/useChatMessages.ts` | Chat message store (nanostore-backed) |
| `lib/llm.ts` | LLM integration + RoutingOverride types |

Brain states: `idle` → `downloading` → `ready` → `unsupported`.
Routing: `force-edge` | `force-local` | `auto`.

---

## 9. Accessibility

### WCAG 2.2 AA

| Criterion | Implementation |
|-----------|---------------|
| 2.4.1 Bypass Blocks | Skip link at top of every page |
| 2.5.8 Enhanced Touch | Min 48×48px touch targets (WCAG 2.5.8) |
| 4.1.2 ARIA Labels | Every icon button has `aria-label`; all SVGs have `aria-hidden="true"` |
| 2.2.2 Pause/Stop | Spoon-aware motion; `prefers-reduced-motion` fallback |
| 1.4.12 Text Spacing | `data-dyslexia` doubles line-height + letter-spacing |
| 1.4.4 Resize Text | `data-density` font-scale; no px in responsive sizes |

### COGA (Cognitive)

- Progressive disclosure via `<Disclosure>` component (auto-collapses at spoons ≤1)
- Spoon-driven complexity: crisis → minimal → compact → standard → exhaustive
- Always user-controlled: system never auto-increases complexity

### Dyslexia Mode

`data-dyslexia="true"`: line-height 1.8, letter-spacing 0.05em, extra paragraph margin.
`data-dyslexia-font="opendyslexic"`: swaps font stack to OpenDyslexic.

---

## 10. Forge Workspace

Dockview-based multi-panel IDE with 8 panels:

| Panel | Lazy-loaded? | Contents |
|-------|-------------|----------|
| Vibe Studio | ✅ | Creative coding workspace |
| Documents | ✅ | Gamified document editing |
| Membrane | ✅ | Deploy verification |
| Devices | ✅ | Device mesh management |
| Artifacts | ✅ | Achievement → 3D print pipeline |
| Terminal | ✅ | xterm.js + PTY relay |
| Admin | ✅ | Payload CMS iframe |
| MCP Tools | ✅ | 137 MCP tool browser |

Layout persistence via `localStorage`. Theme from `data-spoons` context.

---

## 11. Build & Deploy

```bash
# Build
cd apps/phos && bash node_modules/.bin/astro build

# Typecheck
npx tsc --noEmit

# Deploy
npx wrangler pages deploy dist --project-name phos --commit-dirty=true
```

**Dependencies:** `@p31/design-core` for shared CSS, `@p31/interface-generator` for CrisisOverlay, `@nanostores/react` + `@nanostores/persistent` for state.

---

## 12. Design Invariants (Non-Negotiable)

1. **Crisis Mode** (spoons=0): NO UI chrome. Only breathing overlay + exit.
2. **Single accent**: One `quantum-cyan` primary action per screen.
3. **Glassmorphism**: All elevated surfaces use `.phos-glass` with 12px blur, 24px radius.
4. **Text on glass**: MUST use `.glass-text-scrim` for WCAG 4.5:1.
5. **Spoon-aware motion**: All animation respects `data-spoons` — disabled at 0-1.
6. **No pure black/white**: `#0A0A0F` not `#000000`; `#F5F5F7` not `#FFFFFF`.
7. **Labels are uppercase**: 12px Inter, 0.05em tracking.
8. **Body line-height**: Always `1.6`.
9. **Touch targets**: Min 44×44px (48×48 WCAG 2.5.8 Enhanced).
10. **Reduced transparency**: `prefers-reduced-transparency: reduce` disables all backdrop-filter.
11. **Dyslexia mode**: Doubles line-height and letter-spacing on toggle.
12. **Font-family separation**: Inter for UI; JetBrains Mono for code. Never swap.
13. **Compositor-only animations**: Animate only `transform` and `opacity` for GPU layers.
