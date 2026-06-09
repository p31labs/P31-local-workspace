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

## WCD-29: Polymorphic Skin Engine & Theme UI

### Constraint
- r128 compatibility: All material mutations via `meshRef.current.property = value` — no r160+ material APIs
- CSS custom property animation requires `@property` registration with `syntax: '<color>'` — Chrome/Edge only. Firefox fallback: transition on actual properties (`background-color`, `color`), not CSS variables.

### Tasks

#### 29.1 — Zustand Theme Store
```yaml
action: CREATE
file: spaceship-earth/src/stores/themeStore.ts
```

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SkinTheme = 'OPERATOR' | 'KIDS' | 'GRAY_ROCK' | 'HIGH_CONTRAST' | 'LOW_MOTION';

export interface ThemeConfig {
  name: string;
  skin: SkinTheme;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  glassOpacity: number;
  reduceMotion: boolean;
}

const THEME_PRESETS: Record<SkinTheme, ThemeConfig> = {
  OPERATOR: {
    name: 'Operator',
    skin: 'OPERATOR',
    background: '#020617',
    primary: '#22d3ee',    // cyan
    secondary: '#d946ef',  // magenta
    accent: '#C9B1FF',     // soft lavender
    glassOpacity: 0.15,
    reduceMotion: false,
  },
  KIDS: {
    name: 'Kids',
    skin: 'KIDS',
    background: '#1e1b4b',
    primary: '#E9C46A',    // butter yellow
    secondary: '#E76F51',  // soft coral
    accent: '#2A9D8F',     // warm teal
    glassOpacity: 0.25,
    reduceMotion: false,
  },
  GRAY_ROCK: {
    name: 'Gray Rock',
    skin: 'GRAY_ROCK',
    background: '#1a1a2e',
    primary: '#64748B',
    secondary: '#475569',
    accent: '#94a3b8',
    glassOpacity: 0.05,
    reduceMotion: true, // ZERO animations in Gray Rock
  },
  HIGH_CONTRAST: {
    name: 'High Contrast',
    skin: 'HIGH_CONTRAST',
    background: '#000000',
    primary: '#00FFFF',
    secondary: '#FF00FF',
    accent: '#FFFF00',
    glassOpacity: 0.0,
    reduceMotion: false,
  },
  LOW_MOTION: {
    name: 'Low Motion',
    skin: 'LOW_MOTION',
    background: '#020617',
    primary: '#22d3ee',
    secondary: '#d946ef',
    accent: '#C9B1FF',
    glassOpacity: 0.15,
    reduceMotion: true,
  },
};

interface ThemeState {
  config: ThemeConfig;
  setSkin: (skin: SkinTheme) => void;
  setAccentColor: (color: string) => void;
  setConfig: (partial: Partial<ThemeConfig>) => void;
  importTheme: (json: string) => boolean;
  exportTheme: () => string;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      config: THEME_PRESETS.OPERATOR,

      setSkin: (skin) => {
        const preset = THEME_PRESETS[skin];
        if (!preset) return;
        set({ config: preset });
        // Apply data-theme attribute for CSS cascade
        document.documentElement.setAttribute('data-theme', skin.toLowerCase());
      },

      setAccentColor: (color) => {
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return; // Validate hex
        set((s) => ({ config: { ...s.config, accent: color } }));
      },

      setConfig: (partial) => {
        set((s) => ({ config: { ...s.config, ...partial } }));
      },

      importTheme: (json) => {
        try {
          const parsed = JSON.parse(json);
          // Validate required fields
          const required = ['name', 'skin', 'background', 'primary', 'secondary', 'accent'];
          for (const key of required) {
            if (!(key in parsed)) return false;
          }
          // Validate hex colors
          const hexFields = ['background', 'primary', 'secondary', 'accent'];
          for (const key of hexFields) {
            if (!/^#[0-9A-Fa-f]{6}$/.test(parsed[key])) return false;
          }
          set({ config: { ...THEME_PRESETS.OPERATOR, ...parsed } });
          return true;
        } catch {
          return false;
        }
      },

      exportTheme: () => JSON.stringify(get().config, null, 2),
    }),
    { name: 'p31-theme' }
  )
);

export { THEME_PRESETS };
```

**Acceptance**: Store created. `useThemeStore.getState().config` returns valid ThemeConfig. `setSkin('GRAY_ROCK')` updates config AND sets `data-theme` attribute on `<html>`. `importTheme` rejects invalid JSON and invalid hex colors.

---

#### 29.2 — CSS Variable Cascade + @property Registration
```yaml
action: MODIFY
file: spaceship-earth/src/styles.css
```

Add to top of file:
```css
/* @property registrations for animatable CSS custom properties (Chrome/Edge) */
@property --p31-bg { syntax: '<color>'; inherits: true; initial-value: #020617; }
@property --p31-primary { syntax: '<color>'; inherits: true; initial-value: #22d3ee; }
@property --p31-secondary { syntax: '<color>'; inherits: true; initial-value: #d946ef; }
@property --p31-accent { syntax: '<color>'; inherits: true; initial-value: #C9B1FF; }
@property --p31-glass { syntax: '<number>'; inherits: true; initial-value: 0.15; }

:root {
  --p31-bg: #020617;
  --p31-primary: #22d3ee;
  --p31-secondary: #d946ef;
  --p31-accent: #C9B1FF;
  --p31-glass: 0.15;
  transition: --p31-bg 0.3s ease, --p31-primary 0.3s ease, --p31-secondary 0.3s ease, --p31-accent 0.3s ease;
}

/* Fallback for Firefox: transition actual properties */
[data-theme] * {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* Theme overrides */
[data-theme="operator"] { --p31-bg: #020617; --p31-primary: #22d3ee; --p31-secondary: #d946ef; --p31-accent: #C9B1FF; }
[data-theme="kids"] { --p31-bg: #1e1b4b; --p31-primary: #E9C46A; --p31-secondary: #E76F51; --p31-accent: #2A9D8F; }
[data-theme="gray_rock"] { --p31-bg: #1a1a2e; --p31-primary: #64748B; --p31-secondary: #475569; --p31-accent: #94a3b8; }
[data-theme="high_contrast"] { --p31-bg: #000000; --p31-primary: #00FFFF; --p31-secondary: #FF00FF; --p31-accent: #FFFF00; }
[data-theme="low_motion"],
[data-theme="gray_rock"] {
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0s !important; transition-duration: 0s !important; }
}
```

**Acceptance**: Theme switching via `data-theme` attribute instantly re-styles all DOM elements. Gray Rock and Low Motion have zero animations. `@property` transitions work in Chrome; Firefox uses fallback property transitions.

---

#### 29.3 — WebGL Transient Material Mutation Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useThemeMaterial.ts
```

```typescript
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeStore } from '../stores/themeStore';

// Module-scope allocations — NEVER inside useFrame
const _targetColor = new THREE.Color();
const _targetEmissive = new THREE.Color();

interface ThemeMaterialTargets {
  OPERATOR: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  KIDS: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  GRAY_ROCK: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  HIGH_CONTRAST: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
  LOW_MOTION: { emissiveIntensity: number; roughness: number; color: string; emissive: string };
}

const MATERIAL_TARGETS: ThemeMaterialTargets = {
  OPERATOR: { emissiveIntensity: 2.5, roughness: 0.2, color: '#C9B1FF', emissive: '#C9B1FF' },
  KIDS: { emissiveIntensity: 0.5, roughness: 0.8, color: '#E9C46A', emissive: '#E9C46A' },
  GRAY_ROCK: { emissiveIntensity: 0.0, roughness: 1.0, color: '#64748B', emissive: '#000000' },
  HIGH_CONTRAST: { emissiveIntensity: 3.0, roughness: 0.1, color: '#00FFFF', emissive: '#00FFFF' },
  LOW_MOTION: { emissiveIntensity: 2.5, roughness: 0.2, color: '#C9B1FF', emissive: '#C9B1FF' },
};

/**
 * Attaches to a meshStandardMaterial ref and interpolates
 * material properties based on active theme.
 * Uses transient Zustand pattern — NO React re-renders.
 */
export function useThemeMaterial(
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>,
  lerpSpeed: number = 5
) {
  useFrame((_state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    // Imperative fetch — no subscription, no re-render
    const skin = useThemeStore.getState().config.skin;
    const targets = MATERIAL_TARGETS[skin] ?? MATERIAL_TARGETS.OPERATOR;

    // Lerp color
    _targetColor.set(targets.color);
    mat.color.lerp(_targetColor, lerpSpeed * delta);

    // Lerp emissive
    _targetEmissive.set(targets.emissive);
    mat.emissive.lerp(_targetEmissive, lerpSpeed * delta);

    // Lerp scalars
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity, targets.emissiveIntensity, lerpSpeed * delta
    );
    mat.roughness = THREE.MathUtils.lerp(
      mat.roughness, targets.roughness, lerpSpeed * delta
    );
  });
}
```

**Acceptance**: Hook attaches to any `meshStandardMaterial` ref. Theme change causes smooth 0.2-0.5s interpolation. Zero React re-renders during transition. Zero object allocations in useFrame. Verified via Chrome Performance panel: no GC markers during theme switch.

---

#### 29.4 — Post-Processing Intensity Control
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useThemePostProcessing.ts
```

```typescript
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeStore } from '../stores/themeStore';

interface PostProcessingRefs {
  bloomPass?: { luminanceThreshold: number; intensity: number };
  dofPass?: { bokehScale: number };
}

const POSTFX_TARGETS = {
  OPERATOR: { bloomThreshold: 0.6, bloomIntensity: 1.5, dofScale: 2 },
  KIDS: { bloomThreshold: 0.8, bloomIntensity: 0.8, dofScale: 4 },
  GRAY_ROCK: { bloomThreshold: 99, bloomIntensity: 0, dofScale: 0 }, // Effectively disabled
  HIGH_CONTRAST: { bloomThreshold: 0.3, bloomIntensity: 2.0, dofScale: 0 },
  LOW_MOTION: { bloomThreshold: 0.6, bloomIntensity: 1.5, dofScale: 0 },
};

/**
 * CRITICAL: NEVER unmount EffectComposer, bloom, or DoF passes.
 * Unmounting forces shader recompilation = multi-second freeze on Android.
 * Instead, lerp intensity to 0.
 */
export function useThemePostProcessing(refs: PostProcessingRefs) {
  useFrame((_state, delta) => {
    const skin = useThemeStore.getState().config.skin;
    const targets = POSTFX_TARGETS[skin] ?? POSTFX_TARGETS.OPERATOR;

    if (refs.bloomPass) {
      refs.bloomPass.luminanceThreshold = THREE.MathUtils.lerp(
        refs.bloomPass.luminanceThreshold, targets.bloomThreshold, 5 * delta
      );
      refs.bloomPass.intensity = THREE.MathUtils.lerp(
        refs.bloomPass.intensity, targets.bloomIntensity, 5 * delta
      );
    }

    if (refs.dofPass) {
      refs.dofPass.bokehScale = THREE.MathUtils.lerp(
        refs.dofPass.bokehScale, targets.dofScale, 5 * delta
      );
    }
  });
}
```

**Acceptance**: Bloom and DoF passes are NEVER unmounted/remounted during theme switch. Gray Rock drives all intensities to 0. No shader recompilation events visible in Chrome Performance panel.

---

#### 29.5 — Theme Editor Component
```yaml
action: CREATE
file: spaceship-earth/src/components/ui/ThemeEditor.tsx
```

```typescript
// React component with:
// - Preset buttons for each SkinTheme (grid layout)
// - Color pickers for: primary, secondary, accent (HTML <input type="color">)
// - Glass opacity slider (range 0-1, step 0.05)
// - Reduce motion toggle (checkbox)
// - "Reset to Default" button -> setSkin('OPERATOR')
// - "Copy Theme JSON" button -> navigator.clipboard.writeText(exportTheme())
// - "Import Theme" -> textarea + paste + importTheme(json)
// - Live preview: changes apply immediately via setConfig()

// Integration:
// - Mount inside BridgeOverlay.tsx as a new "THEMES" tab (6th tab)
// - Use existing tab navigation pattern from BridgeOverlay
```

**Acceptance**: Theme editor renders in Bridge overlay. Color changes apply in real-time to both DOM and WebGL. Export produces valid JSON. Import validates and rejects malformed input. Reset returns to Operator preset.

---

#### 29.6 — Bridge Overlay Integration
```yaml
action: MODIFY
file: spaceship-earth/src/components/rooms/sovereign/overlays/BridgeOverlay.tsx
```

```
- Add 'THEMES' to tab array (after HW tab)
- Import ThemeEditor component
- Render ThemeEditor when THEMES tab is active
- No other changes to existing tabs
```

**Acceptance**: Themes tab appears in Bridge overlay. Clicking it renders ThemeEditor. Other tabs unaffected.

### WCD-29 Deliverables
- [ ] themeStore.ts with 5 presets + import/export + hex validation
- [ ] CSS @property registrations + data-theme cascade + Firefox fallback
- [ ] useThemeMaterial.ts hook (transient pattern, zero GC)
- [ ] useThemePostProcessing.ts hook (never unmount, lerp to zero)
- [ ] ThemeEditor.tsx component
- [ ] Bridge overlay THEMES tab integration
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-28: Performance Monitoring & Telemetry

### Constraint
- `performance.memory` is Chrome-only and deprecated. Use as best-effort, never build UI that requires it.
- `EXT_disjoint_timer_query` is disabled on most mobile browsers (Spectre mitigations). Graceful fallback to no GPU timing.
- Telemetry MUST be disabled in Kids mode (COPPA). Check `useThemeStore.getState().config.skin !== 'KIDS'` before any collection.

### Tasks

#### 28.1 — Performance Monitor Service
```yaml
action: CREATE
file: spaceship-earth/src/services/performanceMonitor.ts
```

```typescript
interface PerformanceMetrics {
  fps: number;
  fpsMin: number;
  fpsMax: number;
  frameTime: number;        // ms
  memory: number | null;     // bytes, Chrome-only, null if unavailable
  gpuTime: number | null;    // ms, EXT_disjoint_timer_query, null if unavailable
  particleCount: number;
  timestamp: number;
}

// Architecture:
// - Ring buffer: 300 samples (5 minutes at 1Hz sampling)
// - FPS: rolling average of last 60 frame deltas
// - Sample once per second (not per frame)
// - Expose getMetrics(): PerformanceMetrics (current snapshot)
// - Expose getHistory(): PerformanceMetrics[] (ring buffer)
// - Expose getPerformanceLevel(): 'high' | 'medium' | 'low'
//   - high: avg FPS >= 55
//   - medium: avg FPS 40-55
//   - low: avg FPS < 40

// Performance level triggers:
// - On transition to 'low': dispatch event 'p31:perf:low'
// - On sustained 'low' for 10s: dispatch event 'p31:perf:critical'

// Memory detection:
// - Check (performance as any).memory?.usedJSHeapSize
// - If unavailable: memory = null (do not error)

// GPU timing:
// - Check gl.getExtension('EXT_disjoint_timer_query_webgl2')
// - If unavailable: gpuTime = null
// - If available: use disjoint timer query per frame (sample at 1Hz like everything else)

export class PerformanceMonitor {
  private buffer: PerformanceMetrics[] = [];
  private frameTimes: number[] = [];
  private lastSampleTime = 0;
  // ... implementation
}

export const performanceMonitor = new PerformanceMonitor(); // Singleton
```

**Acceptance**: `performanceMonitor.getMetrics()` returns current FPS. `getPerformanceLevel()` returns correct tier. Memory and GPU fields are null (not error) when unsupported. Ring buffer caps at 300 entries.

---

#### 28.2 — R3F Integration Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/usePerformanceMonitor.ts
```

```typescript
import { useFrame } from '@react-three/fiber';
import { performanceMonitor } from '../services/performanceMonitor';

/**
 * Call once in root Canvas component.
 * Feeds frame deltas to the performance monitor.
 */
export function usePerformanceMonitor() {
  useFrame((_state, delta) => {
    performanceMonitor.recordFrame(delta);
  });
}
```

**Acceptance**: Hook records every frame delta. No allocations inside useFrame.

---

#### 28.3 — Stats Overlay Panel
```yaml
action: CREATE
file: spaceship-earth/src/components/ui/StatsPanel.tsx
```

```typescript
// Activation: ?stats=1 URL parameter
// Display:
// - Current FPS (color: green >55, yellow 40-55, red <40)
// - Frame time (ms)
// - Memory (MB, Chrome only, or "N/A")
// - GPU time (ms, or "N/A")
// - Active particle count (from useSovereignStore)
// - Performance level badge (HIGH/MED/LOW)

// UI:
// - Fixed position top-right
// - Draggable (pointer events)
// - Semi-transparent dark background
// - Monospace font (Space Mono)
// - Toggle visibility button (minimize to just FPS number)
// - Updates at 1Hz (not per frame — use setInterval in useEffect)

// IMPORTANT: This component subscribes to performanceMonitor
// via setInterval, NOT via useFrame. It is a DOM component,
// not an R3F component.
```

**Acceptance**: Panel appears only when `?stats=1` is in URL. FPS color-coded correctly. Draggable. Minimizable. Updates 1Hz. No performance impact from the panel itself.

---

#### 28.4 — Telemetry Upload (COPPA-gated)
```yaml
action: CREATE
file: spaceship-earth/worker/telemetry.ts
```

```typescript
// Cloudflare Worker endpoint: POST /telemetry
// Body: {
//   sessionId: string (random UUID, not tied to DID),
//   device: { ua: string, screen: string, dpr: number },
//   metrics: { avgFps: number, minFps: number, maxFps: number },
//   skin: string // current theme
// }
//
// CRITICAL: Reject if skin === 'KIDS'. Return 403.
// Store in KV: key = `telemetry:${sessionId}:${Date.now()}`
// TTL: 30 days
// No PII. No DID. No location. Anonymous only.

// Client-side (in performanceMonitor.ts):
// - Upload every 60 seconds IF:
//   1. telemetryEnabled === true in consent state
//   2. skin !== 'KIDS' (checked at upload time, not just consent time)
// - Debounce: skip upload if last upload was < 55s ago
```

**Acceptance**: Worker accepts POST, stores in KV, returns 200. Rejects Kids mode with 403. Client never uploads when skin is KIDS.

---

#### 28.5 — Quality Settings Dialog
```yaml
action: CREATE
file: spaceship-earth/src/components/ui/QualitySettings.tsx
```

```typescript
// Triggered by: p31:perf:critical event (sustained low FPS)
// Display:
// - "Performance is limited on this device"
// - Options: "High Quality", "Balanced", "Battery Saver"
// - "Don't show again" checkbox
// - Persist: IndexedDB key 'p31-quality-preference'
//   Values: 'auto' | 'high' | 'balanced' | 'low'

// Quality levels control:
// - high: max particles, full bloom, full audio sources
// - balanced: 50% particles, reduced bloom intensity, 4 audio sources
// - low: 25% particles, no bloom, 2 audio sources, frameloop='demand'

// Auto mode: uses performanceMonitor.getPerformanceLevel() to select
```

**Acceptance**: Dialog appears after 10s sustained low FPS. Selection persists in IndexedDB. Quality level affects particle count and post-processing. "Don't show again" suppresses future dialogs.

---

#### 28.6 — Error Logging (Ring Buffer in IndexedDB)
```yaml
action: CREATE
file: spaceship-earth/src/services/errorReporter.ts
```

```typescript
// IMPORTANT: Do NOT use localStorage for error storage.
// localStorage is synchronous (blocks main thread) and shared.
// Use IndexedDB via idb-keyval with ring buffer.

import { get, set } from 'idb-keyval';

const MAX_ERRORS = 100;
const STORE_KEY = 'p31-error-log';

interface ErrorEntry {
  message: string;
  stack?: string;
  context: { room?: string; action?: string; skin?: string };
  timestamp: number;
}

export async function logError(entry: ErrorEntry): Promise<void> {
  const existing: ErrorEntry[] = (await get(STORE_KEY)) ?? [];
  existing.push(entry);
  // Ring buffer: prune oldest if over limit
  while (existing.length > MAX_ERRORS) existing.shift();
  await set(STORE_KEY, existing);
}

// Install global handlers in main.tsx:
// window.onerror = (msg, src, line, col, err) => logError({...})
// window.onunhandledrejection = (event) => logError({...})
```

**Acceptance**: Errors stored in IndexedDB, not localStorage. Ring buffer never exceeds 100 entries. Global handlers catch uncaught errors and unhandled rejections.

### WCD-28 Deliverables
- [ ] performanceMonitor.ts singleton with ring buffer + performance levels
- [ ] usePerformanceMonitor.ts R3F hook
- [ ] StatsPanel.tsx (?stats=1 activation)
- [ ] worker/telemetry.ts CF Worker (COPPA-gated)
- [ ] QualitySettings.tsx auto-detect dialog
- [ ] errorReporter.ts with IndexedDB ring buffer (NOT localStorage)
- [ ] Global error handlers in main.tsx
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-26: Enhanced Spatial Audio & 3D Soundscapes

### Constraint
- Max 6 simultaneous PannerNode sources on Android tablets. Exceeding this causes audio thread starvation → frame drops.
- All spatial position updates throttled to 10Hz (100ms interval), not per-frame.
- Web Audio AudioContext requires user gesture to resume. Gate on first user interaction.

### Tasks

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

---

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

---

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

---

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

### Tasks

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

---

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

---

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

---

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

---

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

## WCD-30: Profile & DID Enhancements

### Constraint
- NO centralized server state for profiles. Local-first sovereignty.
- Friend discovery via room co-presence, not relay-mediated requests.
- UCAN tokens are the ONLY trust/delegation primitive.
- Profile sync: CRDT (Automerge) over relay, NOT last-write-wins PUT/GET.

### Tasks

#### 30.1 — Friend System (Co-Presence Based)
```yaml
action: MODIFY
file: spaceship-earth/src/sovereign/useSovereignStore.ts
```

```typescript
// Add to store:
interface FriendsSlice {
  friends: Map<string, { did: string; displayName: string; lastSeen: number }>;
  addFriend: (did: string, displayName: string) => void;
  removeFriend: (did: string) => void;
}

// Friend discovery:
// When two users are in the same BONDING multiplayer room,
// they see each other's DID broadcast via the relay.
// UI prompt: "You're playing with [name]. Add as friend?"
// Accept: stores DID + displayName in IndexedDB
// NO relay-mediated friend requests. NO server-side friend list.
// Friends list is LOCAL ONLY (sovereign data).
```

**Acceptance**: Friends discovered through room co-presence only. No server-side friend storage. Friend list persists in IndexedDB.

---

#### 30.2 — UCAN Delegation for Cartridge Sharing
```yaml
action: CREATE
file: spaceship-earth/src/services/ucan.ts
```

```typescript
// UCAN token structure:
interface UCANToken {
  iss: string;        // Issuer DID (Ed25519 public key)
  aud: string;        // Audience DID (recipient)
  exp: number;        // Expiration (Unix timestamp)
  prm: {
    cartridgeId: string;
    slot: number;
    access: 'read';   // Read-only sharing only
  };
  sig: string;        // Ed25519 signature of header+payload
}

// Generate: sign with user's DID keypair (from Genesis Block)
// Verify: check sig against iss public key
// Display: as QR code (qrcode library) or copyable text

// Receive flow:
// 1. Scan QR or paste token
// 2. Verify signature
// 3. Check expiration
// 4. If valid: add to "Shared With Me" section in CartridgeDrawer
// 5. Read-only access only — cannot modify shared cartridge
```

**Acceptance**: UCAN token generates from DID keypair. Signature verifies correctly. Expired tokens rejected. QR code displays and scans.

---

#### 30.3 — Profile Overlay Enhancements
```yaml
action: MODIFY
file: spaceship-earth/src/components/ProfileOverlay.tsx
```

```
Add:
- Friends section: list of friends with displayName + lastSeen
- "Share Profile" button: generates QR code of DID
- "Shared With Me" section: list of received UCAN cartridge tokens
- Public/Private toggle: controls whether displayName is broadcast in rooms
  - Store in IndexedDB, NOT on relay server
  - Private = DID only broadcast, no displayName
```

---

#### 30.4 — CartridgeDrawer Share UI
```yaml
action: MODIFY
file: spaceship-earth/src/components/CartridgeDrawer.tsx
```

```
Add to each cartridge card:
- "Share" button -> generates UCAN token -> shows QR + copy
- "Shared With Me" tab: lists received cartridges
  - Read-only badge
  - "From: [displayName]" attribution
  - Expiration countdown
```

### WCD-30 Deliverables
- [ ] Friends slice in store (co-presence discovery, local-only)
- [ ] UCAN token generation + verification
- [ ] QR code display for DID + UCAN tokens
- [ ] Profile overlay with friends + sharing
- [ ] CartridgeDrawer share/receive UI
- [ ] NO server-side profile storage
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-31: LLM Agent Integration & Multi-Modal

### Constraint
- Agent tool calls MUST be validated + rate-limited (max 1 tool call per 2 seconds).
- All hex color inputs validated: `/^#[0-9A-Fa-f]{6}$/`
- Cartridge names must match existing cartridge enum.
- Overlay names must match ROOMS array.
- Voice input: Chrome/Edge only. Graceful fallback to text.
- TTS: respects `prefers-reduced-audio` and Gray Rock mode (disabled).

### Tasks

#### 31.1 — Voice Input Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useVoiceInput.ts
```

```typescript
// Web Speech API wrapper:
// - Returns: { startListening, stopListening, transcript, isListening, isSupported }
// - isSupported: checks window.webkitSpeechRecognition || window.SpeechRecognition
// - If unsupported: isSupported = false, all methods no-op
// - continuous = false, interimResults = true
// - On end: returns final transcript
// - Pulsing animation state via isListening
```

---

#### 31.2 — Image Upload
```yaml
action: CREATE
file: spaceship-earth/src/services/imageProcessor.ts
```

```typescript
// processImage(file: File): Promise<string>
// - Validate: file.size <= 5MB, type in ['image/jpeg', 'image/png', 'image/webp']
// - Resize if > 1024px on longest edge (canvas downscale)
// - Convert to base64 data URL
// - Return base64 string for LLM prompt inclusion
```

---

#### 31.3 — Text-to-Speech Hook
```yaml
action: CREATE
file: spaceship-earth/src/hooks/useTextToSpeech.ts
```

```typescript
// speak(text: string): void
// - Uses window.speechSynthesis
// - Rate: 0.9, pitch: 1.0
// - Prefer English voices
// - DISABLED if:
//   - useThemeStore.getState().config.skin === 'GRAY_ROCK'
//   - useThemeStore.getState().config.reduceMotion === true
//   - prefers-reduced-audio media query matches (future CSS spec, check manually)
// - Toggle: persisted in IndexedDB 'p31-tts-enabled'
```

---

#### 31.4 — Agent Tools with Validation + Rate Limiting
```yaml
action: CREATE
file: spaceship-earth/src/services/agentTools.ts
```

```typescript
type AgentTool =
  | { tool: 'change_skin'; args: { theme: string } }
  | { tool: 'mount_cartridge'; args: { slot: number; cartridge: string } }
  | { tool: 'set_accent_color'; args: { color: string } }
  | { tool: 'open_overlay'; args: { room: string } }
  | { tool: 'get_status'; args: Record<string, never> };

// VALID ENUMS (compile-time constants):
const VALID_SKINS = ['OPERATOR', 'KIDS', 'GRAY_ROCK', 'HIGH_CONTRAST', 'LOW_MOTION'] as const;
const VALID_ROOMS = ['observatory', 'bridge', 'brain', 'forge', 'stim'] as const;
const VALID_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// Validation:
function validateToolCall(call: AgentTool): { valid: boolean; error?: string } {
  switch (call.tool) {
    case 'change_skin':
      if (!VALID_SKINS.includes(call.args.theme as any))
        return { valid: false, error: `Invalid skin: ${call.args.theme}` };
      break;
    case 'set_accent_color':
      if (!/^#[0-9A-Fa-f]{6}$/.test(call.args.color))
        return { valid: false, error: `Invalid hex color: ${call.args.color}` };
      break;
    case 'open_overlay':
      if (!VALID_ROOMS.includes(call.args.room as any))
        return { valid: false, error: `Invalid room: ${call.args.room}` };
      break;
    case 'mount_cartridge':
      if (!VALID_SLOTS.includes(call.args.slot as any))
        return { valid: false, error: `Invalid slot: ${call.args.slot}` };
      break;
  }
  return { valid: true };
}

// Rate limiting:
let lastToolExecution = 0;
const TOOL_COOLDOWN_MS = 2000;

async function executeTool(call: AgentTool): Promise<string> {
  const now = Date.now();
  if (now - lastToolExecution < TOOL_COOLDOWN_MS) {
    return 'Too fast. Wait a moment before the next action.';
  }

  const validation = validateToolCall(call);
  if (!validation.valid) return `Error: ${validation.error}`;

  lastToolExecution = now;
  // Execute via Zustand store actions...
  // Return confirmation string for LLM context
}
```

**Acceptance**: Invalid tool calls rejected with clear error message. Rate limit enforced at 2s minimum between calls. Hallucinated hex colors, room names, or skin names never crash the app.

---

#### 31.5 — Context-Aware System Prompt
```yaml
action: CREATE
file: spaceship-earth/src/services/copilot.ts
```

```typescript
function buildSystemPrompt(): string {
  const theme = useThemeStore.getState();
  const sovereign = useSovereignStore.getState();

  return `You are P31 Copilot, an AI assistant for the Spaceship Earth cognitive dashboard.

Current state:
- Skin: ${theme.config.skin}
- Room: ${sovereign.activeRoom || 'cockpit'}
- Coherence: ${sovereign.coherence?.toFixed(2) ?? 'unknown'}
- Spoons: ${sovereign.spoons ?? '?'}/${sovereign.maxSpoons ?? '?'}
- Cartridges: ${Object.entries(sovereign.dynamicSlots ?? {}).filter(([,v]) => v).map(([k,v]) => \`slot \${k}: \${v}\`).join(', ') || 'none loaded'}

Available tools (respond with JSON to use):
- change_skin(theme): Options: ${VALID_SKINS.join(', ')}
- mount_cartridge(slot, cartridge): Slots 1-9
- set_accent_color(color): Hex color like #FF00AA
- open_overlay(room): Options: ${VALID_ROOMS.join(', ')}
- get_status(): Returns current system state

Respond conversationally. Use tools only when the user explicitly requests an action.
Do not use tools preemptively. Confirm before executing destructive actions.`;
}
```

### WCD-31 Deliverables
- [ ] useVoiceInput.ts (Chrome/Edge, graceful fallback)
- [ ] imageProcessor.ts (5MB limit, resize, base64)
- [ ] useTextToSpeech.ts (Gray Rock disabled, preference persisted)
- [ ] agentTools.ts (validation + 2s rate limit + enum guards)
- [ ] copilot.ts (context-aware system prompt)
- [ ] Brain overlay UI integration (mic button, image button, TTS toggle)
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass

---

## WCD-32: Production Readiness & Documentation

### Constraint
- Analytics DISABLED in Kids mode (COPPA).
- No `unsafe-eval` in CSP (Babel replacement: SWC WASM runs in Worker, not eval).
- All console.error/warn calls replaced with errorReporter in production build.

### Tasks

#### 32.1 — Help Overlay
```yaml
action: CREATE
files:
  - spaceship-earth/src/components/HelpOverlay.tsx
  - spaceship-earth/src/content/help/getting-started.md
  - spaceship-earth/src/content/help/rooms.md
  - spaceship-earth/src/content/help/audio-visuals.md
  - spaceship-earth/src/content/help/profile-friends.md
  - spaceship-earth/src/content/help/cartridges-ai.md
```

```
- Accessible from topbar "?" button
- Searchable client-side (filter by keyword in content)
- Render markdown to HTML (use marked or remark)
- Sections: Getting Started, Rooms, Audio & Visuals, Profile & Friends, Cartridges & AI
- Respects current theme (Glass panel styling)
```

---

#### 32.2 — Analytics Consent (COPPA-Compliant)
```yaml
action: CREATE
files:
  - spaceship-earth/src/services/analytics.ts
  - spaceship-earth/src/components/AnalyticsConsent.tsx
```

```typescript
// analytics.ts:
// - Track: overlay_open, cartridge_mount, theme_change (event names only, no PII)
// - Buffer in IndexedDB (NOT localStorage), periodic upload to /telemetry
// - GATED:
//   1. Consent must be granted (IndexedDB 'p31-analytics-consent' === 'granted')
//   2. Skin must NOT be 'KIDS' (checked at recording time AND upload time)
//   3. If skin changes TO 'KIDS' mid-session: flush buffer, stop recording

// AnalyticsConsent.tsx:
// - Shows on first launch IF skin !== 'KIDS'
// - NEVER shows in Kids mode
// - Options: "Help Us Improve" (accept), "No Thanks" (decline)
// - Decline = consent stored as 'declined', no further prompts
// - Can change in Profile overlay later
```

**Acceptance**: Analytics never fires in Kids mode. Consent dialog never appears in Kids mode. Buffer flushes on skin change to Kids. Decline persists permanently.

---

#### 32.3 — Guided Tour (Demo Mode)
```yaml
action: CREATE
file: spaceship-earth/src/components/GuidedTour.tsx
```

```
Activation: ?demo=true URL parameter
Steps:
1. "Welcome to Spaceship Earth" — overlay with P31 logo + "Next"
2. "This is the Observatory" — highlight dome + "Next"
3. "Drag to explore" — show touch gesture hint + "Next"
4. "Tap a room to enter" — highlight room indicators + "Done"

Implementation:
- Step-based state machine
- Highlight via z-index + backdrop overlay with cutout
- "Skip Tour" button always visible
- "Reset Demo" button: clears all IndexedDB 'p31-*' entries, reloads
```

---

#### 32.4 — CI/CD Pipeline
```yaml
action: CREATE
file: .github/workflows/deploy.yml
```

```yaml
name: Deploy Spaceship Earth
on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run build
      # - run: npm run test  # Enable when test suite is stable
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          command: pages deploy dist --project-name=spaceship-earth
```

---

#### 32.5 — Production Gate Checklist
```yaml
action: CREATE
file: PRODUCTION_GATES.md
```

```markdown
# Production Gates — Spaceship Earth

## Must Pass
- [ ] `tsc --noEmit`: 0 errors
- [ ] `npm run build`: 0 errors
- [ ] CSP without unsafe-eval (SWC in Worker, not eval)
- [ ] PWA install prompt works (Android Chrome)
- [ ] DID keys persist across page reload
- [ ] LLM streaming works with tool validation
- [ ] No console errors on cold load
- [ ] Lighthouse Performance ≥ 80 on Android tablet
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Analytics disabled in Kids mode (COPPA)
- [ ] Gray Rock mode: zero animations verified
- [ ] All 5 theme presets render correctly

## Known Limitations (Document, Don't Fix)
- iOS Web Bluetooth not supported
- Voice input: Chrome/Edge only
- GPU timing: Chrome desktop only
- Some features require HTTPS
- Firefox: CSS custom property transitions use fallback
```

### WCD-32 Deliverables
- [ ] HelpOverlay.tsx + 5 markdown content files
- [ ] Analytics with COPPA gate (NEVER in Kids mode)
- [ ] GuidedTour.tsx (?demo=true)
- [ ] GitHub Actions deploy.yml
- [ ] PRODUCTION_GATES.md checklist
- [ ] README.md updated with production status
- [ ] SECURITY.md with CSP + PII + COPPA notes
- [ ] `tsc --noEmit` clean
- [ ] All existing tests pass
- [ ] All production gates pass

---

## DEPENDENCY MATRIX (Revised)

```
WCD-29 (Theming)  ─────────────────────> WCD-31 (LLM needs theme persistence)
    │                                        │
    └──> provides skin enum for ─────────> WCD-32 (docs reference all skins)

WCD-28 (Perf Monitor) ──> WCD-27 (particles read FPS level)
    │                        │
    ├──> WCD-30 (telemetry for profile)
    │
    └──> WCD-32 (analytics uses telemetry worker)

WCD-26 (Audio) ──────────> WCD-27 (particles have audio feedback)
                             │
                             └──> WCD-32 (particles in demo mode)

WCD-30 (Profile) ─────────> WCD-32 (profile in docs)
WCD-31 (LLM) ─────────────> WCD-32 (AI in docs + demo)
```

---

## FILE MANIFEST

### New Files (26 files)
| WCD | File |
|-----|------|
| 29 | `src/stores/themeStore.ts` |
| 29 | `src/hooks/useThemeMaterial.ts` |
| 29 | `src/hooks/useThemePostProcessing.ts` |
| 29 | `src/components/ui/ThemeEditor.tsx` |
| 28 | `src/services/performanceMonitor.ts` |
| 28 | `src/hooks/usePerformanceMonitor.ts` |
| 28 | `src/components/ui/StatsPanel.tsx` |
| 28 | `src/components/ui/QualitySettings.tsx` |
| 28 | `src/services/errorReporter.ts` |
| 28 | `worker/telemetry.ts` |
| 26 | `src/services/audio/AudioZoneManager.ts` |
| 26 | `src/hooks/useAudio.ts` |
| 27 | `src/effects/GPUParticleSystem.ts` |
| 27 | `src/effects/shaders/particle.vert` |
| 27 | `src/effects/shaders/particle.frag` |
| 27 | `src/effects/ParticlePool.ts` |
| 30 | `src/services/ucan.ts` |
| 31 | `src/hooks/useVoiceInput.ts` |
| 31 | `src/services/imageProcessor.ts` |
| 31 | `src/hooks/useTextToSpeech.ts` |
| 31 | `src/services/agentTools.ts` |
| 31 | `src/services/copilot.ts` |
| 32 | `src/components/HelpOverlay.tsx` |
| 32 | `src/services/analytics.ts` |
| 32 | `src/components/AnalyticsConsent.tsx` |
| 32 | `src/components/GuidedTour.tsx` |

### Modified Files (14 files)
| WCD | File |
|-----|------|
| 29 | `src/styles.css` |
| 29 | `src/components/rooms/sovereign/overlays/BridgeOverlay.tsx` |
| 28 | `src/main.tsx` |
| 26 | `src/services/audioManager.ts` |
| 26 | `src/components/rooms/sovereign/ImmersiveCockpit.tsx` |
| 27 | `src/components/rooms/sovereign/ImmersiveCockpit.tsx` |
| 27 | `src/components/rooms/sovereign/SovereignShell.tsx` |
| 30 | `src/sovereign/useSovereignStore.ts` |
| 30 | `src/components/ProfileOverlay.tsx` |
| 30 | `src/components/CartridgeDrawer.tsx` |
| 31 | `src/components/rooms/sovereign/overlays/BrainOverlay.tsx` |
| 32 | `src/main.tsx` |
| 32 | `README.md` |
| 32 | `.github/workflows/deploy.yml` |
