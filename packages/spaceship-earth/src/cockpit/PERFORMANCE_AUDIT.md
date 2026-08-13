# Performance Audit — Spaceship Earth Dome Renderer

**Last audited:** 2026-08-11 — reflects current HEAD (320 ports, all instanced).

## A. Draw Call Analysis

### OuterDome.tsx

| Component | Status | Details |
|-----------|--------|---------|
| 320 port tetrahedra | ✅ **Fixed** | Single `InstancedMesh` (`portsRef`) — 1 draw call, no per-port geometry. `DOME_FACE_CENTROIDS` (detail=2 geodesic → 320 faces) feeds `generatePortPositions()`. |
| 6 tetra-frame cylinders | ✅ **Fixed** | Single `InstancedMesh` (`tetraRef`) from `regularTetra()` — 1 draw call. |
| Inline `new THREE.Vector3/Quaternion` | ✅ **Fixed** | Positions precomputed once via `useMemo`; render loop uses module-scope scratch objects. |
| Geometry sharing with shipStore | ✅ | `math/geodesic.ts` is the single shared source for vertices/edges/faces; no duplicated generation. |

### TetraCraft.tsx

| Component | Status | Details |
|-----------|--------|---------|
| 6 edge cylinders | ✅ **Fixed** | `InstancedMesh` (`edgesRef`) — 1 draw call. |
| 4 vertex spheres | ✅ **Fixed** | `InstancedMesh` (`vertsRef`) — 1 draw call. |
| Inline allocations | ✅ | Pre-allocated refs; zero per-frame GC. |

### InnerDome.tsx

| Component | Status | Details |
|-----------|--------|---------|
| Wireframe + stat nodes | ✅ | 5 draw calls, not in render tree (superseded by GraphShell/GraphNodes/GraphEdges in Lens.tsx). |

### GraphNodes.tsx

| Component | Status | Details |
|-----------|--------|---------|
| core/glow/halo nodes | ✅ Good | 3 batched `InstancedMesh`; animation updates all instances in one pass. |

### GraphEdges.tsx

| Component | Status | Details |
|-----------|--------|---------|
| Curve geometry | ✅ | Built once in `useMemo`; static edges, no per-frame allocation. |

### NeoPixelFrame.tsx

| Component | Status | Details |
|-----------|--------|---------|
| 9600 segments | ✅ Good | 1 draw call, custom ShaderMaterial instancing. |
| Shader constant | ✅ | Instance count passed as uniform (shader no longer hardcodes `9600.0`). |

## B. Summary

**Current total draw calls:** ~7 (1 OuterDome ports + 1 tetra frame + 1 TetraCraft edges
+ 1 verts + 3 graph node layers) + glass shell + NeoPixelFrame = well under target.

Previously flagged issues (120 ports, TetraCraft edges/verts, inline allocations) are
**all resolved** — see git history for the instancing pass.

## C. Mobile Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FPS (desktop) | 60 | High quality, full 9600 NeoPixels |
| FPS (mobile) | ≥ 30 | Adaptive LOD reduces to 4800 segments |
| NeoPixel segments (mobile/low-perf) | 4800 → 2400 | Halved per LOD tier |
| Port meshes | Always instanced | 1 draw call regardless of count (320) |
| Touch events | OrbitControls handles pinch-zoom/pan | `CameraRig` passes through `OrbitControls` |
| CSS touch guards | `touch-action: none` on canvas | Prevents browser gestures from fighting WebGL |
