# P31 Labs — Brand Identity

## Origin

P31 Labs builds open-source, neurodivergent-first assistive technology. We exist because the tools we need don't exist yet — and the ones that do weren't made for us.

The name "P31" comes from the tetrahedron: four vertices, six edges, four faces. A simplex in 3D space. The simplest possible volume. This geometry grounds everything we build — sovereign data structures, peer-to-peer care networks, post-quantum cryptography.

## Mission

Build the infrastructure for a neurodivergent-led care economy.

## Vision

Care that's sovereign, verifiable, and valued — where every interaction respects cognitive load and every contribution creates lasting equity.

## Values

- **Sovereignty** — You own your data, your identity, your attention.
- **Calm** — Technology should reduce cognitive load, not add to it.
- **Precision** — Every pixel, every interaction, every proof has intent.
- **Neuroinclusion** — Not accessibility as an afterthought, but as the starting point.

## Brand Personality

| Dimension | Expression |
|-----------|------------|
| **Archetype** | Sage + Magician — clarity and transformation through technical precision |
| **Tone** | Direct, calm, precise. No hype, no jargon. |
| **Voice** | Technical but warm. Expert but not exclusionary. |
| **Audience** | Neurodivergent individuals, developers, researchers, donors |
| **Energy** | Low-cognitive-load, high-trust |

## Visual Identity

### Logo System

The P31 logo is a system — not a single static asset.

**Primary mark:** The tetrahedron — four vertices in quantum-cyan, rendered as a glass-form volumetric wireframe. Simple. Self-similar. Unmistakable.

**Variants:**
- Full lockup: Tetrahedron icon + "P31" + property name
- Icon-only: Tetrahedron alone (favicon, app icon, social avatar)
- Text-only: "P31" in Inter Bold (tight tracking, no icon)

**Logo rules:**
- Never stretch, rotate 90°, or apply effects to the tetrahedron icon.
- Minimum clear space: the height of the "P" in "P31" on all sides.
- The tetrahedron must always be quantum-cyan on dark backgrounds. On light backgrounds, use void.

### Color Story

| Color | Name | Meaning | Usage |
|-------|------|---------|-------|
| `#00F0FF` | Quantum-cyan | Care, presence, coordination | Primary accent, primary CTAs |
| `#A78BFA` | Sovereign violet | Identity, dignity, sovereignty | Secondary actions, federated identity |
| `#FBBF24` | Trust gold | Earned reputation, spark | Donor elements, achievements |
| `#FB7185` | Rose | Alert, crisis, pause | Errors, crisis mode indicators |
| `#34D399` | Verdigris | Success, verification | Confirmed states, verified badges |
| `#818CF8` | Iris | Bridge, federation | Inter-app connections, link highlights |

**Never use pure white (#FFFFFF) for text or pure black (#000000) for backgrounds.** These create visual stress and are inaccessible to many users with light sensitivity.

### Typography Voice

| Typeface | Role | Personality |
|----------|------|-------------|
| **Inter** | UI, body, headings | Clear, legible, neutral — the voice of utility |
| **JetBrains Mono** | Code, data, metrics | Mechanical, precise — the voice of authority |

**Tone by typeface:**
- Inter at 400 weight = default. Calm, informative.
- Inter at 700 weight = emphasis. Reserved for headings and primary messaging.
- JetBrains Mono = data. Facts, numbers, code, timestamps.

### Motion Principles

1. **Motion is a privilege, not a default.** Every animation must have a purpose — communicate state change, guide attention, or provide feedback.
2. **Spoon-aware scaling.** Duration and complexity adapt to the user's cognitive load (0–5 spoons). At spoons 0–1, all motion is disabled.
3. **Reduce, don't add.** If a transition doesn't improve understanding, remove it.
4. **Consistent timing.** Use the P31 duration scale (instant 62.5ms → slower 1000ms) and easing curves (standard, decelerate, accelerate).

### Space & Rhythm

P31 uses a 4px base unit with a 1.333 perfect-fourth scale (following the tetrahedron's geometry). All spacing is a multiple of 4 or 8. Card padding is always 24px. This geometric consistency is itself a brand signal — nothing is arbitrary.

## Tone of Voice

### Writing Guidelines

| Do | Don't |
|----|-------|
| Use short sentences | Use jargon without explanation |
| Address the user directly ("you") | Use passive voice excessively |
| Explain technical terms once | Assume everyone knows the context |
| Offer progressive disclosure | Dump all information at once |
| Use clear error messages | Use error codes without human-readable text |

### Vocabulary

| Use | Avoid |
|-----|-------|
| "Sovereign" | "Decentralized" (buzzword) |
| "Care proof" | "Health record" (clinical) |
| "Spoon" | "Energy level" (ableist framing) |
| "Pilot" | "User" (transactional) |
| "Mesh" | "Network" (technical reduction) |

## Brand Applications

### Web Properties

| Property | Role | Brand Identity |
|----------|------|----------------|
| p31ca.org | Foundation, docs, blog | Default brand — dark, cyan-accented, glass |
| phosphorus31.org | Quantum research portal | Scientific — violet-accented, tetrahedron visualizations |
| phos.p31ca.org | AI companion chat | Utility — minimal chrome, high focus on content |
| growth.p31ca.org | Pilot growth dashboard | Data — JetBrains Mono heavy, chart-first layout |

### Social Presence

- **GitHub:** @p31labs — All open-source. All public. No tracking.
- **X / Mastodon:** @p31labs — Technical updates, release notes, research threads.
- **ko-fi:** Donation + supporter community with gold-accented branding.

## Brand Assets

| Asset | Format | Location |
|-------|--------|----------|
| Tetrahedron icon (SVG) | .svg | `@p31ca/ui/chrome/BrandMark` |
| Full lockup | .svg | Design system package |
| Favicon | .svg | `apps/p31ca/public/favicon.svg` |
| Social card | .png | `apps/p31ca/public/og-image.png` |

All brand assets are vector-based and resolution-independent. Prefer SVG over PNG.

## Brand as Code

P31's brand is not a PDF — it's a system of **executable constraints** that agents can read and enforce.

| Constraint | Enforced By | Source |
|------------|-------------|--------|
| Primary accent limit: 1 per screen | Agent prompt + lint rule | DESIGN.md, RULES.md |
| No pure white text | Lint rule | RULES.md |
| No pure black backgrounds | Lint rule | RULES.md |
| Spoon-aware motion required | Component check | RULES.md |
| Glass cards only for containers | Lint rule | RULES.md |
| Button variants restricted to 3 | Lint rule | RULES.md |
| 24px radius for cards | Token reference | manifest.json |
| 12px radius for interactive | Token reference | manifest.json |
| 48px min touch target | WCAG rule | RULES.md |

**Brand decision + code constraint = brand as code.**

## Agent Persona

When AI agents represent P31, they should adopt this persona:

- **Tone:** Direct, calm, precise. No hype, no jargon, no passive voice.
- **Decision-making:** Always check `data-spoons` before proposing motion or complexity.
- **Defaults:** Dark mode first. Glassmorphism for surfaces. One primary accent per screen.
- **Constraint adherence:** No hardcoded colors. No hardcoded spacing. No hardcoded shadows.
- **Error handling:** Clear, human-readable error messages. Never error codes without explanation.

## Spoon-Aware as Brand Differentiator

P31's brand is **spoon-aware** — not as a feature, but as a **philosophy**.

Most design systems talk about accessibility. P31 **embeds it in brand DNA**. Every component, every motion, every interaction is designed to respect cognitive load — not as an afterthought, but as the starting point.

When you interact with P31, you're not just using software. You're using a system that **adapts to your energy level** — that reduces motion when you're low on spoons, that scales complexity when you have capacity.

**This isn't just accessibility. It's sovereignty.**

## Voice as Constraints

| Constraint | Rule | Example |
|------------|------|---------|
| Sentence length | Max 20 words per sentence | "Calm tech respects your energy." |
| Active voice | Use active voice, not passive | "You own your data." |
| Direct address | Use "you" | "Here's how to set up your pilot." |
| No jargon | Explain technical terms once | "Spoons (cognitive capacity)..." |
| Progressive disclosure | Offer levels of detail | "Click to expand" |

## Design Invariants

These are **non-negotiable** — they must be true for every P31 property.

| Invariant | Enforced By | Check |
|-----------|-------------|-------|
| Spoon-aware motion scaling | Component + CSS | `data-spoons` check |
| Crisis mode (spoons=0) | Component | Breathing overlay only |
| One primary accent per screen | Lint rule | Count `quantum-cyan` uses |
| No pure white text | Lint rule | `color: #FFFFFF` disallowed |
| No pure black backgrounds | Lint rule | `background: #000000` disallowed |
| Glass cards for containers | Lint rule | `.glass-card` or `.glass-panel` required |
| 24px radius for cards | Token reference | `rounded.lg` |
| 12px radius for interactive | Token reference | `rounded.md` |
| 48px min touch target | WCAG | `min-height: 48px` |
| `prefers-reduced-motion` fallback | CSS | Hard fallback in all motion rules |
