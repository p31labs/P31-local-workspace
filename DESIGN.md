---
version: alpha
name: P31 Labs
description: "Sovereign, neuroinclusive design system for assistive technology. Dark-first, glassmorphism, spoon-aware motion scaling."

colors:
  void: "#0A0A0F"
  surface: "#12121A"
  surface2: "#1C1C2A"
  cloud: "#A1A1AA"
  text-primary: "#F5F5F7"
  text-secondary: "rgba(245,245,247,0.6)"
  text-tertiary: "rgba(245,245,247,0.3)"
  quantum-cyan: "#00F0FF"
  quantum-violet: "#A78BFA"
  quantum-gold: "#FBBF24"
  quantum-green: "#34D399"
  quantum-red: "#FB7185"
  quantum-iris: "#818CF8"
  glass-surface: "rgba(255,255,255,0.04)"
  glass-border: "rgba(255,255,255,0.08)"
  glass-border-hover: "rgba(255,255,255,0.15)"
  glass-surface-hover: "rgba(255,255,255,0.06)"

typography:
  sans:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  h1:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h2:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.2
  h3:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.05em
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6

rounded:
  none: "0px"
  sm: "8px"
  md: "12px"
  lg: "24px"
  full: "9999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
  gutter: "24px"
  margin: "32px"

components:
  glass-panel:
    background: "{colors.glass-surface}"
    backdrop-filter: "blur(12px)"
    "-webkit-backdrop-filter": "blur(12px)"
    border: "1px solid {colors.glass-border}"
    border-radius: "{rounded.lg}"
    box-shadow: "0 8px 32px rgba(0,0,0,0.15)"
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  glass-panel-hover:
    border-color: "{colors.glass-border-hover}"
    background: "{colors.glass-surface-hover}"
    transform: "translateY(-2px)"
    box-shadow: "0 12px 48px rgba(0,0,0,0.25)"
  glass-card:
    background: "{colors.glass-surface}"
    backdrop-filter: "blur(12px)"
    "-webkit-backdrop-filter": "blur(12px)"
    border: "1px solid {colors.glass-border}"
    border-radius: "{rounded.lg}"
    padding: "{spacing.lg}"
    box-shadow: "0 8px 32px rgba(0,0,0,0.15)"
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
  btn-primary:
    background: "{colors.quantum-cyan}"
    color: "{colors.void}"
    font-weight: 700
    padding: "{spacing.sm} {spacing.lg}"
    border-radius: "{rounded.md}"
    transition: "all 0.2s ease"
    box-shadow: "0 4px 16px rgba(0,240,255,0.2)"
  btn-primary-hover:
    background: "color-mix(in srgb, {colors.quantum-cyan} 80%, transparent)"
    transform: "translateY(-2px)"
    box-shadow: "0 8px 24px rgba(0,240,255,0.3)"
  btn-secondary:
    background: "rgba(167,139,250,0.1)"
    color: "{colors.quantum-violet}"
    font-weight: 700
    padding: "{spacing.sm} {spacing.lg}"
    border-radius: "{rounded.md}"
    border: "1px solid rgba(167,139,250,0.3)"
    transition: "all 0.2s ease"
  btn-secondary-hover:
    background: "rgba(167,139,250,0.2)"
    transform: "translateY(-2px)"
    box-shadow: "0 4px 16px rgba(167,139,250,0.15)"
  btn-ghost:
    background: "rgba(255,255,255,0.05)"
    color: "{colors.text-secondary}"
    font-weight: 700
    padding: "{spacing.sm} {spacing.lg}"
    border-radius: "{rounded.md}"
    border: "1px solid rgba(255,255,255,0.1)"
    transition: "all 0.2s ease"
  btn-ghost-hover:
    background: "rgba(255,255,255,0.1)"
    color: "{colors.text-primary}"
  navbar:
    background: "{colors.glass-surface}"
    backdrop-filter: "blur(12px)"
    "-webkit-backdrop-filter": "blur(12px)"
    border: "1px solid {colors.glass-border}"
    border-radius: "{rounded.lg}"
    position: "fixed"
    top: "{spacing.md}"
    left: "50%"
    transform: "translateX(-50%)"
    z-index: 50
    padding: "{spacing.sm} {spacing.md}"
    width: "95%"
    max-width: "64rem"
---

# P31 Labs Design System

## Overview

P31 Labs builds open-source, neurodivergent-first assistive technology. The design system reflects this mission: **calm, sovereign, technically precise**.

The visual language is **dark-first**, using a warm off-white (`#F5F5F7`) for text to prevent halation and eye strain during extended focus. Glassmorphism provides depth without visual noise. Every component is **spoon-aware** — motion and complexity scale with the user's energy level (0–5).

### Brand Personality

- **Sovereign** — Users own their data and experience. No telemetry, no tracking.
- **Calm** — Reduce cognitive load. Consistent spacing, predictable interactions, no unnecessary motion.
- **Technical** — JetBrains Mono for code, Inter for UI. The aesthetic of a developer workspace.
- **Neuroinclusive** — Designed with and for neurodivergent individuals. Motion is a preference, not a default.

### Target Audience

- Neurodivergent individuals and families using assistive technology
- Developers building on the P31 platform
- Donors and supporters of open-source accessibility

## Colors

The palette is rooted in a dark void and warm neutrals, with a single primary accent (`quantum-cyan`) to reduce cognitive load.

| Token | Value | Usage |
|-------|-------|-------|
| `void` | `#0A0A0F` | Primary background — deep, non-reflective |
| `surface` | `#12121A` | Card backgrounds, raised elements |
| `surface2` | `#1C1C2A` | Nested surfaces, scrollbar track |
| `cloud` | `#A1A1AA` | Muted body text |
| `text-primary` | `#F5F5F7` | Headings and primary body text |
| `text-secondary` | `rgba(245,245,247,0.6)` | Supporting text, metadata |
| `text-tertiary` | `rgba(245,245,247,0.3)` | Low-emphasis text, placeholders |
| `quantum-cyan` | `#00F0FF` | **Primary accent** — CTAs, interactive elements, mesh highlights |
| `quantum-violet` | `#A78BFA` | Secondary actions, decorative elements |
| `quantum-gold` | `#FBBF24` | Donor-facing elements, spark indicators |
| `quantum-green` | `#34D399` | Success states, online indicators |
| `quantum-red` | `#FB7185` | Error states, destructive actions |
| `quantum-iris` | `#818CF8` | Tertiary highlight, links-in-context |

### Color Usage Rules

- Use `quantum-cyan` for **one** primary action per screen — the single most important interaction.
- Use `quantum-violet` for secondary actions that support the primary flow.
- Use `quantum-gold` sparingly — it signals something special (donation, spark, achievement).
- **Never** use pure white (`#FFFFFF`) for text — use `text-primary` (`#F5F5F7`) to prevent halation.
- **Never** use pure black (`#000000`) for backgrounds — use `void` (`#0A0A0F`) to reduce eye strain.

## Typography

P31 uses a dual-typeface system: **Inter** for UI clarity, **JetBrains Mono** for code and terminal interfaces.

| Token | Font | Usage |
|-------|------|-------|
| `sans` | Inter | Navigation, labels, body text, headings |
| `mono` | JetBrains Mono | Code blocks, CLI outputs, terminal interfaces |
| `h1` | Inter, 48px, 700 | Page titles, hero headlines |
| `h2` | Inter, 32px, 600 | Section headings |
| `h3` | Inter, 24px, 600 | Sub-section headings |
| `body` | Inter, 16px, 400 | Primary body text |
| `body-sm` | Inter, 14px, 400 | Supporting text, cards |
| `label` | Inter, 12px, 500, 0.05em | Form labels, metadata, captions |
| `code` | JetBrains Mono, 13px | Inline code, code blocks |

### Typography Rules

- Headings **must** use the sans-serif stack (Inter) — never JetBrains Mono.
- Code blocks **must** use JetBrains Mono at 13px with 1.6 line-height.
- Labels are **uppercase** with generous letter spacing (`0.05em`).
- Body text `line-height` is always `1.6` for readability.

## Layout

The layout follows a **Fixed-Max-Width Grid** for desktop (max 1200px) with a strict **8px spacing scale** (plus a 4px half-step for micro-adjustments). Components are grouped using containment — related items live in `glass-card` containers with 24px internal padding.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Micro-adjustments, icon spacing |
| `sm` | 8px | Tight spacing, inline elements |
| `md` | 16px | Standard spacing between elements |
| `lg` | 24px | Card padding, section spacing |
| `xl` | 40px | Large section spacing |
| `xxl` | 64px | Hero spacing, major layout divisions |
| `gutter` | 24px | Grid gutters |
| `margin` | 32px | Container margins |

### Layout Rules

- Every spacing value is a multiple of 4 or 8.
- Card internal padding is **always** 24px (`lg`).
- Page max-width is 1200px desktop; 100% with `padding: 0 24px` on mobile.
- Related items are housed in `glass-card` containers with generous internal padding.

## Elevation & Depth

Depth is achieved through **glassmorphism** rather than heavy shadows. Elevated surfaces use `backdrop-filter: blur(12px)` with a subtle 1px border and soft shadow.

### Glass Panel (Base)

```css
.glass-panel {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border-radius: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Glass Panel (Hover)

```css
.glass-panel:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
}
```

### Elevation Rules

- All elevated surfaces must use `backdrop-filter: blur(12px)`.
- Border radius for cards and containers is always 24px (`lg`).
- Border radius for interactive elements (buttons, inputs) is always 12px (`md`).
- Shadows are soft — never harsh or sharp.

## Shapes

The shape language is defined by **generous, softened geometry**.

| Token | Value | Usage |
|-------|-------|-------|
| `none` | `0px` | No rounding |
| `sm` | `8px` | Small decorative elements, scrollbar thumb |
| `md` | `12px` | Buttons, inputs, interactive elements |
| `lg` | `24px` | Cards, containers, panels |
| `full` | `9999px` | Pills, badges, avatars |

### Shape Rules

- Do use `lg` (24px) for all card and container corners.
- Do use `md` (12px) for all interactive elements (buttons, inputs).
- Don't mix rounded and sharp corners in the same view.
- Don't use `full` (pill shape) for anything other than badges and avatars.

## Components

### GlassCard

All cards use the `glass-panel` token set with 24px padding. Apply the `.glass-card` class.

**Hover state:** border lightens, background slightly increases opacity, card lifts by 2px.

### Buttons

- **Primary** (`.btn-primary`) — Use once per view for the single most important action. `quantum-cyan` background, `void` text. Hover: cyan at 80% opacity, lifts 2px.
- **Secondary** (`.btn-secondary`) — Supporting actions. `quantum-violet/10` background, `quantum-violet` text, `quantum-violet/30` border. Hover: lifts 2px.
- **Ghost** (`.btn-ghost`) — Low-emphasis actions. `white/5` background, `text-secondary` text, `white/10` border. Hover: text becomes `text-primary`.
- **Donate** — Special gradient (gold → cyan) for donation flows; reserved for supporter conversion.

### Navigation

The navbar is a fixed glass-panel centered at the top of the viewport: `top-4`, centered horizontally, `w-[95%] max-w-5xl`. Mobile collapses into a glass dropdown using the same styling.

### CodeBlock

Code blocks use a `void` background with JetBrains Mono and a copy button. Border `white/10`, radius `md` (12px), padding 16px. Copy button appears on hover.

## Motion & Spoon-Aware Scaling

P31's motion system is **spoon-aware** — animation duration scales with the user's energy level, set on `<html data-spoons="N">`.

| Level | Label | Motion Behavior |
|-------|-------|-----------------|
| 0 | Crisis | All motion disabled — static interface |
| 1 | Low | All motion disabled — static interface |
| 2 | Reduced | Slowed animations (2s duration, 0.6s transition) |
| 3 | Standard | Baseline animations (component defaults) |
| 4 | Enhanced | Accelerated (0.75s duration, 0.15s transition) |
| 5 | Maximum | Fast (0.5s duration, 0.1s transition) |

```css
[data-spoons="0"] *, [data-spoons="1"] * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
[data-spoons="2"] * {
  animation-duration: 2s !important;
  transition-duration: 0.6s !important;
}
[data-spoons="4"] * {
  animation-duration: 0.75s !important;
  transition-duration: 0.15s !important;
}
[data-spoons="5"] * {
  animation-duration: 0.5s !important;
  transition-duration: 0.1s !important;
}
```

### Motion Rules

- All animations and transitions must respect `data-spoons`.
- At spoons 0–1, all motion is disabled — **non-negotiable**.
- Use `prefers-reduced-motion` as a hard fallback — disable all animation when set.

## Crisis Mode

At `spoons === 0`, the interface must render a full-screen breathing exercise overlay.

### Behavior

- No UI chrome (no sidebar, no chat, no navigation).
- A single circle animates through inhale → hold → exhale → hold phases (4s per phase).
- Exit control: **Escape key** or an **"I'm ready"** button, both reset spoons to 3.

### Invariant

Never render interactive UI elements (buttons, inputs, navigation) in CrisisMode. The overlay is a grounding exercise — the only interaction is the exit control. (Implemented in `apps/phos/src/components/CrisisMode.tsx`.)

## COGA — Cognitive and Learning Accessibility

WCAG 2.2 COGA success criteria require interfaces that reduce cognitive load, support progressive disclosure, and adapt to user capabilities. P31 implements these through the spoon system and the `<Disclosure>` component.

### Progressive Disclosure

Use the `<Disclosure>` component (`apps/phos/src/components/Disclosure.tsx`) to hide secondary information behind an expand/collapse toggle. This reduces initial cognitive load while keeping detail accessible.

- **Default state:** Collapsed at spoons ≤ 1, expanded at spoons ≥ 3.
- **Auto-collapse:** The component auto-collapses when spoons drop below the threshold.
- **ARIA:** `aria-expanded`, `aria-controls`, `role="region"` are mandatory.

### Spoon-Driven Complexity Tiers

Surfaces should adapt their information density based on `data-spoons`:

| Spoons | Complexity | Behavior |
| :--- | :--- | :--- |
| 0 | Crisis | Full-screen breathing overlay; no UI chrome |
| 1 | Minimal | Emergency contacts only; all secondary features hidden |
| 2 | Compact | Core features only; compact inputs, reduced detail |
| 3–4 | Standard | Full feature set with progressive disclosure for secondary content |
| 5 | Exhaustive | All features expanded; maximum detail density |

### Information Hierarchy

- Primary action: single `quantum-cyan` CTA per screen.
- Secondary actions: hidden behind `<Disclosure>` or in the Magic Drawer.
- Tertiary information: accessible via navigation but not shown by default.

### User-Controlled Adaptation

The spoon slider (global) and density toggles (per-surface) give users direct control over complexity. The system never auto-increases complexity — only the user can request more detail.

## Do's and Don'ts

### Do's

- Do use `quantum-cyan` for the single most important action per screen.
- Do use `glass-panel` / `glass-card` for all elevated surfaces.
- Do use 24px radius for cards/containers, 12px for interactive elements.
- Do respect `data-spoons` in every component.
- Do use Inter for UI text and JetBrains Mono for code.
- Do keep 1.6 line-height for body text.
- Do use `#F5F5F7` for primary text (never pure white).
- Do use `#0A0A0F` for backgrounds (never pure black).
- Do provide an exit control in CrisisMode.
- Do include a skip link at the top of every page.

### Don'ts

- Don't mix rounded and sharp corners in the same view.
- Don't use more than one primary accent color per view.
- Don't use pure white (`#FFFFFF`) for text.
- Don't use pure black (`#000000`) for backgrounds.
- Don't render UI chrome in CrisisMode (`spoons === 0`).
- Don't use JetBrains Mono for UI text (headings, labels, body).
- Don't use Inter for code blocks.
- Don't ignore `prefers-reduced-motion`.
- Don't use heavy shadows — stick to soft `0 8px 32px rgba(0,0,0,0.15)`.

## Rejected Alternatives

- **Pure Black (`#000000`)** — Rejected for `void #0A0A0F`; pure black creates excessive contrast and eye strain during extended focus.
- **Multiple Accent Colors** — Rejected; only one primary accent (`quantum-cyan`) reduces cognitive load and creates clear hierarchy.
- **Complex Animations** — Rejected for spoon-aware motion scaling; complex motion is inaccessible to motion-sensitive users.
- **Sharp Corners (0px)** — Rejected; all corners are rounded (24px containers, 12px interactive) to feel calm and approachable.
- **Heavy Shadows** — Rejected; shadows are soft and minimal to avoid visual noise.
