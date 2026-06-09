# P31CA.ORG Canonical Design Specification

**Version:** 1.0.0  
**Schema:** `p31.designSpec/1.0.0`  
**Date:** 2026-05-01  
**Status:** LIVE  

---

## 1. Purpose

This document is the canonical design specification for **p31ca.org** — the technical hub for P31 Labs. It codifies the visual language, interaction patterns, asset inventory, and design system governance.

**Single source hierarchy:**
- `design-tokens/p31-universal-canon.json` → tokens
- `ground-truth/p31.ground-truth.json` → routes, Three.js pins, redirects
- `scripts/hub/registry.mjs` + `hub-app-ids.mjs` → product cards + about pages
- This document → human-readable design rationale and patterns

---

## 2. Brand Foundation

### 2.1 Mission Statement (Design Context)

**Build, create, connect** — decentralized family mesh.

P31ca.org is the technical hub that hosts tools, visualizations, and onboarding surfaces. The design language reflects:
- **Sovereignty:** User-owned data, local-first where possible
- **Clarity:** Information-forward, no dark patterns
- **Resilience:** Wye→Delta topology, graceful degradation
- **Inclusion:** AuDHD-first, neuro-inclusive defaults

### 2.2 Ring Architecture

| Ring | Host | Appearance | Purpose |
|------|------|------------|---------|
| **Hub** | p31ca.org, *.p31ca.pages.dev | `hub` (dark) | Technical tools, static surfaces |
| **Org** | phosphorus31.org | `org` (light) | Public narrative, MAP, grants |

**BONDING** (`bonding.p31ca.org`) is intentionally excluded from the universal canon per operator policy.

---

## 3. Color System

### 3.1 Brand Anchors (Cross-Ring Invariant)

| Token | Hex | Role |
|-------|-----|------|
| `--p31-coral` | `#cc6247` | Primary CTA, warmth, emphasis |
| `--p31-teal` | `#25897d` | Secondary CTA, trust, K₄ edges |
| `--p31-cyan` | `#4db8a8` | Live status, accents, focus rings |
| `--p31-butter` | `#cda852` | Trim, soft attention, in-progress |
| `--p31-lavender` | `#8b7cc9` | Research, curiosity, depth |
| `--p31-phosphorus` | `#3ba372` | Success, LIVE badges, belonging |
| `--p31-phosphor` | `#00FF88` | Glow, phosphorescence accent |

### 3.2 Hub Appearance (Dark Default)

```
--p31-void:      #0f1115   (Page background)
--p31-surface:   #161920   (Card backgrounds)
--p31-surface2:  #1c2028   (Elevated surfaces)
--p31-cloud:     #d8d6d0   (Body text)
--p31-paper:     #f4f4f5   (Inverted text)
--p31-ink:       #1e293b   (Dark text on light)
--p31-muted:     #6b7280   (Secondary text)
```

### 3.3 Org Appearance (Light)

```
--p31-void:      #f5f4f0   (Warm paper field)
--p31-surface:   #ffffff   (Cards)
--p31-surface2:  #ebeae4   (Elevated)
--p31-cloud:     #1e293b   (Body text)
--p31-paper:     #fdfcfa   (Canvas)
--p31-ink:       #0f172a   (Headings)
--p31-muted:     #64748b   (Secondary)
```

### 3.4 Semantic Color Map (Psychological Job)

| Role | Token | Psychological Function |
|------|-------|-------------------------|
| **Calm** | `--p31-teal`, `--p31-cyan` | Trust, legibility, "system is stable" |
| **Warmth** | `--p31-coral` | Aliveness without alarm |
| **Together** | `--p31-phosphorus` | Belonging, shared state, growth |
| **Care** | `--p31-butter` | Soft attention, non-critical |
| **Wonder** | `--p31-lavender` | Curiosity, depth — sparingly |

**Rule:** One focal emotional beat per view. Adjacent screaming regions (coral + glow + motion) indicate over-indexing.

---

## 4. Typography

### 4.1 Font Stack

```css
--p31-font-sans:  'Atkinson Hyperlegible', sans-serif;
--p31-font-mono: 'JetBrains Mono', monospace;
```

**Atkinson Hyperlegible:** Designed for low-vision readers; distinct letterforms (b/d, p/q differentiation).

### 4.2 Type Scale

| Token | Rem | Usage |
|-------|-----|-------|
| `xs` | 0.75rem | Captions, timestamps |
| `sm` | 0.875rem | Secondary labels |
| `base` | 1rem | Body text |
| `md` | 1.0625rem | Slightly elevated |
| `lg` | 1.125rem | Lead paragraphs |
| `xl` | 1.25rem | Subheadings |
| `2xl` | 1.5rem | H3 |
| `3xl` | 1.875rem | H2 |
| `4xl` | 2.25rem | H1, hero |

### 4.3 Line Height & Spacing

```css
--p31-leading-tight:   1.25;   /* Headings */
--p31-leading-snug:    1.4;    /* UI labels */
--p31-leading-normal:  1.6;    /* Body */
--p31-leading-relaxed: 1.75;   /* Longform */

--p31-tracking-tight:  -0.02em;
--p31-tracking-normal: 0;
--p31-tracking-wide:   0.08em;
--p31-tracking-caps:   0.12em;
```

---

## 5. Spacing & Layout

### 5.1 Space Ladder

| Token | Value | Usage |
|-------|-------|-------|
| `px` | 1px | Hairlines |
| `0` | 0 | Reset |
| `1` | 0.25rem | Tight gaps |
| `2` | 0.5rem | Inline elements |
| `3` | 0.75rem | Component padding |
| `4` | 1rem | Standard gap |
| `5` | 1.25rem | Cards |
| `6` | 1.5rem | Section gaps |
| `8` | 2rem | Major separators |
| `10` | 2.5rem | Hero spacing |
| `12` | 3rem | Page sections |
| `16` | 4rem | Major sections |
| `20` | 5rem | Landing zones |
| `24` | 6rem | Maximum rhythm |

### 5.2 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Sharp edges |
| `sm` | 4px | Buttons, inputs |
| `md` | 8px | Cards, panels |
| `lg` | 12px | Modals |
| `xl` | 16px | Feature cards |
| `2xl` | 1.25rem | Hero containers |
| `full` | 9999px | Pills, avatars |

### 5.3 Shadows

```css
--p31-shadow-sm:  0 1px 2px rgba(0, 0, 0, 0.06);
--p31-shadow-md:  0 4px 14px rgba(0, 0, 0, 0.08);
--p31-shadow-lg:  0 12px 40px rgba(0, 0, 0, 0.12);
--p31-shadow-glow-teal: 0 0 24px rgba(37, 137, 125, 0.25);
```

### 5.4 Z-Index Stack

| Layer | Value | Usage |
|-------|-------|-------|
| `base` | 0 | Default |
| `dropdown` | 50 | Menus |
| `sticky` | 100 | Headers |
| `overlay` | 200 | Backdrops |
| `modal` | 300 | Dialogs |
| `toast` | 400 | Notifications |

---

## 6. Motion & Animation

### 6.1 Duration Budget

| Token | ms | Usage |
|-------|-----|-------|
| `instant` | 100 | Micro-feedback |
| `fast` | 150 | Hover, toggles |
| `normal` | 250 | Transitions, reveals |
| `slow` | 400 | Page transitions |
| `glacial` | 800 | Ambient, background |

### 6.2 Easing Functions

```css
--p31-ease-standard:    cubic-bezier(0.4, 0, 0.2, 1);   /* Default transitions */
--p31-ease-emphasized:  cubic-bezier(0.2, 0, 0, 1);     /* Entrances */
--p31-ease-decelerate:  cubic-bezier(0, 0, 0.2, 1);     /* Exits */
```

### 6.3 Motion Ethics

- **Never** self-start motion on load (Gray Rock principle)
- Respect `prefers-reduced-motion` — disable or simplify
- **One** celebratory moment, then it stops
- Information must not depend on motion alone
- No timed "reveal" animations that create manufactured urgency

### 6.4 Starfield (Layer 1.5)

| Preset | Base Alpha | FPS | Motion |
|--------|------------|-----|--------|
| `soup` | 0.35 | 24 | Animated |
| `hub` | 0.22 | 20 | Animated |
| `commandCenter` | 0.14 | — | Static plate |
| `operatorDesk` | 0.11 | — | Static plate |

**Global off key:** `localStorage.setItem('p31.starfield.off', '1')`

---

## 7. Component Patterns

### 7.1 Gray Rock → Alive → Personal

**Layer 1 (Gray Rock):** Default state — void background, muted hierarchy, no brand chroma, no self-started motion.

**Layer 2 (Alive):** On interaction — surfaces lift, color emerges, motion responds to operator intent.

**Layer 3 (Personal):** Deep engagement — personal tetrahedron data, preferences, saved state.

**Bypass:** `?alive=1` for demos only (documented, not default).

### 7.2 Return Ribbon (Fixed Spine)

```
[soup] [hub] [passport] [connection] [mesh]
```

- Fixed position footer
- Font: 11px mono
- Links to core entry points

### 7.3 Focus States

```css
/* Hub */
--p31-focus-ring: 2px solid rgba(77, 184, 168, 0.55);

/* Org */
--p31-focus-ring: 2px solid rgba(37, 137, 125, 0.45);
```

Offset: 2px from element edge.

### 7.4 Glass Surfaces

```css
/* Hub */
--p31-glass-border:   rgba(255, 255, 255, 0.08);
--p31-glass-surface:  rgba(255, 255, 255, 0.04);

/* Org */
--p31-glass-border:   rgba(15, 23, 42, 0.07);
--p31-glass-surface:  rgba(255, 255, 255, 0.82);
```

---

## 8. Product Asset Inventory

### 8.1 Core Entry Points

| Path | Product | Tech Stack | Three.js |
|------|---------|------------|----------|
| `/` | Cockpit (hub home) | Astro 5, Three.js r183 | r183 |
| `/dome/` | Sovereign Cockpit | Astro, Three.js | r183 |
| `/connect.html` | The Mesh (K₄ navigator) | Static, Three.js | r160 |
| `/k4market.html` | K4 Market | Static, Three.js | r160 |
| `/tomography.html` | K4 Tomography | Static, Three.js | r183 |
| `/geodesic.html` | Geodesic Builder | Static, Three.js | r160 |
| `/planetary-onboard.html` | Threshold Onboard | Static, Tailwind | — |
| `/mesh-start.html` | EDE Personal | Static | — |

### 8.2 Product Categories

**Cockpit Core (6):**
- bonding, social-molecules, spaceship-earth, ede, buffer, alchemy

**Live Systems (9):**
- attractor, kenosis, genesis-gate, cortex, discord-bot, donate, book, k4market, tomography

**Production Suite (8):**
- appointment-tracker, love-ledger, medical-tracker, somatic-anchor, legal-evidence, kids-growth, contact-locker, sleep-tracker, budget-tracker

**Quantum / Research (6):**
- quantum-clock, quantum-deck, quantum-composer, quantum-core, quantum-family, quantum-life-os

**Tools & Studios (10):**
- geodesic, content-forge, forge, signal, prism, echo, liminal, kinematics, tactile, qg-ide

**Sovereign Stack (6):**
- sovereign, vault, node-zero, node-one, simple-sovereignty, super-centaur

**Onboarding & Narrative (6):**
- planetary-onboard, connect, delta, canon-demo, education, poets

### 8.3 About Page System

Every product ID in `hub-app-ids.mjs` generates:
1. **Hub card** on `/` (cockpit grid)
2. **About page** at `public/{id}-about.html`
3. **Registry entry** in `registry.mjs` with `appUrl`, `related[]`

**Generation:** `npm run hub:ci` → `build-landing-data.mjs` → `generate-about-pages.mjs` → `verify.mjs`

---

## 9. Three.js Version Pins

| Surface | Version | CDN |
|---------|---------|-----|
| dome.astro | r183 | unpkg |
| observatory.html | r160 | unpkg |
| k4market.html | r160 | unpkg |
| tomography.html | r183 | jsdelivr |
| connect.html | r160 | unpkg |
| geodesic.html | r160 | unpkg |
| geodesic-math.astro | r183 | unpkg |
| mesh-observatory.astro | r183 | unpkg |

**Verification:** `npm run verify:ground-truth` checks pins in `p31.ground-truth.json`

---

## 10. Asset Locations

### 10.1 Static Assets

```
public/
├── design-assets/
│   ├── starfield/
│   │   └── p31-larmor-fields.css    # Larmor CSS animation
│   └── stl/
│       └── P31_K4_Topology.stl      # 3D printable mesh
├── p31-style.css                     # Generated design tokens
├── p31-tailwind-extend.js            # Tailwind CDN preset
├── p31-canon-demo.html               # Token gallery
└── _redirects                        # Edge redirects (80+ rules)
```

### 10.2 Generated Files (Do Not Edit Directly)

| File | Source | Generator |
|------|--------|-----------|
| `src/data/hub-landing.json` | registry.mjs + hub-app-ids.mjs | build-landing-data.mjs |
| `public/*-about.html` | registry.mjs | generate-about-pages.mjs |
| `public/p31-style.css` | p31-universal-canon.json | apply:p31-style |
| `public/p31-tailwind-extend.js` | p31-universal-canon.json | apply:p31-style |

---

## 11. Ethical Design Constraints

### 11.1 Gray Rock Principle

Default UI is **inert**:
- Void background
- Muted hierarchy
- No brand chroma
- No self-started motion

Activation requires **operator intent** (hover, click, scroll).

### 11.2 Autonomy

- Obvious affordances
- Explain what happened and why
- No fake scarcity, hidden defaults, mislabeled controls

### 11.3 Transparency

- Name systems honestly ("sim", "co-presence", "family room")
- No "mystery" mechanics or obscured state
- Full glass box at `/glass-box.html`

### 11.4 Dignity

- Treat adults and kids as whole people
- No shame/FOMO as the main lever
- No stranger leaderboards or streak-as-identity

### 11.5 Access

- Respect `prefers-reduced-motion`
- Never force app-store install for mesh access
- One honest "Add to Home Screen" nudge maximum

---

## 12. Copy Voice

### 12.1 Preferred Terms

| Use | Avoid |
|-----|-------|
| "together" | "community" (when implying pressure) |
| "clear" | "transparent" (buzzword) |
| "same bowl / same room" | "ecosystem" (abstract) |
| "your people" | "users" (dehumanizing) |
| "guardian / kid / family" | "parent / child" (clinical) |
| S.J., W.J. | Full names of children |

### 12.2 Anti-FOMO List

Never use:
- "Don't miss"
- "Only today"
- "Epic"
- "Prove you're a real fan"
- "Beat everyone"

---

## 13. Verification & Maintenance

### 13.1 Verify Pipeline

```bash
npm run verify              # Full bar: constants, passport, contracts, egg-hunt, build
npm run hub:ci              # Registry → about pages → verify → build
npm run verify:ground-truth  # Routes, Three.js pins, redirect integrity
npm run verify:p31-style     # Token CSS regeneration check
```

### 13.2 Adding a Product

1. Add entry to `scripts/hub/registry.mjs`
2. Add ID to `scripts/hub/hub-app-ids.mjs` (cockpit or prototype order)
3. Run `npm run hub:ci`
4. If Three.js: add pin to `ground-truth/p31.ground-truth.json`
5. Commit all generated files

### 13.3 Changing Design Tokens

1. Edit `andromeda/software/design-tokens/p31-universal-canon.json`
2. Run `npm run apply:p31-style`
3. Run `npm run verify:p31-style`
4. Test both `hub` and `org` appearances
5. Commit generated CSS

---

## 14. Related Documents

| Document | Purpose |
|----------|---------|
| `docs/ETHICAL-STYLE-MAP.md` | Motion ethics, copy voice, psychological color mapping |
| `docs/P31-DESIGN-DOCTRINE.md` | Gray Rock → Alive → Personal interaction model |
| `docs/P31-QUANTUM-MATERIAL-U.md` | Material 3 grammar through K₄ anchors |
| `design-tokens/DESIGN-TOKENS-REFERENCE.md` | Auto-generated token tables |
| `ground-truth/p31.ground-truth.json` | Machine contract for routes, pins, redirects |
| `docs/P31-HUB-CARD-ECOSYSTEM.md` | Registry → card → about alignment |

---

## 15. Schema Reference

```json
{
  "$schema": "p31.designSpec/1.0.0",
  "canonical": {
    "source": "andromeda/software/p31ca/docs/DESIGN-SPEC.md",
    "tokens": "andromeda/software/design-tokens/p31-universal-canon.json",
    "groundTruth": "andromeda/software/p31ca/ground-truth/p31.ground-truth.json"
  },
  "verifiers": [
    "verify:ground-truth",
    "verify:p31-style",
    "verify:passport",
    "hub:verify"
  ]
}
```

---

*End of specification.*

For questions or updates, follow the verification pipeline in `p31-alignment.json` — never edit derived files directly.
