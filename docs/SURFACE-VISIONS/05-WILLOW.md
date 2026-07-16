# Willow — Design Vision

## Identity

- **Name:** Willow
- **URL:** `willow.p31ca.org`
- **Tagline:** Child-facing activity companion
- **Audience:** Children (neurodivergent), families
- **Purpose:** Activity companion — voice, drawing, magic, feelings, family connection
- **Layout:** Single-page SPA with panel switching

---

## Layout System

- **Container:** Full viewport (`minHeight: 100vh`)
- **Content:** Centered, max-width constrained
- **Panel system:** 6 screens switched via state (no URL changes)
- **Header:** K4 Hero + app title
- **Hub communication:** `postMessage` API to parent frames (for embedding in PHOS/hub)

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0A0A0F` | Page void (canonical) |
| Text primary | `#F5F5F7` | Headings, body |
| Accent | `#00F0FF` | Primary interactive |
| Quantum violet | `#A78BFA` | Secondary actions |
| Glass surface | `rgba(255,255,255,0.04)` | Panel backgrounds |
| Glass border | `rgba(255,255,255,0.08)` | Panel borders |

### Theme Map (by spoon level)

| Spoons | Theme | Accent |
|--------|-------|--------|
| 0 | crisis | `#FB7185` |
| 1 | sanctuary | `#A78BFA` |
| 2 | sanctuary | `#A78BFA` |
| 3 | bridge | `#00F0FF` |
| 4 | quantum | `#00F0FF` |
| 5 | quantum | `#00F0FF` |

---

## Typography

| Element | Font | Size | Weight | Notes |
|---------|------|------|--------|-------|
| Title | Inter | `text-2xl` (24px) | 700 | `#00F0FF` color |
| Screen label | Inter | `text-sm` (14px) | 600 | Panel names |
| Button text | Inter | `text-sm` (14px) | 600 | All buttons |
| Body | Inter | `text-sm` (14px) | 400 | Content text |

---

## Component Inventory

### Header
```
K4 Hero component (from @p31/ui)
App title: "Willow"
```

### Navigation Bar (Screen Switcher)
```
Layout: horizontal flex, gap between buttons
6 screens: Home, Voice, Draw, Magic, Feelings, Family
Each: button with label, active state highlighted
```

### Home Screen
```
Default view
Welcome message
Quick-access to other screens
```

### Voice Screen
```
Voice input component
Audio recording/playback
```

### Draw Screen
```
Drawing canvas
Color picker
Brush tools
```

### Magic Screen
```
Creative/generative tools
Surprise elements
```

### Feelings Screen
```
Mood tracker/emotional regulation
Emoji or visual mood selection
```

### Family Screen
```
Family connection tools
Co-parenting communication
```

### UIGWillowWrapper
```
Wraps UIG (Universal Interface Generator) components
Provides Willow-specific context to generated interfaces
```

### K4 Hero (Header)
```
Component: <K4Hero /> from @p31/ui
Size: smaller than landing surfaces (header-sized)
Position: top of page, above title
```

---

## Glass/Visual Language

- **Glass panels:** `backdrop-filter: blur(12px)`, `border-radius: 12px` (`rounded-xl`)
- **Panel backgrounds:** `rgba(255,255,255,0.04)` with glass border
- **Card style:** Glass panels with `border: 1px solid rgba(255,255,255,0.08)`
- **Less aggressive glass** than PHOS — simpler for children

---

## Motion

- **Imported:** `@p31/design-system/motion` (6-tier spoon-aware)
- **K4 Hero animations:** Spoon-aware CSS from `k4-hero.css`
- **Panel transitions:** Direct swap (no animated transitions)
- **Theme transitions:** `transition: background-color 0.8s ease` when spoon level changes
- **Reduced motion:** All animations respect `data-spoons` and `prefers-reduced-motion`

---

## Screens (6 panels)

| # | Screen | Purpose | Visual Notes |
|---|--------|---------|-------------|
| 1 | Home | Welcome, navigation | Default view, K4 Hero |
| 2 | Voice | Audio interaction | Microphone UI |
| 3 | Draw | Creative expression | Canvas, colors |
| 4 | Magic | Generative surprise | Creative tools |
| 5 | Feelings | Emotional regulation | Mood tracker |
| 6 | Family | Connection | Co-parenting tools |

---

## Interactive States

- **Screen button active:** accent color background, void text
- **Screen button inactive:** `rgba(255,255,255,0.06)` background
- **Hover:** slight brightness increase
- **Focus:** standard browser focus rings

---

## Accessibility

- **Skip link:** Present
- **Touch targets:** Large buttons for children
- **Keyboard:** Tab order logical
- **ARIA:** Panel switching announced
- **Reduced motion:** Fully spoon-aware
- **Crisis mode:** At spoons=0, minimal UI

---

## Hub Communication

Willow communicates with parent frames via `postMessage`:
- **Outbound:** `PRESENCE_PING` on load, screen changes
- **Inbound:** Spoon level sync, theme changes
- **Allowed origins:** `p31ca.org`, `phos.p31ca.org`, `willow.p31ca.org`

---

## Gemini Prompt Notes

- Willow is a **child companion app** — friendly, warm, simple
- The 6-screen panel system is the core navigation pattern
- K4 Hero is in the header (smaller than landing surfaces)
- Theme changes with spoon level — crisis (red), sanctuary (violet), quantum (cyan)
- PostMessage API enables embedding in PHOS or hub pages
- Keep the layout centered and focused — one activity at a time
- Drawing and voice are the primary creative tools
