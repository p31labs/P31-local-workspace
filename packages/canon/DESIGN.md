---
name: "P31 Loom"
description: "The P31 design canon — a family-first, agent-native design system. Human and agent, co-present."
version: "2025.10"
license: "Apache-2.0"

design_system:
  semantics:
    - "accessible by default (WCAG 2.2 AA minimum, family floor 48px targets)"
    - "sensory-aware (muted / warmLight modes, prefers-reduced-motion collapse)"
    - "agent-native (typed tokens, AAF manifest, DESIGN.md)"
  themes:
    - id: "cipher"
      accent: "oklch(65% 0.18 195)"
    - id: "garden"
      accent: "oklch(70% 0.15 145)"
    - id: "family"
      accent: "oklch(80% 0.16 75)"
    - id: "retro"
      accent: "oklch(75% 0.18 80)"
    - id: "ocean"
      accent: "oklch(70% 0.15 200)"
    - id: "sunset"
      accent: "oklch(72% 0.18 40)"
    - id: "mono"
      accent: "oklch(80% 0 0)"
    - id: "aurora"
      accent: "oklch(72% 0.16 250)"
    - id: "zen"
      accent: "oklch(72% 0.1 75)"
    - id: "volt"
      accent: "oklch(75% 0.17 190)"

tokens:
  colors:
    surface: { bg: "--p31-bg", surface: "--p31-surface", surface2: "--p31-surface2" }
    text: { primary: "--p31-text-primary", secondary: "--p31-text-secondary", tertiary: "--p31-text-tertiary" }
    accent: { base: "--p31-accent", cyan: "--p31-accent-cyan", violet: "--p31-accent-violet",
               gold: "--p31-accent-gold", green: "--p31-accent-green", red: "--p31-accent-red",
               iris: "--p31-accent-iris" }
    glass: { bg: "--p31-glass-bg", border: "--p31-glass-border", shadow: "--p31-glass-shadow" }
  typography:
    sans: "--p31-font-sans"
    mono: "--p31-font-mono"
  spacing: { base: "--p31-base", xs: "--p31-scale-xs", sm: "--p31-scale-sm", md: "--p31-scale-md",
              lg: "--p31-scale-lg", xl: "--p31-scale-xl", "2xl": "--p31-scale-2xl" }
  radius: { sm: "--p31-radius-sm", md: "--p31-radius-md", lg: "--p31-radius-lg", full: "--p31-radius-full" }

components:
  - "The Loom chapters (orb, color-pick, workshop) — see apps/loom/src/components/"
  - "Companion view (the elder's window) — apps/loom/src/components/Companion.tsx"
---
# P31 Loom — design system for agents

The design system as a live graph: human and agent, co-present. This file is
the agent-readable face of the P31 canon. Every value below is generated from
`packages/canon/src/theming/theme-store.ts` — the single source of truth.

## Principles

1. **Family-first.** Touch targets are 48px minimum (`--p31-touch-min`), 56px
   recommended, 64px large. This exceeds WCAG 2.2 AAA and Apple/Material guidance.
2. **Accessible by default.** WCAG 2.2 AA minimum; contrast via OKLCH perceptual
   math, not hex luck. `prefers-reduced-motion` collapses `--motion-scale` to
   0.01 — it never sets `animation: none` (the phase machines depend on
   `animationend`).
3. **Sensory-aware.** Two sensory modes — `muted` (chroma down) and `warmLight`
   (chroma up, warmth toward amber). Never a hardcoded hex in production code;
   every color is a `var(--p31-*)` token.
4. **Agent-native.** The canon exposes typed tokens (`P31TokenName`), a W3C
   DTCG export, and an AAF manifest (`.well-known/agent-manifest.json`). The
   Loom's log is the runtime: state folds over an append-only event log; the
   log is tamper-evident (`prev_hash` chain, `/verify`).

## Token map

The base tokens below are the normative values. All are emitted from the
DTCG export (132 base tokens); semantic slots resolve through
the theme store.

| Token | Value | Type |
|---|---|---|
| `--p31-base` | `16px` | dimension |
| `--p31-scale-xs` | `calc(var(--p31-base) * 0.75)` | dimension |
| `--p31-scale-sm` | `var(--p31-base)` | dimension |
| `--p31-scale-md` | `calc(var(--p31-base) * 1.3333)` | dimension |
| `--p31-scale-lg` | `calc(var(--p31-base) * 1.7777)` | dimension |
| `--p31-scale-xl` | `calc(var(--p31-base) * 2.3703)` | dimension |
| `--p31-scale-2xl` | `calc(var(--p31-base) * 3.1604)` | dimension |
| `--p31-radius-sm` | `8px` | dimension |
| `--p31-radius-md` | `16px` | dimension |
| `--p31-radius-lg` | `24px` | dimension |
| `--p31-radius-full` | `9999px` | dimension |
| `--p31-font-sans` | `'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | fontFamily |
| `--p31-font-mono` | `'JetBrains Mono', ui-monospace, 'SF Mono', 'Fira Code', monospace` | fontFamily |
| `--p31-accent-alt` | `oklch(65% 0.18 285)` | color |
| `--p31-text` | `oklch(96% 0.005 240)` | color |
| `--p31-glass-border-hover` | `oklch(100% 0.01 240 / 0.15)` | color |
| `--p31-glass-blur` | `blur(12px)` | dimension |
| `--p31-glass-bg-strong` | `oklch(100% 0.01 75 / 0.22)` | color |
| `--p31-glass-bg-overlay` | `oklch(100% 0.01 75 / 0.10)` | color |
| `--p31-glass-bg-light` | `oklch(100% 0.01 75 / 0.10)` | color |
| `--p31-glass-border-strong` | `oklch(100% 0.01 75 / 0.16)` | color |
| `--p31-glass-border-strong-hover` | `oklch(100% 0.01 75 / 0.25)` | color |
| `--p31-glow-cyan` | `0 0 20px rgba(0,240,255,0.25)` | boxShadow |
| `--p31-glow-neon` | `0 0 6px oklch(90.5% 0.155 194.8), 0 0 20px oklch(90.5% 0.155 194.8 / 0.3)` | boxShadow |
| … | 108 more base tokens | |

## Themes

- **cipher** — accent `oklch(65% 0.18 195)`
- **garden** — accent `oklch(70% 0.15 145)`
- **family** — accent `oklch(80% 0.16 75)`
- **retro** — accent `oklch(75% 0.18 80)`
- **ocean** — accent `oklch(70% 0.15 200)`
- **sunset** — accent `oklch(72% 0.18 40)`
- **mono** — accent `oklch(80% 0 0)`
- **aurora** — accent `oklch(72% 0.16 250)`
- **zen** — accent `oklch(72% 0.1 75)`
- **volt** — accent `oklch(75% 0.17 190)`

## Decision records

The `why` behind the tokens. Each ADR is one decision, immutable once
accepted, superseded never edited. See `adr/` for the full records.

| # | Status | Decision |
|---|---|---|
| 001 | Accepted | ADR-001-the-family-touch-floor-is-48px — `--p31-touch-min` is **48px** (the family floor), with `--p31-touch-recommended` |
| 002 | Accepted | ADR-002-the-artifact-is-a-button-not-a-preview-image — The artifact is a **button** (`made-artifact-btn`), styled with the family |
| 003 | Accepted | ADR-003-color-is-oklch-not-oklab-or-hsl — All new tokens are **OKLCH** (`--p31-bg`, `--p31-accent`, `--p31-text-*`, the |
| 004 | Accepted | ADR-004-the-companion-view-has-no-chip — The companion view has **no chip**. No counts, no numbers, no badges. The |
| 005 | Accepted | ADR-005-the-phase-machine-is-animationend-driven-never-settimeout — The phase machine is **driven by `animationend`**, and reduced motion is |
| 006 | Accepted | ADR-006-music-maker-static-zone-sphere — The spatial music maker keeps zones **static on a sphere** and moves the **listener** (one finger is you); the audio + visual coordinates never disagree |
| 007 | Accepted | ADR-007-music-maker-hrtf-by-device-signals — HRTF is chosen by **device signals** (Safari UA, hardwareConcurrency, outputLatency), never by a runtime panner probe — the probe measures nothing |
| 008 | Accepted | ADR-008-music-maker-composition-vs-performance — **Composition is committed** (gate + D1 + hash-chain); **performance is ephemeral** (WebSocket broadcast, never persisted) |
| 009 | Accepted | ADR-009-music-maker-raycast-plus-listbox — Zones trigger by **canvas raycast** (pointer) AND a **hidden listbox** (keyboard / screen reader), sharing one callback |

## Do / Don't

- **Do** use `var(--p31-*)` tokens; never hardcode hex, rgba, or inline styles.
- **Do** keep touch targets ≥ 48px for anything a child or elder touches.
- **Do** respect `prefers-reduced-motion` (collapse, not disable).
- **Don't** add a second source of truth for tokens — edit `theme-store.ts`.
- **Don't** put PII in the log; the log is an artifact record, not a person record.
- **Don't** make the agent write registry.json, contracts, or CSS directly —
  it appends events; a human approves them through the gate.

## Generated

This file is generated by `node scripts/gen-design.mjs` from the DTCG export
(tokens/tokens.dtc.json) + theme-store.ts. Do not edit by hand; edit the source
and re-run `pnpm gen:design`.
