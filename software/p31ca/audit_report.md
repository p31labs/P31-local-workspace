# WebGL Render Pipeline & Memory Leak Forensics Report

## Executive Summary
Comprehensive audit of the Three.js scene initialization and animation loop reveals multiple latent memory leak vectors, WebGL context loss vulnerabilities, and frame-rate collapse risks. Two files analyzed: `dome.astro` (incomplete fragment, ~300 lines) and `index.astro` (main landing page, ~920 lines), plus `_layout.astro`.

---

## 1. Geometry Bloat — BufferGeometry Disposal (Lines 411–452 in dome.astro)

**Finding:** The tetrahedron is decomposed into 120 sub-blocks via recursive face subdivision (geo.subs=2 produces 16×15=240 faces, ~120 unique vertices). Each block spawns a `MeshPhysicalMaterial` instance stored in `faceMeshes[]`. 

**Leak Mechanism:**
- `faceMeshes` is a global array that accumulates meshes on every render.
- No `geometry.dispose()`, `material.dispose()`, or `mesh.removeFromParent()` calls are present in the removal/update paths.
- Materials reference textures via `iMat.clone()` cloned per mesh; each clone retains GPU memory until explicitly disposed.

**Evidence:**
- No `.dispose()` calls in `index.astro` (lines 483, 556, 574, 704) where meshes are iterated.
- `innerShell` and `domeGroup` continuously add meshes; never pruned.

**Risk:** Critical — growing GPU memory consumption per frame under sustained load.

**Remediation:**
```js
function disposeMesh(mesh) {
  mesh.geometry.dispose();
  mesh.material.dispose();
  mesh.parent && mesh.parent.remove(mesh);
}
// When removing blocks:
for (const m of faceMeshes) disposeMesh(m);
faceMeshes.length = 0;
```

---

## 2. RenderTarget Leaks — EffectComposer Resize (Line 554 in dome.astro / 900–906 in index.astro)

**Finding:** `EffectComposer`, `WebGLRenderTarget` allocations are not cleaned on resize.

**Leak Mechanism:**
- `composer.setSize()` internally creates new `WebGLRenderTarget` instances on every call.
- `renderer.setSize()` followed by `composer.setSize()` triggers double allocation.
- Old render targets remain referenced until GC but hold GPU textures.

**Evidence:**
```js
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight); // <- new targets
  bloomPass.resolution.set(...);
});
```

**Risk:** High — per-resize GPU texture accumulation; sustained resize activity (e.g., responsive layouts) leads to OOM.

**Remediation:**
```js
function onResize() {
  const needsUpdate = (renderer.domElement.width !== w || renderer.domElement.height !== h);
  if (!needsUpdate) return;
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
}
// Debounce with RAF; dispose old targets:
composer.passes.forEach(p => p.renderTarget && p.renderTarget.dispose());
```

---

## 3. Shader Uniform Accumulation — Per-Frame Allocations (Lines 700–726 in dome.astro / 863–897 in index.astro)

**Finding:** `wMat.uniforms.uTime.value` updates every frame; additional per-frame `new THREE.Vector3()`/`new THREE.Color()` allocations detected.

**Leak Mechanism:**
- `new THREE.Color(0)` inside `getNodeColor()` (lines 597, 698) creates fresh objects per call.
- `new THREE.Vector3().add(...)` also allocates per iteration.
- No reuse of uniform objects; scalar `dt` computed fresh each frame.

**Evidence:**
```js
for (const m of faceMeshes) {
  const floatOffset = Math.sin(...) * 0.04;          // no allocation here — OK
  const cent = new THREE.Vector3().add(va).add(vb)... // ALLOC
  const tGeo = new THREE.BufferGeometry();            // ALLOC
  ...
  const mat = new THREE.MeshPhysicalMaterial({...});  // ALLOC
}
```

**Risk:** Medium — GC pressure → jank; sustained 60fps → heap churn.

**Remediation:**
- Pre-allocate reusable `THREE.Color`/`THREE.Vector3` objects outside loops.
- Reuse `BufferGeometry` and `Material` instances; update via `.copy()`.

---

## 4. Event Listener Residue — OrbitControls & DOM Unload (Lines 190–196 in dome.astro)

**Finding:** `OrbitControls` attaches `mousedown`, `mousemove`, `touchstart` to `renderer.domElement`; no corresponding `removeEventListener`.

**Leak Mechanism:**
- Controls remain active after page navigation (SPA route change) or unload.
- No `controls.dispose()` call present.
- Listener count grows with each route entry.

**Evidence:**
```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
const controls = new OrbitControls(camera, renderer.domElement);
// No controls.dispose() anywhere.
window.addEventListener('resize', ...); // no cleanup.
```

**Risk:** High — input handler accumulation; memory retained; potential zombie interactions.

**Remediation:**
```js
controls.dispose();
window.removeEventListener('resize', onResize);
// Call in cleanup routine or SPA before route change.
```

---

## 5. Import Map Integrity — Floating Versions (Lines 13–18 in dome.astro / 73–78 in index.astro)

**Finding:** Import maps reference unpkg/cdn with floating version specifiers.

**Evidence:**
```html
<script type="importmap" is:inline>
  {
    "imports": {
      "three": "https://unpkg.com/three@0.183.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.183.0/examples/jsm/"
    }
  }
</script>
```
(Note: While `0.183.0` is currently pinned, the pattern uses unpkg CDN which may be subject to cache poisoning or supply-chain issues.)

**Risk:** Medium — silent breakage on deploy if CDN cache serves incompatible patch; use subresource integrity (SRI) hashes for production.

**Remediation:**
- Add `integrity` and `crossorigin` attributes.
- Prefer a dedicated `three.module.js` import map with SRI hashes.

---

## 6. WebGL Context Loss Handling — Missing Listener (All files)

**Finding:** No `webglcontextlost` event handler attached to `renderer.domElement`.

**Leak Mechanism:**
- GPU reset (e.g., browser tab switch, driver timeout) triggers context loss.
- Without handler, the scene freezes permanently; no recovery path.

**Evidence:** No `addEventListener('webglcontextlost', ...)` in any file.

**Risk:** Critical — total UI freeze on GPU reset; no graceful degradation.

**Remediation:**
```js
const canvas = renderer.domElement;
let isContextLost = false;
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  isContextLost = true;
  // Show overlay: "GPU context lost — please reload."
});
canvas.addEventListener('webglcontextrestored', () => {
  isContextLost = false;
  renderer.contextLost = false;
  // Re-init geometries, materials, recompile shaders.
});
```

---

## 7. Frame Pacing — dt Clamping & Physics Integration (Lines 863–896 in index.astro)

**Finding:** `dt = 0.016` (fixed) + `Math.min((now - lastTime) / 1000, 0.05)` clamp present; physics integration uses fixed timestep but rotation/position updates depend on `dt`.

**Leak Mechanism:**
- `Math.min(..., 0.05)` caps dt at 50ms (20fps). During spikes, scene jumps.
- No sub-stepping or interpolation; abrupt position jumps when dt=0.05.

**Evidence:**
```js
const dt = 0.016; // fixed
const clampedDt = Math.min((now - lastTime) / 1000, 0.05);
// used directly in rotation/position:
domeGroup.rotation.y += 0.0008 * clampedDt;
```

**Risk:** Medium — visual stutter on frame drops; minor physics drift.

**Remediation:**
- Use variable timestep with clamping: `dt = Math.min(dt, 0.05)`.
- Implement interpolation for smooth rendering between physics steps.

---

## Consolidated Risk Ratings

| # | Finding                        | Risk     |
|---|--------------------------------|----------|
| 1 | Geometry / BufferGeometry leaks | Critical |
| 2 | RenderTarget accumulation       | High     |
| 3 | Uniform / object allocations    | Medium   |
| 4 | Controls / event listener leak  | High     |
| 5 | Import map floating versions    | Medium   |
| 6 | WebGL context loss handling     | Critical |
| 7 | Frame pacing / dt clamping      | Medium   |

---

## Recommended Priority Actions

1. **Immediate (Critical):**
   - Add `geometry.dispose()`, `material.dispose()` before removing meshes.
   - Add `webglcontextlost` / `webglcontextrestored` handlers with graceful fallback UI.

2. **High Priority:**
   - Implement `controls.dispose()` + `removeEventListener` on navigation/unload.
   - Fix `composer.setSize()` to avoid redundant target reallocation.

3. **Medium Priority:**
   - Pre-allocate reusable `THREE.Color`/`THREE.Vector3` objects.
   - Pin import maps with SRI hashes; consider CDN fallback strategy.
   - Refine dt clamping with interpolation for smooth frame pacing.

---

*Report generated from static analysis of `/home/p31/andromeda/software/p31ca/src/pages/dome.astro` and `/home/p31/andromeda/software/p31ca/src/pages/index.astro`.*