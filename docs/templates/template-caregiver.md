# Template C: Caregiver Companion (PHOS Conversational)

> `/conversational` — the zero-reading entry point. Caregiver companion with pre-cognitive action chips, spoon-aware minimal interface, and distraction-free chat layout. For neurodivergent caregivers: no reading required to start, no chrome, no decisions beyond "tap a chip or type."

## Visual Theme

Minimal, calm, distraction-free. The interface vanishes except for two elements: a row of action chips (for users who can't type) and a text input bar (for users who can). No navigation chrome, no sidebars, no decorative elements. Pure conversation surface on a near-black void background.

## Color Palette

```yaml
surface:
  base: var(--p31-void-deep)           # #050508 — nearly black, non-stimulating
  panel: var(--p31-surface)            # #12121A — message bubbles
  input: rgba(255,255,255,0.04)        # glass-subtle input bar
text:
  primary: var(--p31-text-primary)     # oklch(96% 0.005 240)
  secondary: var(--p31-text-secondary) # oklch(75% 0.01 240)
  muted: var(--p31-text-muted)         # oklch(65% 0.01 240)
  accent: var(--p31-accent-violet)     # #A78BFA — chip hover
borders:
  glass: var(--p31-glass-border)       # rgba(255,255,255,0.08)
```

## Typography

```yaml
chips: 12px font-medium               # Non-intimidating, touch-friendly
input: var(--p31-text-base)           # 16px, comfortable reading
messages:
  user: 14px                          # Right-aligned, violet-tinted bubble
  system: 14px                        # Left-aligned, void-tinted bubble
font-family: var(--p31-font-family)   # Inter
```

## Layout

```yaml
viewport: 100vh, flex-column, centered
structure:
  - ChipBar (flex row, centered, wraps, above input)
  - Message canvas (flex: 1, overflow-y: auto, padded)
  - Input bar (glass-subtle, sticky bottom, max-width 640px)
spacing:
  chip-gap: 8px
  chip-padding: 4px 12px
  message-gap: 12px
  input-bar-padding: var(--p31-space-md)
  canvas-padding: var(--p31-space-md)
max-width: 640px                      # Narrow, focused for reading comfort
```

## Components Used

| Component | Import | Purpose |
|-----------|--------|---------|
| `ChipBar` | `../../../../src/components/ChipBar` | Pre-cognitive action chips (5 max) |
| Glass tokens | `@p31/design-core` CSS | Message bubbles, input bar surfaces |
| Native `<input>` | — | Primary text interaction |

## Components NOT Used

- **No Crown** — no brand chrome on this surface
- **No SiteNav** — no navigation visible
- **No Footer** — full-viewport, no footer
- **No GlassCard (component)** — uses inline glass styles for custom fit
- **No SpoonDial** — chips serve as the primary action surface; spoons managed via sidebar
- **No Button component** — uses native `<button>` elements

## Tokens Used

```yaml
surface: --p31-void-deep, --p31-surface, --p31-glass-surface, --p31-glass-bg
text: --p31-text-primary, --p31-text-secondary, --p31-text-muted
border: --p31-glass-border
spacing: --p31-space-xs, --p31-space-sm, --p31-space-md, --p31-space-lg
radius: --p31-radius-md, --p31-radius-full (chips)
font: --p31-font-family
blur: --p31-blur-strong (24px on input bar)
```

## Behavioral Rules

1. **Zero-reading default** — The screen starts with nothing but chips and an input bar. No text reading required to begin using the surface.
2. **Pre-cognitive chips FIRST** — Action chips display ABOVE the input bar (not below, not in a sidebar). Users see actions BEFORE they see a typing surface. This is a behavioral upgrade to eliminate blank-page paralysis.
3. **Limited to exactly 5 chips** — Research-backed constraint: more than 5 simultaneous options overwhelms neurodivergent working memory. Current chips: Check spoons, Grounding, Log care proof, LOVE balance, Ask anything.
4. **Auto-focus input** — On mount, `inputRef.current?.focus()` fires immediately. The user can type without clicking.
5. **Chat-style message bubbles** — User messages: right-aligned, violet-tinted glass bubble. System messages: left-aligned, void-tinted bubble. Like a chat app but with structured actions.
6. **Enter to send** — No Shift+Enter for multiline. Pure Enter sends. `handleKeyDown` intercepts Enter key. Simplicity for users under cognitive load.
7. **600ms processing delay** — Simulates backend latency with visual feedback (`isProcessing` state). Real wiring replaces this with actual MCP/prosthetic calls.
8. **Spoon-aware by default** — All transitions and animations respect `data-spoons` attribute. Motion fully disabled at crisis (spoons 0–1). Message rendering is instantaneous (no typewriter effect).

## Chip Actions (The 5 Pre-Cognitive Actions)

| Label | Action | Prototype Response | Future Wiring |
|-------|--------|--------------------|---------------|
| Check spoons | `'spoons'` | "This is a prototype. The spoons flow will be wired..." | Read from nanostore, display current spoon level |
| Grounding | `'grounding'` | "This is a prototype. The grounding flow..." | Trigger VagusBreath breathing exercise |
| Log care proof | `'care-proof'` | "This is a prototype. The care-proof flow..." | Write to LOVE ledger via MCP |
| LOVE balance | `'love'` | "This is a prototype. The love flow..." | Query ledger-bridge for balance |
| Ask anything | `'chat'` | Echo user input back | Route through LLM proxy |

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Chips ABOVE input bar | Users see actions before typing surface — eliminates blank-page paralysis. Behavioral upgrade over traditional input-first chat UIs |
| 5 chips max | Cognitive load research: more than 5 options at once overwhelms neurodivergent users. "The magic number 7 ± 2" doesn't hold under cognitive load |
| No sidebar/nav | Distraction-free surface. All navigation is behind the Magic Drawer |
| Glass-subtle input bar | Minimal chrome. Only the input field and chips are visible. No decorative elements |
| No footer | Full-viewport immersion. Footer would add unnecessary information to someone seeking help |
| User messages right-aligned | Chat convention. System messages stay left. Creates familiar mental model |
| No multiline input | Simplicity. Caregivers under cognitive load don't need or want complex inputs |
| Violet accent for chips | Gentle, non-alarming. Cyan is too bright for a calming chat surface. Violet is calmer |

## Crisis Mode Behavior

At `data-spoons="0"` or `"1"`:
- All transitions/animations disabled (0s durations via motion.css)
- ChipBar still visible — chips are the FASTEST path to help in crisis
- Input bar visible but may show simplified placeholder text
- Message canvas may collapse to show only last 3 messages
- Processing delay reduced to 0ms (immediate feedback critical in crisis)

## Agent Generation Rules

1. Start with `<div data-spoons="..." style={{ background: 'var(--p31-void-deep)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>`
2. Render `<ChipBar chips={DEFAULT_CHIPS} onChip={handleChip} />` at the top (centered, above input)
3. Render message canvas: `<div style={{ flex: 1, overflowY: 'auto', padding: 'var(--p31-space-md)' }}>` with mapped messages
4. Render input bar: `<form onSubmit={handleSubmit}>` with glass-subtle styling at bottom
5. User messages: right-aligned, `textAlign: 'right'`, violet-tinted glass bubble
6. System messages: left-aligned, void-tinted glass bubble
7. Use glass token references for ALL surfaces — no hardcoded hex colors
8. Auto-focus input on mount via `useEffect` + `inputRef.current?.focus()`
9. Respect `data-spoons` for all transitions (use CSS custom properties, not inline durations)

## Source File
`apps/phos/src/features/conversational/components/ConversationalSurface.tsx` (241 lines)
