# Performance Audit — Spaceship Earth Dome Renderer

## A. Draw Call Analysis

### OuterDome.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| 120 individual `<mesh>` port elements | **Critical** | 120 draw calls for 120 port tetrahedra. Should be `InstancedMesh` (1 draw call). Each element also creates inline `new THREE.Vector3`, `new THREE.Quaternion` objects every render pass — GC pressure. |
| 6 individual `<mesh>` tetra frame cylinders | **High** | 6 extra draw calls for the K4 tensegrity frame. Should be batched into a single `InstancedMesh` via `InstancedEdges`. |
| Inline `new THREE.Vector3()` / `new THREE.Quaternion()` in JSX | **Medium** | Allocated every render cycle inside `.map()` callbacks. Creates GC pressure at 60fps. |
| `new THREE.IcosahedronGeometry()` inside `generatePortPositions()` | **Low** | Created once and memoized, but the function is not shared with `shipStore` which duplicates the same computation at module load. |

### TetraCraft.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| 6 individual `<mesh>` edge cylinders | **High** | 6 draw calls for tetra edges. Should use `InstancedMesh`. |
| 4 individual `<mesh>` vertex spheres | **Medium** | 4 draw calls for tetra vertices. Should use `InstancedMesh`. |
| Inline `new THREE.Vector3()` / `new THREE.Quaternion()` in JSX | **Medium** | Allocated every render in `.map()` callbacks. |

### InnerDome.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| Wireframe geometry + 4 stat nodes | **Low** | 5 draw calls. Not currently in render tree (replaced by GraphShell/GraphNodes/GraphEdges in Lens.tsx). Acceptable. |

### Nodes.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| Already uses `InstancedMesh` (3 instances) | ✅ Good | core/glow/halo all batched. Animation loop updates all in one pass. |

### Edges.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| `new THREE.Vector3()` allocated in `useMemo` | **Low** | Creates Vector3 inside `useMemo` during curve generation. Acceptable for non-animated edges. |
| `mid.clone().normalize()` per edge segment | **Low** | Creates temp vectors during geometry construction. Runs once in `useMemo`. |

### NeoPixelFrame.tsx

| Issue | Severity | Details |
|-------|----------|---------|
| 9600 instances in 1 draw call | ✅ Good | Optimal instancing with custom ShaderMaterial. |
| Hardcoded `9600.0` in shader | **Low** | Fragment shader divides by 9600.0 for normalized instance index. Must match actual instance count. |

## B. Summary

**Total non-instanced draw calls (OuterDome + TetraCraft):** 130+  
**After optimization target:** ≤ 10 (1 per InstancedMesh + 1 for glass shell + effects)

Key fixes:
1. `OuterDome` ports → single `InstancedMesh` (saves 119 draw calls)
2. `OuterDome` tetra frame → `InstancedEdges` (saves 5 draw calls)
3. `TetraCraft` edges → `InstancedMesh` (saves 5 draw calls)
4. `TetraCraft` vertices → `InstancedMesh` (saves 3 draw calls)
5. Inline object creation → pre-allocated `useMemo` refs

## C. Mobile Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FPS (desktop) | 60 | High quality, full 9600 NeoPixels |
| FPS (mobile) | ≥ 30 | Adaptive LOD reduces to 4800 segments |
| NeoPixel segments (mobile/low-perf) | 4800 → 2400 | Halved per LOD tier |
| Port meshes | Always instanced | 1 draw call regardless of count |
| Touch events | OrbitControls handles pinch-zoom/pan | `CameraRig` passes through `OrbitControls` |
| CSS touch guards | `touch-action: none` on canvas | Prevents browser gestures from fighting WebGL |
