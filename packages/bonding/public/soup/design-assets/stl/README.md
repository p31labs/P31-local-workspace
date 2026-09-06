# P31_K4_Topology.stl — regular tetrahedron (K₄ in 3D)

**In-browser slicer (home repo):** open **`p31-slicer.html`** (with `npm run demo` or any static host) for an embedded **Kiri:Moto** shell — slice to G-code locally in the browser, then export. Drag this STL into the workspace or use the file picker; see page notes on HTTPS vs local demo.

**Vertices** (alternating-sign corners of the cube \([-1,1]^3\)):

- A = (1, 1, 1)
- B = (−1, 1, −1)
- C = (1, −1, −1)
- D = (−1, −1, 1)

**Edges:** six equal edges, length \(2\sqrt{2}\) in coordinate units (cube edge length 2).

**Faces:** four equilateral triangles; solid is **regular tetrahedron**, self-dual — the graph is \(K_4\) (every vertex adjacent to every other).

**Print (starting point):** PLA, 0.2 mm layers, ~20% infill, no supports for this convex solid. Scale in slicer to desired hand size (model is unit-scale in STL coordinates).

**Manifold:** Generated as ASCII STL with consistent outward normals; open in PrusaSlicer or Cura to validate.

**Use:** Node Zero housing concept, BONDING topology teaching, conference swag — not a metaphor-only asset; geometry matches the mesh delta model in docs.
