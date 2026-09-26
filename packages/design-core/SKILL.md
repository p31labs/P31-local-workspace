---
name: p31-design-core
description: P31 design system — tokens, components, and the governance vocabulary. Generates P31-compliant UI with verified tokens. Every token name and component name must be looked up — never invented.
---

# P31 Design System — Agent Skill

Generate UI that matches the P31 design system. **Source contract:** every token
name, component name, and value must be looked up in the canonical sources
below. Anything not published here is a design decision, stated explicitly —
never quietly passed off as spec.

## Canonical sources (look these up; do not memorize)

- **Tokens (DTCG):** `packages/canon/tokens/tokens.dtc.json` — 448+ leaf
  tokens, W3C DTCG `$value`/`$type`, Style-Dictionary-validated.
- **Runtime CSS vars:** `packages/canon/dist/tokens.css` — `:root` carries the
  base palette + 10 `[data-theme]` blocks; every var is `--p31-*`.
- **Component definitions:** `packages/design-core/src/componentDefs.ts` —
  canonical props, tokens, accessibility, and aiGuidance for every component.
- **Theme store:** `packages/canon/src/theming/theme-store.ts` — the single
  source of truth (`THEMES` + `BASE`); the DTCG and CSS are derived from it.
- **Motion:** `packages/design-core/src/math/motion.ts` — M3 Expressive springs
  (`SPRINGS`, `spoonSpring`), durations, `SHAPE_MORPH`, `ELEVATION`.
- **Governance components:** `packages/design-core/src/governance/` (also
  `@p31/governance`) — ChainTimeline, VerifyButton, EnforcementGauge,
  RefusalFeed, ProposalQueue, SovereignBadge, LumiIdentityCard.

## Token rules (non-negotiable)

1. **Zero hardcoded hex in production code.** All colors via `var(--p31-*)`.
2. **Color space:** OKLCH for new tokens; hex fallbacks only for legacy.
3. **Themes × ages:** 5 themes × 3 age tiers + muted/warmLight sensory modes
   (the `data-theme`/`data-age`/`data-saturation` cascade).
4. **Spoon-aware:** low spoons → standard motion + calm; high spoons → M3
   Expressive springs. Use `spoonSpring(spoons, kind)` from `math/motion.ts`.
5. **Tonal elevation, not shadows:** depth via `ELEVATION` surface-tint opacity
   (levels 1–3), never drop shadows.
6. **Emphasized type:** use `type.emphasized.*` for display/headline emphasis
   (weight 600–700, tighter tracking) — not arbitrary weights.

## Component rules

- Use `componentDefs.ts` for props and `aiGuidance.useWhen/avoidWhen`.
- Accessibility: WCAG 2.2 AA minimum, 48px touch targets, `:focus-visible`,
  `prefers-reduced-motion` respected.
- Chat surfaces: use `ChatShell` from `@p31/design-core/compositions`; never
  reimplement the shell.
- Governance surfaces (chain, identity, refusals, enforcement): use the
  `@p31/governance` components — they render the audit layer with the correct
  tokens.

## Generation checklist

- [ ] Every token name resolved from `tokens.dtc.json` or `tokens.css`
- [ ] Zero standalone hex in emitted CSS-in-JS or classes
- [ ] Theme/age/sensory variants handled via the `data-*` cascade, not inline
- [ ] Spoon-aware motion via `spoonSpring`
- [ ] Accessibility: touch ≥48px, focus visible, reduced-motion, aria labels
- [ ] Governance data rendered via `@p31/governance` components

## The P31 differentiator

The design system ships the **governance vocabulary**: a hash-chained audit
trail, PQC capability tokens (ML-DSA-65), and co-presence enforcement
("Lumi proposes, the human decides"). When a UI must show agent activity,
verification, refusals, or agent identity, use the governance components —
that is what separates P31 from generic agent dashboards.