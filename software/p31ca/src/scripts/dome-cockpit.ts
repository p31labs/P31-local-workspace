import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildGeoThree } from "../lib/dome/icosphere-to-three";
import {
  trimHzFromKnob,
  breathInhaleHz,
  breathExhaleHz,
} from "../lib/dome/p31-dome-constants";
import {
  TELEMETRY_URLS,
  fetchWithCache,
  formatTrimHz,
  readDomePerfLite,
  resolveSimplexStateUrl,
  fersDaysRemaining,
  LOVE_LEDGER_TARGET,
  fersUrgencyCss,
} from "../lib/dome/cockpit-shared";
import { makeDomeCockpitFaceMaterial } from "../lib/dome/three-dome-materials";
import {
  fetchPersonalMeshForHud,
  formatMeshHudLine,
} from "../lib/mesh/mesh-snapshot";
import { BottomSheetController } from '../lib/kinematics';

// ================================================================
// 1. TELEMETRY & HUD STATE
// ================================================================
const $ = (id: string) => document.getElementById(id);

/** Hide boot splash and set `body.loaded` so dome.astro paints #webgl-container / HUD visible. */
function dismissDomeSplash(options?: { fadeMs?: number }) {
  const fadeMs = options?.fadeMs ?? 1000;
  document.body.classList.add("loaded");
  const splash = $("loading-screen");
  if (!splash || splash.style.display === "none") return;
  splash.style.pointerEvents = "none";
  splash.style.opacity = "0";
  setTimeout(() => {
    splash.style.display = "none";
  }, fadeMs);
}

function showWebGLError() {
  const container = $("webgl-container");
  if (container) {
    container.innerHTML = `
       <div class="flex flex-col items-center justify-center h-full text-center p-6">
         <svg width="64" height="64" viewBox="0 0 512 512" class="mb-6"><rect width="512" height="512" rx="112" fill="var(--p31-teal)"/><circle cx="390" cy="120" r="48" fill="#cc6247"/><text x="256" y="340" font-family="system-ui" font-weight="900" font-size="220" fill="var(--p31-cloud)" text-anchor="middle">P31</text><rect x="156" y="380" width="200" height="16" rx="8" fill="#cda852"/></svg>
         <h2 class="text-2xl font-bold text-red-400 mb-3" data-i18n="error.webgl.title">WebGL Not Supported</h2>
         <p class="text-p31-cloud mb-6" data-i18n="error.webgl.message">Your browser or device does not support WebGL, which is required for the 3D visualization. Please try a modern browser like Chrome, Firefox, or Edge.</p>
         <button onclick="location.reload()" class="px-6 py-3 bg-white/20 hover:bg-white/30 text-p31-cloud rounded transition-colors" data-i18n="error.retry">Retry</button>
       </div>
     `;
    i18n.apply();
  }
}

function showLoadingError() {
  const container = $("webgl-container");
  if (container) {
    container.innerHTML = `
     <div class="flex flex-col items-center justify-center h-full text-center p-6">
       <svg width="64" height="64" viewBox="0 0 512 512" class="mb-8"><rect width="512" height="512" rx="112" fill="var(--p31-teal)"/><circle cx="390" cy="120" r="48" fill="#cc6247"/><text x="256" y="340" font-family="system-ui" font-weight="900" font-size="220" fill="var(--p31-cloud)" text-anchor="middle">P31</text><rect x="156" y="380" width="200" height="16" rx="8" fill="#cda852"/></svg>
       <div class="text-red-400 font-bold mb-4" data-i18n="error.loading.title">Loading Failed</div>
       <div class="text-p31-cloud mb-6" data-i18n="error.loading.message">Failed to load 3D resources. Please check your connection and try again.</div>
       <button onclick="location.reload()" class="px-6 py-3 bg-white/20 hover:bg-white/30 text-p31-cloud rounded transition-colors" data-i18n="error.retry">Retry</button>
     </div>
   `;
  }
  i18n.apply();
  dismissDomeSplash({ fadeMs: 400 });
}

let currentSpoons = 8;
/** SENTINEL / SIMPLEX spoon scale (max 12); HUD fill uses this cap. */
let maxSpoonsHud = 12;
/** Gray Rock test bypass — `docs/P31-DESIGN-DOCTRINE.md` §7 */
const domeAliveBypass =
  typeof location !== "undefined" && /[?&]alive=1(?:&|$)/.test(location.search);
/** Operator has reached toward the dome (Layer 2 gate). Bypass skips withholding. */
let domeOperatorReached = domeAliveBypass;
/** True while scene should stay low-kinetic (Gray Rock 3D + HUD damp). */
let domeVISuppressed = !domeAliveBypass;
/** Assigned after Three.js scene init; telemetry may run earlier. */
let syncDomeGrayRockVisuals: (() => void) | null = null;
/** Last L.O.V.E. numeric applied to dock + legacy HUD */
let lastLoveBalance = 3.28;
/** Circumference of dock spoon ring (r=24, 2πr) for stroke-dasharray */
const DOCK_SPOON_ARC = 150.79644737231007;

function simplexOriginFromStateUrl(): string | null {
  try {
    return new URL(resolveSimplexStateUrl()).origin;
  } catch {
    return null;
  }
}

async function tryFetchAgentRuns(): Promise<Array<Record<string, unknown>>> {
  const origin = simplexOriginFromStateUrl();
  if (!origin) return [];
  try {
    const r = await fetch(`${origin}/api/agents`, {
      mode: "cors",
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return [];
    const j = (await r.json()) as unknown;
    return Array.isArray(j) ? (j as Array<Record<string, unknown>>).slice(0, 10) : [];
  } catch {
    return [];
  }
}

function formatTomographFeed(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) {
    return "No recent agent rows.\n(/api/agents blocked or SIMPLEX offline — strip still uses /api/state when CORS allows.)";
  }
  const head = "agent      voltage   age";
  const lines = rows.map((r) => {
    const id = String(r.agent_id ?? "?").slice(0, 10);
    const v = String(r.voltage ?? "—").slice(0, 9);
    const c = r.created_at;
    const ageMin =
      typeof c === "number"
        ? `${Math.max(0, Math.round((Date.now() - c) / 60_000))}m`
        : "—";
    return `${id.padEnd(10)} ${v.padEnd(9)} ${ageMin}`;
  });
  return [head, "—", ...lines].join("\n");
}

function setDockSpoonArc(spoons: number, max: number) {
  const arc = $("dock-spoon-arc") as SVGCircleElement | null;
  const lab = $("dock-spoon-label");
  const pct = Math.max(0, Math.min(1, max > 0 ? spoons / max : 0));
  if (lab) lab.textContent = `${Math.round(spoons)}/${max}`;
  if (arc) arc.setAttribute("stroke-dasharray", `${pct * DOCK_SPOON_ARC} ${DOCK_SPOON_ARC}`);
}

function setDockLove(love: number) {
  lastLoveBalance = love;
  const v = $("dock-love-val");
  const b = $("dock-love-bar");
  const pct = Math.max(0, Math.min(1, love / LOVE_LEDGER_TARGET));
  if (v) v.textContent = love.toFixed(2);
  if (b) b.style.width = `${pct * 100}%`;
}

function setDockFers(days: number) {
  const el = $("dock-fers-val");
  const pan = $("dock-fers-panel");
  const band = fersUrgencyCss(days);
  if (el) el.textContent = `${days}d`;
  if (pan) {
    pan.classList.remove("fers-ok", "fers-warn", "fers-hot", "fers-critical");
    pan.classList.add(band);
  }
}

// ================================================================
// 1a. INTERNATIONALIZATION (i18n)
// ================================================================
// Simple keyed translation system for future expansion
const i18n = {
  currentLang: 'en',
  messages: {
    en: {
      // Loading
      'loading.title': 'Materializing K4 Tetrahedron',
      'loading.initializing': 'Initializing...',
      'loading.details': 'Loading 3D scene',
      'loading.eta': 'ETA: ',
      // HUD
      'hud.cockpit': 'Cockpit',
      'hud.qFactor.label': 'Q-FACTOR:',
      'hud.qFactor.title': 'Fisher-Escolà Coherence Score',
      'hud.volume.title': 'Ambient Volume',
      'hud.volume.mute': 'Toggle mute',
      'hud.volume.sliderLabel': 'Volume control',
      'hud.volume.tooltip': '70%',
      'hud.connection.label': 'SYNC',
      'hud.connection.status.title': 'Connection status',
      'hud.connection.status.connected': 'Connected',
      'hud.connection.status.reconnecting': 'Reconnecting...',
      'hud.connection.status.failed': 'Connection failed',
      'hud.toggleUI': 'Toggle heads-up display',
      'hud.spoons.label': 'SPOONS',
      'hud.spoons.title': 'Vertex A: Operator State',
      'hud.love.label': 'L.O.V.E.',
      'hud.love.title': 'L.O.V.E. Ledger Balance',
      'hud.fleet.label': 'FLEET:',
      'hud.fleet.title': 'Active K4 Vertices',
      'hud.trimtab.label': 'Trimtab frequency control',
      'hud.trimtab.frequency': '863Hz',
      // Filters
      'filters.all': 'ALL',
      'filters.allAria': 'Show all axes',
      'filters.body': 'Body',
      'filters.bodyAria': 'Show Body axis only',
      'filters.mesh': 'Mesh',
      'filters.meshAria': 'Show Mesh axis only',
      'filters.forge': 'Forge',
      'filters.forgeAria': 'Show Forge axis only',
      'filters.shield': 'Shield',
      'filters.shieldAria': 'Show Shield axis only',
      'filters.groupLabel': 'Filter by axis',
      // Search
      'search.placeholder': 'Search topology...',
      'search.ariaLabel': 'Search topology nodes',
      // Stats & Legend
      'stats.nodes': 'NODES IDENTIFIED',
      'legend.active': 'Active',
      'legend.deployed': 'Deployed',
      'legend.countdown': 'Countdown',
      'legend.research': 'Research',
      'legend.missing': 'Missing',
      // Node Detail
      'nodeDetail.title': 'Node Name',
      'nodeDetail.axis': 'Axis',
      'nodeDetail.state': 'State',
      'nodeDetail.bus': 'Bus',
      'nodeDetail.close': 'Close node details',
      // Noscript
      'noscript.title': 'JavaScript Required',
      'noscript.description': 'The Sovereign Cockpit Dome requires JavaScript to render the 3D visualization and interactive elements. Please enable JavaScript in your browser settings.',
      'noscript.backLink': 'Back to hub',
      // Performance
      'perf.render': 'Render:',
      'perf.fps': 'FPS:',
      // Shortcuts
      'shortcuts.title': 'Keyboard Shortcuts',
      'shortcuts.close': 'Close shortcuts',
      'shortcuts.focusSearch': 'Focus search',
      'shortcuts.toggleUI': 'Toggle HUD',
      'shortcuts.activateLayer0': 'Activate Layer 0',
      'shortcuts.prompt': 'Press any key to close',
      // A11y scan
      'a11y.scanButton': 'A11y Scan',
      'a11y.violationsTitle': 'Accessibility violations found',
      'a11y.noViolations': 'No accessibility violations detected',
      // Errors
      'error.webgl.title': 'WebGL Not Supported',
      'error.webgl.message': 'Your browser or device does not support WebGL, which is required for the 3D visualization. Please try a modern browser like Chrome, Firefox, or Edge.',
      'error.loading.title': 'Loading Failed',
      'error.loading.message': 'Failed to load 3D resources. Please check your connection and try again.',
      'error.retry': 'Retry',
      // Layer 0
      'layer0.spoonsLabel': 'SPOONS',
      'layer0.inhale': 'INHALE',
      'layer0.escapeHint': 'Hold ESC for 3 seconds to disengage',
      'layer0.larmorFreq': 'Larmor Frequency: 863Hz Active',
      // Theme
      'theme.toggle': 'Theme: A'
    }
  },
  t(key: string) {
    return ((this.messages as Record<string, Record<string, string>>)[this.currentLang])[key] || key;
  },
  // Apply translations to DOM elements with data-i18n attributes
  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key ?? '');
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      (el as HTMLInputElement).placeholder = this.t(key ?? '');
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', this.t(key ?? ''));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      (el as HTMLElement).title = this.t(key ?? '');
    });
  }
};

  // Apply i18n on load
  i18n.apply();

  const domePerfLite = readDomePerfLite();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Audio system singleton
let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambientOscillator: OscillatorNode | null = null;
let isAudioInitialized = false;

// Load volume from localStorage or default to 70%
const savedVolume = localStorage.getItem('p31:dome:volume') || '70';
const volumeSlider = $("hud-volume-slider") as HTMLInputElement | null;
if (volumeSlider) volumeSlider.value = savedVolume;
const volumeValue = $("hud-volume-value");
if (volumeValue) volumeValue.textContent = `${savedVolume}%`;

 // Initialize audio on first user interaction (browser requirement)
 function initAudio() {
   if (isAudioInitialized || prefersReducedMotion) return;
   
   try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioCtx();
    masterGain = audioContext.createGain();
    
    // Create ambient music oscillator (sine wave at 110Hz - A2 harmonic)
    ambientOscillator = audioContext.createOscillator();
    ambientOscillator.type = 'sine';
    ambientOscillator.frequency.setValueAtTime(110, audioContext.currentTime);
    
    // Connect: oscillator -> masterGain -> destination
    ambientOscillator.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // Set initial volume from saved setting, fade in over 2 seconds
    const volume = parseInt(savedVolume);
    const gain = Math.pow(volume / 100, 2) * 0.3; // Max gain 0.3 at 100%
    masterGain.gain.setValueAtTime(0, audioContext.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(gain, audioContext.currentTime + 2.0);
    
    ambientOscillator.start();
    isAudioInitialized = true;
  } catch (e) {
    console.warn('Failed to initialize audio:', e);
  }
}

function initAudioOnInteraction() {
  if (isAudioInitialized) return;
  
  const initOnce = () => {
    initAudio();
    document.removeEventListener('click', initOnce);
    document.removeEventListener('keydown', initOnce);
    document.removeEventListener('touchstart', initOnce);
  };
  
  document.addEventListener('click', initOnce);
  document.addEventListener('keydown', initOnce);
  document.addEventListener('touchstart', initOnce);
}

// Custom Volume Slider State
let isMuted = localStorage.getItem('p31:dome:muted') === 'true';
const volumeSliderContainer = document.getElementById('volume-slider-container');
const volumeFill = document.getElementById('volume-fill');
const volumeThumb = document.getElementById('volume-thumb');
const volumeTooltip = document.getElementById('volume-tooltip');
const volumeMuteBtn = document.getElementById('volume-mute-btn');
const volumeIcon = document.getElementById('volume-icon');
const muteIcon = document.getElementById('mute-icon');
let currentVolume = parseInt(savedVolume);

function updateVolumeUI(vol: number, isMute = false) {
  const percent = isMute ? 0 : vol;
  if (volumeFill) volumeFill.style.width = `${percent}%`;
  if (volumeThumb) {
    const containerWidth = volumeSliderContainer ? volumeSliderContainer.offsetWidth : 80;
    const thumbLeft = Math.max(0, (percent / 100) * (containerWidth - 12));
    volumeThumb.style.left = `${thumbLeft}px`;
  }
  if (volumeValue) volumeValue.textContent = `${isMute ? 0 : vol}%`;
  if (volumeTooltip) volumeTooltip.textContent = `${isMute ? 0 : vol}%`;
  if (volumeIcon && muteIcon) {
    volumeIcon.classList.toggle('hidden', isMute);
    muteIcon.classList.toggle('hidden', !isMute);
  }
}

// Initialize volume UI
updateVolumeUI(currentVolume, isMuted);

// Set up volume slider (custom implementation)
if (volumeSliderContainer) {
  // Disable if reduced motion is preferred (audio disabled)
  if (prefersReducedMotion) {
    (volumeSliderContainer as unknown as { disabled: boolean }).disabled = true;
    volumeSliderContainer.title = "Ambient audio disabled (prefers-reduced-motion)";
  }
  
  let isDragging = false;
  
  function handleVolumeInteraction(e: PointerEvent | MouseEvent | TouchEvent) {
    e.preventDefault();
    const rect = volumeSliderContainer!.getBoundingClientRect();
    const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent | PointerEvent).clientX;
    let percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    
    currentVolume = Math.round(percent);
    updateVolumeUI(currentVolume, isMuted);
    
    // Show tooltip
    if (volumeTooltip) {
      volumeTooltip.style.opacity = '1';
      volumeTooltip.style.left = `${percent}%`;
    }
    
    // Update audio
    localStorage.setItem('p31:dome:volume', currentVolume.toString());
    if (masterGain && audioContext && !isMuted) {
      const gain = Math.pow(currentVolume / 100, 2) * 0.3;
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
    }
    
    // Haptic feedback if supported and not reduced motion
    if (navigator.vibrate && !prefersReducedMotion) {
      navigator.vibrate(10);
    }
  }
  
  volumeSliderContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleVolumeInteraction(e);
  });
  
  volumeSliderContainer.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleVolumeInteraction(e);
  }, { passive: false });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) handleVolumeInteraction(e);
  });
  
  document.addEventListener('touchmove', (e) => {
    if (isDragging) handleVolumeInteraction(e);
  }, { passive: false });
  
  const stopDrag = () => {
    isDragging = false;
    if (volumeTooltip) volumeTooltip.style.opacity = '0';
  };
  
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
}

// Mute toggle
if (volumeMuteBtn) {
  volumeMuteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    localStorage.setItem('p31:dome:muted', isMuted.toString());
    updateVolumeUI(currentVolume, isMuted);
    
    if (masterGain && audioContext) {
      if (isMuted) {
        masterGain.gain.cancelScheduledValues(audioContext.currentTime);
        masterGain.gain.setTargetAtTime(0.001, audioContext.currentTime, 0.01);
      } else {
        const gain = Math.pow(currentVolume / 100, 2) * 0.3;
        masterGain.gain.cancelScheduledValues(audioContext.currentTime);
        masterGain.gain.setTargetAtTime(gain, audioContext.currentTime, 0.01);
      }
    }
    
    // Haptic feedback
    if (navigator.vibrate && !prefersReducedMotion) {
      navigator.vibrate(20);
    }
  });
}

// Initialize audio on first user interaction
initAudioOnInteraction();

  function applyQFactorHud(score: number) {
    const isOpt = score >= 0.9;
    const isStab = score >= 0.7;
    const colorClass = isOpt ? "text-[var(--p31-phosphorus)]" : isStab ? "text-[#cda852]" : "text-[#E8636F]";
    const bgClass = isOpt ? "bg-[var(--p31-phosphorus)]" : isStab ? "bg-[#cda852]" : "bg-[#E8636F]";
    const s = score.toFixed(3);
    const nq = $("dock-q-mini") || $("hud-q-val");
    const nd = $("dock-q-dot") || $("hud-q-dot");
    if (nq) {
      nq.innerText = s;
      nq.className = `font-mono text-[9px] font-bold tabular-nums ${colorClass}`;
    }
    if (nd) {
      nd.className = `h-1.5 w-1.5 shrink-0 rounded-full ${bgClass}`;
      nd.style.boxShadow = `0 0 8px ${isOpt ? "var(--p31-phosphorus)" : isStab ? "#cda852" : "#E8636F"}`;
    }
  }

  function extractQFromSimplexState(state: Record<string, unknown> | null): number | null {
    if (!state) return null;
    const raw =
      state.q_factor ??
      state.qFactor ??
      (typeof state.telemetry === "object" && state.telemetry !== null
        ? (state.telemetry as Record<string, unknown>).q_factor
        : undefined);
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const n = parseFloat(raw);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  type SimplexStateSlice = {
    q: number | null;
    spoons: number | null;
    maxSpoons: number;
    sentinel: string | null;
    love: number | null;
  };

  async function tryFetchSimplexState(): Promise<SimplexStateSlice | null> {
    const url = resolveSimplexStateUrl();
    try {
      const r = await fetch(url, {
        method: "GET",
        mode: "cors",
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) return null;
      const j = (await r.json()) as { state?: Record<string, unknown> };
      const st = j.state && typeof j.state === "object" ? (j.state as Record<string, unknown>) : null;
      if (!st) return null;
      const q = extractQFromSimplexState(st);
      const rawSp = st.current_spoons;
      const spoons = typeof rawSp === "number" && Number.isFinite(rawSp) ? rawSp : null;
      const rawMax = st.max_spoons;
      const maxSpoons = typeof rawMax === "number" && rawMax > 0 ? rawMax : 12;
      const sent = st.sentinel_context_source;
      const sentinel = typeof sent === "string" ? sent : null;
      const rawLove = st.current_love;
      const love = typeof rawLove === "number" && Number.isFinite(rawLove) ? rawLove : null;
      return { q, spoons, maxSpoons, sentinel, love };
    } catch {
      return null;
    }
  }

  function updateCockpitInstrumentStrip(parts: {
    q: string;
    spoons: string;
    fers: string;
    sentinel: string;
  }) {
    const el = $("cockpit-instrument-strip");
    if (!el) return;
    el.textContent = `COCKPIT · Q ${parts.q} · SPOONS ${parts.spoons} · FERS ${parts.fers} · SENTINEL ${parts.sentinel}`;
  }

  const updateTelemetry = async () => {
    const dq = $("dock-q-mini");
    const dd = $("dock-q-dot");
    if (dq) {
      dq.textContent = "···";
      dq.className = "text-p31-muted animate-pulse font-mono text-[9px]";
    }
    if (dd) {
      dd.className = "h-1.5 w-1.5 shrink-0 rounded-full bg-cyan animate-pulse opacity-80";
    }

    const sx = await tryFetchSimplexState();
    let stripQ = "—";
    let stripSpoons = `—/${maxSpoonsHud}`;
    let stripSent = "—";
    const fersD = fersDaysRemaining();

    if (sx) {
      if (sx.q != null) {
        applyQFactorHud(sx.q);
        stripQ = sx.q.toFixed(2);
        try {
          localStorage.setItem("p31_cache_simplex_q", String(sx.q));
        } catch {
          /* */
        }
      } else {
        const qData = await fetchWithCache(TELEMETRY_URLS.qFactor, "p31_cache_qfactor", {
          score: 0.925,
          vertexHealth: { A: 1, B: 1, C: 1, D: 1 },
        });
        let cachedSimplex: number | null = null;
        try {
          const c = localStorage.getItem("p31_cache_simplex_q");
          if (c) {
            const n = parseFloat(c);
            if (Number.isFinite(n)) cachedSimplex = n;
          }
        } catch {
          /* */
        }
        const score =
          (qData && typeof qData.score === "number" && Number.isFinite(qData.score) ? qData.score : null) ??
          cachedSimplex ??
          0.925;
        applyQFactorHud(score);
        stripQ = score.toFixed(2);
      }

      maxSpoonsHud = sx.maxSpoons > 0 ? sx.maxSpoons : 12;
      if (sx.spoons != null) {
        currentSpoons = sx.spoons;
        stripSpoons = `${Math.round(sx.spoons)}/${maxSpoonsHud}`;
        setDockSpoonArc(sx.spoons, maxSpoonsHud);
      } else {
        const spoonData = await fetchWithCache(TELEMETRY_URLS.spoons, "p31_cache_spoons", { spoons: currentSpoons });
        if (spoonData.spoons !== undefined) {
          currentSpoons = spoonData.spoons as number;
        }
        stripSpoons = `${Math.round(currentSpoons)}/${maxSpoonsHud}`;
        setDockSpoonArc(currentSpoons, maxSpoonsHud);
      }

      stripSent = sx.sentinel ?? "sync";

      if (sx.love != null) {
        setDockLove(sx.love);
      } else {
        const loveData = await fetchWithCache(TELEMETRY_URLS.love, "p31_cache_love", { availableBalance: 3.28 });
        const v =
          loveData.availableBalance ?? (loveData as { balance?: number }).balance ?? (loveData as { available?: number }).available;
        if (typeof v === "number" && Number.isFinite(v)) setDockLove(v);
      }
    } else {
      const qData = await fetchWithCache(TELEMETRY_URLS.qFactor, "p31_cache_qfactor", {
        score: 0.925,
        vertexHealth: { A: 1, B: 1, C: 1, D: 1 },
      });
      let cachedSimplex: number | null = null;
      try {
        const c = localStorage.getItem("p31_cache_simplex_q");
        if (c) {
          const n = parseFloat(c);
          if (Number.isFinite(n)) cachedSimplex = n;
        }
      } catch {
        /* */
      }
      const score =
        (qData && typeof qData.score === "number" && Number.isFinite(qData.score) ? qData.score : null) ??
        cachedSimplex ??
        0.925;
      applyQFactorHud(score);
      stripQ = score.toFixed(2);

      const loveData = await fetchWithCache(TELEMETRY_URLS.love, "p31_cache_love", { availableBalance: 3.28 });
      const lv =
        loveData.availableBalance ?? (loveData as { balance?: number }).balance ?? (loveData as { available?: number }).available;
      if (typeof lv === "number" && Number.isFinite(lv)) setDockLove(lv);

      const spoonData = await fetchWithCache(TELEMETRY_URLS.spoons, "p31_cache_spoons", { spoons: currentSpoons });
      if (spoonData.spoons !== undefined) {
        currentSpoons = spoonData.spoons as number;
      }
      stripSpoons = `${Math.round(currentSpoons)}/${maxSpoonsHud}`;
      setDockSpoonArc(currentSpoons, maxSpoonsHud);
      stripSent = "mesh_fallback";
    }

    setDockFers(fersD);
    setDockLove(lastLoveBalance);
    void tryFetchAgentRuns().then((runs) => {
      const feed = $("dock-tomograph-feed");
      if (feed) feed.textContent = formatTomographFeed(runs);
    });

    updateCockpitInstrumentStrip({
      q: stripQ,
      spoons: stripSpoons,
      fers: `${fersD}d`,
      sentinel: stripSent,
    });

    syncDomeGrayRockVisuals?.();

    const conn = $("connection-status");
    if (conn && stripSent !== "mesh_fallback" && stripSent !== "—") {
      conn.className = "w-2 h-2 rounded-full bg-emerald";
      conn.setAttribute("title", `SIMPLEX · ${stripSent}`);
    } else if (conn) {
      conn.className = "w-2 h-2 rounded-full bg-butter";
      conn.setAttribute("title", "SYNC · fallback telemetry");
    }

    await refreshMeshHud();
  };

  async function refreshMeshHud() {
    const meshP = await fetchPersonalMeshForHud();
    const { vit, love, detail } = formatMeshHudLine(meshP);
    const vEl = $("hud-mesh-vit");
    const veEl = $("hud-mesh-ve");
    const dEl = $("hud-mesh-detail");
    if (vEl) vEl.textContent = vit;
    if (veEl) veEl.textContent = love;
    if (dEl) {
      dEl.textContent = detail || "";
      dEl.setAttribute("title", detail || "");
    }
  }

  setInterval(updateTelemetry, 60000);
  setInterval(() => {
    void refreshMeshHud();
  }, 30000);
  updateTelemetry();

  // ================================================================
  // 2. TRIMTAB & LAYER 0 (Somatic Breathing)
  // ================================================================
  const $trimCanvas = $("trimtab-canvas") as HTMLCanvasElement | null;
  const $trimFreq = $("trimtab-freq");
  let trimValue = 1.0;
  let trimOn = false;
  let trimAudioCtx: AudioContext | null = null, trimOsc: OscillatorNode | null = null, trimGain: GainNode | null = null;
  let _trimIsDown = false, _trimAngle: number | null = null;

  function trimFreq() { return trimHzFromKnob(trimValue); }

  function drawTrimtab() {
 if (!$trimCanvas) return;
 const ctx = $trimCanvas.getContext("2d");
 if (!ctx) return;
 ctx.clearRect(0, 0, 24, 24);
 const cx = 12, cy = 12, r = 8, start = 3*Math.PI/4, sweep = 3*Math.PI/2;
 
 ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2; ctx.lineCap = "round";
 ctx.beginPath(); ctx.arc(cx, cy, r, start, start + sweep); ctx.stroke();

 const valEnd = start + trimValue * sweep;
 ctx.strokeStyle = trimOn ? "#cda852" : "rgba(205,168,82,0.4)";
 ctx.beginPath(); ctx.arc(cx, cy, r, start, valEnd); ctx.stroke();

 ctx.fillStyle = trimOn ? "#cda852" : "rgba(205,168,82,0.6)";
 ctx.beginPath(); ctx.arc(cx + r*Math.cos(valEnd), cy + r*Math.sin(valEnd), 2.5, 0, Math.PI*2); ctx.fill();

    const f = trimFreq();
    if ($trimFreq) $trimFreq.innerText = formatTrimHz(f);
  }

  function trimToggleAudio() {
 trimOn = !trimOn;
 if (trimOn) {
   try {
     const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
     if (!trimAudioCtx) trimAudioCtx = new AudioCtx();
     if(trimAudioCtx.state === "suspended") trimAudioCtx.resume();
     trimOsc = trimAudioCtx.createOscillator(); trimGain = trimAudioCtx.createGain();
     trimOsc.type = "sine"; trimOsc.frequency.setValueAtTime(trimFreq(), trimAudioCtx.currentTime);
     trimGain.gain.setValueAtTime(0, trimAudioCtx.currentTime);
     trimGain.gain.linearRampToValueAtTime(0.05, trimAudioCtx.currentTime + 0.1);
     trimOsc.connect(trimGain); trimGain.connect(trimAudioCtx.destination);
     trimOsc.start();
   } catch(e) { trimOn = false; }
 } else if (trimOsc) {
   try { if (trimGain && trimAudioCtx) { trimGain.gain.linearRampToValueAtTime(0, trimAudioCtx.currentTime + 0.1); trimOsc.stop(trimAudioCtx.currentTime + 0.15); } } catch(e){}
   trimOsc = null; trimGain = null;
 }
 drawTrimtab();
  }

  if ($trimCanvas) {
    $trimCanvas.addEventListener("pointerdown", e => {
      e.preventDefault(); $trimCanvas.setPointerCapture(e.pointerId);
      _trimIsDown = true;
      const rect = $trimCanvas.getBoundingClientRect();
      _trimAngle = Math.atan2(e.clientY - rect.top - 12, e.clientX - rect.left - 12);
    });
    $trimCanvas.addEventListener("pointermove", e => {
      if (!_trimIsDown) return;
      const rect = $trimCanvas.getBoundingClientRect();
      const a = Math.atan2(e.clientY - rect.top - 12, e.clientX - rect.left - 12);
      let d = a - (_trimAngle ?? 0);
      if (d > Math.PI) d -= 2*Math.PI; if (d < -Math.PI) d += 2*Math.PI;
      trimValue = Math.max(0, Math.min(1, trimValue + d / (3*Math.PI/2)));
      if (trimOn && trimOsc && trimAudioCtx) try { trimOsc.frequency.setValueAtTime(trimFreq(), trimAudioCtx.currentTime); } catch(e){}
      _trimAngle = a; drawTrimtab();
    });
    const trimUp = () => { _trimIsDown = false; _trimAngle = null; };
    $trimCanvas.addEventListener("pointerup", trimUp);
    $trimCanvas.addEventListener("pointercancel", trimUp);
  }

  $("trimtab-trigger")?.addEventListener("click", (e) => {
    if (e.target !== $trimCanvas) activateLayer0();
    else if (!_trimIsDown) trimToggleAudio();
  });
  
  drawTrimtab();

  // Layer 0 Logic
  let l0Timer: ReturnType<typeof setTimeout> | null = null;
  let l0Audio: AudioContext | null = null;
  let escStart: number | null = null;
  let escTimer: ReturnType<typeof setTimeout> | null = null;
  let spoons = 15;

  function activateLayer0() {
    $("layer0")?.classList.remove("opacity-0", "pointer-events-none");
    if (!l0Timer) runBreathCycle();
    if (!trimOn) trimToggleAudio();
  }

  function deactivateLayer0() {
    $("layer0")?.classList.add("opacity-0", "pointer-events-none");
    if (l0Timer !== null) clearTimeout(l0Timer); l0Timer = null;
    if (l0Audio) { try { l0Audio.close(); } catch(e){} l0Audio = null; }
  }

  function playBreath(phase: string, durMs: number, freq: number | null) {
    const phaseEl = $("l0-phase"); if (phaseEl) phaseEl.innerText = phase;
    const dot = $("l0-dot");
    if (dot) { dot.style.animation = "none"; void dot.offsetWidth; dot.style.animation = `l0-${phase.toLowerCase()} ${durMs}ms ease-in-out forwards`; }

    if (phase === "INHALE" && spoons < maxSpoonsHud) {
      spoons += 0.5;
      const sf = $("l0-spoon-fill"); if (sf) sf.style.width = `${(spoons / maxSpoonsHud) * 100}%`;
      const sp = $("l0-spoon-pct"); if (sp) sp.innerText = `${Math.round((spoons / maxSpoonsHud) * 100)}%`;
      setDockSpoonArc(Math.min(spoons, maxSpoonsHud), maxSpoonsHud);
    }

 if (!freq) return;
 try {
   const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
   if (!l0Audio) l0Audio = new AudioCtx();
   if(l0Audio.state === "suspended") l0Audio.resume();
   const osc = l0Audio.createOscillator(), gain = l0Audio.createGain();
   osc.frequency.setValueAtTime(freq, l0Audio.currentTime); osc.type = "sine";
   gain.gain.setValueAtTime(0, l0Audio.currentTime);
   gain.gain.linearRampToValueAtTime(0.04, l0Audio.currentTime + 0.4);
   gain.gain.linearRampToValueAtTime(0, l0Audio.currentTime + (durMs/1000) - 0.4);
   osc.connect(gain); gain.connect(l0Audio.destination);
   osc.start(); osc.stop(l0Audio.currentTime + (durMs/1000));
 } catch(e) {}
  }

  function runBreathCycle() {
    playBreath("INHALE", 4000, breathInhaleHz());
    l0Timer = setTimeout(() => {
      playBreath("HOLD", 4000, null);
      l0Timer = setTimeout(() => {
        playBreath("EXHALE", 6000, breathExhaleHz());
        l0Timer = setTimeout(runBreathCycle, 6000);
      }, 4000);
    }, 4000);
  }

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || $("layer0")?.classList.contains("pointer-events-none")) return;
    e.preventDefault();
    if (escStart) return;
    escStart = Date.now();
    const ef = $("l0-escape-fill");
    if (ef) { ef.style.transition = "width 3s linear"; ef.style.width = "100%"; }
    escTimer = setTimeout(() => { deactivateLayer0(); escStart = null; const el = $("l0-escape-fill"); if (el) el.style.width = "0%"; }, 3000);
  });
  document.addEventListener("keyup", e => {
    if (e.key === "Escape") {
      if (escTimer !== null) clearTimeout(escTimer);
      escStart = null;
      const ef = $("l0-escape-fill");
      if (ef) { ef.style.transition = "width 0.15s linear"; ef.style.width = "0%"; }
    }
  });

  // Global toggle UI
  (window as unknown as { toggleUI: () => void }).toggleUI = () => {
    const isHidden = $("top-hud")?.classList.contains("-translate-y-full") ?? false;
    $("top-hud")?.classList.toggle("-translate-y-full", !isHidden);
    $("left-hud")?.classList.toggle("opacity-0", !isHidden);
    $("left-hud")?.classList.toggle("pointer-events-none", !isHidden);
  };

  document.addEventListener("keydown", (e) => {
    if(e.key === "Tab") { e.preventDefault(); (window as unknown as { toggleUI: () => void }).toggleUI(); }
  });

// ================================================================
// 3. WEBGL SPACESHIP EARTH DOME (Three.js)
// ================================================================

// Loading manager for progress tracking and error handling
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
  console.log(`Started loading: ${url} (${itemsLoaded}/${itemsTotal})`);
};

loadingManager.onLoad = () => {
  console.log('All resources loaded');
  dismissDomeSplash();
  // Audio will initialize on first user interaction (initAudioOnInteraction)
};

 // Track time for ETA calculation
 let loadStartTime = Date.now();
 let estimatedTotalTime = 0;
 
 loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
   const progress = itemsLoaded / itemsTotal;
   const progressBar = $('loading-bar');
   const loadingText = $('loading-text');
   const loadingDetails = $('loading-details');
   const loadingETA = $('loading-eta');
   
   if (progressBar) progressBar.style.width = `${progress * 100}%`;
   if (loadingText) loadingText.textContent = `Loading... ${Math.round(progress * 100)}%`;
   if (loadingDetails) loadingDetails.textContent = `${itemsLoaded} of ${itemsTotal} resources`;
   
   // Calculate ETA
   if (loadingETA && progress > 0) {
     const elapsedTime = Date.now() - loadStartTime;
     const estimatedTotal = elapsedTime / progress;
     const remainingTime = estimatedTotal - elapsedTime;
     if (remainingTime > 0 && !isNaN(remainingTime)) {
       const seconds = Math.max(0, Math.floor(remainingTime / 1000));
       loadingETA.textContent = `${i18n.t('loading.eta')}${seconds}s`;
     }
   }
 };

loadingManager.onError = (url) => {
  console.error(`Failed to load: ${url}`);
  showLoadingError();
};

// Check WebGL support before proceeding
let webglSupported = true;
try {
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
  if (!gl) webglSupported = false;
} catch (e) {
  webglSupported = false;
}

if (!webglSupported) {
  showWebGLError();
  dismissDomeSplash({ fadeMs: 400 });
} else {
const container = $("webgl-container");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050508);
  /** Depth cue — far faces soften so the shell reads as volume, not a sticker */
  scene.fog = new THREE.Fog(0x050508, 14, 92);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.08, 520);
  /* Interior cockpit: start just inside the RADIUS≈3.5 shell, looking toward origin */
  camera.position.set(0, 0.45, 2.38);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  const maxPR = domePerfLite ? 1 : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(maxPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
if (!container) { showLoadingError(); } else { container.appendChild(renderer.domElement); }

// Camera Controls (Orbit) — cockpit policy: left = select (raycast-wins); orbit = Alt+left or right-drag; zoom = scroll.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
controls.minDistance = 0.52;
controls.maxDistance = 108;
controls.enablePan = false;
controls.autoRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN; // with enablePan false → left does not orbit
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.touches.ONE = THREE.TOUCH.PAN; // with enablePan false → one-finger no camera (raycast selects)
controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE; // two-finger pinch + orbit

window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Alt") controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  },
  true
);
window.addEventListener(
  "keyup",
  (e) => {
    if (e.key === "Alt") controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  },
  true
);

controls.target.set(0, 0, 0);
controls.update();

if (prefersReducedMotion) {
  controls.enableZoom = false;
}

// Post Processing
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bloomPass: InstanceType<typeof UnrealBloomPass> | null = null;
  if (!domePerfLite) {
    bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.38,
      0.35,
      0.55
    );
    composer.addPass(bloomPass);
  }
  composer.addPass(new OutputPass());

  // Lighting — one key direction + dim fill; dome shell reads as structure not FX wash
  scene.add(new THREE.AmbientLight(0x0a0a0a, 0.28));
  const keyLight = new THREE.DirectionalLight(0xa8c4d8, 0.55);
  keyLight.position.set(4.5, 9, 5);
  scene.add(keyLight);
  const domeLight = new THREE.PointLight(0x1a2a3a, 1.05, 18);
  domeLight.position.set(0, 0.4, 0);
  scene.add(domeLight);

  // Data
  const AXIS_COLORS = { a: 0xff9944, b: 0x44aaff, c: 0x44ffaa, d: 0xff4466 };
  const AXIS_LABELS = { a: 'Operator', b: 'Signals', c: 'Context', d: 'Shield' };
  const STATE_CSS = { active: 'var(--p31-phosphorus)', deployed: 'var(--p31-teal)', countdown: '#cda852', complete: '#4db8a8', missing: '#cc6247', ongoing: 'var(--p31-teal)', prototype: '#cda852', research: '#4db8a8' };
  const STATE_GLOW = { countdown: 2.0, critical: 2.5, complete: 0.4, active: 1.0, ongoing: 0.6, deployed: 0.7, prototype: 0.8, missing: 1.2, research: 0.5 };

  const VERTICES = {
 'operator-state': ['Vertex A: Operator', 4, 0, 0, 0, 'active', 'vital', 'Spoons, Bio, Medication'],
 'signal-processor': ['Vertex B: Signals', 0, 4, 0, 0, 'active', 'ac', 'Message Queue, Fawn Guard'],
 'context-engine': ['Vertex C: Context', 0, 0, 4, 0, 'active', 'dc', 'Timeline, Mesh Topology'],
 'shield-engine': ['Vertex D: Shield', 0, 0, 0, 4, 'active', 'ac', 'AI Orchestration, Synthesis'],
 'bonding': ['BONDING', 0, 3, 1, 0, 'deployed', 'ac', 'WebRTC Social Protocol'],
 'spaceship': ['Spaceship Earth', 0, 1, 3, 0, 'deployed', 'ac', 'Sovereign Command Center'],
 'ede': ['Spaceship Earth', 1, 1, 2, 0, 'deployed', 'ac', 'Browser IDE & Compiler'],
 'buffer': ['Buffer', 2, 1, 1, 0, 'active', 'dc', 'Voltage Gate'],
 'love-econ': ['L.O.V.E. Ledger', 1, 1, 2, 0, 'deployed', 'ac', 'Care Economy'],
 'genesis': ['Genesis Gate', 0, 1, 3, 0, 'building', 'ac', 'Auth Node'],
 'fawn': ['Fawn Guard', 0, 3, 0, 1, 'active', 'ac', 'Trauma Interceptor'],
 'node-zero': ['Node Zero', 1, 0, 3, 0, 'prototype', 'dc', 'Hardware Rig'],
 'alchemy': ['Neuro-Cognition Alchemy', 1, 1, 1, 1, 'research', 'dc', 'Zenodo Published'],
 'p31-mesh': ['P31 Mesh', 0, 1, 3, 0, 'active', 'dc', 'CRDT PGLite Sync'],
 'vault': ['P31 Vault', 0, 0, 3, 1, 'building', 'ac', 'Encrypted Storage'],
 'oqe-icosa': [
   'OQE Icosa (forensic)',
   1,
   1,
   1,
   1,
   'deployed',
   'dc',
   'Twenty-face contradiction map. Short /oqe; lexicon /p31-oqe-twenty.json; schema p31.oqeTwenty',
 ],
  };

  const EDGES = [
 ['operator-state', 'signal-processor', 'modulates'],
 ['operator-state', 'context-engine', 'timeline'],
 ['operator-state', 'shield-engine', 'prompt_context'],
 ['signal-processor', 'context-engine', 'metadata'],
 ['signal-processor', 'shield-engine', 'analysis'],
 ['context-engine', 'shield-engine', 'alignment'],
 ['bonding', 'love-econ', 'earns'],
 ['spaceship', 'p31-mesh', 'reads'],
 ['ede', 'shield-engine', 'compiles'],
 ['fawn', 'signal-processor', 'filters'],
 ['vault', 'operator-state', 'protects'],
 ['oqe-icosa', 'context-engine', 'forensic_index'],
  ];

  const ncEl = $("node-count"); if (ncEl) ncEl.innerText = `${Object.keys(VERTICES).length} ${i18n.t('stats.nodes')}`;

  type AxisKey = 'a' | 'b' | 'c' | 'd';
  type AssignmentData = { faceIdx: number; node: unknown; color: THREE.Color; glow: number };

  function getDominantAxis(a: number, b: number, c: number, d: number) { const v: Record<AxisKey, number>={a,b,c,d}; let m=-1, ax: AxisKey='a'; for(const k of ['a','b','c','d'] as AxisKey[]) { if(v[k]>m) { m=v[k]; ax=k; } } return ax; }
  function getNodeColor(a: number, b: number, c: number, d: number) { const s=a+b+c+d||1, col=new THREE.Color(0); const ac: Record<AxisKey, THREE.Color>={a:new THREE.Color(AXIS_COLORS.a),b:new THREE.Color(AXIS_COLORS.b),c:new THREE.Color(AXIS_COLORS.c),d:new THREE.Color(AXIS_COLORS.d)}; for(const k of ['a','b','c','d'] as AxisKey[]) { const w=({a,b,c,d} as Record<AxisKey, number>)[k]/s; col.r+=ac[k].r*w; col.g+=ac[k].g*w; col.b+=ac[k].b*w; } return col; }

  const TETRA = [new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1/3,Math.sqrt(8/9)), new THREE.Vector3(-Math.sqrt(2/3),-1/3,-Math.sqrt(2/9)), new THREE.Vector3(Math.sqrt(2/3),-1/3,-Math.sqrt(2/9))];
  function nodeDir(a: number, b: number, c: number, d: number) { const s=a+b+c+d||1, dir=new THREE.Vector3(0,0,0); dir.addScaledVector(TETRA[0],a/s); dir.addScaledVector(TETRA[1],b/s); dir.addScaledVector(TETRA[2],c/s); dir.addScaledVector(TETRA[3],d/s); return dir.normalize(); }

  // Build Geodesic Geometry (see src/lib/dome/icosphere-geometry.ts)
  const RADIUS = 3.5;
  const geo = buildGeoThree(RADIUS, 2);
  const faceMeshes: THREE.Mesh[] = [];
  const nodeToFace = new Map();

  const domeGroup = new THREE.Group();
  scene.add(domeGroup);

  // Map Nodes to Faces
  const sortedNodes = Object.entries(VERTICES).map(([id,d])=>({id, label:String(d[0]), a:Number(d[1]), b:Number(d[2]), c:Number(d[3]), d:Number(d[4]), state:String(d[5]), bus:String(d[6]), notes:d[7] ? String(d[7]) : undefined, dir:nodeDir(Number(d[1]),Number(d[2]),Number(d[3]),Number(d[4])), p:d[5]==='countdown'?0:1})).sort((x,y)=>x.p-y.p);
  type NodeData = typeof sortedNodes[0];
  const usedFaces = new Set<number>();
  const assignments: AssignmentData[] = [];
  for(const n of sortedNodes) {
 let best=-1, bd=-2;
 for(let i=0; i<geo.faces.length; i++) {
   if(usedFaces.has(i)) continue;
   const dot=geo.faces[i].centroid.clone().normalize().dot(n.dir);
   if(dot>bd) {bd=dot; best=i;}
 }
 if(best>=0) {
   usedFaces.add(best);
   const a: AssignmentData = {faceIdx:best, node:n, color:getNodeColor(n.a,n.b,n.c,n.d), glow:(STATE_GLOW as Record<string,number>)[n.state]||0.5};
   assignments.push(a);
   nodeToFace.set(n.id, a);
   geo.faces[best].assignment = a;
 }
  }

  // 1. Construct 3D Tetrahedral Blocks
  for(let i=0; i<geo.faces.length; i++) {
 const f=geo.faces[i], a=f.assignment as AssignmentData | undefined, [ai,bi,ci]=f.indices;

 const va=geo.verts[ai].clone();
 const vb=geo.verts[bi].clone();
 const vc=geo.verts[ci].clone();
 const cent = new THREE.Vector3().add(va).add(vb).add(vc).divideScalar(3);

 // Shrink outer face towards centroid to create gaps
 const gap = 0.08;
 va.lerp(cent, gap);
 vb.lerp(cent, gap);
 vc.lerp(cent, gap);

 // Inner vertex to create the 3D block volume (points inward to core)
 const vd = cent.clone().multiplyScalar(0.85);

 const tGeo = new THREE.BufferGeometry();
 const vertices = new Float32Array([
   // Outer face
   va.x,va.y,va.z, vb.x,vb.y,vb.z, vc.x,vc.y,vc.z,
   // Side 1
   va.x,va.y,va.z, vc.x,vc.y,vc.z, vd.x,vd.y,vd.z,
   // Side 2
   vc.x,vc.y,vc.z, vb.x,vb.y,vb.z, vd.x,vd.y,vd.z,
   // Side 3
   vb.x,vb.y,vb.z, va.x,va.y,va.z, vd.x,vd.y,vd.z
 ]);
 tGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
 tGeo.computeVertexNormals();

 const mat = makeDomeCockpitFaceMaterial(
   a ? { glow: a.glow, color: a.color } : null,
   domePerfLite
 );
 /* Cockpit shell: nearly transparent faces so structure reads as teal wire, not slabs */
 if (typeof mat.opacity === "number") {
   mat.opacity = a ? (domePerfLite ? 0.82 : 0.2) : domePerfLite ? 0.35 : 0.06;
 }
 if ("emissiveIntensity" in mat && typeof (mat as THREE.MeshPhysicalMaterial).emissiveIntensity === "number") {
   const m = mat as THREE.MeshPhysicalMaterial;
   m.emissiveIntensity = a ? (domePerfLite ? m.emissiveIntensity : m.emissiveIntensity * 0.55) : m.emissiveIntensity * 0.4;
 }

 const mesh=new THREE.Mesh(tGeo, mat);

 // Edge definitions attached to each block
 const edgeGeo = new THREE.EdgesGeometry(tGeo);
 const edgeMat = new THREE.LineBasicMaterial({
   color: a ? a.color : 0x223344,
   transparent: true,
   opacity: a ? 0.8 : 0.3,
   blending: THREE.AdditiveBlending
 });
 const blockEdges = new THREE.LineSegments(edgeGeo, edgeMat);
 mesh.add(blockEdges);

 // Interactive animation state
 mesh.userData = {
   a,
   centroidDir: cent.clone().normalize(),
   randomPhase: Math.random() * Math.PI * 2,
   currentOffset: 0,
   targetOffset: 0,
   domeSaved: {
     faceColor: a ? a.color.clone() : null,
     emissiveIntensity: (mat as THREE.MeshPhysicalMaterial).emissiveIntensity,
     opacity: (mat as THREE.MeshPhysicalMaterial).opacity,
     edgeColorHex: (edgeMat as THREE.LineBasicMaterial).color.getHex(),
     edgeOpacity: (edgeMat as THREE.LineBasicMaterial).opacity,
   },
 };

 domeGroup.add(mesh);
 faceMeshes.push(mesh);
  }

  // 2. Global Wireframe Encapsulation Layer (The Grid)
  const wPos=[];
  for(let i=0; i<geo.edges.length; i++) {
 const [a,b]=geo.edges[i];
 wPos.push(geo.verts[a].x, geo.verts[a].y, geo.verts[a].z, geo.verts[b].x, geo.verts[b].y, geo.verts[b].z);
  }
  const wGeo=new THREE.BufferGeometry();
  wGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
  const wMat = new THREE.LineBasicMaterial({
    color: 0x4db8a8,
    transparent: true,
    opacity: domePerfLite ? 0.38 : 0.48,
    depthWrite: false,
  });
  const wireMesh = new THREE.LineSegments(wGeo, wMat);
  wireMesh.scale.setScalar(1.02); // Push outward to encapsulate the blocks
  domeGroup.add(wireMesh);

  // 3. Central Core and Inner Struts (Connections)
  const strutGeo = new THREE.BufferGeometry();
  const strutPos = [];
  for(let i=0; i<geo.faces.length; i++) {
   const cent = geo.faces[i].centroid;
   const inner = cent.clone().multiplyScalar(0.85); // Matches `vd` inner block point
   strutPos.push(inner.x, inner.y, inner.z);
   strutPos.push(0, 0, 0); // Connects to origin
  }
  strutGeo.setAttribute('position', new THREE.Float32BufferAttribute(strutPos, 3));
  const strutMat = new THREE.LineBasicMaterial({ color: 0x112233, transparent: true, opacity: 0.5 });
  const struts = new THREE.LineSegments(strutGeo, strutMat);
  domeGroup.add(struts);

  const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x4db8a8,
    emissive: 0x2a6a62,
    emissiveIntensity: 0.85,
    wireframe: true,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  domeGroup.add(coreMesh);

  // Deep Molecular Soup
  const pCount = domePerfLite ? 4000 : 12000;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount*3), pSiz = new Float32Array(pCount), pCol = new Float32Array(pCount*3);
  for(let i=0; i<pCount; i++) {
 const r=4+Math.random()*30, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
 pPos[i*3]=r*Math.sin(ph)*Math.cos(th); pPos[i*3+1]=r*Math.sin(ph)*Math.sin(th); pPos[i*3+2]=r*Math.cos(ph);
 pSiz[i]=0.01+Math.random()*0.04;
 const cBase = r>15 ? 0x15151a : 0x1a201f;
 pCol[i*3]=(cBase>>16)/255; pCol[i*3+1]=((cBase>>8)&0xff)/255; pCol[i*3+2]=(cBase&0xff)/255;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(pSiz,1));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol,3));

  const pMat = new THREE.PointsMaterial({
    color: 0xffffff,
    vertexColors: true,
    size: domePerfLite ? 0.022 : 0.026,
    transparent: true,
    opacity: domePerfLite ? 0.14 : 0.2,
    sizeAttenuation: true,
    depthWrite: false,
  });
  const molField = new THREE.Points(pGeo, pMat);
  scene.add(molField);

  const domeShellSaved = {
    wireColorHex: wMat.color.getHex(),
    wireOpacity: wMat.opacity,
    strutOpacity: strutMat.opacity,
    coreColorHex: coreMat.color.getHex(),
    coreEmissiveIntensity: coreMat.emissiveIntensity,
  };

  syncDomeGrayRockVisuals = () => {
    const suppressed =
      !domeAliveBypass && (!domeOperatorReached || Math.round(currentSpoons) <= 3);
    domeVISuppressed = suppressed;
    document.body.classList.toggle("dome-gray-rock", suppressed);

    molField.visible = !suppressed;

    if (bloomPass) {
      bloomPass.enabled = !suppressed;
    }

    for (const m of faceMeshes) {
      const du = m.userData;
      const a = du.a;
      const mat = m.material as THREE.MeshPhysicalMaterial;
      const saved = du.domeSaved as
        | {
            faceColor: THREE.Color | null;
            emissiveIntensity: number;
            opacity: number;
            edgeColorHex: number;
            edgeOpacity: number;
          }
        | undefined;
      if (!saved) continue;
      if (suppressed) {
        mat.color.setHex(0x4a5568);
        if (mat.emissive) mat.emissive.setHex(0x080a0c);
        mat.emissiveIntensity = 0.07;
        mat.opacity = a ? (domePerfLite ? 0.38 : 0.11) : saved.opacity * 0.45;
      } else {
        if (a && saved.faceColor) {
          mat.color.copy(saved.faceColor);
          mat.emissive?.copy(saved.faceColor);
        }
        mat.emissiveIntensity = saved.emissiveIntensity;
        mat.opacity = saved.opacity;
      }
      const edge = m.children[0] as THREE.LineSegments | undefined;
      const em = edge?.material as THREE.LineBasicMaterial | undefined;
      if (em) {
        if (suppressed) {
          em.color.setHex(0x3a4450);
          em.opacity = 0.24;
        } else {
          em.color.setHex(saved.edgeColorHex);
          em.opacity = saved.edgeOpacity;
        }
      }
    }

    if (suppressed) {
      wMat.color.setHex(0x3d4f56);
      wMat.opacity = domePerfLite ? 0.3 : 0.36;
      strutMat.opacity = 0.16;
      coreMat.color.setHex(0x2a3238);
      coreMat.emissiveIntensity = 0.09;
    } else {
      wMat.color.setHex(domeShellSaved.wireColorHex);
      wMat.opacity = domeShellSaved.wireOpacity;
      strutMat.opacity = domeShellSaved.strutOpacity;
      coreMat.color.setHex(domeShellSaved.coreColorHex);
      coreMat.emissiveIntensity = domeShellSaved.coreEmissiveIntensity;
    }
  };

  function markDomeOperatorReached() {
    if (domeAliveBypass || domeOperatorReached) return;
    domeOperatorReached = true;
    syncDomeGrayRockVisuals?.();
  }
  window.addEventListener("pointerdown", markDomeOperatorReached, { once: true, capture: true });
  window.addEventListener("keydown", markDomeOperatorReached, { once: true, capture: true });

  syncDomeGrayRockVisuals();

  // ================================================================
  // 4. INTERACTION & RAYCASTING
  // ================================================================
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selectedNode: NodeData | null = null;
  let activeAxis = 'all';

  // Filter Logic
  document.querySelectorAll('#axis-filters button').forEach(btn => {
 btn.addEventListener('click', (e) => {
   const t = e.target as HTMLButtonElement | null;
   if (!t) return;
   document.querySelectorAll('#axis-filters button').forEach(b => {
     b.classList.remove('bg-white/10', 'border-white/20');
     b.classList.add('bg-p31-void', 'border-white/5');
   });
   t.classList.add('bg-white/10', 'border-white/20');
   t.classList.remove('bg-p31-void', 'border-white/5');

   activeAxis = t.dataset.axis ?? 'all';
   applyFilters();
 });
  });

  ($('search-input') as HTMLInputElement | null)?.addEventListener('input', applyFilters);

  function applyFilters() {
 const q = (($('search-input') as HTMLInputElement | null)?.value ?? '').toLowerCase().trim();

 for(const m of faceMeshes) {
   const a = m.userData.a;
   if(!a) { m.visible = !(q || activeAxis !== 'all'); continue; }

   const n = a.node;
   let visible = true;
   if(activeAxis !== 'all' && getDominantAxis(n.a, n.b, n.c, n.d) !== activeAxis) visible = false;
   if(q && ![n.label, n.id, n.notes||'', n.state].some(s => s.toLowerCase().includes(q))) visible = false;

   m.visible = visible;
   const mat = m.material as THREE.MeshPhysicalMaterial;
   if(visible) {
     mat.opacity = 0.9;
     mat.emissiveIntensity = a.glow >= 1.0 ? 3.0 : 1.2;
   } else {
     mat.opacity = 0.05;
     mat.emissiveIntensity = 0;
   }
 }
    syncDomeGrayRockVisuals?.();
  }

  const canvas = renderer.domElement;
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  const touchIdsOnCanvas = new Set<number>();
  let selectSuppressPointerId: number | null = null;

  function ndcFromClient(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    return { x, y };
  }

  function refreshFaceHighlight() {
    for (const m of faceMeshes) {
      const a = m.userData.a;
      if (!a) continue;
      const rmat = m.material as THREE.MeshPhysicalMaterial;
      const rNode = a.node as NodeData;
      if (selectedNode && rNode.id === selectedNode.id) {
        rmat.emissiveIntensity = 4.0;
        rmat.opacity = 1.0;
        m.userData.targetOffset = 0.5;
      } else {
        rmat.emissiveIntensity = a.glow >= 1.0 ? 2.5 : 0.8;
        rmat.opacity = selectedNode ? 0.2 : 0.9;
        m.userData.targetOffset = 0.0;
      }
    }
    syncDomeGrayRockVisuals?.();
  }

  function applyHitSelection(hit: THREE.Intersection | null) {
    const panel = $("node-detail-panel");
    if (hit && hit.object.userData.a) {
      const n = hit.object.userData.a.node as NodeData;
      selectedNode = n;
      const ndTitle = $("nd-title"); if (ndTitle) ndTitle.innerText = n.label;

      const ax = getDominantAxis(n.a, n.b, n.c, n.d);
      const ndAxis = $("nd-axis");
      if (ndAxis) { ndAxis.innerText = AXIS_LABELS[ax]; ndAxis.style.color = "#" + AXIS_COLORS[ax].toString(16); }

      const stateKey = n.state as keyof typeof STATE_CSS;
      const ndState = $("nd-state");
      if (ndState) { ndState.innerText = n.state; ndState.style.color = STATE_CSS[stateKey] || "var(--p31-cloud)"; ndState.style.borderColor = STATE_CSS[stateKey] || "var(--p31-cloud)"; }

      const ndBus = $("nd-bus"); if (ndBus) ndBus.innerText = n.bus;
      // Toggle empty-state vs populated-state
      $("nd-empty")?.classList.add("hidden");
      const ndNotes = $("nd-notes");
      if (ndNotes) { ndNotes.classList.remove("hidden"); ndNotes.innerText = n.notes || "Core topology node verified by K4 edge network."; }
      $("nd-edges-label")?.classList.remove("hidden");

      const edges = EDGES.filter((ed) => ed[0] === n.id || ed[1] === n.id);
      const ndConns = $("nd-conns");
      if (ndConns) {
        ndConns.classList.remove("hidden");
        ndConns.innerHTML = edges.length
          ? edges
              .map((ed) => {
                const otherId = ed[0] === n.id ? ed[1] : ed[0];
                const other = VERTICES[otherId as keyof typeof VERTICES];
                return other
                  ? `<span class="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] hover:bg-white/10 transition-colors">${other[0]}</span>`
                  : "";
              })
              .join("")
          : '<span class="text-xs text-p31-muted-50 italic">Isolated Node</span>';
      }

      panel?.classList.remove("opacity-0", "pointer-events-none");
      sheetController.mitigateRibbon();

      const targetPos = hit.object.userData.centroidDir.clone().multiplyScalar(7);
      camera.position.lerp(targetPos, 0.1);
    } else {
      selectedNode = null;
      // Restore empty state
      $("nd-empty")?.classList.remove("hidden");
      $("nd-notes")?.classList.add("hidden");
      $("nd-edges-label")?.classList.add("hidden");
      $("nd-conns")?.classList.add("hidden");
      if (panel) {
        panel.style.transform = '';
        panel.style.opacity = '';
        panel.style.transition = '';
        panel.classList.add("opacity-0", "pointer-events-none");
      }
      sheetController.restoreRibbon();
    }
    refreshFaceHighlight();
  }

  /** Capture phase: raycast before OrbitControls; Alt / 2+ touches / non-primary always orbit. */
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target !== canvas) return;
      if (e.pointerType === "touch") {
        touchIdsOnCanvas.add(e.pointerId);
        // Second+ finger: pinch/orbit handled by OrbitControls (must have seen all pointers — never disable controls on touch hits).
        if (touchIdsOnCanvas.size >= 2) {
          controls.enabled = true;
          return;
        }
      }
      if (e.altKey) return;
      if (e.button === 1 || e.button === 2) return;

      const primary = e.pointerType === "touch" || e.button === 0;
      if (!primary) return;

      const { x, y } = ndcFromClient(e.clientX, e.clientY);
      pointer.set(x, y);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(faceMeshes);
      const hit = hits.find((h) => h.object.userData?.a) ?? null;

      if (hit) {
        applyHitSelection(hit);
        // Mouse/stylus: block OrbitControls for this gesture so drag does not fight raycast. Touch keeps controls enabled so 2-finger pinch tracks both pointers.
        if (e.pointerType !== "touch") {
          controls.enabled = false;
          selectSuppressPointerId = e.pointerId;
        }
      } else {
        applyHitSelection(null);
      }
    },
    true
  );

  window.addEventListener(
    "pointerup",
    (e) => {
      if (e.pointerType === "touch") touchIdsOnCanvas.delete(e.pointerId);
      if (selectSuppressPointerId != null && e.pointerId === selectSuppressPointerId) {
        selectSuppressPointerId = null;
        controls.enabled = true;
      }
    },
    true
  );
  window.addEventListener(
    "pointercancel",
    (e) => {
      if (e.pointerType === "touch") touchIdsOnCanvas.delete(e.pointerId);
      if (selectSuppressPointerId != null && e.pointerId === selectSuppressPointerId) {
        selectSuppressPointerId = null;
        controls.enabled = true;
      }
    },
    true
  );

  window.addEventListener("pointermove", (e) => {
    const { x, y } = ndcFromClient(e.clientX, e.clientY);
    pointer.set(x, y);

    if (e.target !== canvas) {
      document.body.style.cursor = "default";
      return;
    }

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(faceMeshes);
    const over = hits.find((h) => h.object.userData?.a);
    document.body.style.cursor = over ? "pointer" : "default";
  });

$('node-detail-close')?.addEventListener('click', () => {
  selectedNode = null;
  const closePanel = $('node-detail-panel');
  if (closePanel) {
    closePanel.style.transform = '';
    closePanel.style.opacity = '';
    closePanel.style.transition = '';
    closePanel.classList.add('opacity-0', 'pointer-events-none');
  }
  sheetController.restoreRibbon();
  for(const m of faceMeshes) {
    const a = m.userData.a;
    if(a) {
      const cmat = m.material as THREE.MeshPhysicalMaterial;
      cmat.emissiveIntensity = a.glow >= 1.0 ? 3.0 : 1.2;
      cmat.opacity = 0.9;
    }
    m.userData.targetOffset = 0.0;
  }
  syncDomeGrayRockVisuals?.();
});

// ── Bottom sheet kinematics (mobile) ─────────────────────────────────────
// Instantiated here; re-instantiated in remount() so fresh DOM refs are used
// after each SPA navigation back to the dome page.
function attachSheetController() {
  const ctrl = new BottomSheetController({
    panelId: 'node-detail-panel',
    handleId: 'node-detail-handle',
    ribbonId: 'p31-bottom-ribbon',
    dismissThreshold: 120,
  });
  const sheetPanel = document.getElementById('node-detail-panel');
  sheetPanel?.addEventListener('p31:sheet-dismissed', () => {
    selectedNode = null;
    for (const m of faceMeshes) {
      const a = m.userData.a;
      if (a) {
        const mat = m.material as THREE.MeshPhysicalMaterial;
        mat.emissiveIntensity = a.glow >= 1.0 ? 3.0 : 1.2;
        mat.opacity = 0.9;
      }
      m.userData.targetOffset = 0.0;
    }
    syncDomeGrayRockVisuals?.();
    // Defer state reset until spring throw animation completes (~400ms).
    setTimeout(() => {
      if (sheetPanel) {
        sheetPanel.classList.add('opacity-0', 'pointer-events-none');
        sheetPanel.style.transform = '';
        sheetPanel.style.opacity = '';
        sheetPanel.style.transition = '';
      }
    }, 420);
  });
  return ctrl;
}
let sheetController = attachSheetController();

// ================================================================
// 5. ANIMATION & RENDER LOOP
// ================================================================
let time = 0;
let animationFrameId: ReturnType<typeof requestAnimationFrame> | ReturnType<typeof setTimeout> | null = null;
const FPS_LIMIT = 60;
const FRAME_TIME = 1000 / FPS_LIMIT;
let lastTime = performance.now();

// Time scale multiplier based on hardware concurrency (1x to 2x)
const timeScale = Math.min(navigator.hardwareConcurrency || 4, 8) / 4;

function animate(timestamp = 0) {
  let dt: number;
  // Handle hidden tabs: use setTimeout to reduce power consumption
  if (document.hidden) {
    animationFrameId = setTimeout(animate, FRAME_TIME);
    dt = FRAME_TIME / 1000;
    time += dt * 0.1 * timeScale; // Slow-motion when hidden
  } else {
    animationFrameId = requestAnimationFrame(animate);
    dt = (timestamp - lastTime) / 1000 || 0.016;
    lastTime = timestamp;
    time += dt * timeScale;
  }

 /* Cockpit: shell stays fixed until the operator orbits (no idle dome spin). */
 const ambientMotion = !prefersReducedMotion && !domeVISuppressed;

 // Breathing & Displacement effect on blocks — very subtle instrument sway
 const breath = ambientMotion ? 1.0 + 0.0018 * Math.sin(time * 1.2) : 1.0;

 for(const m of faceMeshes) {
   const floatOffset = ambientMotion ? Math.sin(time * 1.8 + m.userData.randomPhase) * 0.012 : 0;

   // Smoothly lerp towards target offset (interaction)
   m.userData.currentOffset += (m.userData.targetOffset - m.userData.currentOffset) * 0.1;

   // Apply final displacement along the node's outward centroid direction
   const totalOffset = floatOffset + m.userData.currentOffset;
   m.position.copy(m.userData.centroidDir).multiplyScalar(totalOffset);

   m.scale.setScalar(breath);
 }

 composer.render();
  }
  animate();

  queueMicrotask(() => {
    if (typeof loadingManager.onLoad === "function") {
      (loadingManager.onLoad as () => void)();
    }
  });

window.addEventListener('resize', () => {
     camera.aspect = window.innerWidth / window.innerHeight;
     camera.updateProjectionMatrix();
     renderer.setSize(window.innerWidth, window.innerHeight);
     composer.setSize(window.innerWidth, window.innerHeight);
     if (bloomPass) {
       bloomPass.resolution.set(window.innerWidth, window.innerHeight);
     }
   });

 // Fallback: reveal scene after 10s even if LoadingManager never completes
 setTimeout(() => {
   const splash = $("loading-screen");
   if (splash && splash.style.display !== "none") {
     dismissDomeSplash();
   }
 }, 10000);
 
 // ================================================================
 // 6. HUD AUTO-HIDE & LATENCY TRACKING
 // ================================================================
 
 // HUD Auto-hide after 3s of inactivity
 let hudTimer: ReturnType<typeof setTimeout> | null = null;
 const hud = $('top-hud');
 const hudContent = $('hud-content');
 let isHudHidden = false;
 
 function showHUD() {
   if (!hud) return;
   isHudHidden = false;
   hud.classList.remove('translate-y-[-100%]');
   hud.classList.remove('opacity-0');
   if (hudContent) hudContent.classList.remove('hidden');
 }
 
 function hideHUD() {
   if (!hud) return;
   isHudHidden = true;
   hud.classList.add('translate-y-[-100%]');
   hud.classList.add('opacity-0');
   if (hudContent) hudContent.classList.add('hidden');
 }
 
 function resetHUDTimer() {
   if (hudTimer !== null) clearTimeout(hudTimer);
   if (isHudHidden) showHUD();
   hudTimer = setTimeout(() => {
     if (!isHudHidden) hideHUD();
   }, 3000);
 }

 // Show HUD on hover/touch/focus
 if (hud) {
   hud.addEventListener('mouseenter', resetHUDTimer);
   hud.addEventListener('mousemove', resetHUDTimer);
   hud.addEventListener('touchstart', resetHUDTimer);
   hud.addEventListener('focusin', resetHUDTimer);
   hud.addEventListener('mouseleave', () => {
     if (hudTimer !== null) clearTimeout(hudTimer);
     hudTimer = setTimeout(() => {
       if (!isHudHidden) hideHUD();
     }, 3000);
   });
 }
 
 // Initialize HUD timer
 resetHUDTimer();
 
 // Performance Monitoring (Dev Mode)
 const perfIndicators = $('performance-indicators');
 const renderTimeEl = $('render-time');
 const fpsCounterEl = $('fps-counter');
 const webglStatusEl = $('webgl-status');
 const connectionStatusEl = $('connection-status');
 
 // Only show in dev mode (localhost or dev query param)
 const isDevMode = window.location.hostname === 'localhost' || window.location.search.includes('dev=true');
 if (perfIndicators) {
   perfIndicators.classList.toggle('hidden', !isDevMode);
 }
 
 // Render time tracking
 let frameCount = 0;
 let lastFpsTime = performance.now();
 let fpsValues: number[] = [];

 function updatePerformanceMetrics(dt: number) {
   if (!isDevMode) return;
   
   // Render time
   if (renderTimeEl) renderTimeEl.textContent = (dt * 1000).toFixed(1);
   
   // FPS calculation (2s average)
   frameCount++;
   const now = performance.now();
   if (now - lastFpsTime >= 2000) {
     const fps = (frameCount / ((now - lastFpsTime) / 1000));
     fpsValues.push(fps);
     if (fpsValues.length > 10) fpsValues.shift();
     const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
     if (fpsCounterEl) fpsCounterEl.textContent = String(Math.round(avgFps));
     frameCount = 0;
     lastFpsTime = now;
   }
   
   // WebGL status
   if (webglStatusEl) {
     webglStatusEl.textContent = renderer.getContext().isContextLost() ? '✗' : '✓';
     webglStatusEl.className = renderer.getContext().isContextLost() ? 'text-red-400' : 'text-emerald';
   }
 }
 
 // Connection status simulation (replace with real WebSocket in production)
 let connectionState = 'connected'; // connected, reconnecting, failed
 function updateConnectionStatus() {
   if (!connectionStatusEl) return;
   
   const statusConfig = {
     connected: { color: 'bg-emerald', title: 'Connected', ariaLabel: 'Connected' },
     reconnecting: { color: 'bg-amber', title: 'Reconnecting...', ariaLabel: 'Reconnecting' },
     failed: { color: 'bg-red-400', title: 'Connection failed', ariaLabel: 'Failed' }
   };
   
   const config = statusConfig[connectionState as keyof typeof statusConfig] || statusConfig.connected;
   connectionStatusEl.className = `w-2 h-2 rounded-full ${config.color}`;
   connectionStatusEl.title = config.title;
   connectionStatusEl.setAttribute('aria-label', config.ariaLabel);
 }
 
 // Simulate connection state changes (for demo)
 setInterval(() => {
   // In real implementation, update based on WebSocket/EventBus events
   updateConnectionStatus();
 }, 5000);
 
 updateConnectionStatus();
 
 // Modify animate function to track performance
 const originalAnimate = animate;
 
 // Hook into animation loop to measure performance
 let animationStartTime = 0;
 function measureFramePerformance(timestamp: number) {
   if (animationStartTime === 0) animationStartTime = timestamp;
   const dt = (timestamp - animationStartTime) / 1000 || 0.016;
   animationStartTime = timestamp;
   updatePerformanceMetrics(dt);
 }
 
 // Override composer.render to measure frame time
 const originalRender = composer.render.bind(composer);
 composer.render = function() {
   const start = performance.now();
   originalRender();
   const end = performance.now();
   measureFramePerformance(end);
 };
 
 // Focus-visible styles via JS (for browsers that don't support :focus-visible)
 document.addEventListener('focusin', (e) => {
   const t = e.target as HTMLElement | null;
   if (t?.matches('button, [role="button"], input, [tabindex]')) {
     t.classList.add('focus-visible');
   }
 });

 document.addEventListener('focusout', (e) => {
   const t = e.target as HTMLElement | null;
   if (t?.matches('button, [role="button"], input, [tabindex]')) {
     t.classList.remove('focus-visible');
   }
 });
 
 // Add focus-visible styles to head
 const focusStyle = document.createElement('style');
 focusStyle.textContent = `
    .focus-visible {
      outline: 2px solid var(--p31-cyan);
      outline-offset: 2px;
      transition: outline 0.15s ease;
    }
    /* Ensure touch targets are at least 44x44px */
    button, [role="button"], input[type="range"] {
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    #volume-slider-container {
      min-width: 80px;
      min-height: 44px;
      padding: 0;
    }
    #volume-slider-container > div {
      height: 100%;
      align-items: center;
    }
 `;
 document.head.appendChild(focusStyle);
 
  // UI Toggle Button functionality
  const uiToggleBtn = $('ui-toggle-btn');
  if (uiToggleBtn) {
    uiToggleBtn.addEventListener('click', () => {
      const isCurrentlyHidden = hud?.classList.contains('translate-y-[-100%]') ?? false;
      if (isCurrentlyHidden) {
        showHUD();
        resetHUDTimer();
      } else {
        hideHUD();
      }
      
      // Haptic feedback
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate(10);
      }
    });
  }
  
  // ================================================================
  // 7b. A/B THEME VARIANT SWITCHER
  // ================================================================
  const themeToggleBtn = $('theme-toggle-btn');
  const THEME_KEY = 'p31:dome:themeVariant';
  const defaultVariant = 'tm'; // teal-magenta
  const variants = { tm: 'A (teal-magenta)', cv: 'B (cyan-violet)' };
  
  function applyTheme(variant: string) {
    document.documentElement.setAttribute('data-palette', variant);
    if (themeToggleBtn) {
      const vLabel = (variants as Record<string, string>)[variant] ?? variant;
      themeToggleBtn.textContent = `Theme: ${vLabel}`;
      themeToggleBtn.title = `Current: ${vLabel}`;
    }
    localStorage.setItem(THEME_KEY, variant);
  }
  
  // Load saved theme
  const savedVariant = localStorage.getItem(THEME_KEY) || defaultVariant;
  applyTheme(savedVariant);
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-palette') || defaultVariant;
      const next = current === 'tm' ? 'cv' : 'tm';
      applyTheme(next);
      
      // Haptic feedback
      if (navigator.vibrate && !prefersReducedMotion) {
        navigator.vibrate(5);
      }
    });
  }
  
  // ================================================================
  // 7. KEYBOARD SHORTCUTS OVERLAY
  // ================================================================
  const shortcutsOverlay = $('keyboard-shortcuts-overlay');
  const closeShortcutsBtn = $('close-shortcuts');
  let shortcutsVisible = false;
  let shortcutsTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function showShortcuts(autoClose = true) {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.classList.remove('opacity-0', 'pointer-events-none');
    shortcutsVisible = true;
    
    if (autoClose) {
      // Auto-close after 2.5 seconds and then focus search
      shortcutsTimeout = setTimeout(() => {
        hideShortcuts();
        // Focus the search input after overlay closes
        const searchInput = $('search-input');
        if (searchInput) searchInput.focus();
      }, 2500);
    }
  }
  
  function hideShortcuts() {
    if (!shortcutsOverlay) return;
    shortcutsOverlay.classList.add('opacity-0', 'pointer-events-none');
    shortcutsVisible = false;
    if (shortcutsTimeout !== null) {
      clearTimeout(shortcutsTimeout);
      shortcutsTimeout = null;
    }
  }
  
  // Toggle with "/" key
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    const kT = e.target as HTMLElement | null;
    if (kT?.tagName === 'INPUT' || kT?.tagName === 'TEXTAREA') return;
    
    if (e.key === '/' && !shortcutsVisible) {
      e.preventDefault();
      showShortcuts(true);
    } else if (shortcutsVisible && e.key !== 'Escape') {
      // Any key (except Escape which is handled separately) dismisses overlay immediately
      e.preventDefault();
      hideShortcuts();
      // If the key is a letter/digit, could focus appropriate control; but focus search after brief
      setTimeout(() => {
        const searchInput = $('search-input');
        if (searchInput && document.activeElement !== searchInput) searchInput.focus();
      }, 50);
    }
  });
  
  // Also allow Escape to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shortcutsVisible) {
      hideShortcuts();
    }
  });
  
  if (closeShortcutsBtn) {
    closeShortcutsBtn.addEventListener('click', hideShortcuts);
  }
  
  // Close on backdrop click
  if (shortcutsOverlay) {
    shortcutsOverlay.addEventListener('click', (e) => {
      if (e.target === shortcutsOverlay) hideShortcuts();
    });
  }
  
  // ================================================================
  // 8. AXE-CORE ACCESSIBILITY SCANNER (DEV ONLY)
  // ================================================================
  type AxeViolation = { impact: string; id: string; description: string };
  type AxeLib = { run: (opts: unknown) => Promise<{ violations: AxeViolation[] }> };
  const a11yScanBtn = $('a11y-scan-btn');

  if (a11yScanBtn) {
    a11yScanBtn.addEventListener('click', async () => {
      const axe = (globalThis as Record<string, unknown>)['axe'] as AxeLib | undefined;
      if (!axe) {
        alert('axe-core not loaded. Please refresh to load the accessibility scanner.');
        return;
      }

      try {
        const results = await axe.run({
          runOnly: {
            type: 'tag',
            values: ['wcag2aa']
          }
        });

        if (results.violations.length === 0) {
          alert(i18n.t('a11y.noViolations'));
        } else {
          const msg = `${i18n.t('a11y.violationsTitle')}\n\n` +
            results.violations.map((v: AxeViolation) => `${v.impact.toUpperCase()}: ${v.id} - ${v.description}`).join('\n');
          alert(msg);
          console.group('Accessibility Violations');
          console.table(results.violations);
          console.groupEnd();
        }
      } catch (error) {
        console.error('Axe scan failed:', error);
        alert('Accessibility scan failed. Check console.');
      }
    });
  }
  
  // ================================================================
  // 9. REDUCED MOTION ENFORCEMENT
  // ================================================================
  // Already detected at top via: const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // CSS handles transitions/animations; JS handles non-css motion in animate loop
  
  // Apply reduced-motion class to html for CSS overrides
  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduced-motion');
  }
  
  // Watch for changes
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  });

  // ── Dome lifecycle handle (astro:before-swap / astro:page-load) ───────────────
  // Captured via closure so unmount/remount can stop/restart the animate loop and
  // re-attach the renderer canvas without rebuilding the Three.js scene.
  (window as unknown as Record<string, unknown>)['__p31Dome'] = {
    unmount() {
      sheetController.dispose();
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId as number);
        clearTimeout(animationFrameId as ReturnType<typeof setTimeout>);
        animationFrameId = null;
      }
      renderer.domElement.parentElement?.removeChild(renderer.domElement);
    },
    remount() {
      const cont = document.getElementById('webgl-container');
      if (!cont) return;
      // Guard: canvas already live in the container — first-mount case, nothing to do.
      if (renderer.domElement.parentElement === cont) return;
      cont.appendChild(renderer.domElement);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      if (bloomPass) bloomPass.resolution.set(window.innerWidth, window.innerHeight);
      animationFrameId = requestAnimationFrame(animate);
      document.body.classList.remove('loaded');
      dismissDomeSplash({ fadeMs: 200 });
      // Re-attach kinematics to fresh DOM nodes after SPA navigation.
      sheetController = attachSheetController();
    },
  };

} // WebGL branch (else opened when webglSupported)