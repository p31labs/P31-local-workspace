# WCD Batch 3 — Structured Agent Execution Plan
## P31 Labs · Spaceship Earth · Delta Topology
## Issued: March 20, 2026 · Classification: SOULSAFE

---

## GLOBAL CONSTRAINTS (Apply to ALL wcds)

```yaml
three_js_version: r128 # FROZEN. Do not upgrade. Do not use r160+ APIs.
camera_controls: v1.x # Yomotsu camera-controls. v2+ incompatible with r128.
target_device: Android tablet, mid-tier, Chrome
fps_target: 60fps sustained
framework: React 18 + React Three Fiber + @react-three/drei + Zustand
bundler: Vite
test_runner: Vitest
state: Zustand (transient pattern for WebGL — useStore.getState() in useFrame, never reactive subscriptions from R3F components)
persistence: IndexedDB via idb-keyval (NEVER localStorage for data > 1KB)
coppa: Kids mode MUST NOT collect analytics, telemetry, or PII
memory: ZERO object instantiation inside useFrame loops. All THREE.Color, THREE.Vector3, THREE.Matrix4 allocated at module scope or useMemo.
audio: Max 6 simultaneous Web Audio spatial sources on mobile. Pool and prioritize by proximity.
```

### File Conventions
- New files: Create in stated path
- Modified files: Use surgical edits only — do not rewrite entire files
- Every WCD must pass: `tsc --noEmit` + `npm run build` + existing test suite
- Commit message format: `WCD-XX.Y: [description]`

---

## EXECUTION ORDER (Revised from review)

```
Sprint 1 (Days 1-4):   WCD-29 (Theming)      — Identity first
Sprint 1 (Days 1-4):   WCD-28 (Perf Monitor)  — Instrumentation before features
Sprint 2 (Days 5-9):   WCD-26 (Audio)         — Extends existing, no blockers
Sprint 3 (Days 10-14): WCD-27 (Particles)     — Needs 26 + 28
Sprint 4 (Days 15-19): WCD-30 (Profile/DID)   — Needs 28
Sprint 5 (Days 20-24): WCD-31 (LLM Agent)     — Needs 29
Sprint 6 (Days 25-28): WCD-32 (Production)    — Gate: all others closed
```

---

## WCD-26: Enhanced Spatial Audio & 3D Soundscapes

### Constraint
- Max 6 simultaneous PannerNode sources on Android tablets. Exceeding this causes audio thread starvation → frame drops.
- All spatial position updates throttled to 10Hz (100ms interval), not per-frame.
- Web Audio AudioContext requires user gesture to resume. Gate on first user interaction.

### Implementation Plan

#### 26.1 — Audio Zone Manager
```yaml
action: CREATE
file: spaceship-earth/src/services/audio/AudioZoneManager.ts
```

```typescript
interface AudioZone {
  id: string;
  position: [number, number, number];
  radius: number;
  frequencies: number[];
  volume: number;
  filterType: BiquadFilterType;
  filterFreq: number;
}

const ZONES: AudioZone[] = [
  { id: 'cockpit', position: [0, 0, 0], radius: 20,
    frequencies: [172.35], volume: 0.06, filterType: 'lowpass', filterFreq: 800 },
  { id: 'observatory', position: [0, 0, -10], radius: 15,
    frequencies: [800, 1200, 1600], volume: 0.1, filterType: 'bandpass', filterFreq: 2000 },
  { id: 'bridge', position: [-20, 0, 0], radius: 12,
    frequencies: [60, 80, 120], volume: 0.15, filterType: 'lowpass', filterFreq: 400 },
  { id: 'brain', position: [0, 15, -10], radius: 10,
    frequencies: [4000, 6000, 8000], volume: 0.08, filterType: 'highpass', filterFreq: 3000 },
];

// Architecture:
// - Extends existing audioManager.ts singleton
// - setListenerTransform(camera: THREE.Object3D): updates AudioListener position at 10Hz
// - updateZones(listenerPosition: THREE.Vector3): calculates zone weights, cross-fades
// - Cross-fade: 1s linear ramp between zones using gainNode.gain.linearRampToValueAtTime()
// - Only the 2 nearest zones are active at any time (the rest gain = 0)
```

**Acceptance**: Moving camera between rooms cross-fades ambient audio. Cockpit zone always plays 172.35 Hz Larmor drone. 10Hz update throttle verified (not per-frame).

#### 26.2 — useAudio Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useAudio.ts
```

```typescript
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { audioZoneManager } from '../services/audio/AudioZoneManager';

// Module-scope vector — no allocation in useFrame
const _listenerPos = new THREE.Vector3();
let _lastUpdate = 0;

export function useAudio() {
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (now - _lastUpdate < 0.1) return; // 10Hz throttle
    _lastUpdate = now;

    state.camera.getWorldPosition(_listenerPos);
    audioZoneManager.setListenerTransform(state.camera);
    audioZoneManager.updateZones(_listenerPos);
  });
}
```

**Acceptance**: Hook updates audio at 10Hz. No allocations in useFrame. Camera position drives zone cross-fade.

#### 26.3 — Jitterbug Spatial Hums (Pooled)
```yaml
action: MODIFY
file: spaceship-earth/src/components/rooms/sovereign/ImmersiveCockpit.tsx
```

```
CRITICAL: Do NOT create one PannerNode per Jitterbug node.
With 12+ nodes at 10Hz updates = 120+ Web Audio calls/second.

Instead:
- Pre-allocate a POOL of 6 spatial sources (PannerNode + OscillatorNode pairs)
- Each frame (at 10Hz): sort Jitterbug nodes by distance to listener
- Assign the 6 closest nodes to the 6 pooled sources
- Remaining nodes contribute to a SINGLE mixed ambient oscillator
- Frequency modulated by node velocity (distance/frame)
- Gain modulated by node opacity (jOpacity array from useJitterbugStore)

Pool interface:
interface SpatialSourcePool {
  acquire(): SpatialSource | null;  // Returns source from pool, or null if full
  release(source: SpatialSource): void;
  updateAll(): void;  // Called at 10Hz
}
```

**Acceptance**: Never more than 6 simultaneous PannerNodes active. Nodes beyond 6 nearest contribute to ambient mix. No audio thread starvation. Frequency responds to node velocity.

#### 26.4 — Coherence Audio Morphing
```yaml
action: MODIFY
file: spaceship-earth/src/services/audioManager.ts
```

```
Extend existing updateDrone() method:
- Add 5th harmonic oscillator at 517.05 Hz (172.35 × 3)
- 5th harmonic gain: 0 when coherence < 0.8, ramps to 0.06 at coherence = 1.0
- Resonance layer: bandpass filter centered at 172.35 Hz, Q ramps with coherence
- On coherence crossing 0.95 upward: trigger playResonanceLock()
  - playResonanceLock(): 500ms chime at 863 Hz (172.35 × 5, Larmor harmonic)
  - Attack: 10ms, Decay: 490ms, envelope via gainNode

State check:
- Read coherence from useSovereignStore.getState().coherence (transient pattern)
- Do NOT subscribe reactively
```

**Acceptance**: 172.35 Hz drone gains harmonic richness as coherence approaches 1.0. Chime plays exactly once when crossing 0.95 threshold upward. No chime spam on oscillation around threshold.

### WCD-26 Deliverables
- [ ] AudioZoneManager.ts with 4 zone definitions
- [ ] useAudio.ts hook with 10Hz throttle
- [ ] Jitterbug spatial hum pool (max 6 sources)
- [ ] Coherence 5th harmonic + resonance lock chime
- [ ] All audio gated on user gesture (AudioContext.resume())
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-27: GPU Particle Systems & Visual FX

### Constraint
- r128 GLSL: use `#version 100` or `#version 300 es` shaders compatible with r128 WebGLRenderer.
- NEVER instantiate new GPUParticleSystem inside event handlers. Use a POOL of pre-allocated systems.
- Performance auto-scaling reads from `performanceMonitor.getPerformanceLevel()` (WCD-28).

### Implementation Plan

#### 27.1 — GPU Particle System Core
```yaml
action: CREATE
files:
  - spaceship-earth/src/effects/GPUParticleSystem.ts
  - spaceship-earth/src/effects/shaders/particle.vert
  - spaceship-earth/src/effects/shaders/particle.frag
```

```typescript
// GPUParticleSystem.ts
interface ParticleSystemConfig {
  maxCount: number;       // Pre-allocated buffer size
  behavior: 'orbit' | 'wave' | 'stream' | 'ripple';
  color: THREE.Color;
  size: number;
  speed: number;
}

// Architecture:
// - Uses THREE.Points with THREE.BufferGeometry
// - Pre-allocate Float32Array for positions, velocities, ages
// - All computation in vertex shader (GPU-side)
// - CPU only updates uniform: time, behavior params
// - Single draw call regardless of particle count

// Vertex shader (particle.vert):
// - attribute vec3 position (from buffer)
// - attribute float offset (random per particle)
// - uniform float uTime
// - uniform float uSpeed
// - uniform int uBehavior
// - Compute position based on behavior enum
// - Output: gl_PointSize, gl_Position

// Fragment shader (particle.frag):
// - Circular point with soft alpha edge
// - uniform vec3 uColor
// - discard if distance from center > 0.5
```

**Acceptance**: Single Points object renders up to 5000 particles. Draw calls = 1. FPS does not drop below 55 with 5000 particles on Android tablet.

#### 27.2 — Particle System Pool
```yaml
action: CREATE
file: spaceship-earth/src/effects/ParticlePool.ts
```

```typescript
// Pre-allocate N particle systems at app init
// Pool size: 8 systems (covers all concurrent effects)

class ParticlePool {
  private available: GPUParticleSystem[] = [];
  private active: Map<string, GPUParticleSystem> = new Map();

  constructor(scene: THREE.Scene, poolSize: number = 8) {
    for (let i = 0; i < poolSize; i++) {
      const sys = new GPUParticleSystem({ maxCount: 1000, /* defaults */ });
      sys.visible = false;
      scene.add(sys.points);
      this.available.push(sys);
    }
  }

  acquire(id: string, config: Partial<ParticleSystemConfig>): GPUParticleSystem | null {
    if (this.available.length === 0) return null;
    const sys = this.available.pop()!;
    sys.configure(config);
    sys.visible = true;
    sys.reset();
    this.active.set(id, sys);
    return sys;
  }

  release(id: string): void {
    const sys = this.active.get(id);
    if (!sys) return;
    sys.visible = false;
    this.active.delete(id);
    this.available.push(sys);
  }

  // Auto-release after duration
  acquireForDuration(id: string, config: Partial<ParticleSystemConfig>, durationMs: number): void {
    const sys = this.acquire(id, config);
    if (!sys) return;
    setTimeout(() => this.release(id), durationMs);
  }
}

export const particlePool = new ParticlePool(/* inject scene */);
```

**Acceptance**: NEVER creates new particle systems at runtime. Pool pre-allocates 8 systems. acquire/release cycle works. Rapid-fire events (fast plucking) gracefully fail when pool exhausted (returns null, no crash).

#### 27.3 — Coherence Energy Wave Effect
```yaml
action: MODIFY
file: spaceship-earth/src/components/rooms/sovereign/ImmersiveCockpit.tsx
```

```
On coherence crossing 0.95 upward:
1. particlePool.acquireForDuration('coherence-wave', {
     behavior: 'wave',
     color: new THREE.Color('#22d3ee'), // cyan
     speed: 3,
     maxCount: 2000
   }, 2000)
2. Wave radiates from attractor position outward
3. Color: cyan → white → fade (via uniform animation)
4. Duration: 2 seconds, then auto-released to pool

Debounce: ignore if last wave was < 3s ago (prevent spam)
```

#### 27.4 — Resonance Ripple Effect
```yaml
action: MODIFY
file: spaceship-earth/src/components/rooms/sovereign/ImmersiveCockpit.tsx
```

```
On Jitterbug node pluck (touch/click):
1. particlePool.acquireForDuration('ripple-' + nodeIndex, {
     behavior: 'ripple',
     color: new THREE.Color('#d946ef'), // magenta
     speed: 2,
     maxCount: 500
   }, 1500)
2. Ring expands from plucked node position
3. Secondary ripples on connected nodes after 200ms delay
4. Max 3 simultaneous ripples (check pool availability)

IMPORTANT: Do NOT create new GPUParticleSystem per pluck.
Use particlePool.acquire(). If pool exhausted, skip effect silently.
```

#### 27.5 — Performance Auto-Scaling
```yaml
action: MODIFY
file: spaceship-earth/src/effects/GPUParticleSystem.ts
```

```typescript
// Read performance level from WCD-28:
// import { performanceMonitor } from '../services/performanceMonitor';

// In update() method (called per frame):
// const level = performanceMonitor.getPerformanceLevel();
// if (level === 'low') this.activeCount = Math.floor(this.maxCount * 0.25);
// else if (level === 'medium') this.activeCount = Math.floor(this.maxCount * 0.5);
// else this.activeCount = this.maxCount;

// URL override: ?particles=off
// Check once at init: new URLSearchParams(location.search).get('particles') === 'off'
// If off: all systems visible = false, update() no-ops
```

**Acceptance**: Particle count scales with FPS. `?particles=off` disables all systems. Low-quality mode renders 25% particles.

### WCD-27 Deliverables
- [ ] GPUParticleSystem.ts with GLSL shaders (r128 compatible)
- [ ] ParticlePool.ts (pre-allocated, acquire/release)
- [ ] Coherence energy wave (2s, auto-release, debounced)
- [ ] Resonance ripple (on pluck, pool-limited)
- [ ] Data stream on cartridge mount
- [ ] Performance auto-scaling + ?particles=off
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-28: Performance Monitoring & Telemetry

### Objective
Build in-app performance dashboard and telemetry pipeline for real-world data collection (FPS, memory, GPU time) on Android tablets.

### Implementation Plan

#### 28.1 Performance Metrics Collection
```typescript
// File: src/services/performanceMonitor.ts (NEW)

interface PerformanceMetrics {
  fps: number;
  fpsMin: number;
  fpsMax: number;
  frameTime: number;
  memory?: number; // performance.memory.usedJSHeapSize
  gpuTime?: number; // EXT_disjoint_timer_query
  particleCount: number;
  timestamp: number;
}

// Ring buffer: last 300 samples (5 minutes at 1Hz)
const metricsBuffer: PerformanceMetrics[] = [];
const MAX_SAMPLES = 300;

// In RAF loop:
// - Calculate delta time between frames
// - Rolling average FPS (last 60 frames)
// - Sample every 1 second for buffer
```

**Files Created:**
- `spaceship-earth/src/services/performanceMonitor.ts`

#### 28.2 Stats Overlay
```typescript
// URL flag: ?stats=1
// Display: draggable panel showing:
// - Current FPS (color-coded: green >55, yellow 45-55, red <45)
// - GPU time (if available)
// - Memory usage (Chrome only)
// - Active particle count
// - Toggle visibility button

// Implementation:
// - StatsPanel.tsx component
// - Position: top-right, draggable
// - Default: hidden, show on ?stats=1
```

**Files Created:**
- `spaceship-earth/src/components/ui/StatsPanel.tsx`

#### 28.3 Telemetry Upload
```typescript
// Store slice: useSovereignStore.telemetry
interface TelemetryState {
  telemetryEnabled: boolean;
  sessionId: string;
  uploadInterval: number; // ms
}

// Upload endpoint: POST /telemetry
// Body: { sessionId, device: { ua, screen, dpr }, metrics: { avgFps, minFps, maxFps, memory, gpuTime } }
// Interval: every 60 seconds when enabled

// Cloudflare Worker stub:
// - Accepts POST /telemetry
// - Stores in KV (anonymous, no PII)
// - Returns 200 OK
```

**Files Created:**
- `spaceship-earth/src/sovereign/useSovereignStore.ts` — add telemetry slice
- `spaceship-earth/worker/telemetry.ts` (NEW) — CF Worker stub

#### 28.4 Performance Logging
```typescript
// Log to localStorage['p31-errors']:
// - Performance warnings: FPS < 45 sustained for 10 seconds
// - Memory warnings: >80% of heap limit
// - GPU timeouts: >33ms frame time

// Toast notification:
// - "Performance degraded. Consider enabling low quality mode."
// - Trigger: FPS < 45 for 10 seconds
// - Action: Open settings dialog with quality options
```

**Files Modified:**
- `spaceship-earth/src/services/performanceMonitor.ts`
- `spaceship-earth/src/services/toast.ts` — add performance warning

#### 28.5 Optimization Feedback
```typescript
// Auto-suggest low quality mode:
// - If FPS < 45 for 30 seconds: show dialog
// - Options: "Enable Low Quality", "Remind Later", "Ignore"

// Store preference: localStorage['p31-quality']
// - 'auto' (default): auto-detect
// - 'high': max particles, full effects
// - 'low': reduced particles, simplified shaders
```

**Files Modified:**
- `spaceship-earth/src/components/ui/QualitySettings.tsx` (NEW)
- `spaceship-earth/src/services/performanceMonitor.ts`

### Deliverables Checklist
- [ ] performanceMonitor.ts with metrics collection
- [ ] Stats overlay (?stats=1)
- [ ] Telemetry slice in store + CF Worker stub
- [ ] Performance warning logs + toast notifications
- [ ] Auto quality suggestions

---

## WCD-29: Theming & Dynamic Skin UI Polish

### Objective
Enhance theming engine with visual skin editor, custom color components, import/export themes, animated transitions.

### Implementation Plan

#### 29.1 Theme Editor Component
```typescript
// File: src/components/ui/ThemeEditor.tsx (NEW)

// Adjustable CSS variables:
interface ThemeConfig {
  name: string;
  background: string;
  primary: string;      // --cyan
  secondary: string;    // --magenta
  accent: string;      // --neon (user-selected)
  glassOpacity: number;
  reduceMotion: boolean;
}

// UI:
// - Color pickers for each variable
// - Sliders for glass opacity
// - Live preview on change
// - "Reset to Default" button
// - "Copy Theme JSON" button

// Integration:
// - Uses existing useSovereignStore.setAccentColor()
// - Adds setSkinTheme() for full theme
```

**Files Created:**
- `spaceship-earth/src/components/ui/ThemeEditor.tsx`

#### 29.2 Theme Import/Export
```typescript
// Export:
// - Generate JSON: { name, background, primary, secondary, accent, glassOpacity }
// - Copy to clipboard via navigator.clipboard

// Import:
// - Paste JSON into text area
// - Validate schema (check required fields, hex colors)
// - Apply via setSkinTheme() + setAccentColor()

// Storage:
// - localStorage['p31-theme'] = JSON.stringify(ThemeConfig)
// - Load on app init
```

**Files Modified:**
- `spaceship-earth/src/components/ui/ThemeEditor.tsx`
- `spaceship-earth/src/sovereign/useSovereignStore.ts` — add theme persistence

#### 29.3 Animated Transitions
```typescript
// CSS transitions:
// - Add to root element: transition: color 0.3s ease, background-color 0.3s ease
// - Trigger on theme change via data-theme attribute

// Three.js material uniforms:
// - In ImmersiveCockpit: tween uniform values over 0.2s
// - For Jitterbug materials, IVM lattice materials
// - Use existing lerp utility or add simple tween helper

// Implementation:
// - Add CSS: :root { transition: --cyan 0.3s, --magenta 0.3s, ... }
// - Add JS: animateThemeTransition(oldConfig, newConfig)
```

**Files Modified:**
- `spaceship-earth/src/styles.css` — add theme transitions
- `spaceship-earth/src/components/ui/ThemeEditor.tsx` — trigger animations

#### 29.4 Accessibility Presets
```typescript
// New skin presets in types.ts:
type SkinTheme = 'OPERATOR' | 'KIDS' | 'GRAY_ROCK' | 'AURORA' | 'HIGH_CONTRAST' | 'LOW_MOTION';

// HIGH_CONTRAST:
// - Background: #000000
// - Primary: #00FFFF (max contrast against black)
// - Secondary: #FF00FF
// - Text: #FFFFFF

// LOW_MOTION:
// - All animations disabled (--reduce-motion: 1)
// - Uses CSS: @media (prefers-reduced-motion: reduce)
// - Colors preserved from current theme

// Apply via setSkinTheme() existing action
```

**Files Modified:**
- `spaceship-earth/src/sovereign/types.ts` — extend SkinTheme
- `spaceship-earth/src/components/ui/ThemeEditor.tsx` — preset buttons

#### 29.5 Bridge Overlay Integration
```typescript
// Add "Themes" tab to Bridge overlay:
// - Existing tabs: LOVE, WALLET, STEALTH, LEDGER, HW
// - New tab: THEMES (6th tab)

// Tab content:
// - Theme preset selector (grid of buttons)
// - Theme editor (expandable panel)
// - Import/Export buttons

// Implementation:
// - Modify BridgeOverlay.tsx to include ThemesTab
// - Use existing tab navigation pattern
```

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/overlays/BridgeOverlay.tsx`
- `spaceship-earth/src/components/ui/ThemeEditor.tsx`

### Deliverables Checklist
- [ ] ThemeEditor.tsx with color pickers/sliders
- [ ] Import/export functionality with JSON
- [ ] CSS + Three.js animated transitions
- [ ] HIGH_CONTRAST and LOW_MOTION presets
- [ ] Themes tab in Bridge overlay

---

## WCD-30: Profile & DID Enhancements

### Objective
Expand user profile system with social features: friend connections, public profiles, UCAN delegation for cartridge sharing.

### Implementation Plan

#### 30.1 Friend System
```typescript
// Extend profileStore:
interface ProfileState {
  did: string;
  displayName: string;
  avatar: string; // base64 or URL
  friends: string[]; // array of DIDs
  pendingRequests: string[];
}

// Add Friend UI:
// - Input field for DID
// - QR scanner (using existing camera API?)
// - Send friend request via relay: { type: 'friend_request', to: DID, from: myDID }

// Handle incoming:
// - Show toast: "Friend request from [name]"
// - Accept/Reject buttons
// - On accept: add to friends, store in IndexedDB
```

**Files Modified:**
- `spaceship-earth/src/sovereign/useSovereignStore.ts` — add friends slice
- `spaceship-earth/src/components/ProfileOverlay.tsx` — add friend UI

#### 30.2 Public Profile
```typescript
// Profile visibility toggle:
// - In ProfileOverlay: "Make Profile Public" toggle
// - Store: localStorage['p31-profile-public'] = boolean

// Relay query response:
// - When peer queries: GET /profile/:did
// - If public: return { displayName, avatar, status }
// - If private: return 404

// Display:
// - "Public" badge on own profile
// - "Private" indicator on others' profiles
```

**Files Modified:**
- `spaceship-earth/src/sovereign/useSovereignStore.ts` — add publicProfile
- `spaceship-earth/worker/relay.ts` — add profile query handler
- `spaceship-earth/src/components/ProfileOverlay.tsx`

#### 30.3 UCAN Delegation for Cartridges
```typescript
// UCAN (User Controlled Authorization Networks):
// - Generate Ed25519 token granting read access
// - Token format: { iss, aud, exp, prm: { cartridgeId, slot } }
// - Sign with user's DID key

// Share flow:
// 1. User selects cartridge in drawer
// 2. Clicks "Share" -> "Generate Link"
// 3. System generates UCAN token
// 4. Display as QR code or text

// Receive flow:
// 1. User scans QR / pastes token
// 2. Verify signature against issuer's DID
// 3. If valid: add to "Shared with me" section in drawer
// 4. Display read-only, with "From: [name]" attribution
```

**Files Created:**
- `spaceship-earth/src/services/ucan.ts` (NEW) — UCAN generation/verification

**Files Modified:**
- `spaceship-earth/src/components/CartridgeDrawer.tsx` — share/receive UI
- `spaceship-earth/src/hooks/useCartridgeShare.ts` (NEW)

#### 30.4 Profile Sync Across Devices
```typescript
// Cloud sync:
// - Encrypt profile with key derived from DID
// - Upload to relay: PUT /profile { encryptedBlob }
// - Download: GET /profile/:did

// Conflict resolution:
// - Last-write-wins based on timestamp
// - Store local timestamp with profile

// Implementation:
// - On login: check if cloud profile exists
// - If yes: merge with local (prompt if conflict)
// - On profile change: debounce 5s then upload
```

**Files Modified:**
- `spaceship-earth/src/services/profileSync.ts` (NEW)
- `spaceship-earth/src/sovereign/useSovereignStore.ts` — add sync actions

#### 30.5 UI Polish
```typescript
// Share Profile QR:
// - Generate QR containing DID
// - Use existing qrcode library or Web API

// Friend presence:
// - Top bar shows: "3 friends online"
// - Click to see list of online friends
// - Future: quick message button

// Pending requests section:
// - In ProfileOverlay: "Pending (2)" expandable
// - Accept/Reject each
```

**Files Modified:**
- `spaceship-earth/src/components/ProfileOverlay.tsx`
- `spaceship-earth/src/components/TopBar.tsx` — friend count

### Deliverables Checklist
- [ ] Friend system in store + UI
- [ ] Friend request/accept via relay
- [ ] Public profile toggle
- [ ] UCAN token generation + verification
- [ ] Profile cloud sync
- [ ] QR code generation for DID + UCAN tokens

---

## WCD-31: LLM Agent Integration & Multi-Modal

### Objective
Upgrade Brain overlay for multi-modal interactions: image upload, voice input, TTS output. Add agent system for natural language commands.

### Implementation Plan

#### 31.1 Voice Input (Speech-to-Text)
```typescript
// Use Web Speech API:
// const recognition = new webkitSpeechRecognition();
// recognition.continuous = false;
// recognition.interimResults = true;

// UI:
// - Microphone button in Brain overlay
// - Pulsing animation while recording
// - Show transcript in real-time
// - Send to LLM on end of speech

// Fallback:
// - If API unavailable: show text input
// - Browser support: Chrome, Edge (not Firefox/Safari)
```

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/overlays/BrainOverlay.tsx`
- `spaceship-earth/src/hooks/useVoiceInput.ts` (NEW)

#### 31.2 Image Upload
```typescript
// UI buttons:
// - "Camera" - use navigator.mediaDevices.getUserMedia
// - "Upload" - file input accept="image/*"

// Processing:
// - Convert to base64 data URL
// - If multi-modal model: include in prompt
// - If text-only model: stub for vision API (future)

// Security:
// - Max file size: 5MB
// - Accepted formats: jpg, png, webp
```

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/overlays/BrainOverlay.tsx`
- `spaceship-earth/src/services/imageProcessor.ts` (NEW)

#### 31.3 Text-to-Speech Output
```typescript
// Use Web Speech API:
// const utterance = new SpeechSynthesisUtterance(text);
// utterance.rate = 0.9;
// utterance.pitch = 1.0;

// UI toggle:
// - "Read Aloud" button in Brain overlay
// - Persist preference: localStorage['p31-tts']

// Accessibility:
// - Respect prefers-reduced-audio
// - If reduced: disable TTS automatically

// Voice selection:
// - Use default system voice
// - Prefer English voices
```

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/overlays/BrainOverlay.tsx`
- `spaceship-earth/src/hooks/useTextToSpeech.ts` (NEW)

#### 31.4 Agent System
```typescript
// Define agent tools:
type AgentTool = 
  | { tool: 'change_skin', args: { theme: string } }
  | { tool: 'mount_cartridge', args: { slot: number, cartridge: string } }
  | { tool: 'set_accent_color', args: { color: string } }
  | { tool: 'open_overlay', args: { room: string } }
  | { tool: 'get_status', args: {} };

// System prompt:
// "You are P31 Copilot. Available tools: [tool definitions]. 
// Respond with JSON for tool calls, natural language otherwise."

// Execution:
// - Parse LLM response for JSON tool calls
// - Execute via useSovereignStore actions
// - Return confirmation to LLM for context

// Error handling:
// - Invalid tool: "I can't do that"
// - Failed action: "Something went wrong: [error]"
```

**Files Created:**
- `spaceship-earth/src/services/agentTools.ts` (NEW)

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/overlays/BrainOverlay.tsx`

#### 31.5 Context-Aware System Prompt
```typescript
// Enhance buildSystemContext():
function buildSystemContext(): string {
  const state = useSovereignStore.getState();
  return `
You are P31 Copilot, an AI assistant for the Spaceship Earth cognitive dashboard.
Current state:
- Room: ${state.activeRoom}
- Coherence: ${state.coherence.toFixed(2)}
- Spoons: ${state.spoons}/${state.maxSpoons}
- Active cartridges: ${Object.values(state.dynamicSlots).filter(Boolean).join(', ') || 'none'}
- Open overlay: ${state.openOverlay || 'none'}
- Recent actions: [from chat history]

Available tools:
- change_skin(theme): Change UI theme
- mount_cartridge(slot, cartridge): Load a cartridge
- set_accent_color(color): Set accent color (hex)
- open_overlay(room): Open a room overlay

Respond naturally. If the user asks to do something, use a tool.
`;
}
```

**Files Modified:**
- `spaceship-earth/src/services/copilot.ts` (NEW or extend existing)

### Deliverables Checklist
- [ ] Voice input with Web Speech API
- [ ] Image upload (camera + file)
- [ ] TTS for AI responses
- [ ] Agent tool definitions + execution
- [ ] Context-aware system prompt
- [ ] Brain overlay UI with new controls

---

## WCD-32: Production Readiness & Documentation

### Objective
Finalize app for public release: documentation, error reporting, analytics, demo mode. Ensure all production gates are met.

### Implementation Plan

#### 32.1 User Documentation
```typescript
// Help overlay:
// - Accessible from topbar "?" button
// - Sections: Getting Started, Rooms, Audio & Visuals, Profile & Friends, Cartridges & AI
// - Searchable index

// Implementation:
// - HelpOverlay.tsx component
// - Content in: src/content/help/*.md (or JSON)
// - Render markdown to HTML
// - Search: client-side filter
```

**Files Created:**
- `spaceship-earth/src/components/HelpOverlay.tsx`
- `spaceship-earth/src/content/help/` (markdown files)

#### 32.2 Error Reporting & Logging
```typescript
// Integration: Sentry or custom endpoint
// Endpoint: POST /errors
// Body: { message, stack, userContext: { room, action }, timestamp }

// Implementation:
// - Wrap app in ErrorBoundary (existing: OverlayErrorBoundary)
// - Add global error handler: window.onerror
// - Add unhandled promise rejection handler
// - Exclude PII from reports

// Store errors:
// - localStorage['p31-errors'] = array of recent errors
// - Display in Profile overlay for debugging
```

**Files Modified:**
- `spaceship-earth/src/main.tsx` — add error handlers
- `spaceship-earth/src/services/errorReporter.ts` (NEW)
- `spaceship-earth/worker/errors.ts` (NEW) — CF Worker stub

#### 32.3 Analytics (Opt-In)
```typescript
// Track (opt-in only):
// - Feature usage: overlay_open, cartridge_mount, theme_change
// - Performance: FPS, memory (aggregated)
// - Session: duration, page views

// Consent dialog:
// - First launch: "Help us improve P31 Labs"
// - Options: "Accept", "Decline"
// - Store: localStorage['p31-analytics-consent']

// Implementation:
// - analytics.ts service
// - localStorage buffer, periodic upload
// - No PII collected
```

**Files Created:**
- `spaceship-earth/src/services/analytics.ts`
- `spaceship-earth/src/components/AnalyticsConsent.tsx`

#### 32.4 Demo Mode Enhancements
```typescript
// Extend ?demo=true flag:
// - Pre-load demo cartridges
// - Pre-fill Brain chat with example conversation
// - Add guided tour (step-by-step overlay)

// Tour steps:
// 1. "Welcome to Spaceship Earth" -> Next
// 2. "This is the Observatory" -> Next
// 3. "Drag to look around" -> Next
// 4. "Tap a room to enter" -> Done

// Reset demo:
// - "Reset Demo" button clears state
// - Removes localStorage['p31-*'] entries
// - Reloads page
```

**Files Modified:**
- `spaceship-earth/src/components/rooms/sovereign/SovereignShell.tsx` — demo enhancements
- `spaceship-earth/src/components/GuidedTour.tsx` (NEW)

#### 32.5 Build & Deployment Automation
```typescript
// GitHub Actions workflow:
// .github/workflows/deploy.yml

// On push to main:
// 1. Install dependencies
// 2. Run lint: npx eslint .
// 3. Build: npm run build
// 4. Run tests: npm run test (when fixed)
// 5. Deploy: wrangler pages deploy

// Status badge:
// - Add to README.md
// - Use shields.io or GitHub status
```

**Files Created:**
- `.github/workflows/deploy.yml`

#### 32.6 Production Gates Checklist
```typescript
// Verify all:
// [ ] CSP without unsafe-eval (Babel in worker)
// [ ] PWA install prompt works
// [ ] WebGPU fallback to WebGL
// [ ] DID keys persist across updates
// [ ] LLM streaming works
// [ ] No console errors on load

// Document known limitations:
// - iOS Web Bluetooth not supported
// - Voice input: Chrome/Edge only
// - Some features require HTTPS
```

**Files Modified:**
- `README.md` — production status
- `SECURITY.md` — security considerations

### Deliverables Checklist
- [ ] Help overlay with searchable docs
- [ ] Error tracking integration
- [ ] Analytics consent + collection
- [ ] Enhanced demo mode with tour
- [ ] CI/CD workflow
- [ ] Production gate validation report

---

## Dependencies Matrix

```
WCD-26 ──────┬──> WCD-27
 │             │
 │             └──> WCD-28 (FPS for particles)
 │
 ├──────────────> WCD-30 (profile persistence)
 │
 └──────────────> WCD-31 (audio feedback for AI)

WCD-28 ───────> WCD-30 (telemetry for friends)
                │
                └─> WCD-32 (analytics)

WCD-29 ───────> WCD-31 (theme persistence)
                │
                └─> WCD-32 (docs reference)

WCD-30 ───────> WCD-32 (profile in docs)

WCD-31 ───────> WCD-32 (AI in docs)
```

---

## File Summary

### New Files to Create

| WCD | Files |
|-----|-------|
| 26 | `src/services/audio/AudioZoneManager.ts`, `src/hooks/useAudio.ts` |
| 27 | `src/effects/GPUParticleSystem.ts`, `src/effects/shaders/particle.vert`, `src/effects/shaders/particle.frag` |
| 28 | `src/services/performanceMonitor.ts`, `src/components/ui/StatsPanel.tsx`, `worker/telemetry.ts`, `src/components/ui/QualitySettings.tsx` |
| 29 | `src/components/ui/ThemeEditor.tsx` |
| 30 | `src/services/ucan.ts`, `src/hooks/useCartridgeShare.ts`, `src/services/profileSync.ts` |
| 31 | `src/hooks/useVoiceInput.ts`, `src/services/imageProcessor.ts`, `src/hooks/useTextToSpeech.ts`, `src/services/agentTools.ts`, `src/services/copilot.ts` |
| 32 | `src/components/HelpOverlay.tsx`, `src/services/errorReporter.ts`, `worker/errors.ts`, `src/services/analytics.ts`, `src/components/AnalyticsConsent.tsx`, `src/components/GuidedTour.tsx`, `.github/workflows/deploy.yml` |

### Existing Files to Modify

| WCD | Files |
|-----|-------|
| 26 | `src/services/audioManager.ts`, `src/components/rooms/sovereign/ImmersiveCockpit.tsx` |
| 27 | `src/effects/GPUParticleSystem.ts`, `src/components/rooms/sovereign/ImmersiveCockpit.tsx`, `src/components/rooms/sovereign/SovereignShell.tsx`, `src/main.tsx` |
| 28 | `src/sovereign/useSovereignStore.ts`, `src/services/toast.ts` |
| 29 | `src/sovereign/types.ts`, `src/styles.css`, `src/components/ui/ThemeEditor.tsx`, `src/components/rooms/sovereign/overlays/BridgeOverlay.tsx` |
| 30 | `src/sovereign/useSovereignStore.ts`, `src/components/ProfileOverlay.tsx`, `worker/relay.ts`, `src/components/CartridgeDrawer.tsx`, `src/components/TopBar.tsx` |
| 31 | `src/components/rooms/sovereign/overlays/BrainOverlay.tsx` |
| 32 | `src/main.tsx`, `README.md`, `SECURITY.md` |

---

## Notes

- **WCD-27 depends on WCD-26** for spatial audio positioning of particles
- **WCD-28 provides FPS data** needed by WCD-27 for auto-performance scaling
- **WCD-29 theming** should complete before WCD-31 to ensure agent tools can persist theme changes
- **Testing**: Prioritize Android Chrome for WCD-31 (voice input), all wcds for tablet performance (WCD-28)
- **Accessibility**: Ensure all new features respect `prefers-reduced-motion` and `prefers-reduced-audio`
