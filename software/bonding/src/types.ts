// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Type definitions: game state, chemistry, engagement
// ═══════════════════════════════════════════════════════

// ── Elements ──

export type ElementSymbol = 'H' | 'C' | 'N' | 'O' | 'Na' | 'P' | 'Ca' | 'Cl' | 'S' | 'Fe' | 'Mn' | 'Ba' | 'Wi';

export interface ElementData {
  symbol: ElementSymbol;
  name: string;
  valence: number;
  color: string;
  emissive: string;
  frequency: number;
  note: string;
  size: number;
  funFact: string;
}

// ── Placed atoms and bonds ──

export interface PlacedAtom {
  id: number;
  element: ElementSymbol;
  position: { x: number; y: number; z: number };
  bondSites: number;
  bondedTo: number[];
  placedBy: number;
  timestamp: string;
}

export interface Bond {
  id: number;
  from: number;
  to: number;
  timestamp: string;
}

// ── Achievement system ──

export interface Achievement {
  id: string;
  name: string;
  description: string;
  trigger: AchievementTrigger;
  love: number;
  icon: string;
  hidden?: boolean;
}

export type AchievementTrigger =
  | { type: 'first_atom' }
  | { type: 'formula'; formula: string }
  | { type: 'atom_count'; count: number }
  | { type: 'molecule_count'; count: number }
  | { type: 'time_under'; seconds: number }
  | { type: 'ping_count'; count: number }
  | { type: 'novel_molecule' }
  | { type: 'element_diversity'; count: number }
  | { type: 'element_count'; element: ElementSymbol; count: number }
  | { type: 'full_palette' };

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
  moleculeFormula: string;
}

// ── LOVE economy ──

export interface LoveBalance {
  total: number;
  earned: LoveTransaction[];
}

export interface LoveTransaction {
  amount: number;
  source: 'atom_placed' | 'bond_formed' | 'molecule_completed' | 'achievement' | 'quest_completed';
  sourceId?: string;
  timestamp: string;
}

// ── Toast system ──

export interface ToastMessage {
  id: string;
  icon: string;
  text: string;
  subtext?: string;
  love?: number;
  duration: number;
  createdAt: number;
  /** WCD-23/25: Visual variant for special toasts. */
  variant?: 'discovery' | 'hero';
}

// ── Engagement ledger ──

export interface EngagementEvent {
  timestamp: string;
  gameId: string;
  sessionId: string;
  playerId: number;
  playerName: string;
  eventType:
    | 'atom_placed'
    | 'bond_formed'
    | 'ping_sent'
    | 'ping_received'
    | 'molecule_completed'
    | 'achievement_earned'
    | 'session_start'
    | 'session_end';
  metadata: Record<string, unknown>;
}

// ── Molecule history ──

export interface CompletedMolecule {
  formula: string;
  atomCount: number;
  completedAt: string;
  sessionElapsedMs: number;
  coherencePhase: number;
  elements: string[];
}
