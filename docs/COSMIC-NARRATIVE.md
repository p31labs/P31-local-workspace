# Cosmic / Archetypal Layer — Narrative Map

> ⚠️ This document maps archetypal concepts to the P31 codebase. The
> **verified** sources are peer-reviewed or Zenodo-published mathematics.
> The **interpretive** sources are preprints and essays — not established
> science. Every code file carries the `⚠️ HONEST LABEL` header.

## Verified Anchor (Peer-Reviewed / Zenodo)

| Concept | Source | P31 Implementation |
|---------|--------|-------------------|
| SIC-POVM d=2 | Tetrahedron Protocol (Zenodo, Feb 2026) | `packages/quantum-core/src/sicPovm.ts` |
| K₄ complete graph | Maxwell rigidity criterion | `k4-worker/src/engine/graph.ts`, re-exported as `@p31ca/quantum-core/k4` |
| Posner molecule Ca₉(PO₄)₆ | Fisher (2015), Adams et al. (2025 *Sci Rep*) | `packages/quantum-core/src/posner.ts` |
| Tetrahedral geometry preserves entanglement | Gassab et al. (2025 *Entropy*, Waterloo/Helsinki) | Confirms K₄ graph topology; referenced in docs |
| SIC-POVM overlap = 1/3 | Tetrahedron Protocol; Gassab et al. (2025) | Verified in `tests/unit/quantum/sicPovm.test.ts` |

## Interpretive Layer (Preprints / Essays)

| Concept | Source | P31 Mapping | Status |
|---------|--------|------------|--------|
| Homo Constellatus | Preprints.org (July 2025) | `packages/quantum-core/src/cosmic.ts` → `homoConstellatusProfile()` | ⚠️ Narrative only |
| 12 houses → neurobehavioral | Vedic / archetypal research synthesis | `packages/quantum-core/src/cosmic.ts` → `HOUSE_NEURO_MAP` | ⚠️ Interpretive model |
| Diamond Light Body | Jan 2026 paper, carbon → octahedral coherence | Extended Posner model (planned) | ⚠️ Not yet implemented |
| Tetrahedral Hyperdimensional Algebra | MacDonald (Apr 2025) | `packages/quantum-core/src/morphogeneticField.ts` | ⚠️ Speculative, labeled |
| Vedic Observer Effect | 2024 preprint | Referenced in research synthesis only | ⚠️ Not in code |
| Morphogenetic field = recursive Clifford-phase | MacDonald (2025) | `computeMorphogeneticField()` | ⚠️ Speculative |

## Design System Mapping

| Cosmological Concept | Design Token | CSS Variable | File |
|---------------------|-------------|--------------|------|
| Tetrahedron (V=4, E=6) | Layout grid | `--p31-tetra-vertices`, `--p31-tetra-edges` | `quantum.css` |
| SIC-POVM overlap 1/3 | Spacing ratio | `--p31-sic-overlap` | `quantum.css` |
| 4 vertices | Color palette | `--p31-quantum-cyan/violet/gold/green` | `quantum.css` |
| 6 edges | Relationship colors | `--p31-edge-12` through `--p31-edge-34` | `quantum.css` |
| 1.333 progression | Typography scale | `--p31-font-scale` | `quantum.css` |
| 863 Hz | Animation pulse | `.resonance-pulse` keyframes | `quantum.css` |

## Site Architecture (p31ca.org)

| Vertex | Route | Color | Content |
|--------|-------|-------|---------|
| V₁ · |ψ₁⟩ | `/quantum/` | Cyan | SIC-POVM, K₄, Posner |
| V₂ · |ψ₂⟩ | `/care/` | Violet | LOVE Ledger, Care Mesh |
| V₃ · |ψ₃⟩ | `/passport/` | Gold | Cognitive Passport, DID |
| V₄ · |ψ₄⟩ | `/mesh/` | Green | Workers, Federation |

**Navigation**: K₄ complete graph (6 edges linking all 4 vertices). See `AppShell.astro` tetra-nav.

## Honest Labeling Protocol

Every file in the cosmic/archetypal layer carries:

```
⚠️ HONEST LABEL: This implements a computational model inspired by contested
hypotheses. The underlying science is NOT established physics or accepted
medical science. This code is an architectural metaphor made literal.
```

The verified math (SIC-POVM, K₄, Posner) and the cosmic/archetypal narrative
share the same codebase but are **clearly separated by labeling**. Tests assert
only the math; narrative lives in comments and this document.

## Cross-References

- `QUANTUM-FORTUNE-1.md` — QF-1 implementation details
- `QF1_CONTESTED_SCIENCE.md` — Full contested-science position
- `packages/quantum-core/src/morphogeneticField.ts` — Speculative field model
- `packages/quantum-core/src/cosmic.ts` — Blended house map + archetype profiles
- `tests/unit/quantum/morphogeneticField.test.ts` — Math-only assertions
