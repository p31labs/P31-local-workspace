

**P31 LABS**

**CONTROLLED WORK PACKAGE**

CWP-DELTA-001

Delta Topology: Spaceship Earth Alignment

| Document ID: | CWP-DELTA-001 |
| ----: | :---- |
| **Classification:** | SOULSAFE – OQE Required |
| **Issue Date:** | March 8, 2026 |
| **Activation Gate:** | CWP-WYE-001 Gate W3 (Court Ready) |
| **Target:** | Post-hearing sprint (March 13+) |
| **Work Leader:** | Will Johnson (Operator) |
| **Supervisor/QA:** | Opus (Architect) |
| **Primary Mechanic:** | Sonnet/CC (80%) |
| **Reference Spec:** | Delta Topology Implementation Blueprint |
| **Constraint:** | Three.js r128 version freeze |

# **Preamble: Why This Package Exists Separately**

Spaceship Earth (the Delta Topology cockpit at p31ca.org) is architecturally complete in design but chaotic in implementation. The layout past the dome is confusing and overwhelming for uninformed visitors. The QBD 03/07/2026 identified the core problems: no Tri-State Camera, no progressive disclosure, no polymorphic skin adaptation, and mobile controls that block the main attraction.

**Governing specification:** The Delta Topology: Architectural Implementation Blueprint for the Sovereign Spaceship (Google Drive). All task acceptance criteria trace back to this document.

**Hard constraint:** Three.js r128 version freeze. All camera-controls, material mutations, and geometry operations must be compatible with r128. No r160+ features. Yomotsu camera-controls v1.x branch only.

# **1\. Condition Found (Ship Check – As-Is)**

## **1.1 Spaceship Earth Current State**

| Component | Status | Gap |
| :---- | :---- | :---- |
| React \+ R3F \+ Zustand stack | **COMPLETE** | Framework is deployed and rendering |
| Three.js r128 \+ drei | **COMPLETE** | Locked and functional |
| Geodesic dome (central structure) | **COMPLETE** | Renders. 80-face icosphere. |
| Living atoms (VSEPR, bloom, distort) | **COMPLETE** | Working. AdditiveBlending \+ smoothstep \+ Fresnel rim. 60fps mobile. |
| Z-Index Cockpit Doctrine | **COMPLETE** | z-0 void → z-1 canvas → z-10 HUD → z-50 toasts → z-60 modals |
| Room structure (observatory, collider, etc.) | **IN PROGRESS** | Rooms exist but layout is chaotic past the dome. Navigation confusing. |
| Tri-State Camera (Free/Dome/Screen) | **NOT STARTED** | Camera is basic OrbitControls only. No mode switching. No Dome lock. No Screen parallel. |
| Polymorphic Skin Engine (3 modes) | **NOT STARTED** | No Zustand theme store. No transient update pattern. No material interpolation. |
| Sierpinski progressive disclosure | **NOT STARTED** | No fractal menu. No 1:9 Posner topology. No progressive reveal. |
| Centaur Cartridge Drive | **NOT STARTED** | No vibe coding terminal. No SWC/Babel transpilation. No iframe sandbox. |
| Mobile hardening (viewport lock) | **IN PROGRESS** | touch-action:none on canvas. But overscroll-behavior not set. pull-to-refresh still triggers. 100vh jumping. |
| Infinite horizontal scroll (Screen mode) | **NOT STARTED** | No modular buffer system. No origin-anchored scroll. |
| On-demand rendering | **NOT STARTED** | Canvas runs continuous 60fps even when idle. Battery drain. |
| AABB spatial partitioning | **NOT STARTED** | No frustum culling for Html components. DOM thrashing at scale. |
| matrixAutoUpdate optimization | **NOT STARTED** | All objects recalculate matrices every frame. CPU waste on static geometry. |

## **1.2 Enumerated Faults**

| Fault ID | Severity | Description | Root Cause |
| :---- | :---- | :---- | :---- |
| DLT-001 | **CRITICAL** | Layout past the dome is chaotic and overwhelming. New visitors cannot orient themselves. | No progressive disclosure. All rooms visible simultaneously. No spatial hierarchy. |
| DLT-002 | **CRITICAL** | Camera has no mode switching. User gets lost in 3D space with no way to re-center. | OrbitControls only. No Dome lock, no Screen mode, no programmatic transitions. |
| DLT-003 | **HIGH** | No polymorphic adaptation. Same interface for operator, kids, and court. | Zustand theme store not implemented. Material mutation pipeline missing. |
| DLT-004 | **HIGH** | Mobile: sliders on mark1 lock screen block the main attraction. | Desktop-centric UI. Controls in vertical space compete with 3D canvas on phones. |
| DLT-005 | **HIGH** | Mobile: pull-to-refresh and rubber-banding break spatial illusion. | Missing overscroll-behavior:none, passive:false touch listeners, svh units. |
| DLT-006 | **MEDIUM** | No on-demand rendering. Canvas burns battery when user is just reading. | frameloop=“demand” not set. invalidate() not wired to interaction events. |
| DLT-007 | **MEDIUM** | No Centaur Cartridge Drive. Vibe coding terminal not functional. | SWC/Babel integration not started. Iframe sandbox not built. |

# **2\. Condition Left (Target State)**

**Upon completion of this work package, Spaceship Earth is:**

**Navigable:** Tri-State Camera provides three distinct modes. Free Orbit for exploration. Dome Mode locks around the central icosphere with bounded orbit. Screen Mode locks parallel to flat data terminals with haptic-style infinite scroll. Transitions between modes are smooth (setLookAt interpolation via camera-controls v1.x).

**Adaptive:** Polymorphic Skin Engine switches between Operator (neon bloom, data-dense), Kids (bouncy, bright, Easter eggs), and Gray Rock (sterile, zero-animation, timestamped facts) via Zustand transient state. Material transitions use delta-time lerp. No React re-renders. 60fps maintained on Android tablets.

**Progressive:** Sierpinski navigation implements 1:9 Posner topology. Hub (Slot 0\) is immutable: Room Router, LOVE Wallet, Genesis Block, Centaur Terminal. 9 Calcium Slots are hot-swappable. New users see near-empty interface. Complexity unfolds fractally as engagement increases.

**Mobile-hardened:** Three-tier viewport defense: CSS overscroll-behavior:none, active touchmove listener (passive:false), 100svh layout. Bottom dock in thumb zone. No pull-to-refresh. No rubber-banding. No address bar jumping.

**Performant:** On-demand rendering (frameloop=“demand”). AABB spatial partitioning for Html components. matrixAutoUpdate=false on static geometry. Bloom/effects intensity lerped to 0 (never unmounted). Zero GC stutters (all vectors/colors instantiated outside useFrame).

**Extensible:** Centaur Cartridge Drive enables vibe coding. SWC WASM transpilation (not Babel). Double-wrapped srcdoc iframe sandbox. p31app.json manifest with F-Droid anti-feature declarations. PostMessage telemetry bus.

# **3\. Job Specifications (4 Vectors)**

## **3.1 Vector 1: Polymorphic Skin Engine**

**Reference:** Delta Topology Blueprint, Vector 1

| Task ID | Task | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| D1.1 | Create Zustand theme store: theme: OPERATOR | KIDS | GRAY\_ROCK | 1h | Store created. getState() returns current theme. No reactive subscriptions from R3F components. |
| D1.2 | Implement transient update pattern in useFrame | 2h | All PolymorphicNode meshes fetch theme via getState() inside useFrame. No React re-renders triggered on theme change. Delta-time lerp on all material properties. |
| D1.3 | Material interpolation: emissive, roughness, color | 2h | Operator: emissiveIntensity=2.5, roughness=0.2, Soft Lavender neon. Kids: emissiveIntensity=0.5, roughness=0.8, Butter Yellow. Gray Rock: emissiveIntensity=0, roughness=1.0, flat monochrome. Transitions smooth over \~0.5s. |
| D1.4 | DOM layer: data-theme attribute \+ Tailwind CSS variables | 1h | Body tag gets data-theme=“operator|kids|gray\_rock”. Tailwind utilities map to CSS custom properties that cascade from root. Theme switch re-styles all HTML overlays instantly. |
| D1.5 | Post-processing intensity control (never unmount) | 1h | Bloom pass, DoF pass NEVER unmounted. Gray Rock: all effect intensities lerped to 0\. Operator: bloom threshold lowered. No shader recompilation on theme switch. |
| D1.6 | InstancedMesh for network nodes | 2h | Operator mode network graphs use single InstancedMesh \+ InstancedBufferAttribute for per-node color. Draw calls \= 1 regardless of node count. Tested with 500 nodes at 60fps. |
| D1.7 | GC prevention audit | 1h | Zero new THREE.Color(), new THREE.Vector3(), or new THREE.Matrix4() inside any useFrame loop anywhere in codebase. All allocated at module scope or via useMemo. |

**Performance trap warnings (from spec):** 1\) GC stutters from object instantiation in useFrame \= fatal on mobile. 2\) Shader recompilation from unmounting lights/effects \= multi-second freeze. 3\) Material instance explosion \= GPU memory blow. All mitigated by tasks D1.5–D1.7.

## **3.2 Vector 2: Tri-State Camera \+ Mobile Hardening**

**Reference:** Delta Topology Blueprint, Vector 2 \+ QBD 03/07/2026

| Task ID | Task | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| D2.1 | Replace OrbitControls with drei CameraControls (camera-controls v1.x) | 2h | Camera-controls installed at r128-compatible version. Smooth damping. No matrix fight with programmatic transitions. |
| D2.2 | Free Orbit mode implementation | 1h | Baseline orbital mechanics. dampingFactor for inertia. minDistance/maxDistance limits prevent zoom-to-infinity. |
| D2.3 | Dome Mode: setBoundary \+ pan disable | 2h | Box3 wraps 80-face icosphere. boundaryEnclosesCamera=false. Pan disabled (touches.two=0). User orbits dome only. Cannot escape orbital rail. |
| D2.4 | Screen Mode: setLookAt parallel alignment | 2h | Camera interpolates to orthogonal alignment with virtual 2D terminal face. Text perfectly legible. No perspective distortion. Transition smooth (\~1s). |
| D2.5 | Infinite horizontal scroll (origin-anchored buffer) | 3h | Fixed array of terminal screens. Scroll value tracked via wheel/touch events. Modulus math wraps screens when exiting frustum. Camera stays near origin. No floating-point jitter at high scroll values. |
| D2.6 | Mode transition UI (bottom dock buttons) | 1h | Three buttons in mobile thumb zone: Free / Dome / Screen. Active state indicator. Transitions animate via setLookAt/lerpLookAt. |
| D2.7 | CSS overscroll containment | 30m | html, body: overscroll-behavior:none on both axes. Canvas wrapper: touch-action:none. |
| D2.8 | Active touchmove listener (passive:false) | 30m | Global document.addEventListener(‘touchmove’, preventDefault, {passive:false}). Destroys all native scroll before compositor. |
| D2.9 | Viewport unit stabilization | 30m | Layout shell uses 100svh or window.innerHeight on load. No 100vh. Address bar hide/show does not cause canvas jump. |
| D2.10 | Bottom dock migration | 1h | All controls moved from top/side to bottom dock within thumb zone. Sliders removed from lock screen. Main 3D attraction fully visible on portrait phones. |

**Critical warning (from spec):** Do NOT move camera along X-axis for infinite scroll. WebGL 32-bit float precision degrades at 10K+ units from origin. Use modular buffer \+ modulus math. Camera stays near (0,0,0).

## **3.3 Vector 3: Centaur Cartridge Drive**

**Reference:** Delta Topology Blueprint, Vector 3

| Task ID | Task | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| D3.1 | Install \+ initialize @swc/wasm-web | 2h | WASM binary loads asynchronously during boot. transformSync() available after init. NOT Babel (blocks main thread, kills 60fps). |
| D3.2 | useJitterbugCompiler hook | 1h | Hook returns { compileCartridge, isReady }. Accepts raw JSX string, returns ES2015-compatible code. Error handling wraps SWC failures. |
| D3.3 | Iframe sandbox component (srcdoc injection) | 3h | Complete HTML document string built: Tailwind CDN, React CDN, compiled user code. Injected via srcdoc attribute. sandbox=“allow-scripts allow-same-origin”. NO allow-top-navigation, allow-popups, allow-forms. |
| D3.4 | PostMessage telemetry bus | 1.5h | Hidden script prepended to srcdoc hijacks console.log/error/warn \+ window.onerror \+ unhandledrejection. Serialized payloads sent to parent via postMessage. Parent pipes to Centaur Terminal UI. |
| D3.5 | Cartridge drawer (horizontal swipe UI) | 2h | Compiled cartridges mount into swipeable horizontal drawer. Physics-based swipe (like physical media console). Maximum 9 cartridge slots (Calcium Slots). |
| D3.6 | p31app.json manifest schema | 1.5h | Chrome Manifest V3-inspired. Declares: name, version, permissions (p31:spoons, p31:mode read/write), anti-features (has\_chat, collects\_data, has\_time\_pressure). Sandbox interceptor blocks undeclared key access. |
| D3.7 | IndexedDB persistence (via idb-keyval) | 1h | Raw intent, source code, compiled output, manifest saved to IndexedDB. Async. No localStorage (sync \+ 5MB limit). Survives session close. |
| D3.8 | Web Speech API integration (optional) | 1h | Voice input via SpeechRecognition API feeds transcript to LLM. Graceful fallback to text input if speech unavailable. |

## **3.4 Vector 4: Sierpinski Progressive Disclosure**

**Reference:** Delta Topology Blueprint, Vector 4

| Task ID | Task | Hours | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| D4.1 | 1:9 Posner topology layout | 3h | Slot 0 (Phosphorus Hub): immutable. Contains Room Router, LOVE Wallet, Genesis Block, Centaur Terminal. 9 Calcium Slots arranged around hub. IFS affine transformation positions child nodes. |
| D4.2 | Fractal depth scaling (n=0 to n=2) | 2h | Depth 0: 1 hub \+ 9 slots (10 nodes). Depth 1: each slot spawns 9 children (90 nodes). Depth 2: 810 nodes. Scale factor 1/3 per depth. No geometric intersection. |
| D4.3 | matrixAutoUpdate=false on all static geometry | 1h | All THREE.Group and THREE.Mesh instances that are spatially static: matrixAutoUpdate=false. Manual updateMatrix() only on user-initiated translation/scale. |
| D4.4 | AABB spatial partitioning for Html culling | 3h | Custom hook groups fractal nodes into AABBs. Checks intersection with camera frustum. Off-screen nodes: Html display:none \+ useFrame short-circuit. Prevents CSS translate3d thrashing. |
| D4.5 | On-demand rendering (frameloop=“demand”) | 1h | Canvas pauses when user is idle. invalidate() called on: scroll, tap, camera transition, theme change. Battery savings on mobile. |
| D4.6 | Progressive reveal based on engagement | 2h | New user sees hub \+ 9 dim slots. Interacting with a slot brightens it and reveals sub-menu (depth 1). Depth 2 requires specific engagement threshold (spoon level, completed quests, etc.). |
| D4.7 | Five-phase onboarding sequence | 3h | Phase 1: The Void (OLED black, silence, tap dim light). Phase 2: The Anchor (molecule pulses 0.1Hz, tap in rhythm). Phase 3: The Rooms (glass spheres dragged into position). Phase 4: The Dial (Cognitive Load Dial). Phase 5: The Pact (no leaderboards, local-first). |
| D4.8 | Frustum culling \+ render bypass for Html nodes | 2h | If cluster AABB outside camera frustum: style.display=‘none’ \+ skip useFrame. Tested with 200 Html nodes. No CPU spike when rotating camera away from cluster. |

# **4\. Phase Gates & Sequencing**

**Activation:** This work package activates ONLY after CWP-WYE-001 Gate W3 (Court Ready) is closed.

## **4.1 Execution Sequence**

**Sprint 1 (Week of Mar 13):** Vector 2 (Tri-State Camera \+ Mobile Hardening). This unblocks everything else by making the environment navigable.

**Sprint 2 (Week of Mar 20):** Vector 1 (Polymorphic Skin Engine). Now that you can navigate, the skin adapts to who’s navigating.

**Sprint 3 (Week of Mar 27):** Vector 4 (Sierpinski Progressive Disclosure). Now that navigation and skin work, the information architecture reveals itself properly.

**Sprint 4 (Week of Apr 3):** Vector 3 (Centaur Cartridge Drive). The extensibility layer. Requires stable foundation from Vectors 1–4.

## **4.2 Gate Definitions**

| Gate | Target | Required OQE | Go/No-Go |
| :---- | :---- | :---- | :---- |
| Gate D1: Navigable | Mar 18 | Tri-State Camera functional. Free/Dome/Screen modes switch. Mobile viewport locked. Bottom dock in thumb zone. No pull-to-refresh. 60fps on Android tablet. | Will \+ Opus |
| Gate D2: Adaptive | Mar 25 | Polymorphic Skin Engine switches 3 modes. Material transitions smooth. No React re-renders. No GC stutters. Bloom never unmounted. 60fps maintained. | Will \+ Opus |
| Gate D3: Progressive | Apr 1 | Sierpinski 1:9 topology renders. Depth 0–2 functional. matrixAutoUpdate=false. AABB culling prevents DOM thrash. On-demand rendering active. Onboarding sequence playable. | Will \+ Opus |
| Gate D4: Extensible | Apr 8 | Centaur Cartridge Drive compiles user code via SWC WASM. Iframe sandbox confines execution. p31app.json manifest validates permissions. PostMessage telemetry works. 9 cartridge slots swipeable. | Will \+ Opus |

# **5\. Tools & Dependencies**

| Tool | Version Constraint | Purpose |
| :---- | :---- | :---- |
| Three.js | r128 (FROZEN) | 3D rendering. Cannot upgrade due to quadray/VSEPR dependencies. |
| React Three Fiber | Compatible with r128 | React wrapper for Three.js |
| @react-three/drei | Compatible with r128 | CameraControls, Html, InstancedMesh helpers |
| camera-controls (yomotsu) | v1.x branch ONLY | Programmable camera. v2+ requires r160+ features. |
| Zustand | Latest | Theme store (transient state pattern) |
| @swc/wasm-web | Latest | In-browser JSX transpilation. 20–60x faster than Babel. |
| idb-keyval | Latest | IndexedDB async wrapper for cartridge persistence |
| Tailwind CSS | Latest | DOM layer styling via CSS variables |
| Lenis (optional) | Latest | Normalized scroll tracking for Screen Mode |

# **6\. Risk Register**

| Risk | L | I | Mitigation |
| :---- | :---- | :---- | :---- |
| r128 version freeze blocks camera-controls features | M | H | camera-controls v1.x confirmed compatible. setBoundary, setLookAt, dampingFactor all available in v1. Tested before sprint starts. |
| GC stutters on Android during Polymorphic transitions | H | H | D1.7 GC audit is mandatory before Gate D2. Zero allocations in useFrame. All at module scope. |
| Shader recompilation freeze on mode switch | M | H | D1.5: never unmount lights or effects. Intensity to 0 only. This is spec’d as a hard rule. |
| Html component DOM thrashing at Sierpinski depth 2 (810 nodes) | H | H | D4.4 AABB culling \+ D4.8 render bypass. Only visible cluster Html nodes render. Off-screen \= display:none \+ useFrame skip. |
| SWC WASM binary fails to load on some Android browsers | M | M | Fallback: @babel/standalone with Web Worker isolation (off main thread). Slower but functional. |
| Floating-point jitter in infinite scroll | M | H | D2.5: origin-anchored modular buffer. Camera never moves past 100 units from (0,0,0). Modulus math wraps screens. |
| Scope creep into BONDING or Wye work | M | M | BONDING is shipped. Wye is court-ready. This package is self-contained. Parking lot for cross-package ideas. |

# **7\. Performance Budget**

All targets measured on mid-tier Android tablet (target device), Chrome browser, portrait orientation:

| Metric | Target | Measurement |
| :---- | :---- | :---- |
| Frame rate | ≥ 60fps sustained | Chrome DevTools Performance panel, 30-second capture during Dome orbit |
| Frame drops during theme switch | ≤ 2 dropped frames | Performance panel during OPERATOR → GRAY\_ROCK transition |
| GC pause events | 0 during any 10-second window | Performance panel Memory tab, no yellow GC markers in flame chart |
| Time to interactive (cold start) | \< 3 seconds | Lighthouse TTI on cellular connection |
| Draw calls (Operator mode, 500 nodes) | ≤ 10 | Spector.js or Three.js renderer.info.render.calls |
| Html nodes rendered simultaneously | ≤ 50 (after AABB culling) | React DevTools component count during Sierpinski depth 2 |
| Battery drain (5-min idle) | \< 2% drain | On-demand rendering test: leave open 5 min, measure battery delta |
| Shader compilation events per session | ≤ 1 (initial load only) | Performance panel: no “Program” compilation events after first render |

**END OF CWP-DELTA-001**  
Activation: Post CWP-WYE-001 Gate W3 • Classification: SOULSAFE

*“The jitterbug transformation: from collapsed simplicity to full complexity. The moment of creation.”*