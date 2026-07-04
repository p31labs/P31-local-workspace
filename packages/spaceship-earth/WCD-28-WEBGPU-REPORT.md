# WCD-28: WebGPU Migration Path — Research Report

**Three.js version**: 0.159.0
**Branch**: feat/wcd-28-webgpu
**Prototype**: `src/components/rooms/sovereign/ImmersiveCockpitWebGPU.tsx`
**Date**: 2026-03-19

---

## Executive Summary

WebGPU is partially viable in Three.js 0.159.0 but **not production-ready** for this project due to one blocking dependency: `UnrealBloomPass` (the bloom pipeline) is EffectComposer/WebGL-only and has no WebGPU equivalent in this version. Everything else — renderer, node materials, and compute shaders — works.

**Recommendation**: Maintain the current WebGL production path. Revisit when upgrading to Three.js ≥ 0.165.0 where `PostProcessing` + `BloomNode` are available.

---

## API Inventory (Three.js 0.159.0)

### Available

| API | Path | Status |
|-----|------|--------|
| `WebGPURenderer` | `three/examples/jsm/renderers/webgpu/WebGPURenderer.js` | Working. Auto-falls-back to `WebGLBackend` with `console.warn`. |
| `ComputeNode` | `three/examples/jsm/nodes/gpgpu/ComputeNode.js` | Working. Dispatches WGSL compute shader on WebGPU, GLSL on fallback. |
| `StorageBufferNode` | `three/examples/jsm/nodes/accessors/StorageBufferNode.js` | Working. GPU-resident buffer, no CPU readback needed. |
| `PointsNodeMaterial` | `three/examples/jsm/nodes/materials/PointsNodeMaterial.js` | Working. `positionNode` replaces attribute entirely. |
| `MeshStandardNodeMaterial` | `three/examples/jsm/nodes/materials/MeshStandardNodeMaterial.js` | Working. |
| `MeshBasicNodeMaterial` | same | Working. |
| `WGSLNodeBuilder` | `three/examples/jsm/renderers/webgpu/nodes/WGSLNodeBuilder.js` | Working (used internally). |
| TSL (Three.js Shader Language) | `ShaderNode.js` — `tslFn`, `uniform`, `storage`, `instanceIndex`, etc. | Working. Compiles to WGSL on WebGPU, GLSL on WebGL2. |

### Blocked / Missing

| API | Status |
|-----|--------|
| `PostProcessing` | **Not present** in 0.159.0. Added in ~0.165.0. |
| `BloomNode` | **Not present** in 0.159.0. |
| `UnrealBloomPass` | Present but **WebGL EffectComposer only** — cannot be used with `WebGPURenderer`. |
| `renderAsync()` | Required instead of `renderer.render()` — minor API change. |

---

## Prototype Results

**File**: `ImmersiveCockpitWebGPU.tsx`

### What the prototype demonstrates

1. **WebGPURenderer initialization** with zero-code WebGL2 fallback (same component works on devices without WebGPU).
2. **GPU compute particle system** (2000 particles):
   - `StorageBufferNode` holds position + velocity on GPU.
   - `ComputeNode` (TSL `tslFn`) runs spring-towards-target update entirely on GPU.
   - `PointsNodeMaterial.positionNode` reads from storage buffer — no vertex attribute upload.
   - CPU cost: 2 uniform writes per frame (`uTime`, `uEntropy`). Zero buffer readback.
3. **Jitterbug line skeleton** renders identically under both backends (CPU morph → `BufferAttribute.needsUpdate`).
4. **Async render loop**: `await renderer.renderAsync(scene, camera)` — required for WebGPU, gracefully handled by WebGL2 fallback.

### What is missing vs production `ImmersiveCockpit.tsx`

| Feature | Production | WebGPU prototype |
|---------|-----------|-----------------|
| Bloom post-processing | UnrealBloomPass (1.0 intensity) | **None** — no WebGPU bloom available |
| IVM Lattice (13³ InstancedMesh) | Full | Not included (out of prototype scope) |
| Tri-state camera (Free/Dome/Screen) | Full | OrbitControls only |
| Pinch-to-zoom, haptic | Full (SE WCD-27) | Not included |
| Skin theme / accent color | Full | `uEntropy` only |
| perf monitor (`setGpuMs`) | Integrated | Not integrated |

---

## Performance Comparison Methodology

Because there is no production WebGPU device available for automated benchmarking, the following procedure is specified for manual QA when upgrading Three.js:

### Baseline capture (WebGL — current production)
1. Load `?renderer=webgl` on target device (Android Chrome, Pixel 7a or Galaxy Tab A9+).
2. Open Chrome DevTools → Performance → record 10 seconds of `animate` loop.
3. Note **GPU frame time** (Frames panel) and **JS self time** for `animate`.
4. Open `chrome://tracing` → record with `disabled-by-default-gpu.service` category for GPU timeline.

### WebGPU capture
1. Load `?renderer=webgpu` — component auto-selects `ImmersiveCockpitWebGPU`.
2. Repeat identical profiling steps.
3. Compare GPU frame time and compute shader dispatch time.

### Expected deltas (literature basis)
| Workload | Expected improvement |
|----------|---------------------|
| 2000-particle compute | 30–50% GPU frame time reduction |
| Draw calls (no change) | 0% — InstancedMesh is identical |
| Bloom (unavailable) | Regression until `BloomNode` available |

---

## Migration Blockers

### Blocker 1 — UnrealBloomPass incompatibility (CRITICAL)

**Current state**: `ImmersiveCockpit.tsx` uses `EffectComposer` → `UnrealBloomPass` for Jitterbug + IVM glow. This pipeline is hard-coupled to `THREE.WebGLRenderer`'s `getRenderTarget()` API. Passing a `WebGPURenderer` causes a runtime exception.

**Fix path**: Upgrade to Three.js ≥ 0.165.0 where `three/examples/jsm/renderers/common/PostProcessing.js` and `three/addons/postprocessing/BloomNode.js` are available. Migration is:
```typescript
// 0.165.0+ pattern:
import PostProcessing from 'three/examples/jsm/renderers/common/PostProcessing.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
postProcessing.outputNode = bloom(scenePass, 1.0, 0.35, 0.9);
// In animate: await postProcessing.renderAsync();
```

### Blocker 2 — ShaderMaterial incompatibility

**Current state**: GPU particle system uses `THREE.ShaderMaterial` with raw GLSL vertex/fragment shaders. `WebGPURenderer` does not support `ShaderMaterial` — it requires `ShaderNodeMaterial` or node-based materials.

**Status**: Already resolved in the prototype — `PointsNodeMaterial` + TSL replaces `ShaderMaterial`. Production refactor is a 1:1 replacement with no visual change.

### Blocker 3 — MeshDistortMaterial (non-critical)

**Current state**: `BondingRoom.tsx` uses `MeshDistortMaterial` from `@react-three/drei`. This is R3F-only and outside the ImmersiveCockpit scope.

**Impact**: Zero — BondingRoom is a separate R3F canvas. No migration needed.

### Blocker 4 — renderer.render() → renderAsync() (trivial)

The RAF loop must change from:
```typescript
renderer.render(scene, camera);
```
to:
```typescript
await renderer.renderAsync(scene, camera);
// animate() must be declared async
```
The `WebGPURenderer` wraps `WebGL2Backend` with the same async API — both code paths are identical after this change.

---

## Migration Roadmap

| Phase | Three.js | Effort | Blocker removed |
|-------|----------|--------|-----------------|
| **Now** (0.159.0) | Current | Prototype only | — |
| **Phase 1** | 0.165.0+ | Medium | Bloom: `BloomNode` available. Land `ImmersiveCockpitWebGPU` as production fallback behind `?renderer=webgpu` flag. |
| **Phase 2** | 0.168.0+ | Low | Verify `StorageInstancedBufferAttribute` for IVM Lattice compute — removes last CPU→GPU buffer for InstancedMesh. |
| **Phase 3** | Stable | Low | Remove WebGL fallback path and WebGL-only imports. Full WebGPU production build. |

### Version upgrade notes

Three.js patch upgrades within 0.15x are generally safe (no breaking API changes in node materials). The jump from 0.159.0 → 0.165.0 requires:
- Updating `three` in `package.json`
- Re-testing `EffectComposer`/`UnrealBloomPass` imports (they may be removed or moved)
- Verifying `OrbitControls` path (stable at `three/examples/jsm/controls/OrbitControls.js`)
- Running `tsc --noEmit` — expect 0 new errors with this prototype's `@ts-ignore` guards

---

## Conclusion

The WebGPU compute particle system is working and the API surface is sufficient for a future production migration. The single blocking item — bloom post-processing — is a known gap in Three.js 0.159.0 that will be resolved in a minor version upgrade.

**Action items for future sprint**:
- [ ] Upgrade Three.js to 0.165.0+ and verify `BloomNode` availability
- [ ] Replace `UnrealBloomPass` with `PostProcessing` + `bloom()` in `ImmersiveCockpit.tsx`
- [ ] Land `ImmersiveCockpitWebGPU.tsx` as production component behind `isWebGPUAvailable()` flag
- [ ] Run manual perf benchmark per methodology above on target Android device
- [ ] Remove `@ts-ignore` guards once Three.js publishes TS declarations for WebGPU paths
