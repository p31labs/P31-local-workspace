/**
 * @file useSovereignStore — Central Zustand v5 state machine for Spaceship Earth.
 *
 * Architecture: Single store, no middleware (middleware breaks Zustand v5 curried
 * type inference). Curried form: `create<T>()((set, get) => ...)`.
 *
 * Slice groups (by subsystem milestone):
 *   UI / Navigation    — viewMode, openOverlay, activeRoom, pwaStatus
 *   Audio              — audioEnabled
 *   Coherence / Signal — coherence, noiseFloor (drives Fawn Guard threshold)
 *   Identity (M01)     — didKey, ucanStatus, isGeneratingIdentity
 *   CRDT / Telemetry   — crdtVersion, telemetryHashes
 *   Radio              — bleStatus, loraNodes
 *   NodeContext bridge — spoons, maxSpoons, tier, love, nodeId (mirrored from NodeContext)
 *   Centaur Engine     — centaurStatus, centaurLastOutput
 *   Genesis Sync       — genesisSyncStatus
 *   Dynamic Slots      — dynamicSlots (Cartridge Drive slot → name mapping)
 *   Somatic (M18)      — somaticTetherStatus, fawnGuardActive, HR/HRV waveform
 *   Spatial Mesh (M20) — spatialNodes, spatialTransport, handshake peer discovery
 *   K4 Handshake (M21) — k4Graph (directed K4), handshakeActive, partnerDID
 *   Reactor Core (M19) — mintStatus, lastMintNonce
 *   Skin (D1.1)        — skinTheme (OPERATOR / KIDS / GRAY_ROCK)
 *   Sierpinski (D4.6)  — interactedSlots, sierpinskiDepth (0-2)
 *   Camera (D2.1)      — cameraMode, activeScreenIdx, viewPerspective
 *   Lock Screen        — shipLocked (boot gate until attractor coherence achieved)
 *
 * Usage:
 *   Atomic selectors (no re-render on unrelated state change):
 *     const openOverlay = useSovereignStore(s => s.openOverlay);
 *   Imperative read (RAF callbacks — no subscription, no re-render):
 *     const state = useSovereignStore.getState();
 *   Multi-value (wrap with useShallow to avoid reference churn):
 *     const { a, b } = useSovereignStore(useShallow(s => ({ a: s.a, b: s.b })));
 */
import { create } from 'zustand';
import type { SovereignState, SovereignRoom, RelayPeer, RelayStatus } from './types';
import { SOVEREIGN_ROOMS } from './types';
import { audioEngine, generateDID, hashTelemetry, exportLedgerJSON } from '@p31/shared/sovereign';
import { trackEvent } from '../services/telemetry';
import { haptic } from '../services/haptic';
// Refs for timers to prevent race conditions
const coherenceTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
const initTimerRef = { current: null as ReturnType<typeof setTimeout> | null };

export const useSovereignStore = create<SovereignState>((set, get) => ({
  viewMode: 'cockpit',
  activeRoom: 'OBSERVATORY',
  openOverlay: null,
  pwaStatus: 'INITIALIZING...',
  audioEnabled: false,
  coherence: 0.99,
  noiseFloor: 0.05,
  didKey: 'UNINITIALIZED',
  ucanStatus: 'WAITING FOR HARDWARE ROOT',
  isGeneratingIdentity: false,
  crdtVersion: 0,
  telemetryHashes: [],
  bleStatus: 'DISCONNECTED',
  loraNodes: 0,
  // NodeContext bridge
  spoons: 12,
  maxSpoons: 12,
  tier: 'FULL',
  love: 0,
  nodeId: null,
  structureCount: 0,
  challengeName: null,
  // Centaur Engine
  centaurStatus: 'IDLE',
  centaurLastOutput: '',
  // Genesis Sync
  genesisSyncStatus: 'offline',
  // Dynamic slot hydration
  dynamicSlots: {},

  // M18: Somatic Tether
  somaticTetherStatus: 'disconnected',
  fawnGuardActive: false,
  somaticHr: 0,
  somaticHrv: 0,
  somaticWaveform: [],

  // M20: Spatial Mesh
  spatialNodes: 0,
  spatialTransport: 'none',
  handshakeCandidate: null,
  spatialNodeList: [],

  // M21: K4 Handshake
  k4Graph: { nodes: [], edges: [] },
  handshakeActive: false,
  handshakePartnerDID: null,

  // M19: Reactor Core
  mintStatus: 'idle',
  lastMintNonce: null,

  // D1.1: Polymorphic Skin Engine
  skinTheme: 'OPERATOR',
  accentColor: (() => { try { return localStorage.getItem('p31-accent') ?? '#00FFFF'; } catch { return '#00FFFF'; } })(),

  // D4.6: Sierpinski Progressive Disclosure
  interactedSlots: [],
  sierpinskiDepth: 0,

  // D2.1: Tri-State Camera
  cameraMode: 'free',
  activeScreenIdx: 0,

  // D2.1: Dual-Camera Matrix
  viewPerspective: 'OBSERVER' as 'OBSERVER' | 'GODHEAD',

  // Lock screen (boot sequence)
  shipLocked: false,

  // Relay (WCD 15)
  relayStatus: 'disconnected' as RelayStatus,
  relayPing: 0,
  relayPeers: [] as RelayPeer[],
  offlineQueueSize: 0,

  // WCD-20: Multiplayer presence
  remotePeers: {},
  celebrationPending: false,

  // Audio (WCD 18) — persisted in localStorage
  sfxEnabled: (() => { try { return localStorage.getItem('p31-sfx') !== '0'; } catch { return true; } })(),
  masterVolume: (() => { try { return parseFloat(localStorage.getItem('p31-vol') ?? '0.6'); } catch { return 0.6; } })(),

  setPwaStatus: (status) => set({ pwaStatus: status }),
  toggleView: () => set((state) => ({ viewMode: state.viewMode === 'cockpit' ? 'classic' : 'cockpit' })),

  initAudio: () => {
    audioEngine.init();
    if (audioEngine.ctx?.state === 'suspended') audioEngine.ctx.resume();
    set({ audioEnabled: true });
  },

  setOverlay: (roomId) => {
    // null or OBSERVATORY → go home
    if (roomId === null || roomId === 'OBSERVATORY') {
      set({ openOverlay: null });
      return;
    }
    const current = get().openOverlay;
    // Toggle: same room closes overlay
    if (roomId === current) {
      set({ openOverlay: null });
    } else if ((SOVEREIGN_ROOMS as readonly string[]).includes(roomId) || (typeof roomId === 'string' && roomId.startsWith('SLOT_'))) {
      set({ openOverlay: roomId as SovereignRoom });
      // D4.6: Track slot interaction for progressive disclosure
      const slotMap: Record<string, number> = {
        OBSERVATORY: 1, COLLIDER: 2, BONDING: 3, BRIDGE: 4, BUFFER: 5,
        COPILOT: 6, LANDING: 7, RESONANCE: 8, FORGE: 9,
      };
      const slot = slotMap[roomId];
      if (slot !== undefined) {
        get().markSlotInteracted(slot);
      }
    }
  },

  initIdentity: async () => {
    set({ isGeneratingIdentity: true, ucanStatus: 'GENERATING Ed25519 VIA WebCrypto...' });
    try {
      const didKey = await generateDID();
      setTimeout(() => {
        set({ didKey, ucanStatus: 'DELEGATION GRANTED (SE050 -> BROWSER)', isGeneratingIdentity: false });
      }, 2000);
    } catch {
      set({ ucanStatus: 'ERR: CRYPTO NOT AVAILABLE', isGeneratingIdentity: false });
    }
  },

  connectBLE: async () => {
    set({ bleStatus: 'REQUESTING GATT SERVER...' });
    setTimeout(() => set({ bleStatus: 'CONNECTED: ESP32-S3 (SIMULATED)', loraNodes: Math.floor(Math.random() * 8) + 3 }), 1200);
  },

  appendTelemetry: async () => {
    if (get().didKey === 'UNINITIALIZED') {
      if (initTimerRef.current) clearTimeout(initTimerRef.current);
      set({ coherence: 0.2, noiseFloor: 0.8 });
      initTimerRef.current = setTimeout(() => set({ coherence: 0.99, noiseFloor: 0.05 }), 1000);
      return;
    }
    const hashHex = await hashTelemetry(get().didKey, get().activeRoom);
    if (coherenceTimerRef.current) clearTimeout(coherenceTimerRef.current);
    set((state) => ({ crdtVersion: state.crdtVersion + 1, telemetryHashes: [hashHex, ...state.telemetryHashes].slice(0, 8), coherence: 0.8 }));
    coherenceTimerRef.current = setTimeout(() => set({ coherence: 1.0 }), 200);
  },

  exportLedger: () => {
    const state = get();
    exportLedgerJSON(state.didKey, state.telemetryHashes);
  },

  setCentaurStatus: (status, output) => set({
    centaurStatus: status,
    ...(output !== undefined && { centaurLastOutput: output }),
  }),

  setGenesisSyncStatus: (status) => set({ genesisSyncStatus: status }),

  mountToSlot: (slot, name) => {
    set((state) => ({ dynamicSlots: { ...state.dynamicSlots, [slot]: { name } } }));
    trackEvent('cartridge_mount', { slot, name });
    haptic.snap();
  },

  unmountSlot: (slot) => set((state) => {
    const next = { ...state.dynamicSlots };
    next[slot] = null;
    return { dynamicSlots: next };
  }),

  // M18: Somatic Tether actions
  setSomaticStatus: (status) => set({ somaticTetherStatus: status }),
  setFawnGuard: (active) => set({ fawnGuardActive: active }),
  setSomaticHr: (hr) => set({ somaticHr: hr }),
  setSomaticHrv: (hrv) => set({ somaticHrv: hrv }),
  setSomaticWaveform: (buf) => set({ somaticWaveform: buf }),

  // M20: Spatial Mesh actions
  setSpatialNodes: (count) => set({ spatialNodes: count }),
  setSpatialTransport: (t) => set({ spatialTransport: t }),
  setHandshakeCandidate: (id) => set({ handshakeCandidate: id }),
  setSpatialNodeList: (nodes) => set({ spatialNodeList: nodes }),

  // M21: K4 Handshake actions
  addK4Edge: (edge) => set((state) => {
    const nodes = new Set(state.k4Graph.nodes);
    nodes.add(edge.from);
    nodes.add(edge.to);
    return {
      k4Graph: {
        nodes: Array.from(nodes),
        edges: [...state.k4Graph.edges, edge],
      },
    };
  }),
  setHandshakeActive: (active) => set({ handshakeActive: active }),
  setHandshakePartner: (did) => set({ handshakePartnerDID: did }),

  // M19: Reactor Core actions
  setMintStatus: (status) => set({ mintStatus: status }),
  setLastMintNonce: (nonce) => set({ lastMintNonce: nonce }),

  // D1.1: Polymorphic Skin Engine
  setSkinTheme: (theme) => {
    set({ skinTheme: theme });
    // D1.4: Sync DOM data-theme attribute
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = theme.toLowerCase().replace('_', '-');
    }
  },

  setAccentColor: (hex) => {
    set({ accentColor: hex });
    try { localStorage.setItem('p31-accent', hex); } catch {}
    if (typeof document === 'undefined') return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const root = document.documentElement.style;
    root.setProperty('--cyan',       hex);
    root.setProperty('--neon',       hex);
    root.setProperty('--neon-dim',   `rgba(${r},${g},${b},0.35)`);
    root.setProperty('--neon-faint', `rgba(${r},${g},${b},0.08)`);
    root.setProperty('--neon-ghost', `rgba(${r},${g},${b},0.03)`);
    root.setProperty('--glow-cyan',  `0 0 6px ${hex}, 0 0 20px rgba(${r},${g},${b},0.3)`);
  },

  // D4.6: Sierpinski Progressive Disclosure
  markSlotInteracted: (slot) => set((state) => ({
    interactedSlots: state.interactedSlots.includes(slot)
      ? state.interactedSlots
      : [...state.interactedSlots, slot],
  })),
  setSierpinskiDepth: (depth) => set({ sierpinskiDepth: Math.max(0, Math.min(2, depth)) }),

  // D2.1: Tri-State Camera
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveScreenIdx: (idx) => set({ activeScreenIdx: Math.max(0, Math.min(2, idx)) }),

  // D2.1: Dual-Camera Matrix
  setViewPerspective: (perspective) => set({ viewPerspective: perspective }),

  // Lock screen
  unlockShip: () => set({ shipLocked: false }),

  // Relay (WCD 15)
  setRelayStatus: (status) => set({ relayStatus: status }),
  setRelayPing: (ms) => set({ relayPing: ms }),
  setRelayPeers: (peers) => set({ relayPeers: peers }),
  setOfflineQueueSize: (n) => set({ offlineQueueSize: n }),

  // WCD-20: Multiplayer presence
  upsertRemotePeer: (did, room, lastSeen) => set((state) => ({
    remotePeers: { ...state.remotePeers, [did]: { room, lastSeen } },
  })),
  triggerCelebration: () => {
    set({ celebrationPending: true });
    setTimeout(() => set({ celebrationPending: false }), 2000);
  },
  clearCelebration: () => set({ celebrationPending: false }),

  // Audio (WCD 18)
  setSfxEnabled: (enabled) => {
    set({ sfxEnabled: enabled });
    try { localStorage.setItem('p31-sfx', enabled ? '1' : '0'); } catch {}
  },
  setMasterVolume: (v) => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ masterVolume: clamped });
    try { localStorage.setItem('p31-vol', String(clamped)); } catch {}
  },

}));

/**
 * Apply persisted theme + accent on first page load.
 * Call once from main.tsx after the React root mounts.
 */
export function initTheme(): void {
  const { skinTheme, accentColor, setSkinTheme, setAccentColor } = useSovereignStore.getState();
  setSkinTheme(skinTheme);       // re-applies data-theme attribute
  setAccentColor(accentColor);   // re-applies CSS vars for persisted accent
}
