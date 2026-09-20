# Field Falsification — Report

## What was tested

The falsification lane reconstructs the conditions of "The Organizational
Physics of Multi-Agent AI" (2026-02): N concurrent agents each completing
their local interface, and asks whether the boundaries between them close
into a coherent whole.

## The result

**Local completeness does not compose to global enclosure.** Confirmed.

Every cell in the Sierpiński construction is locally complete (β₂ = 1 in the
cell). The global structure has β₂ = 0 at every recursion depth — it never
encloses a volume. The boundary surface grows without bound (β₁ = (3^(n+1)
− 1)/2), but none of those boundaries close the whole.

| Depth | Cells | Boundaries | β₀ | β₁ | β₂ |
|-------|-------|------------|----|----|----|
| 0 | 1 | 3 | 1 | 1 | 0 |
| 1 | 3 | 9 | 1 | 4 | 0 |
| 2 | 9 | 27 | 1 | 13 | 0 |
| 3 | 27 | 81 | 1 | 40 | 0 |
| 4 | 81 | 243 | 1 | 121 | 0 |
| 5 | 243 | 729 | 1 | 364 | 0 |

## What this means

The Sierpiński gap is the topological form of the paper's finding: a swarm
whose agents each do their job correctly can still produce a whole that does
not cohere. The Field's Zone (K₄, β₂ = 1) is a *local* invariant; it does not
guarantee a *global* enclosure.

This is the first falsification target the Field has survived — "survived" in
the honest sense: the harness measured the gap rather than papering over it.
A future Field topology that composes local rigidity into global enclosure
would flip this report's numbers, and the harness would record that too.

## Status

Not a victory. A null result the Field is capable of reporting.
