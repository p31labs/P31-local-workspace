export type Tab = string;

export type TetraVertex =
  | { type: 'did'; value: string }
  | { type: 'reputation'; value: Reputation }
  | { type: 'preferences'; value: Preferences }
  | { type: 'relations'; value: Relations };

export interface Reputation {
  careScore: number;
  trustTier: number;
  sbts: SBT[];
  loveBalance: number;
}

export interface Preferences {
  spoons: number;
  spoonQuadrants: [number, number, number, number];
  darkMode: boolean;
  reduceMotion: boolean;
  soundEffects: boolean;
  mood: string | null;
}

export interface Relations {
  familyDid: string | null;
  guardianDid: string | null;
  meshPeers: string[];
  caregiverPin: string | null;
}

export interface SBT {
  id: string;
  type: 'achievement' | 'credential' | 'affiliation' | 'guardian';
  issuer: string;
  issuedAt: number;
  tetrahedronHash: string;
  metadata: Record<string, unknown>;
  onChainTokenId?: number;
  onChainContract?: string;
}

export interface Tetrahedron<T> {
  vertices: [T, T, T, T];
  symmetry: number;
  curvature: number;
  status: 'green' | 'yellow' | 'red' | 'black';
}

export interface Profile {
  username: string;
  name: string;
  avatar: string;
  role: 'child' | 'teen' | 'parent';
  did: string;
  tetrahedron: Tetrahedron<TetraVertex>;
  sbts: SBT[];
  starCount: number;
  gamesCompleted: number;
  moodCount: number;
  sbtMilestones: string[];
  createdAt: number;
  updatedAt: number;
}

export interface MeshNode {
  did: string;
  publicKey: string;
  endpoint: string;
  lastSeen: number;
  status: 'online' | 'away' | 'offline';
  spoons?: number;
  mood?: string | null;
  role?: string;
}

export interface MeshState {
  localDid: string;
  nodes: Map<string, MeshNode>;
  topology: 'delta' | 'wye' | 'isolated';
  symmetry: number;
  curvature: number;
  heartbeatInterval: number;
}

export interface CryptoState {
  keyPair: TetraKeyPair | null;
  biometricHash: string | null;
  sessionKey: CryptoKey | null;
  algorithm: 'TKE' | 'RTH' | 'QIDL';
}

export interface TetraKeyPair {
  publicKey: string;
  privateKey: string;
  vertices: [string, string, string, string];
}

export interface LoveBalance {
  userId: string;
  totalEarned: number;
  sovereigntyPool: number;
  performancePool: number;
  careScore: number;
  availableBalance: number;
  frozenBalance: number;
  totalSpoonDebt: number;
  updatedAt: number | null;
}

export interface LoveTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: number;
}

export interface ChainEntry {
  id: number;
  entry_type: string;
  entry_hash: string;
  prev_hash: string;
  payload_json: string;
  created_at: number;
}

export interface ChainVerification {
  valid: boolean;
  count: number;
  rootHash: string;
  entries: ChainEntry[];
}
