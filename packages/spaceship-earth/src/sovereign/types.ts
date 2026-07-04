export type SovereignRoom = 'OBSERVATORY' | 'COLLIDER' | 'BONDING' | 'BRIDGE' | 'BUFFER' | 'COPILOT' | 'LANDING' | 'RESONANCE' | 'FORGE' | 'VAULT' | 'SOVEREIGN' | 'GEODESIC';

export const SOVEREIGN_ROOMS: readonly SovereignRoom[] = ['OBSERVATORY', 'COLLIDER', 'BONDING', 'BRIDGE', 'BUFFER', 'COPILOT', 'LANDING', 'RESONANCE', 'FORGE', 'VAULT', 'SOVEREIGN', 'GEODESIC'];

export type CentaurStatus = 'IDLE' | 'GENERATING' | 'COMPILING' | 'ERROR' | 'SUCCESS';

export type GenesisSyncStatus = 'offline' | 'syncing' | 'synced' | 'error';

export type ViewMode = 'cockpit' | 'classic';

// D2.1: Tri-State Camera
export type CameraMode = 'free' | 'dome' | 'screen';

// D2.1: Dual-Camera Matrix
export type ViewPerspective = 'OBSERVER' | 'GODHEAD';

// D1.1: Polymorphic Skin Engine
export type SkinTheme = 'OPERATOR' | 'KIDS' | 'GRAY_ROCK';

// M18: Somatic Tether
export type SomaticStatus = 'disconnected' | 'calibrating' | 'active' | 'stress';

// M19: Reactor Core
export type MintStatus = 'idle' | 'collecting-signatures' | 'minting' | 'success' | 'error';

// M20: Spatial Mesh
export type SpatialTransport = 'web-bluetooth' | 'websocket' | 'none';

// M21: K4 Handshake
export interface K4Edge {
  from: string;
  to: string;
  timestamp: number;
  signature: string;
}

// WCD 15: Relay
export type RelayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export interface RelayPeer {
  did: string;
  room: string | null;
  lastSeen: number;
}

// WCD-20: Multiplayer presence
export interface RemotePeer {
  room: string | null;
  lastSeen: number;
}
export type CelebrationEvent = 'coherence' | 'covenant' | { type: 'molecule_complete'; formula: string };

export interface SovereignState {
  viewMode: ViewMode;
  activeRoom: SovereignRoom;
  openOverlay: SovereignRoom | string | null;
  pwaStatus: string;
  audioEnabled: boolean;
  coherence: number;
  noiseFloor: number;
  didKey: string;
  ucanStatus: string;
  isGeneratingIdentity: boolean;
  crdtVersion: number;
  telemetryHashes: string[];
  bleStatus: string;
  loraNodes: number;
  // NodeContext bridge fields (synced from useNode)
  spoons: number;
  maxSpoons: number;
  tier: string;
  love: number;
  nodeId: string | null;
  structureCount: number;
  challengeName: string | null;
  // Centaur Engine state
  centaurStatus: CentaurStatus;
  centaurLastOutput: string;
  // Genesis Sync state
  genesisSyncStatus: GenesisSyncStatus;
  // Dynamic slot hydration (Jitterbug Mount)
  dynamicSlots: Record<number, { name: string } | null>;

  // M18: Somatic Tether
  somaticTetherStatus: SomaticStatus;
  fawnGuardActive: boolean;
  somaticHr: number;
  somaticHrv: number;
  somaticWaveform: number[];

  // M20: Spatial Mesh
  spatialNodes: number;
  spatialTransport: SpatialTransport;
  handshakeCandidate: string | null;
  spatialNodeList: Array<{ id: string; rssi: number; valency: number; flags: number }>;

  // M21: K4 Handshake
  k4Graph: { nodes: string[]; edges: K4Edge[] };
  handshakeActive: boolean;
  handshakePartnerDID: string | null;

  // M19: Reactor Core
  mintStatus: MintStatus;
  lastMintNonce: string | null;

  // D1.1: Polymorphic Skin Engine
  skinTheme: SkinTheme;
  accentColor: string;     // CSS hex, e.g. '#00FFFF' — user-selectable primary accent

  // D4.6: Sierpinski Progressive Disclosure
  interactedSlots: number[];  // slots user has visited (serializable)
  sierpinskiDepth: number;    // current max fractal depth (0-2)

  // D2.1: Tri-State Camera
  cameraMode: CameraMode;
  activeScreenIdx: number; // which screen is focused in Screen Mode (0-2)

  // D2.1: Dual-Camera Matrix
  viewPerspective: ViewPerspective;

  // Lock screen (boot sequence)
  shipLocked: boolean;

  // Relay (WCD 15)
  relayStatus: RelayStatus;
  relayPing: number;          // RTT in ms; 0 = no measurement yet
  relayPeers: RelayPeer[];
  offlineQueueSize: number;   // actions queued while disconnected

  // WCD-20: Multiplayer presence
  remotePeers: Record<string, RemotePeer>;
  celebrationPending: boolean;

  // Audio (WCD 18)
  sfxEnabled: boolean;
  masterVolume: number;       // 0–1

  // Actions (existing)
  setPwaStatus: (status: string) => void;
  toggleView: () => void;
  initAudio: () => void;
  setOverlay: (roomId: SovereignRoom | string | null) => void;
  initIdentity: () => Promise<void>;
  connectBLE: () => Promise<void>;
  appendTelemetry: () => Promise<void>;
  exportLedger: () => void;
  setCentaurStatus: (status: CentaurStatus, output?: string) => void;
  setGenesisSyncStatus: (status: GenesisSyncStatus) => void;
  mountToSlot: (slot: number, name: string) => void;
  unmountSlot: (slot: number) => void;

  // Actions (M18: Somatic Tether)
  setSomaticStatus: (status: SomaticStatus) => void;
  setFawnGuard: (active: boolean) => void;
  setSomaticHr: (hr: number) => void;
  setSomaticHrv: (hrv: number) => void;
  setSomaticWaveform: (buf: number[]) => void;

  // Actions (M20: Spatial Mesh)
  setSpatialNodes: (count: number) => void;
  setSpatialTransport: (t: SpatialTransport) => void;
  setHandshakeCandidate: (id: string | null) => void;
  setSpatialNodeList: (nodes: Array<{ id: string; rssi: number; valency: number; flags: number }>) => void;

  // Actions (M21: K4 Handshake)
  addK4Edge: (edge: K4Edge) => void;
  setHandshakeActive: (active: boolean) => void;
  setHandshakePartner: (did: string | null) => void;

  // Actions (M19: Reactor Core)
  setMintStatus: (status: MintStatus) => void;
  setLastMintNonce: (nonce: string | null) => void;

  // D1.1: Polymorphic Skin Engine
  setSkinTheme: (theme: SkinTheme) => void;
  setAccentColor: (hex: string) => void;

  // D4.6: Sierpinski Progressive Disclosure
  markSlotInteracted: (slot: number) => void;
  setSierpinskiDepth: (depth: number) => void;

  // D2.1: Tri-State Camera
  setCameraMode: (mode: CameraMode) => void;
  setActiveScreenIdx: (idx: number) => void;

  // D2.1: Dual-Camera Matrix
  setViewPerspective: (perspective: ViewPerspective) => void;

  // Lock screen
  unlockShip: () => void;

  // Relay (WCD 15)
  setRelayStatus: (status: RelayStatus) => void;
  setRelayPing: (ms: number) => void;
  setRelayPeers: (peers: RelayPeer[]) => void;
  setOfflineQueueSize: (n: number) => void;

  // WCD-20: Multiplayer presence
  upsertRemotePeer: (did: string, room: string | null, lastSeen: number) => void;
  triggerCelebration: () => void;
  clearCelebration: () => void;

  // Audio (WCD 18)
  setSfxEnabled: (enabled: boolean) => void;
  setMasterVolume: (v: number) => void;

}
