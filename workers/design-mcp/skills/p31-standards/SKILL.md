---
name: p31-standards
description: Enforces P31 design system standards. Use when writing, reviewing, or fixing any UI code in a P31 surface — catching token drift, hardcoded hex, media queries, unstyled tags, and contract violations before merge or deploy.
audit:
  trigger: "Use when reviewing changes to src/**/*.tsx, src/**/*.css, src/**/*.astro, or any file that renders P31 UI."
  patterns:
    - pattern: "#[0-9a-fA-F]{3,8}\\b"
      severity: MUST
      rule: no-hardcoded-hex
      message: "Hardcoded hex color. Use a var(--p31-*) token."
    - pattern: "@media\\s"
      severity: SHOULD
      rule: no-media-queries
      message: "Fixed @media breakpoint. Use container queries or fluid clamp()."
    - pattern: "rgba?\\([^)]*\\)"
      severity: MUST
      rule: no-rgba-literals
      message: "Raw rgba()/rgb() literal. Use a color token with alpha variant."
    - pattern: "style=\\{\\{"
      severity: MUST
      rule: no-inline-styles
      message: "Inline style object. Declare tokens/classes instead."
    - pattern: "<[a-z]+(?![a-z/])\\s"
      severity: WARN
      rule: no-unstyled-tags
      message: "Bare HTML tag in P31 surface. Use design-core primitives/compositions."
---

# P31 Standards

These are NON-NEGOTIABLE. Violations are deploy blockers (MUST) or CI-fixable drift (SHOULD).

## Rule 1 — No hardcoded color values

All colors MUST use `var(--p31-*)` tokens. Zero hardcoded hex in production code (AGENTS.md design gate).

WRONG:
```css
.button {
  background-color: #FF0000;
}
```
WRONG (rgba literal):
```tsx
<Box style={{ background: "rgba(255, 0, 0, 0.5)" }} />
```
CORRECT:
```css
.button {
  background-color: var(--p31-color-primary);
}
```
CORRECT (token with alpha variant where supported):
```tsx
<Box backgroundColor="var(--p31-color-primary-soft)" />
```
WHY: OKLCH token values are perceptually uniform and themeable across the 30 variants. Hardcoded hex breaks the 5 worlds × 3 ages × 2 sensory system and is invisible to theme switching.

AUDIT: `grep -Er "#[0-9a-fA-F]{3,8}" src --include="*.tsx" --include="*.css"` — same gate as AGENTS.md.

## Rule 2 — No fixed media queries

Use container queries or fluid `clamp()` sizing. Do NOT use `@media (max-width: ...)` fixed breakpoints.

WRONG:
```css
@media (max-width: 768px) {
  .card { padding: 8px; }
}
```
CORRECT (container query):
```css
.card {
  container-type: inline-size;
}
@container (max-width: 300px) {
  .card { padding: 0.5rem; }
}
```
CORRECT (fluid sizing):
```css
.card {
  padding: clamp(0.5rem, 2vw, 1rem);
}
```
WHY: P31 uses the K4/tetrahedral layout topology — 4-ary branching max, no deep nesting. Fixed breakpoints encode a device taxonomy that the system deliberately does not have.

AUDIT: grep for `@media ` in src files. Severity SHOULD because auto-fix is possible via propose_from_spec.

## Rule 3 — No inline styles

Inline `style={{ }}` objects bypass the token system and are invisible to CI. MUST unless the file is a canvas/three.js internal (AGENTS.md carve-out).

WRONG:
```tsx
<Box style={{ padding: "16px", color: "#333" }} />
```
CORRECT:
```tsx
<Box className="p31-pad-md p31-text-body" />
```
AUDIT: grep for `style={{` in src. Canvas/Three.js internals may justify a documented exception.

## Rule 4 — No bare unstyled HTML tags

UI surfaces use design-core primitives and compositions (ChatShell, SectionStrip, CommandPalette, Chameleon, PageHeader) — never reimplement chrome.

WRONG:
```tsx
<div className="chat-header">...</div>
```
CORRECT:
```tsx
<ChatShell>
  <ChatShell.Header>...</ChatShell.Header>
</ChatShell>
```
WHY: Chat surfaces MUST use ChatShell from `@p31/design-core/compositions`. Do not reimplement (AGENTS.md Chat Surfaces contract).

## Rule 5 — Spoon cost declared

Every interactive deliverable declares its cognitive cost. 1 approach: read headline; 2: read+respond; 3: complex choice; 5+: requires break.

WRONG (ambiguous, no spoon signal):
```tsx
<Button onClick={handle}>Continue</Button>
```
CORRECT:
```tsx
<Button data-spoons="2" onClick={handle}>Continue</Button>
```
WHY: Explicit spoon costs let neurodivergent users budget energy. Ambiguity is the failure.

## Rule 6 — Motion timing at 863 Hz rhythm

Animations follow the P31 rhythm (863 Hz as numerical signature: ~50ms/60fps=43 frames or 33ms/30fps=29 frames scale). Respect `prefers-reduced-motion`; default to static.

WRONG:
```css
.anim { transition: all 1s ease-in-out; }
```
CORRECT:
```css
.anim { transition: var(--p31-motion-fast); }
@media (prefers-reduced-motion: reduce) { .anim { transition: none; } }
```
WHY: Non-rhythmic animation triggers vestibular/anxiety response in neurodivergent users. The 863 Hz number is P31's numerical signature (Larmor frequency of ³¹P at Earth's field) — consistent, predictable, spoon-aware.

## Rule 7 — Accessibility baseline

WCAG 2.2 AA minimum. 48px touch targets on coarse pointer. Keyboard nav for all controls. Contrast ≥4.5:1 (normal), ≥3:1 (large). 2px accent focus outline with 2px offset.

WRONG:
```tsx
<button onClick={go} className="tiny-link">Send</button>
```
CORRECT:
```tsx
<button onClick={go} className="p31-btn-touch" aria-label="Send message">Send</button>
```
WHY: Accessibility first is the P31 constitution, not a checkbox. v:gate enforces it.

## Rule 8 — Contract compliance

Any component used in a P31 surface MUST satisfy `validate_contract()` before merge. Contracts come from design-core's `componentDefs.ts` and `contracts.ts`.

WRONG: inventing a conflicting prop:
```tsx
<Card elevation={9} glow="green" />
```
CORRECT: use defined semantic parts:
```tsx
<Card>
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>
```
WHY: The contract catalog is the closed surface. If a real gap exists, report the gap — do not fake around it (100/100 vs 69/100 adherence finding).

## Rule 9 — Transient state is derived, never persisted

Persist only the source of truth. Derive things like `isUnread` (thread.updatedAt > lastViewedAt). Do NOT persist booleans that go stale on refresh.

WRONG:
```tsx
useEffect(() => { localStorage.setItem("isUnread", "true") }, [])
```
CORRECT:
```tsx
const isUnread = thread.updatedAt > thread.lastViewedAt
```
WHY: Go stale on refresh and require manual clearing (AGENTS.md Chat Surfaces).

---

# FAILURE MODE (what agents get wrong)

Agents DO NOT report drift. In one 60-run eval, 0 of 60 runs self-reported a problem — yet 73% of style decisions bypassed tokens. **Self-reporting is worthless as a signal. The CI must be the detection layer.** When you see a P31 surface change, run the audit patterns before you say "done".